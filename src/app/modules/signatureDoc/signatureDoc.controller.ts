import { RequestHandler } from "express";
import httpStatus from "http-status";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SignatureDocServices } from "./signatureDoc.service";

// ─────────────────────────────────────────────────────────────────────────────
// Standard CRUD
// ─────────────────────────────────────────────────────────────────────────────

const getAllSignatureDoc: RequestHandler = catchAsync(async (req, res) => {
  const result = await SignatureDocServices.getAllSignatureDocFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signature Documents retrieved successfully",
    data: result,
  });
});

const getSingleSignatureDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SignatureDocServices.getSingleSignatureDocFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signature Document retrieved successfully",
    data: result,
  });
});

const updateSignatureDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SignatureDocServices.updateSignatureDocIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signature Document updated successfully",
    data: result,
  });
});

const createSignatureDoc = catchAsync(async (req, res) => {
  const result = await SignatureDocServices.createSignatureDocIntoDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signature Document created successfully",
    data: result,
  });
});

const deleteSignatureDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SignatureDocServices.deleteSignatureDocFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signature Document deleted successfully",
    data: result,
  });
});


const generateTemplate = catchAsync(async (req, res) => {
  const { document, content, companyId } = req.body;
  const result = await SignatureDocServices.createDocuSignTemplate(
    document,
    content,
    companyId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Template created successfully",
    data: result,
  });
});


const sendSignatureDocs = catchAsync(async (req, res) => {
  const result = await SignatureDocServices.createAndSendSignatureDocs(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Documents sent to staff successfully",
    data: result,
  });
});


const fetchTemplates = catchAsync(async (req, res) => {
  const { companyId } = req.query;

  if (!companyId || typeof companyId !== "string") {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "companyId query parameter is required",
      data: null,
    });
  }

  const result = await SignatureDocServices.getDocuSignTemplates(companyId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Templates fetched successfully",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DocuSign — Staff signing
// ─────────────────────────────────────────────────────────────────────────────


const initiateDocuSign = catchAsync(async (req, res) => {
  const { signatureDocId } = req.params;
  const { signerId,layout } = req.body; // 🚀 Extract the signer ID

  if (!signerId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "signerId is required",
      data: null,
    });
  }

  const result = await SignatureDocServices.initiateSigningProcess(signatureDocId, signerId,layout);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Signing URL generated successfully",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DocuSign — Webhook
// ─────────────────────────────────────────────────────────────────────────────


const handleDocuSignWebhook = catchAsync(async (req, res) => {
  res.status(200).send("Webhook received");
  SignatureDocServices.processDocuSignWebhook(req.body).catch((error) => {
    console.error("❌ Background webhook processing failed:", error.message);
  });
});

const forwardSignatureDoc = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { approverIds } = req.body; 
  
  if (!approverIds || !approverIds.length) {
     return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "At least one approver is required to forward the document",
      data: null,
    });
  }

  const result = await SignatureDocServices.forwardDocumentForApproval(id, approverIds);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Document successfully forwarded to authorities",
    data: result,
  });
});


export const SignatureDocControllers = {
  getAllSignatureDoc,
  getSingleSignatureDoc,
  updateSignatureDoc,
  createSignatureDoc,
  deleteSignatureDoc,
  generateTemplate,
  sendSignatureDocs,
  fetchTemplates,
  initiateDocuSign,
  handleDocuSignWebhook,
  forwardSignatureDoc
};