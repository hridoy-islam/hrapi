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
  const modifiedQuery = { ...query };

  // Build a custom $or filter for employeeId and approverIds
  const orConditions: Record<string, unknown>[] = [];

  if (modifiedQuery.employeeId) {
    orConditions.push({ employeeId: modifiedQuery.employeeId });
    delete modifiedQuery.employeeId;
  }

  if (modifiedQuery.approverIds) {
    orConditions.push({ "approverIds.userId": modifiedQuery.approverIds });
    delete modifiedQuery.approverIds;
  }

  // Base query with $or if needed
  const baseQuery =
    orConditions.length > 0
      ? SignatureDoc.find({ $or: orConditions })
      : SignatureDoc.find();

  const userQuery = new QueryBuilder(
    baseQuery.populate([
      {
        path: "employeeId",
        select: "name firstName lastName email phone",
      },
      {
        path: "approverIds.userId",
        select: "firstName lastName email",
      },
      {
        path: "signedBy.userId",
        select: "firstName lastName email",
      },
    ]),
    modifiedQuery, // remaining filters like companyId, status, etc.
  )
    .search(SignatureDocSearchableFields)
    .filter(modifiedQuery)
    .sort()
    .paginate()
    .fields();

  const meta = await userQuery.countTotal();
  const result = await userQuery.modelQuery;
  return { meta, result };
};

