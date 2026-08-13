import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { Audit } from "./audit.model";
import { TAudit } from "./audit.interface";
import { AuditSearchableFields } from "./audit.constant";
import mongoose from "mongoose";
import { UploadDocumentService } from "../../modules/hr/documents/documents.service";

const getAllAuditFromDB = async (query: Record<string, unknown>) => {
  const filterQuery = { ...query };

  // Convert missing parentId or string "null" to actual JavaScript literal null
  if (filterQuery.parentId === "null" || !filterQuery.parentId) {
    filterQuery.parentId = null;
  }

  const userQuery = new QueryBuilder(Audit.find(), filterQuery)
    .search(AuditSearchableFields)
    .filter(filterQuery) // 🌟 CHANGED THIS from 'query' to 'filterQuery'
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleAuditFromDB = async (id: string) => {
  const result = await Audit.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Audit document not found");
  }
  return result;
};

const createAuditIntoDB = async (payload: TAudit) => {
  try {
    let calculatedAncestors: mongoose.Types.ObjectId[] = [];

    // Check if the item is being nested inside a parent folder
    if (payload.parentId) {
      const parentFolder = await Audit.findById(payload.parentId);

      if (!parentFolder) {
        throw new AppError(httpStatus.NOT_FOUND, "Parent folder not found");
      }
      if (parentFolder.type !== "folder") {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Cannot create a file or folder inside a file"
        );
      }

      // New ancestors = parent's ancestors + the parent's own ID
      calculatedAncestors = [...parentFolder.ancestors, parentFolder._id];
    }

    // Attach calculated ancestors to the payload before inserting
    payload.ancestors = calculatedAncestors;

    const result = await Audit.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createAuditIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Audit"
    );
  }
};

const updateAuditIntoDB = async (id: string, payload: Partial<TAudit>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentAudit = await Audit.findById(id).session(session);

    if (!currentAudit) {
      throw new AppError(httpStatus.NOT_FOUND, "Audit not found");
    }

    // --- GOOGLE DRIVE FILE MOVE LOGIC ---
    // If the parentId is changing, the item is being moved to a different folder
    if (payload.parentId !== undefined && String(payload.parentId) !== String(currentAudit.parentId)) {
      let newAncestors: mongoose.Types.ObjectId[] = [];

      if (payload.parentId) {
        // Prevent moving a folder into itself or its own sub-folders
        if (String(payload.parentId) === id) {
          throw new AppError(httpStatus.BAD_REQUEST, "Cannot move a folder into itself");
        }

        const targetParent = await Audit.findById(payload.parentId).session(session);
        if (!targetParent) {
          throw new AppError(httpStatus.NOT_FOUND, "Target parent folder not found");
        }
        if (targetParent.type !== "folder") {
          throw new AppError(httpStatus.BAD_REQUEST, "Target parent must be a folder");
        }
        if (targetParent.ancestors.some((ancestorId) => String(ancestorId) === id)) {
          throw new AppError(httpStatus.BAD_REQUEST, "Cannot move a folder into one of its sub-folders");
        }

        newAncestors = [...targetParent.ancestors, targetParent._id];
      }

      // Update the target item's ancestors payload
      payload.ancestors = newAncestors;

      // If it's a folder, we MUST also update all downstream nested children paths
      if (currentAudit.type === "folder") {
        const children = await Audit.find({ ancestors: currentAudit._id }).session(session);

        for (const child of children) {
          // Find where the old trail broke off and stitch the new ancestor trail onto it
          const oldAncestorIndex = child.ancestors.findIndex(
            (ancestorId) => String(ancestorId) === id
          );
          
          if (oldAncestorIndex !== -1) {
            const downstreamTrail = child.ancestors.slice(oldAncestorIndex);
            child.ancestors = [...newAncestors, ...downstreamTrail];
            await child.save({ session });
          }
        }
      }
    }

    const result = await Audit.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      session,
    });

    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in updateAuditIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to update Audit"
    );
  }
};

const deleteAuditFromDB = async (id: string) => {
  try {
    const audit = await Audit.findById(id);

    if (!audit) {
      throw new AppError(httpStatus.NOT_FOUND, "Audit document not found");
    }

    // 1. Find all items scheduled for deletion (the folder/item itself + all its nested descendants)
    const itemsToDelete = await Audit.find({
      $or: [
        { _id: id },
        { ancestors: id }
      ]
    });

    // 2. Collect all valid GCS file URLs from the matching records
    const cloudStorageUrls = itemsToDelete
      .map((item) => item.documentUrl) 
      .filter((url) => typeof url === "string" && url.trim() !== "");

    // 3. Execute the cascading delete inside your database
    await Audit.deleteMany({
      $or: [
        { _id: id },
        { ancestors: id }
      ]
    });

    // 4. 🛡️ ISOLATED TRY-CATCH FOR SIDE EFFECTS
    // If Google Cloud goes down or a network timeout happens here, the database records 
    // are ALREADY deleted. We catch this internally so the client still gets a successful 200 OK.
    if (cloudStorageUrls.length > 0) {
      try {
        console.log(`[GCS DELETION] Attempting to clean up ${cloudStorageUrls.length} files...`);
        await Promise.all(
          cloudStorageUrls.map((url:any) => UploadDocumentService.DeleteDocumentFromGCS(url))
        );
      } catch (gcsError) {
        // Log the error for maintenance, but do not interrupt the main request flow
        console.error("Data cleaned successfully, but background GCS cleanup failed:", gcsError);
      }
    }

    return { message: "Audit item and all its nested contents deleted successfully" };

  } catch (error) {
    // 🛡️ GLOBAL FUNCTION TRY-CATCH
    console.error("Critical error inside deleteAuditFromDB service:", error);

    // If it's an expected operational error (like the 404 Audit document not found), rethrow it
    if (error instanceof AppError) {
      throw error;
    }

    // Capture untracked exceptions (Mongoose connection loss, casting bugs) and handle gracefully
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "An error occurred while deleting the audit item");
  }
};

export const AuditServices = {
  getAllAuditFromDB,
  getSingleAuditFromDB,
  updateAuditIntoDB,
  createAuditIntoDB,
  deleteAuditFromDB,
};