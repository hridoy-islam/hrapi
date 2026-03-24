import { RequestHandler } from "express";
;
import httpStatus from "http-status";


import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SignatureDocServices } from "./signatureDoc.service";


const getAllSignatureDoc: RequestHandler = catchAsync(async (req, res) => {
  const result = await SignatureDocServices.getAllSignatureDocFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branchs retrived succesfully",
    data: result,
  });
});
const getSingleSignatureDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SignatureDocServices.getSingleSignatureDocFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch is retrieved succesfully",
    data: result,
  });
});

const updateSignatureDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SignatureDocServices.updateSignatureDocIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch is updated succesfully",
    data: result,
  });
});

const createSignatureDoc = catchAsync(async (req, res) => {
  
  const result = await SignatureDocServices.createSignatureDocIntoDB( req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch Created succesfully",
    data: result,
  });
});

const deleteSignatureDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SignatureDocServices.deleteSignatureDocFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Company Branch deleted successfully",
    data: result,
  });
});


export const SignatureDocControllers = {
    getAllSignatureDoc,
    getSingleSignatureDoc,
    updateSignatureDoc,
    createSignatureDoc,
    deleteSignatureDoc
};

