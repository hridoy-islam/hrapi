import { RequestHandler } from "express";
;
import httpStatus from "http-status";

import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { RequestDocumentServices } from "./requestDocument.service";

const getAllRequestDocument: RequestHandler = catchAsync(async (req, res) => {
  const result = await RequestDocumentServices.getRequestDocumentFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "RequestDocuments retrived succesfully",
    data: result,
  });
});

const getSingleRequestDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RequestDocumentServices.getSingleRequestDocumentFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "RequestDocument is retrieved succesfully",
    data: result,
  });
});

const updateRequestDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await RequestDocumentServices.updateRequestDocumentIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "RequestDocument is updated succesfully",
    data: result,
  });
});




const createRequestDocument = catchAsync(async (req, res) => {
  
  const result = await RequestDocumentServices.createRequestDocumentIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "RequestDocument Created succesfully",
    data: result,
  });
});

export const RequestDocumentControllers = {
    createRequestDocument,
    getAllRequestDocument,
    getSingleRequestDocument,
    updateRequestDocument
};