const getSingleSignatureDocFromDB = async (id: string) => {
  return SignatureDoc.findById(id).populate([
    {
      path: "employeeId",
      select: "name firstName lastName email phone designationId",
      // Nested populate for the employee's designation
      populate: {
        path: "designationId",
        select: "title", // Change to "name" if your Designation schema uses 'name' instead of 'title'
      },
    },
    {
      path: "approverIds.userId",
      select: "firstName lastName email designationId",
      // Nested populate for the approver's designation
      populate: {
        path: "designationId",
        select: "title", 
      },
    },
    {
      path: "signedBy.userId",
      select: "firstName lastName email designationId",
      // Nested populate for the signer's designation
      populate: {
        path: "designationId",
        select: "title",
      },
    },
  ]);
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

  const rsaKey: any = creds.rsaPrivateKey.replace(/\\n/g, "\n");

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
    const templateSummary: any = await templatesApi.createTemplate(accountId, {
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
  approverIds?: string[]; // Array of User ObjectIds
  companyId: string;
  content: string;
  document: string;
  templateId?: string;
}) => {
  try {
    const {
      employeeIds,
      approverIds = [],
      companyId,
      content,
      document,
      templateId,
    } = payload;

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
      if (!fileResponse.ok) {
        throw new Error(
          `Failed to fetch document: ${fileResponse.status} ${fileResponse.statusText}`,
        );
      }
      documentBase64 = Buffer.from(await fileResponse.arrayBuffer()).toString(
        "base64",
      );
    }

    // ── 1. PREPARE APPROVERS BY INDEX ──
    // Map the incoming array exactly to your ForwardSchema structure
    const dbApprovers = approverIds.map((userId, index) => ({
      index, // 0, 1, 2...
      userId,
    }));

    // Fetch the actual user records so we have their names and emails for DocuSign
    const validApprovers = [];
    for (const app of dbApprovers) {
      const userDoc: any = await mongoose.model("User").findById(app.userId);
      if (userDoc && userDoc.email) {
        validApprovers.push({
          user: userDoc,
          index: app.index, // Retain the schema index for routing logic
        });
      } else {
        console.warn(`⚠️ Approver missing or has no email: ${app.userId}`);
      }
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

      // ── 2. CREATE DB RECORD ──
      const sigDoc = await SignatureDoc.create({
        content,
        document,
        employeeId: empId,
        companyId,
        status: "pending",
        approverIds: dbApprovers,
      });

      const envelope = new (docusign as any).EnvelopeDefinition();
      envelope.status = "sent";
      envelope.emailSubject = "Please sign this requested document";

      const signers = [];
      const templateRoles = [];
      let currentRecipientId = 1;

      // ── 3. SET EMPLOYEE TO ROUTING ORDER 1 ──
      if (templateId) {
        // Template flow
        envelope.templateId = templateId;
        templateRoles.push(
          (docusign as any).TemplateRole.constructFromObject({
            email: signerEmail,
            name: signerName,
            roleName: "staff",
            clientUserId: employee._id.toString(),
            routingOrder: "1", // Employee signs first
          }),
        );
        currentRecipientId++;
      } else {
        // Free-form document flow
        const docDef = new (docusign as any).Document();
        docDef.documentBase64 = documentBase64;
        docDef.name = content || "Document";
        docDef.fileExtension = "pdf";
        docDef.documentId = "1";
        envelope.documents = [docDef];

        signers.push(
          (docusign as any).Signer.constructFromObject({
            email: signerEmail,
            name: signerName,
            clientUserId: employee._id.toString(), // Required for embedded signing
            recipientId: currentRecipientId.toString(),
            routingOrder: "1", // Employee signs first
          }),
        );
        currentRecipientId++;
      }

      // ── 4. SET APPROVERS TO ROUTING ORDER (INDEX + 2) ──
      for (const approverObj of validApprovers) {
        const { user, index } = approverObj;
        const approverName =
          user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();

        // Mathematical mapping: DB index 0 -> Routing Order 2
        const docuSignRoutingOrder = (index + 2).toString();

        if (templateId) {
          // Add approver as a TemplateRole if using a template
          templateRoles.push(
            (docusign as any).TemplateRole.constructFromObject({
              email: user.email,
              name: approverName,
              roleName: "staff", // NOTE: Ensure this matches the exact role name defined for approvers in your DocuSign template!
              clientUserId: user._id.toString(),
              routingOrder: docuSignRoutingOrder,
            }),
          );
        } else {
          // Add approver as a raw Signer if NOT using a template
          signers.push(
            (docusign as any).Signer.constructFromObject({
              email: user.email,
              name: approverName,
              clientUserId: user._id.toString(), // Required for embedded signing
              recipientId: currentRecipientId.toString(),
              routingOrder: docuSignRoutingOrder,
            }),
          );
        }
        currentRecipientId++;
      }

      // Attach appended template roles OR signers to the envelope
      if (templateId && templateRoles.length > 0) {
        envelope.templateRoles = templateRoles;
      } else if (!templateId && signers.length > 0) {
        envelope.recipients = (docusign as any).Recipients.constructFromObject({
          signers: signers,
        });
      }

      // ── 5. WEBHOOK CONFIGURATION ──
      if (webhookUrl && webhookUrl.startsWith("https://")) {
        envelope.eventNotification = (
          docusign as any
        ).EventNotification.constructFromObject({
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
          // Ensures webhook fires when EACH approver completes their turn
          recipientEvents: [
            (docusign as any).RecipientEvent.constructFromObject({
              recipientEventStatusCode: "Completed",
            }),
          ],
        });
      }

      // ── 6. CUSTOM FIELDS (Link Envelope to DB Record) ──
      envelope.customFields = (
        docusign as any
      ).CustomFields.constructFromObject({
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

const initiateSigningProcess = async (
  signatureDocId: string,
  signerId: string,
  layout: "staffLayout" | "adminLayout",
) => {
  try {
    const sigDoc = await SignatureDoc.findById(signatureDocId).populate(
      "employeeId approverIds.userId",
    );
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

    let signerUser: any = null;
    let isApprover = false;
    let currentApproverIndex = -1;

    // Determine who is trying to sign
    if ((sigDoc.employeeId as any)._id.toString() === signerId) {
      signerUser = sigDoc.employeeId;
    } else if (sigDoc.approverIds && sigDoc.approverIds.length > 0) {
      const matchedApprover = (sigDoc.approverIds as any[]).find(
        (app: any) =>
          app.userId?._id?.toString() === signerId ||
          app.userId?.toString() === signerId,
      );

      if (matchedApprover) {
        signerUser = matchedApprover.userId;
        isApprover = true;
        currentApproverIndex = matchedApprover.index;
      }
    }

    if (!signerUser) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not authorized to sign this document.",
      );
    }

    if (isApprover) {
      const signedUserIds =
        sigDoc.signedBy?.map((s: any) => s.userId?.toString()) || [];

      // Check if there are any approvers with a lower index who haven't signed yet
      const waitingOnPreviousApprover = (sigDoc.approverIds as any[]).some(
        (app: any) => {
          const appUserId =
            app.userId?._id?.toString() || app.userId?.toString();
          return (
            app.index < currentApproverIndex &&
            !signedUserIds.includes(appUserId)
          );
        },
      );

      if (waitingOnPreviousApprover) {
        throw new AppError(
          httpStatus.FORBIDDEN, // 403 Forbidden is the correct semantic code here
          "It is not your turn to sign yet. Please wait for previous authorities to complete their approval.",
        );
      }
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

    const { dsApiClient, accountId } = await getAuthenticatedDocuSignClient(
      companyId as string,
    );
    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);

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
    viewRequest.clientUserId = signerUser._id.toString();

    const viewResults = await envelopesApi.createRecipientView(
      accountId,
      sigDoc.envelopeId,
      { recipientViewRequest: viewRequest },
    );

    return { signingUrl: viewResults.url };
  } catch (error: any) {
    if (error instanceof AppError) throw error; // Pass through our custom turn-based errors

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
// ADMIN ACTION: Forward to Higher Authority (FREE FORM & EMBEDDED SIGNING)
// ─────────────────────────────────────────────────────────────────────────────

const forwardDocumentForApproval = async (
  signatureDocId: string,
  approverIds: string[],
) => {
  try {
    const sigDoc = await SignatureDoc.findById(signatureDocId);
    if (!sigDoc) throw new AppError(httpStatus.NOT_FOUND, "Document not found");
    if (!sigDoc.signedDocument)
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Document has not been signed by staff yet",
      );

    const companyId = sigDoc.companyId?.toString();

    const fileResponse = await fetch(sigDoc.signedDocument);
    if (!fileResponse.ok)
      throw new Error("Failed to fetch signed document from storage");
    const documentBase64 = Buffer.from(
      await fileResponse.arrayBuffer(),
    ).toString("base64");

    const { dsApiClient, accountId } = await getAuthenticatedDocuSignClient(
      companyId as string,
    );
    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    const envelope = new (docusign as any).EnvelopeDefinition();
    envelope.status = "sent";
    envelope.emailSubject = "Approval Required: Staff Signed Document";

    const docDef = new (docusign as any).Document();
    docDef.documentBase64 = documentBase64;
    docDef.name = "Signed Document for Approval";
    docDef.fileExtension = "pdf";
    docDef.documentId = "1";
    envelope.documents = [docDef];

    // 🚀 NEW: Consolidate DB array updates and DocuSign Routing Order logic
    const existingApprovers = sigDoc.approverIds || [];
    const existingApproverUserIds = existingApprovers.map((app: any) =>
      app.userId.toString(),
    );
    const newApproverIds = approverIds.filter(
      (id) => !existingApproverUserIds.includes(id.toString()),
    );

    let nextIndex =
      existingApprovers.length > 0
        ? Math.max(...existingApprovers.map((app: any) => app.index)) + 1
        : 0;

    const signers = [];
    let recipientIdCounter = existingApprovers.length + 1;

    for (const newId of newApproverIds) {
      const approver: any = await mongoose.model("User").findById(newId);
      if (approver && approver.email) {
        const currentIndex = nextIndex++; // Grab current index, then increment for the next loop

        // Add to DocuSign Envelope mapping index to routingOrder
        signers.push(
          (docusign as any).Signer.constructFromObject({
            email: approver.email,
            name:
              approver.name ||
              `${approver.firstName} ${approver.lastName}`.trim(),
            recipientId: recipientIdCounter.toString(),
            // routingOrder must be a string > 0. We add 1 so DB index 0 becomes DocuSign order 1.
            routingOrder: (currentIndex + 1).toString(),
            clientUserId: approver._id.toString(),
          }),
        );
        recipientIdCounter++;

        // Add to DB array
        (sigDoc.approverIds as any[]).push({
          index: currentIndex,
          userId: newId,
        });
      }
    }

    // If there are no new signers to add, stop processing to prevent DocuSign errors
    if (signers.length === 0) {
      return sigDoc;
    }

    envelope.recipients = (docusign as any).Recipients.constructFromObject({
      signers,
    });

    const rawWebhookUrl = process.env.WEBHOOK_URL || "";
    const webhookUrl = rawWebhookUrl.trim().replace(/['";]+/g, "");
    if (webhookUrl && webhookUrl.startsWith("https://")) {
      envelope.eventNotification = (
        docusign as any
      ).EventNotification.constructFromObject({
        url: webhookUrl,
        loggingEnabled: "true",
        requireAcknowledgment: "true",
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
        recipientEvents: [
          (docusign as any).RecipientEvent.constructFromObject({
            recipientEventStatusCode: "Completed",
          }),
        ],
      });
    }

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
    sigDoc.status = "forwarded";

    await sigDoc.save();

    return sigDoc;
  } catch (error: any) {
    const exactError =
      error.response?.body || error.response?.data || error.message;
    console.error(
      "❌ DOCUSIGN FORWARD ERROR DETAILS:\n",
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
// 5. SYSTEM ACTION: Process DocuSign Webhook

// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const processDocuSignWebhook = async (webhookPayload: any) => {
  try {
    const envelopeData = webhookPayload.data ?? webhookPayload;
    const envelopeSummary = envelopeData.envelopeSummary ?? envelopeData;
    const envelopeStatus = envelopeSummary.status;
    const envelopeId = envelopeData.envelopeId ?? envelopeSummary.envelopeId;

    const customFieldsRaw =
      envelopeSummary?.customFields?.textCustomFields ??
      envelopeSummary?.customFields?.text ??
      [];

    const dbIdField = customFieldsRaw.find(
      (f: any) => f.name === "signatureDocId",
    );
    
    if (!dbIdField?.value) {
      // If there's no DB ID, it's not a document our system generated. Ignore safely.
      return { success: true }; 
    }

    const signatureDocId = dbIdField.value;
    const sigDoc = await SignatureDoc.findById(signatureDocId);

    if (!sigDoc) {
      throw new Error(`SignatureDoc not found in DB: ${signatureDocId}`);
    }

    const recipients = envelopeSummary?.recipients ?? envelopeData?.recipients;
    const signers = recipients?.signers ?? [];

    // 1. Identify who has actually finished signing
    const completedSignerIds = signers
      .filter(
        (signer: any) => signer.status === "completed" && signer.clientUserId,
      )
      .map((signer: any) => signer.clientUserId);

    const existingSignedUserIds =
      sigDoc.signedBy?.map((s: any) => s.userId.toString()) || [];
    
    // Find signers who just finished but aren't in our DB array yet
    const newSigners = completedSignerIds
      .filter((id: string) => !existingSignedUserIds.includes(id))
      .map((id: string) => ({ userId: id }));

    const isEnvelopeFullyCompleted = envelopeStatus === "completed";

    // 2. If someone new signed OR the whole envelope is now fully complete, UPDATE the Document
    if (newSigners.length > 0 || isEnvelopeFullyCompleted) {
      console.log(`🔄 Fetching updated document for ${signatureDocId}...`);

      const companyId = sigDoc.companyId?.toString();
      if (!companyId) {
        throw new Error(`SignatureDoc ${signatureDocId} has no companyId`);
      }

      const { dsApiClient, accountId } = await getAuthenticatedDocuSignClient(companyId);
      const envelopesApi = new (docusign as any).EnvelopesApi(dsApiClient);

      // 3. RETRY LOGIC: Fetch the combined document gracefully handling network timeouts
      let documentRaw;
      let retries = 3;
      
      while (retries > 0) {
        try {
          documentRaw = await envelopesApi.getDocument(
            accountId,
            envelopeId,
            "combined"
          );
          break; // If successful, break out of the while loop
        } catch (fetchError: any) {
          retries--;
          const isTimeout = fetchError.message?.includes("ETIMEDOUT") || fetchError.code === "ETIMEDOUT";
          
          if (retries === 0 || !isTimeout) {
            throw fetchError; // Out of retries or it's a hard error (like 401 Unauthorized), crash out
          }
          console.warn(`⚠️ DocuSign API Timeout. Retrying... (${retries} attempts left)`);
          await delay(2000); // Wait 2 seconds before trying again
        }
      }

      // Format the fetched document into a Buffer
      let signedPdfBuffer: Buffer;
      if (Buffer.isBuffer(documentRaw)) {
        signedPdfBuffer = documentRaw;
      } else if (typeof documentRaw === "string") {
        signedPdfBuffer = Buffer.from(documentRaw, "binary");
      } else {
        signedPdfBuffer = Buffer.from(documentRaw as any);
      }

      // 4. Upload to Google Cloud Storage
      // 🚀 Appending Date.now() so the browser doesn't cache the old PDF url
      const newSignedUrl = await UploadDocumentService.UploadBufferToGCS(
        signedPdfBuffer,
        `${signatureDocId}-signed-${Date.now()}.pdf`,
        "application/pdf",
      );

      // 5. Prepare the DB update payload
      const updatePayload: any = {
        $set: {
          signedDocument: newSignedUrl,
          // If everyone is done, it's completed. Otherwise, keep it as submitted (in-progress)
          status: isEnvelopeFullyCompleted ? "completed" : "submitted",
        },
      };

      if (newSigners.length > 0) {
        updatePayload.$push = { signedBy: { $each: newSigners } };
      }

      if (!sigDoc.submittedAt) {
        updatePayload.$set.submittedAt = new Date();
      }

      // 6. Save everything to the database at once
      await SignatureDoc.findByIdAndUpdate(signatureDocId, updatePayload);

      // Logging for your server console
      if (newSigners.length > 0) {
        console.log(`👤 Successfully saved signedBy for ${signatureDocId}:`, newSigners);
        console.log(`⏭️ Envelope ${envelopeId} intermediate signed document & status updated!`);
      }

      if (isEnvelopeFullyCompleted) {
        console.log(`✅ Final Document fully completed and saved for ${signatureDocId}`);
      }

    } else {
      // It was just a delivery or view webhook, no new signatures yet
      console.log(`⏭️ Envelope ${envelopeId} is '${envelopeStatus}'. Waiting for next signature.`);
    }

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
    const exactError =
      error.response?.body || error.response?.data || error.message;
    console.error(
      "❌ DOCUSIGN TEMPLATE ERROR DETAILS:\n",
      JSON.stringify(exactError, null, 2),
    );

    // DocuSign JWT auth errors usually have 'error_description', API errors have 'message'
    const readableMessage =
      typeof exactError === "object"
        ? exactError?.error_description ||
          exactError?.message ||
          exactError?.errorCode ||
          JSON.stringify(exactError)
        : exactError;

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `DocuSign Error: ${readableMessage}`,
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
  forwardDocumentForApproval,
};
