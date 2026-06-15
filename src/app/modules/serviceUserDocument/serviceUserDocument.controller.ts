import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ServiceUserDocumentServices } from "./serviceUserDocument.service";


const getAllServiceUserDocument: RequestHandler = catchAsync(async (req, res) => {
  const result = await ServiceUserDocumentServices.getAllServiceUserDocumentFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUserDocuments retrived succesfully",
    data: result,
  });
});
const getSingleServiceUserDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ServiceUserDocumentServices.getSingleServiceUserDocumentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUserDocument is retrieved succesfully",
    data: result,
  });
});



const updateServiceUserDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ServiceUserDocumentServices.updateServiceUserDocumentIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUserDocument is updated succesfully",
    data: result,
  });
});

const createServiceUserDocument = catchAsync(async (req, res) => {
  
  const result = await ServiceUserDocumentServices.createServiceUserDocumentIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUserDocument Created succesfully",
    data: result,
  });
});

const deleteServiceUserDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ServiceUserDocumentServices.deleteServiceUserDocumentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "ServiceUserDocument deleted successfully",
    data: result,
  });
});


export const ServiceUserDocumentControllers = {
  getAllServiceUserDocument,
  getSingleServiceUserDocument,
  updateServiceUserDocument,
  createServiceUserDocument,
  deleteServiceUserDocument,
};

