import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { PayslipDoc } from "./payslipDoc.model";
import { TPayslipDoc } from "./payslipDoc.interface";
import { PayslipDocSearchableFields } from "./payslipDoc.constant";
import mongoose from "mongoose";
import { UploadDocumentService } from "../hr/documents/documents.service";

const getAllPayslipDocFromDB = async (query: Record<string, unknown>) => {
  const filterQuery = { ...query };

  // Convert missing parentId or string "null" to actual JavaScript literal null
  if (filterQuery.parentId === "null" || !filterQuery.parentId) {
    filterQuery.parentId = null;
  }

  const userQuery = new QueryBuilder(PayslipDoc.find(), filterQuery)
    .search(PayslipDocSearchableFields)
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

const getSinglePayslipDocFromDB = async (id: string) => {
  const result = await PayslipDoc.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Payslip document not found");
  }
  return result;
};

const createPayslipDocIntoDB = async (payload: TPayslipDoc) => {
  try {
    let calculatedAncestors: mongoose.Types.ObjectId[] = [];

    // Check if the item is being nested inside a parent folder
    if (payload.parentId) {
      const parentFolder = await PayslipDoc.findById(payload.parentId);

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

    const result = await PayslipDoc.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createPayslipDocIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create payslip document"
    );
  }
};

const updatePayslipDocIntoDB = async (id: string, payload: Partial<TPayslipDoc>) => {
  try {
    const currentPayslipDoc = await PayslipDoc.findById(id);

    if (!currentPayslipDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Payslip document not found");
    }

    // --- GOOGLE DRIVE FILE MOVE LOGIC ---
    // If the parentId is changing, the item is being moved to a different folder
    if (payload.parentId !== undefined && String(payload.parentId) !== String(currentPayslipDoc.parentId)) {
      let newAncestors: mongoose.Types.ObjectId[] = [];

      if (payload.parentId) {
        // Prevent moving a folder into itself or its own sub-folders
        if (String(payload.parentId) === id) {
          throw new AppError(httpStatus.BAD_REQUEST, "Cannot move a folder into itself");
        }

        const targetParent = await PayslipDoc.findById(payload.parentId);
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
      if (currentPayslipDoc.type === "folder") {
        const children = await PayslipDoc.find({ ancestors: currentPayslipDoc._id });

        for (const child of children) {
          // Find where the old trail broke off and stitch the new ancestor trail onto it
          const oldAncestorIndex = child.ancestors.findIndex(
            (ancestorId) => String(ancestorId) === id
          );

          if (oldAncestorIndex !== -1) {
            const downstreamTrail = child.ancestors.slice(oldAncestorIndex);
            child.ancestors = [...newAncestors, ...downstreamTrail];
            await child.save();
          }
        }
      }
    }

    const result = await PayslipDoc.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    return result;
  } catch (error: any) {
    console.error("Error in updatePayslipDocIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to update payslip document"
    );
  }
};

const deletePayslipDocFromDB = async (id: string) => {
  try {
    const payslipDoc = await PayslipDoc.findById(id);

    if (!payslipDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Payslip document not found");
    }

    // 1. Find all items scheduled for deletion (the folder/item itself + all its nested descendants)
    // const itemsToDelete = await PayslipDoc.find({
    //   $or: [
    //     { _id: id },
    //     { ancestors: id }
    //   ]
    // });

    // 2. Collect all valid GCS file URLs from the matching records
    // const cloudStorageUrls = itemsToDelete
    //   .map((item) => item.documentUrl) 
    //   .filter((url) => typeof url === "string" && url.trim() !== "");

    // 3. Execute the cascading delete inside your database
    await PayslipDoc.deleteMany({
      $or: [
        { _id: id },
        { ancestors: id }
      ]
    });

    // 4. 🛡️ ISOLATED TRY-CATCH FOR SIDE EFFECTS
    // If Google Cloud goes down or a network timeout happens here, the database records 
    // are ALREADY deleted. We catch this internally so the client still gets a successful 200 OK.
    // if (cloudStorageUrls.length > 0) {
    //   try {
    //     // console.log(`[GCS DELETION] Attempting to clean up ${cloudStorageUrls.length} files...`);
    //     await Promise.all(
    //       cloudStorageUrls.map((url:any) => UploadDocumentService.DeleteDocumentFromGCS(url))
    //     );
    //   } catch (gcsError) {
    //     // Log the error for maintenance, but do not interrupt the main request flow
    //     console.error("Data cleaned successfully, but background GCS cleanup failed:", gcsError);
    //   }
    // }

    return { message: "Payslip document and all its nested contents deleted successfully" };

  } catch (error) {
    // 🛡️ GLOBAL FUNCTION TRY-CATCH
    // console.error("Critical error inside deletePayslipDocFromDB service:", error);

    // If it's an expected operational error (like the 404 Payslip document not found), rethrow it
    if (error instanceof AppError) {
      throw error;
    }

    // Capture untracked exceptions (Mongoose connection loss, casting bugs) and handle gracefully
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "An error occurred while deleting the PayslipDoc item");
  }
};

