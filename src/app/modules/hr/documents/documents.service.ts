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

    const fileName = `${Date.now()}-${file.originalname}`;
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


const DeleteDocumentFromGCS = async (fileUrl: string) => {
  try {
    if (!fileUrl) {
      console.warn("Skipping GCS deletion: No file URL provided.");
      return { message: "Skipping operation: No URL provided" };
    }


    const parsedUrl = new URL(fileUrl);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

    const fileName = decodeURIComponent(pathSegments.slice(1).join("/"));

    // 3. Absolute safety guard against empty strings or root paths - SKIPPED ON FAILURE
    if (!fileName || fileName.trim() === "" || fileName === "/") {
      console.warn(`Skipping GCS deletion: Invalid URL structure for URL: ${fileUrl}`);
      return { message: "Skipping operation: Invalid file URL structure" };
    }

    const gcsFile = bucket.file(fileName);

    // 4. Verify file exists before executing deletion - SKIPPED ON FAILURE
    const [exists] = await gcsFile.exists();
    if (!exists) {
      console.warn(`Skipping GCS deletion: File does not exist on GCS: ${fileName}`);
      return { message: "Skipping operation: File not found on GCS" };
    }

    await gcsFile.delete();

    return { message: "File deleted successfully from GCS" };
  } catch (error: any) {
    // We only log the error here. This prevents your entire request/route from crashing 
    // if something unexpected goes wrong (like network issues with Google Cloud)
    console.error("GCS File deletion failed entirely:", error);
    return { message: "Skipping operation: Internal error occurred during deletion" };
  }
};


export const UploadDocumentService = {
  UploadDocumentToGCS,
  DeleteDocumentFromGCS
};
