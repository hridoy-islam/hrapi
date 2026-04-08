import httpStatus from "http-status";
import docusign from "docusign-esign";
import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { SignatureDoc } from "./signatureDoc.model";
import { TSignatureDoc } from "./signatureDoc.interface";
import { SignatureDocSearchableFields } from "./signatureDoc.constant";
import { UploadDocumentService } from "../documents/documents.service";
import { DocusignCredentials } from "../docusignCredentials/docusignCredentials.model";

// ─────────────────────────────────────────────────────────────────────────────
// CRUD helpers (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

const getAllSignatureDocFromDB = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(
    SignatureDoc.find().populate([
      {
        path: "employeeId",
        select: "name firstName lastName email phone",
      },
      {
        path: "approverIds",
        select: "firstName lastName email", 
      },
      {
        path: "signedByApprovers",
        select: "firstName lastName email", 
      }
    ]),
    query,
  )
    .search(SignatureDocSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;
  return { meta, result };
};

const getSingleSignatureDocFromDB = async (id: string) => {
  return SignatureDoc.findById(id);
};

const createSignatureDocIntoDB = async (payload: TSignatureDoc) => {
  try {
    return await SignatureDoc.create(payload);
  } catch (error: any) {
    console.error("Error in createSignatureDocIntoDB:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create SignatureDoc",
    );
  }
};