// ─── Copy / Move ──────────────────────────────────────────────────────────────

// Validates the destination folder and returns the ancestor trail
// the item should receive there. Empty array = home (root level).
const resolveDestinationAncestors = async (
  sourceId: string,
  targetFolderId: string | null
): Promise<mongoose.Types.ObjectId[]> => {
  if (!targetFolderId) return [];

  const targetFolder = await PayslipDoc.findById(targetFolderId);

  if (!targetFolder) {
    throw new AppError(httpStatus.NOT_FOUND, "Target folder not found");
  }
  if (targetFolder.type !== "folder") {
    throw new AppError(httpStatus.BAD_REQUEST, "Target must be a folder");
  }
  if (String(targetFolder._id) === String(sourceId)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot copy or move an item into itself"
    );
  }
  if (
    targetFolder.ancestors.some(
      (ancestorId) => String(ancestorId) === String(sourceId)
    )
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot copy or move a folder into one of its sub-folders"
    );
  }

  return [...targetFolder.ancestors, targetFolder._id];
};

// Copy → creates another object under the selected folder's parentId.
// For folders it recursively copies every nested child as well.
const copyPayslipDocIntoDB = async (
  id: string,
  targetFolderId: string | null
) => {
  try {
    const parentAncestors = await resolveDestinationAncestors(
      id,
      targetFolderId
    );

    const cloneTree = async (
      sourceId: string,
      parentId: string | null,
      ancestors: mongoose.Types.ObjectId[]
    ) => {
      const source = await PayslipDoc.findById(sourceId);
      if (!source) {
        throw new AppError(httpStatus.NOT_FOUND, "Source item not found");
      }

      const [cloned] = await PayslipDoc.create([
        {
          companyId: source.companyId,
          documentTitle: source.documentTitle,
          title: source.title,
          type: source.type,
          parentId,
          ancestors,
          ...(source.documentUrl ? { documentUrl: source.documentUrl } : {}),
        },
      ]);

      // Folder → copy all of its children into the cloned folder
      if (source.type === "folder") {
        const children = await PayslipDoc.find({
          parentId: source._id,
        });

        for (const child of children) {
          await cloneTree(String(child._id), String(cloned._id), [
            ...ancestors,
            cloned._id,
          ]);
        }
      }

      return cloned;
    };

    const result = await cloneTree(id, targetFolderId || null, parentAncestors);

    return result;
  } catch (error: any) {
    console.error("Error in copyPayslipDocIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to copy payslip document"
    );
  }
};

// Move → changes the parentId (null = home). For folders the ancestor
// trails of ALL nested descendants are restitched as well.
const movePayslipDocIntoDB = async (
  id: string,
  targetFolderId: string | null
) => {
  try {
    const parentAncestors = await resolveDestinationAncestors(
      id,
      targetFolderId
    );

    const currentPayslipDoc = await PayslipDoc.findById(id);
    if (!currentPayslipDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Payslip document not found");
    }

    const result = await PayslipDoc.findByIdAndUpdate(
      id,
      { parentId: targetFolderId || null, ancestors: parentAncestors },
      { new: true, runValidators: true }
    );

    if (currentPayslipDoc.type === "folder") {
      // Restitch the ancestor trail of every descendant
      const descendants = await PayslipDoc.find({
        ancestors: currentPayslipDoc._id,
      });

      for (const child of descendants) {
        const oldAncestorIndex = child.ancestors.findIndex(
          (ancestorId) => String(ancestorId) === id
        );

        if (oldAncestorIndex !== -1) {
          const downstreamTrail = child.ancestors.slice(oldAncestorIndex);
          child.ancestors = [...parentAncestors, ...downstreamTrail];
          await child.save();
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error("Error in movePayslipDocIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to move payslip document"
    );
  }
};

export const PayslipDocServices = {
  getAllPayslipDocFromDB,
  getSinglePayslipDocFromDB,
  updatePayslipDocIntoDB,
  createPayslipDocIntoDB,
  deletePayslipDocFromDB,
  copyPayslipDocIntoDB,
  movePayslipDocIntoDB,
};