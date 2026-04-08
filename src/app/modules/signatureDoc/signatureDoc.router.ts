import express from 'express';
import { SignatureDocControllers } from './signatureDoc.controller';

const router = express.Router();

// --- DocuSign Specific Routes ---

// 1. Admin creates a DocuSign Template
router.post(
  '/create-template',
  SignatureDocControllers.generateTemplate
);



// 2. Admin finalizes and sends docs to staff (supports Template or Free-Form)
router.post(
  '/send',
  SignatureDocControllers.sendSignatureDocs
);
router.get(
  '/templates',
  SignatureDocControllers.fetchTemplates
);


router.post(
  '/forward/:id',
  SignatureDocControllers.forwardSignatureDoc
);


// 3. Staff signs the document
router.post(
  '/initiate-signing/:signatureDocId',
  SignatureDocControllers.initiateDocuSign
);

// 4. DocuSign Webhook updates the database
router.post(
  '/docusign-webhook',
  SignatureDocControllers.handleDocuSignWebhook
);

// --- Standard CRUD Routes ---
router.post(
  '/',
  SignatureDocControllers.createSignatureDoc
);

router.get(
  '/',
  SignatureDocControllers.getAllSignatureDoc
);

router.get(
  '/:id',
  SignatureDocControllers.getSingleSignatureDoc
);

router.patch(
  '/:id',
  SignatureDocControllers.updateSignatureDoc
);

router.delete(
  '/:id',
  SignatureDocControllers.deleteSignatureDoc
);

export const SignatureDocRoutes = router;