/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";

import { TDocusignCredentials } from "./docusignCredentials.interface";
import config from "../../config";

const DocusignCredentialsSchema = new Schema<TDocusignCredentials>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    clientId: { type: String ,required: true},
    userId: { type: String ,required: true},   
    accountId: { type: String ,required: true},
    rsaPrivateKey: { type: String ,required: true},
  },
  {
    timestamps: true,
  },
);


// DocusignCredentialsSchema.pre("save", async function (next) {
//   const docusign = this;

//   const saltRounds = Number(config.bcrypt_salt_rounds);

//   if (docusign.isModified("clientId")) {
//     docusign.clientId = await bcrypt.hash(docusign.clientId, saltRounds);
//   }

//   if (docusign.isModified("userId")) {
//     docusign.userId = await bcrypt.hash(docusign.userId, saltRounds);
//   }

//   if (docusign.isModified("accountId")) {
//     docusign.accountId = await bcrypt.hash(docusign.accountId, saltRounds);
//   }

//   if (docusign.isModified("rsaPrivateKey")) {
//     docusign.rsaPrivateKey = await bcrypt.hash(docusign.rsaPrivateKey, saltRounds);
//   }

//   next();
// });



export const DocusignCredentials = model<TDocusignCredentials>("DocusignCredentials", DocusignCredentialsSchema);
