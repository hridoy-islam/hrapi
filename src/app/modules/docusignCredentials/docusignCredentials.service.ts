import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { DocusignCredentialsSearchableFields } from "./docusignCredentials.constant";
import { DocusignCredentials } from "./docusignCredentials.model";
import { TDocusignCredentials } from "./docusignCredentials.interface";

const getDocusignCredentialsFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(DocusignCredentials.find(), query)
    .search(DocusignCredentialsSearchableFields)
    .filter(query)
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

// const getSingleNoticeFromDB = async (id: string) => {
//   const result = await DocusignCredentials.findById(id);
//   return result;
// };

const createDocusignCredentialsIntoDB = async (payload: TDocusignCredentials) => {
  try {
    const result = await DocusignCredentials.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in create Docusign Template Into DB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Docusign Template"
    );
  }
};

const updateDocusignCredentialsIntoDB = async (
  id: string,
  payload: Partial<TDocusignCredentials>
) => {
  const docusignCredentials = await DocusignCredentials.findById(id);

  if (!docusignCredentials) {
    throw new AppError(httpStatus.NOT_FOUND, "Docusign Credentials not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await DocusignCredentials.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

export const DocusignCredentialsServices = {
  createDocusignCredentialsIntoDB,
  getDocusignCredentialsFromDB,
  updateDocusignCredentialsIntoDB,
};
