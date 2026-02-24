import httpStatus from "http-status";

import AppError from "../../../errors/AppError";
import QueryBuilder from "../../../builder/QueryBuilder";
import { EmployeeDocument } from "./employeeDocument.model";
import { TEmployeeDocument } from "./employeeDocument.interface";
import { EmployeeDocumentSearchableFields, MIN_REFERENCE_COUNT, REQUIRED_DOCUMENTS_LIST } from "./employeeDocument.constant";
import { User } from "../../user/user.model";


const getAllEmployeeDocumentFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(EmployeeDocument.find(), query)
    .search(EmployeeDocumentSearchableFields)
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

const getSingleEmployeeDocumentFromDB = async (id: string) => {
  const result = await EmployeeDocument.findById(id);
  return result;
};


const createEmployeeDocumentIntoDB = async (payload: TEmployeeDocument) => {
    try {
      
      const result = await EmployeeDocument.create(payload);
      return result;
    } catch (error: any) {
      console.error("Error in createEmployeeDocumentIntoDB:", error);
  
      // Throw the original error or wrap it with additional context
      if (error instanceof AppError) {
        throw error;
      }
  
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message || "Failed to create EmployeeDocument");
    }
  };


const updateEmployeeDocumentIntoDB = async (id: string, payload: Partial<TEmployeeDocument>) => {
  const employeeDocument = await EmployeeDocument.findById(id);

  if (!employeeDocument) {
    throw new AppError(httpStatus.NOT_FOUND, "EmployeeDocument not found");
  }

  // Toggle `isDeleted` status for the selected user only
  // const newStatus = !user.isDeleted;

  // // Check if the user is a company, but only update the selected user
  // if (user.role === "company") {
  //   payload.isDeleted = newStatus;
  // }

  // Update only the selected user
  const result = await EmployeeDocument.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};



const deleteEmployeeDocumentFromDB = async (id: string) => {
  const employeeDocument = await EmployeeDocument.findById(id);

  if (!employeeDocument) {
    throw new AppError(httpStatus.NOT_FOUND, "EmployeeDocument not found");
  }

  await EmployeeDocument.findByIdAndDelete(id);

  return { message: "EmployeeDocument deleted successfully" };
};



const getEmployeeComplianceStatus = async (id: string) => {
  // 1. Fetch the user to get their specific flags (isBritish, noRtwCheck)
  const user = await User.findById(id).select("isBritish noRtwCheck");
  
  if (!user) {
    throw new Error("Employee not found");
  }

  // 2. Fetch the documents uploaded by this employee
  const employeeDocuments = await EmployeeDocument.find({ employeeId: id });

  const uploadedTitles = employeeDocuments.map((doc) => 
    doc.documentTitle.trim().toLowerCase()
  );

  // 3. Dynamic required documents logic based on user profile
  let requiredForThisUser = [...REQUIRED_DOCUMENTS_LIST];
      
  if (user.noRtwCheck) {
    // If no RTW check is needed: Remove ALL RTW-related documents
    requiredForThisUser = requiredForThisUser.filter(
      (req) => !["Immigration Status", "Right to Work", "Passport"].includes(req)
    );
  }
   

  // 4. Find which required documents are missing
  const missingDocuments = requiredForThisUser.filter((reqDoc) => {
    return !uploadedTitles.includes(reqDoc.toLowerCase());
  });

  // 5. Count how many "Reference" documents exist
  const referenceCount = uploadedTitles.filter((title) => 
    title.includes("reference") && !title.includes("dbs") // Exclude "DBS Reference" if it's separate
  ).length;

  const isReferenceCompliant = referenceCount >= MIN_REFERENCE_COUNT;
  if (!isReferenceCompliant) {
    missingDocuments.push(`Reference (Uploaded: ${referenceCount}, Required: ${MIN_REFERENCE_COUNT})`);
  }

  return {
    employeeId: id,
    totalUploaded: employeeDocuments.length,
    isCompliant: missingDocuments.length === 0, 
    missingDocuments: missingDocuments, 
    uploadedDocuments: employeeDocuments, 
  };
};


export const EmployeeDocumentServices = {
  getAllEmployeeDocumentFromDB,
  getSingleEmployeeDocumentFromDB,
  updateEmployeeDocumentIntoDB,
  createEmployeeDocumentIntoDB,
  deleteEmployeeDocumentFromDB,
  getEmployeeComplianceStatus,
};



  