const updateSignatureDocIntoDB = async (
  id: string,
  payload: Partial<TSignatureDoc>,
) => {
  const signatureDoc = await SignatureDoc.findById(id);
  if (!signatureDoc)
    throw new AppError(httpStatus.NOT_FOUND, "SignatureDoc not found");

  return SignatureDoc.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteSignatureDocFromDB = async (id: string) => {
  const signatureDoc = await SignatureDoc.findById(id);
  if (!signatureDoc)
    throw new AppError(httpStatus.NOT_FOUND, "SignatureDoc not found");

  await SignatureDoc.findByIdAndDelete(id);
  return { message: "SignatureDoc deleted successfully" };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Authenticate DocuSign using per-company credentials from DB
// Returns the authenticated API client AND the company's accountId.
// ─────────────────────────────────────────────────────────────────────────────

const getAuthenticatedDocuSignClient = async (companyId: string) => {
  const creds = await DocusignCredentials.findOne({ companyId });

  if (!creds?.clientId || !creds?.rsaPrivateKey) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "DocuSign is not configured for this company. Please update settings.",
    );
  }

  const dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(
    process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi",
  );

  const rsaKey:any = creds.rsaPrivateKey.replace(/\\n/g, "\n");

  const authResults = await dsApiClient.requestJWTUserToken(
    creds.clientId,
    creds.userId,
    ["signature"],
    rsaKey,
    3600,
  );

  dsApiClient.addDefaultHeader(
    "Authorization",
    "Bearer " + authResults.body.access_token,
  );

  return { dsApiClient, accountId: creds.accountId };
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADMIN ACTION: Create DocuSign Template
// ─────────────────────────────────────────────────────────────────────────────

const createDocuSignTemplate = async (
  documentUrl: string,
  content: string,
  companyId: string, // <-- now required
) => {
  try {
    const fileResponse = await fetch(documentUrl);
    if (!fileResponse.ok)
      throw new Error(`Failed to fetch document: ${fileResponse.statusText}`);
    const documentBase64 = Buffer.from(
      await fileResponse.arrayBuffer(),
    ).toString("base64");

    const { dsApiClient, accountId } =
      await getAuthenticatedDocuSignClient(companyId);

    const template = new (docusign as any).EnvelopeTemplate();
    template.name = content ? content.substring(0, 50) : "Company Template";
    template.emailSubject = "Please sign this document";
    template.shared = "false";
    template.status = "created";

    const doc = new (docusign as any).Document();
    doc.documentBase64 = documentBase64;
    doc.name = "Document";
    doc.fileExtension = "pdf";
    doc.documentId = "1";
    template.documents = [doc];

    const signer = (docusign as any).Signer.constructFromObject({
      roleName: "staff",
      recipientId: "1",
      routingOrder: "1",
    });
    template.recipients = (docusign as any).Recipients.constructFromObject({
      signers: [signer],
    });

    const templatesApi = new docusign.TemplatesApi(dsApiClient);
    const templateSummary:any = await templatesApi.createTemplate(accountId, {
      envelopeTemplate: template,
    });

    const viewRequest = new (docusign as any).ReturnUrlRequest();
    viewRequest.returnUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const editView = await templatesApi.createEditView(
      accountId,
      templateSummary.templateId,
      { returnUrlRequest: viewRequest },
    );

    return { templateId: templateSummary.templateId, editUrl: editView.url };
  } catch (error: any) {
    console.error(
      "Template Creation Error:",
      error.response?.body || error.message,
    );
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create DocuSign template",
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADMIN ACTION: Send Envelopes (with or without a Template)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADMIN ACTION: Send Envelopes (with or without a Template)
// ─────────────────────────────────────────────────────────────────────────────

const createAndSendSignatureDocs = async (payload: {
  employeeIds: string[];
  companyId: string;
  content: string;
  document: string;
  templateId?: string;
}) => {
  try {
    const { employeeIds, companyId, content, document, templateId } = payload;

    // Authenticate once for this company
    const { dsApiClient, accountId } =
      await getAuthenticatedDocuSignClient(companyId);

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    const rawWebhookUrl =
      process.env.WEBHOOK_URL || process.env.webhook_url || "";
    const webhookUrl = rawWebhookUrl.trim().replace(/['";]+/g, "");

    // Pre-fetch document only when not using a template
    let documentBase64 = "";
    if (!templateId) {
      const fileResponse = await fetch(document);
      if (!fileResponse.ok)
        throw new Error(
          `Failed to fetch document: ${fileResponse.status} ${fileResponse.statusText}`,
        );
      documentBase64 = Buffer.from(await fileResponse.arrayBuffer()).toString(
        "base64",
      );
    }

    const results = [];

    for (const empId of employeeIds) {
      const employee: any = await mongoose.model("User").findById(empId);
      if (!employee) {
        console.warn(`⚠️ Employee not found: ${empId}, skipping.`);
        continue;
      }

      const signerName =
        employee.name ||
        `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
      const signerEmail = employee.email;

      if (!signerEmail) {
        console.warn(`⚠️ Employee ${empId} has no email, skipping.`);
        continue;
      }

      // Create DB record
      const sigDoc = await SignatureDoc.create({
        content,
        document,
        employeeId: empId,
        companyId,
        status: "pending",
      });

      const envelope = new (docusign as any).EnvelopeDefinition();
      envelope.status = "sent";
      envelope.emailSubject = "Please sign this requested document";

      if (templateId) {
        // ── Template flow ──────────────────────────────────────────────
        envelope.templateId = templateId;
        envelope.templateRoles = [
          (docusign as any).TemplateRole.constructFromObject({
            email: signerEmail,
            name: signerName,
            // 🛑 CRITICAL FIX: Changed "Staff" to lowercase "staff" to exactly match the template setup
            roleName: "staff", 
            clientUserId: employee._id.toString(),
          }),
        ];
      } else {
        // ── Free-form document flow ────────────────────────────────────
        const docDef = new (docusign as any).Document();
        docDef.documentBase64 = documentBase64;
        docDef.name = content || "Document";
        docDef.fileExtension = "pdf";
        docDef.documentId = "1";
        envelope.documents = [docDef];

        const signer = (docusign as any).Signer.constructFromObject({
          email: signerEmail,
          name: signerName,
          clientUserId: employee._id.toString(), // Required for embedded signing
          recipientId: "1",
        });

        envelope.recipients = (docusign as any).Recipients.constructFromObject({
          signers: [signer],
        });
      }

      // ── Webhook ────────────────────────────────────────────────────
      if (webhookUrl && webhookUrl.startsWith("https://")) {
        envelope.eventNotification =
          (docusign as any).EventNotification.constructFromObject({
            url: webhookUrl,
            loggingEnabled: "true",
            requireAcknowledgment: "true",
            includeDocumentFields: "true",
            eventData: {
              version: "restv2.1",
              format: "json",
              includeData: ["custom_fields", "recipients"],
            },
            envelopeEvents: [
              (docusign as any).EnvelopeEvent.constructFromObject({
                envelopeEventStatusCode: "completed",
              }),
            ],
          });
      }

      // ── Custom fields ──────────────────────────────────────────────
      envelope.customFields = (docusign as any).CustomFields.constructFromObject({
        textCustomFields: [
          (docusign as any).TextCustomField.constructFromObject({
            name: "signatureDocId",
            value: sigDoc._id.toString(),
          }),
        ],
      });

      const envelopeSummary = await envelopesApi.createEnvelope(accountId, {
        envelopeDefinition: envelope,
      });

      (sigDoc as any).envelopeId = envelopeSummary.envelopeId;
      await sigDoc.save();
      results.push(sigDoc);
    }

    return results;
  } catch (error: any) {
    const exactError =
      error.response?.body || error.response?.data || error.message;
    console.error(
      "❌ DOCUSIGN API ERROR DETAILS:\n",
      JSON.stringify(exactError, null, 2),
    );

    const readableMessage =
      typeof exactError === "object"
        ? exactError?.message ||
          exactError?.errorCode ||
          JSON.stringify(exactError)
        : exactError;

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `DocuSign Error: ${readableMessage}`,
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. STAFF ACTION: Generate embedded signing URL
// ─────────────────────────────────────────────────────────────────────────────

const initiateSigningProcess = async (signatureDocId: string, signerId: string,layout: "staffLayout" | "adminLayout") => {
  try {
    const sigDoc = await SignatureDoc.findById(signatureDocId).populate("employeeId approverIds");
    if (!sigDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Signature document not found");
    }

    if (!sigDoc.envelopeId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Document has not been processed/sent to DocuSign yet.",
      );
    }

    const companyId = sigDoc.companyId?.toString();

    // 🚀 Check if the signer is the original employee or one of the approvers
    let signerUser: any = null;
    if ((sigDoc.employeeId as any)._id.toString() === signerId) {
      signerUser = sigDoc.employeeId;
    } else if (sigDoc.approverIds && sigDoc.approverIds.length > 0) {
      signerUser = (sigDoc.approverIds as any[]).find((app: any) => app._id.toString() === signerId);
    }

    if (!signerUser) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not authorized to sign this document.",
      );
    }

    const signerName =
      signerUser.name ||
      `${signerUser.firstName || ""} ${signerUser.lastName || ""}`.trim();
    const signerEmail = signerUser.email;

    if (!signerEmail || !signerName) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Employee/Approver email or name is missing",
      );
    }

    // Authenticate using company credentials
    const { dsApiClient, accountId } = await getAuthenticatedDocuSignClient(companyId as string);
    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    // Generate embedded signing URL using the EXISTING envelope
    const viewRequest = new (docusign as any).RecipientViewRequest();
    const returnPath =
      layout === "adminLayout"
        ? `/company/${companyId}/employee/${signerUser._id}?event=signing_complete`
        : `/company/${companyId}/staff/${signerUser._id}/document-request?event=signing_complete`;

    viewRequest.returnUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}${returnPath}`
      : `http://localhost:5173${returnPath}`;
    viewRequest.authenticationMethod = "none";
    viewRequest.email = signerEmail;
    viewRequest.userName = signerName;
    
    // 🚀 Tell DocuSign exactly who is opening the frame
    viewRequest.clientUserId = signerUser._id.toString();

    const viewResults = await envelopesApi.createRecipientView(
      accountId,
      sigDoc.envelopeId,
      { recipientViewRequest: viewRequest },
    );

    return { signingUrl: viewResults.url };
  } catch (error: any) {
   const exactError = error.response?.body || error.response?.data || error.message;
    
    console.error(
      "❌ DOCUSIGN SIGNING ERROR DETAILS:\n",
      JSON.stringify(exactError, null, 2)
    );

    const readableMessage =
      typeof exactError === "object"
        ? exactError?.message || exactError?.errorCode || JSON.stringify(exactError)
        : exactError;

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `DocuSign Error: ${readableMessage}`
    );
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ACTION: Forward to Higher Authority (FREE FORM & EMBEDDED SIGNING)
// ─────────────────────────────────────────────────────────────────────────────

const forwardDocumentForApproval = async (signatureDocId: string, approverIds: string[]) => {
  try {
    const sigDoc = await SignatureDoc.findById(signatureDocId);
    if (!sigDoc) throw new AppError(httpStatus.NOT_FOUND, "Document not found");
    if (!sigDoc.signedDocument) throw new AppError(httpStatus.BAD_REQUEST, "Document has not been signed by staff yet");

    const companyId = sigDoc.companyId?.toString();

    // 1. Fetch the PDF that the staff ALREADY signed
    const fileResponse = await fetch(sigDoc.signedDocument);
    if (!fileResponse.ok) throw new Error("Failed to fetch signed document from storage");
    const documentBase64 = Buffer.from(await fileResponse.arrayBuffer()).toString("base64");

    // 2. Authenticate
    const { dsApiClient, accountId } = await getAuthenticatedDocuSignClient(companyId as string);
    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    // 3. Create a NEW envelope with the signed document
    const envelope = new (docusign as any).EnvelopeDefinition();
    envelope.status = "sent";
    envelope.emailSubject = "Approval Required: Staff Signed Document";

    const docDef = new (docusign as any).Document();
    docDef.documentBase64 = documentBase64;
    docDef.name = "Signed Document for Approval";
    docDef.fileExtension = "pdf";
    docDef.documentId = "1";
    envelope.documents = [docDef];

    // 4. Add Authorities as Remote Signers (Free Form Signing)
    const signers = [];
    let recipientIdCounter = 1;

    for (const appId of approverIds) {
      const approver: any = await mongoose.model("User").findById(appId);
      if (approver && approver.email) {
        signers.push((docusign as any).Signer.constructFromObject({
          email: approver.email,
          name: approver.name || `${approver.firstName} ${approver.lastName}`.trim(),
          recipientId: recipientIdCounter.toString(), // Cleaned up variable name
          routingOrder: '1',
          clientUserId: approver._id.toString(), 
        }));
        recipientIdCounter++;
      }
    }

    envelope.recipients = (docusign as any).Recipients.constructFromObject({ signers });

    // 5. Attach existing Webhook to the NEW envelope
    const rawWebhookUrl = process.env.WEBHOOK_URL || "";
    const webhookUrl = rawWebhookUrl.trim().replace(/['";]+/g, "");
    if (webhookUrl && webhookUrl.startsWith("https://")) {
      envelope.eventNotification = (docusign as any).EventNotification.constructFromObject({
        url: webhookUrl,
        loggingEnabled: "true",
        requireAcknowledgment: "true",
        eventData: { version: "restv2.1", format: "json", includeData: ["custom_fields", "recipients"] },
        envelopeEvents: [
          (docusign as any).EnvelopeEvent.constructFromObject({ envelopeEventStatusCode: "completed" })
        ],
        recipientEvents: [
          (docusign as any).RecipientEvent.constructFromObject({ recipientEventStatusCode: "Completed" }) // Capitalized C just in case DocuSign is being strict
        ]
      });
    }

    // 6. Link back to the exact same DB Record
    envelope.customFields = (docusign as any).CustomFields.constructFromObject({
      textCustomFields: [(docusign as any).TextCustomField.constructFromObject({ name: "signatureDocId", value: sigDoc._id.toString() })],
    });

    // 7. Send Envelope and Update DB
    const envelopeSummary = await envelopesApi.createEnvelope(accountId, { envelopeDefinition: envelope });

    (sigDoc as any).envelopeId = envelopeSummary.envelopeId; 
    sigDoc.status = "forwarded"; 
    
    // Merge existing approvers with new approvers, avoiding duplicates
    const existingApprovers = sigDoc.approverIds?.map((id: any) => id.toString()) || [];
    const combinedApprovers = Array.from(new Set([...existingApprovers, ...approverIds]));
    
    sigDoc.approverIds = combinedApprovers as any;
    
    await sigDoc.save();

    return sigDoc;
  } catch (error: any) {
    // 🚀 NEW: Extract the exact error from DocuSign so we know what is failing!
    const exactError = error.response?.body || error.response?.data || error.message;
    console.error("❌ DOCUSIGN FORWARD ERROR DETAILS:\n", JSON.stringify(exactError, null, 2));

    const readableMessage =
      typeof exactError === "object"
        ? exactError?.message || exactError?.errorCode || JSON.stringify(exactError)
        : exactError;

    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, `DocuSign Error: ${readableMessage}`);
  }
};



// ─────────────────────────────────────────────────────────────────────────────
// 5. SYSTEM ACTION: Process DocuSign Webhook

// ─────────────────────────────────────────────────────────────────────────────


const processDocuSignWebhook = async (webhookPayload: any) => {
  try {
    const envelopeData = webhookPayload.data ?? webhookPayload;
    const envelopeSummary = envelopeData.envelopeSummary ?? envelopeData;
    const envelopeStatus = envelopeSummary.status;
    const envelopeId = envelopeData.envelopeId ?? envelopeSummary.envelopeId;

    // 1. Extract signatureDocId from custom fields
    const customFieldsRaw =
      envelopeSummary?.customFields?.textCustomFields ??
      envelopeSummary?.customFields?.text ??
      [];

    const dbIdField = customFieldsRaw.find((f: any) => f.name === "signatureDocId");
    if (!dbIdField?.value) return { success: true }; // Not our document

    const signatureDocId = dbIdField.value;
    const sigDoc = await SignatureDoc.findById(signatureDocId);
    
    if (!sigDoc) throw new Error(`SignatureDoc not found in DB: ${signatureDocId}`);

    // 2. 🚀 Track Individual Signers robustly
    // Look for recipients in multiple possible DocuSign payload locations
    const recipients = envelopeSummary?.recipients ?? envelopeData?.recipients;
    const signers = recipients?.signers ?? [];
    
    const completedSignerIds = signers
      .filter((signer: any) => signer.status === "completed" && signer.clientUserId)
      .map((signer: any) => signer.clientUserId);

    if (completedSignerIds.length > 0) {
      // 🚀 FIX: Use Mongoose $addToSet to safely push unique IDs directly to the database
      await SignatureDoc.findByIdAndUpdate(signatureDocId, {
        $addToSet: { signedByApprovers: { $each: completedSignerIds } }
      });
      console.log(`👤 Successfully saved signedByApprovers for ${signatureDocId}:`, completedSignerIds);
    }

    // 3. Stop here if the ENTIRE envelope is not finished yet
    // (This allows individual "recipient-completed" webhooks to update the DB above, then exit)
    if (envelopeStatus !== "completed") {
      console.log(`⏭️ Envelope ${envelopeId} is '${envelopeStatus}'. Individual signatures updated, waiting for final completion.`);
      return { success: true };
    }

    // 4. Handle Final Document Download (Only runs when EVERYONE is done)
    const companyId = sigDoc.companyId?.toString();
    if (!companyId) throw new Error(`SignatureDoc ${signatureDocId} has no companyId`);

    const { dsApiClient, accountId } = await getAuthenticatedDocuSignClient(companyId);
    const envelopesApi = new (docusign as any).EnvelopesApi(dsApiClient);
    
    const documentRaw = await envelopesApi.getDocument(accountId, envelopeId, "combined");

    let signedPdfBuffer: Buffer;
    if (Buffer.isBuffer(documentRaw)) signedPdfBuffer = documentRaw;
    else if (typeof documentRaw === "string") signedPdfBuffer = Buffer.from(documentRaw, "binary");
    else signedPdfBuffer = Buffer.from(documentRaw as any);

    const newSignedUrl = await UploadDocumentService.UploadBufferToGCS(
      signedPdfBuffer,
      `${signatureDocId}-signed.pdf`,
      "application/pdf",
    );

    // Final DB update
    await SignatureDoc.findByIdAndUpdate(signatureDocId, {
      signedDocument: newSignedUrl,
      status: "submitted",
      submittedAt: new Date(),
    });

    console.log(`✅ Final Document fully completed and saved for ${signatureDocId}`);
    return { success: true };

  } catch (error: any) {
    console.error("❌ Error processing DocuSign Webhook:", error.message);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. ADMIN ACTION: List templates for a company
// ─────────────────────────────────────────────────────────────────────────────

const getDocuSignTemplates = async (companyId: string) => {
  try {
    const { dsApiClient, accountId } =
      await getAuthenticatedDocuSignClient(companyId);

    const templatesApi = new docusign.TemplatesApi(dsApiClient);
    const results = await templatesApi.listTemplates(accountId);

    return (
      results.envelopeTemplates?.map((t) => {
        console.log(
          "Raw DocuSign Template Object:",
          JSON.stringify(t, null, 2),
        );
        return {
          templateId: t.templateId,
          name: t.name || t.description || "Unnamed Template",
        };
      }) ?? []
    );
  } catch (error: any) {
   const exactError = error.response?.body || error.response?.data || error.message;
    console.error("❌ DOCUSIGN TEMPLATE ERROR DETAILS:\n", JSON.stringify(exactError, null, 2));

    // DocuSign JWT auth errors usually have 'error_description', API errors have 'message'
    const readableMessage =
      typeof exactError === "object"
        ? exactError?.error_description || exactError?.message || exactError?.errorCode || JSON.stringify(exactError)
        : exactError;

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `DocuSign Error: ${readableMessage}`
    );
  }
};

export const SignatureDocServices = {
  getAllSignatureDocFromDB,
  getSingleSignatureDocFromDB,
  updateSignatureDocIntoDB,
  createSignatureDocIntoDB,
  deleteSignatureDocFromDB,
  createDocuSignTemplate,
  createAndSendSignatureDocs,
  initiateSigningProcess,
  processDocuSignWebhook,
  getDocuSignTemplates,
  forwardDocumentForApproval
};
