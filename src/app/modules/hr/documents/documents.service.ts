import { Storage } from "@google-cloud/storage";
import httpStatus from "http-status";

import pdfParse from "pdf-parse";
import AppError from "../../../errors/AppError";
import { User } from "../../user/user.model";
import config from "../../../config";

const storage = new Storage({
  keyFilename: "./work.json",
  projectId: "vast-pride-453709-n7",
});
const bucketName = config.bucket as string; // Make sure this bucket exists

const bucket = storage.bucket(bucketName);

const UploadDocumentToGCS = async (file: any, payload: any) => {
  const { entityId, file_type } = payload;
  try {
    if (!file) throw new AppError(httpStatus.BAD_REQUEST, "No file provided");
const sanitizedName = file.originalname
  .normalize("NFKD")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/[^a-zA-Z0-9.\-_]/g, "");

const fileName = `${Date.now()}-${sanitizedName}`;
    // const fileName = `${Date.now()}-${file.originalname}`;
    const gcsFile = bucket.file(fileName);

    await new Promise((resolve, reject) => {
      const stream = gcsFile.createWriteStream({
        metadata: { contentType: file.mimetype }, // Set metadata to determine file type
      });

      stream.on("error", (err) => {
        console.error("Error during file upload:", err);
        reject(err);
      });

      stream.on("finish", async () => {
        try {
          // Make the file publicly accessible
          await gcsFile.makePublic();
          resolve(true);
        } catch (err) {
          console.error("Error making the file public:", err);
          reject(err);
        }
      });

      // Send the file buffer to GCS
      stream.end(file.buffer);
    });

    const fileUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    const fileContentText = file.buffer.toString("utf-8");
    // Check file type and determine where to save the file URL
    if (file_type === "profile") {
      const user = await User.findById(entityId);
      if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

      user.image = fileUrl;
      await user.save();

      return { entityId, file_type, fileUrl };
    } else if (file_type === "studentDoc") {
      return { entityId, file_type, fileUrl };
    } else if (file_type === "resumeDoc") {
      const pdfData = await pdfParse(file.buffer);
      const extractedText = pdfData.text;
      return { entityId, file_type, fileUrl, fileContent: extractedText };
    } else {
      return { entityId, file_type, fileUrl };
    }
  } catch (error) {
    console.error("File upload failed:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
  }
};


const UploadBufferToGCS = async (buffer: Buffer, originalName: string, mimetype: string = "application/pdf") => {
  try {
    if (!buffer) throw new AppError(httpStatus.BAD_REQUEST, "No buffer provided");

    const fileName = `${Date.now()}-signed-${originalName}`;
    const gcsFile = bucket.file(fileName);

    await new Promise((resolve, reject) => {
      const stream = gcsFile.createWriteStream({
        metadata: { contentType: mimetype }, 
        
      });

      stream.on("error", (err) => {
        console.error("Error during buffer upload:", err);
        reject(err);
      });

      stream.on("finish", async () => {
        try {
          // Make the file publicly accessible just like your other function
          await gcsFile.makePublic();
          resolve(true);
        } catch (err) {
          console.error("Error making the buffer file public:", err);
          reject(err);
        }
      });

      // Send the raw buffer to GCS
      stream.end(buffer);
    });

    const fileUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    return fileUrl;

  } catch (error) {
    console.error("Buffer upload failed:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Buffer upload failed");
  }
};



const DeleteDocumentFromGCS = async (fileUrl: string) => {
  try {
    if (!fileUrl) {
      console.warn("[GCS] Skipping GCS deletion: No file URL provided.");
      return { message: "Skipping operation: No URL provided" };
    }

    // 1. Convert URL to string and parse safely
    const parsedUrl = new URL(fileUrl);
    
    // 2. Extract everything after the bucket name cleanly using the bucketName variable
    // This safely extracts paths even if your file is inside sub-folders like /folder/image.jpg
    const bucketPrefix = `/${bucketName}/`;
    let fileName = parsedUrl.pathname;

    if (fileName.startsWith(bucketPrefix)) {
      fileName = fileName.replace(bucketPrefix, "");
    } else {
      // Fallback fallback if pathname layout differs: take everything after the first directory segment
      const segments = fileName.split("/").filter(Boolean);
      fileName = segments.slice(1).join("/");
    }

    // 3. Decode the URL string so it restores literal spaces and symbols matching GCS records
    fileName = decodeURIComponent(fileName).trim();

    // console.log(`[DEBUG DELETION] Extracted Filename for GCS: "${fileName}"`);

    // 4. Safety guard against root directory deletion hazards
    if (!fileName || fileName === "/" || fileName === "") {
      console.warn(`[GCS] Skipping deletion: Invalid file path extracted from URL: ${fileUrl}`);
      return { message: "Skipping operation: Invalid file URL structure" };
    }

    const gcsFile = bucket.file(fileName);

    // 5. Check existence and log the true response status
    const [exists] = await gcsFile.exists();
    if (!exists) {
      console.warn(`[GCS WARNING] File "${fileName}" was not found on GCS. It might have been manually deleted or named differently.`);
      return { message: "Skipping operation: File not found on GCS" };
    }

    // 6. Execute actual cloud deletion
    await gcsFile.delete();
    // console.log(`[GCS SUCCESS] Successfully deleted physical asset: "${fileName}"`);

    return { message: "File deleted successfully from GCS" };
  } catch (error: any) {
    // console.error("[GCS CRITICAL ERROR] File deletion failed entirely:", error);
    return { message: "Skipping operation: Internal error occurred during deletion" };
  }
};


export const UploadDocumentService = {
  UploadDocumentToGCS,
  DeleteDocumentFromGCS,
  UploadBufferToGCS
};
