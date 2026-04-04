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
    SignatureDoc.find().populate({
      path: "employeeId",
      select: "name firstName lastName email phone",
    }),
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
      roleName: "Staff",
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
            roleName: "Staff",
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

const initiateSigningProcess = async (signatureDocId: string) => {
  try {
    const sigDoc =
      await SignatureDoc.findById(signatureDocId).populate("employeeId");
    if (!sigDoc) {
      throw new AppError(httpStatus.NOT_FOUND, "Signature document not found");
    }

    // 🚀 Check if envelopeId exists (it was created in Step 2)
    if (!sigDoc.envelopeId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Document has not been processed/sent to DocuSign yet.",
      );
    }

    const employee = sigDoc.employeeId as any;
    const companyId = sigDoc.companyId?.toString();

    const signerName =
      employee.name ||
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
    const signerEmail = employee.email;

    if (!signerEmail || !signerName) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Employee email or name is missing",
      );
    }

    // Authenticate using company credentials
    const { dsApiClient, accountId } =
      await getAuthenticatedDocuSignClient(companyId);
    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    // Generate embedded signing URL using the EXISTING envelope
    const viewRequest = new (docusign as any).RecipientViewRequest();
    viewRequest.returnUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/company/${companyId}/employee/${employee._id}`
      : "http://localhost:5173";
    viewRequest.authenticationMethod = "none";
    viewRequest.email = signerEmail;
    viewRequest.userName = signerName;
    viewRequest.clientUserId = employee._id.toString();

    // 🚀 USE THE EXISTING ENVELOPE ID FROM THE DATABASE!
    // No need to fetch files or create a new envelope.
    const viewResults = await envelopesApi.createRecipientView(
      accountId,
      sigDoc.envelopeId,
      { recipientViewRequest: viewRequest },
    );

    return { signingUrl: viewResults.url };
  } catch (error: any) {
    const exactError =
      error.response?.body || error.response?.data || error.message;
    console.error(
      "❌ DOCUSIGN SIGNING ERROR DETAILS:\n",
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
// 4. SYSTEM ACTION: Process DocuSign Webhook
// NOTE: The webhook does NOT carry a companyId, so we look it up from our DB
//       using the signatureDocId embedded in the envelope's custom fields.
// ─────────────────────────────────────────────────────────────────────────────

const processDocuSignWebhook = async (webhookPayload: any) => {
  try {
    console.log(
      "📦 Webhook received:",
      JSON.stringify(webhookPayload, null, 2),
    );

    const envelopeData = webhookPayload.data ?? webhookPayload;
    const envelopeSummary = envelopeData.envelopeSummary ?? envelopeData;
    const envelopeStatus = envelopeSummary.status;
    const envelopeId = envelopeData.envelopeId ?? envelopeSummary.envelopeId;

    console.log(`📋 Envelope ${envelopeId} status: ${envelopeStatus}`);

    if (envelopeStatus !== "completed") {
      console.log(
        `⏭️ Skipping — status is '${envelopeStatus}', not 'completed'`,
      );
      return { success: true };
    }

    // Extract signatureDocId from custom fields
    const customFieldsRaw =
      envelopeSummary?.customFields?.textCustomFields ??
      envelopeSummary?.customFields?.text ??
      [];

    console.log("🔑 Custom fields received:", JSON.stringify(customFieldsRaw));

    const dbIdField = customFieldsRaw.find(
      (f: any) => f.name === "signatureDocId",
    );
    if (!dbIdField?.value)
      throw new Error("signatureDocId not found in DocuSign custom fields");

    const signatureDocId = dbIdField.value;
    console.log(`🆔 signatureDocId resolved: ${signatureDocId}`);

    // Resolve companyId from our DB record so we can pick the right credentials
    const sigDoc = await SignatureDoc.findById(signatureDocId).lean();
    if (!sigDoc)
      throw new Error(`SignatureDoc not found in DB: ${signatureDocId}`);

    const companyId = sigDoc.companyId?.toString();
    if (!companyId)
      throw new Error(`SignatureDoc ${signatureDocId} has no companyId`);

    // Authenticate with company-specific credentials
    const { dsApiClient, accountId } =
      await getAuthenticatedDocuSignClient(companyId);

    // Download the completed, signed document
    const envelopesApi = new (docusign as any).EnvelopesApi(dsApiClient);
    const documentRaw = await envelopesApi.getDocument(
      accountId,
      envelopeId,
      "combined",
    );

    console.log(
      `📄 Downloaded document type: ${typeof documentRaw}, isBuffer: ${Buffer.isBuffer(
        documentRaw,
      )}`,
    );

    // Robust buffer conversion
    let signedPdfBuffer: Buffer;
    if (Buffer.isBuffer(documentRaw)) {
      signedPdfBuffer = documentRaw;
    } else if (typeof documentRaw === "string") {
      signedPdfBuffer = Buffer.from(documentRaw, "binary");
    } else {
      signedPdfBuffer = Buffer.from(documentRaw as any);
    }

    // Validate PDF header
    const pdfHeader = signedPdfBuffer.slice(0, 4).toString("ascii");
    if (pdfHeader !== "%PDF") {
      console.error(`❌ Not a valid PDF. Header: "${pdfHeader}"`);
      throw new Error("Downloaded document is not a valid PDF");
    }
    console.log(
      `✅ PDF buffer validated, size: ${signedPdfBuffer.length} bytes`,
    );

    // Upload to GCS
    const newSignedUrl = await UploadDocumentService.UploadBufferToGCS(
      signedPdfBuffer,
      `${signatureDocId}-signed.pdf`,
      "application/pdf",
    );
    console.log(`☁️ Uploaded signed PDF to GCS: ${newSignedUrl}`);

    // Update DB record
    await SignatureDoc.findByIdAndUpdate(signatureDocId, {
      signedDocument: newSignedUrl,
      status: "submitted",
      submittedAt: new Date(),
    });
    console.log(`✅ DB updated for SignatureDoc ${signatureDocId}`);

    return { success: true };
  } catch (error: any) {
    console.error("❌ Error processing DocuSign Webhook:", error.message);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. ADMIN ACTION: List templates for a company
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
    console.error(
      "Failed to fetch templates:",
      error.response?.body || error.message,
    );
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to fetch DocuSign templates",
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
};
