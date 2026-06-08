import { RequestHandler } from "express";

import httpStatus from "http-status";
import { UploadDocumentService } from "./documents.service";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";



const UploadDocument = catchAsync(async (req, res) => {

  const result = await UploadDocumentService.UploadDocumentToGCS(req.file, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upload document successfully",
    data: result,
  });
});



// const UploadDocument = catchAsync(async (req, res) => {
//   console.log('Uploaded file:', req.file);

//   if (!req.file) {
//     return res.status(httpStatus.BAD_REQUEST).json({
//       success: false,
//       message: 'No file uploaded',
//     });
//   }

//   const result = await UploadDocumentService.uploadDocument(req.file, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Document uploaded and processed successfully',
//     data: result,
//   });
// });


const DeleteDocument = catchAsync(async (req, res) => {
  const { fileUrl } = req.body; // Expecting { "fileUrl": "https://..." } in the body

  await UploadDocumentService.DeleteDocumentFromGCS(fileUrl);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Document deleted successfully from cloud storage",
    data: null,
  });
});

export const UploadDocumentController = {
  UploadDocument,
  DeleteDocument
};
