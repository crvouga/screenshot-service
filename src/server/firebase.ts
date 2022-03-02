import admin from "firebase-admin";
import dotenv from "./dotenv";
import * as base64 from "js-base64";

const cred = JSON.parse(
  base64.decode(dotenv.FIREBASE_ADMIN_CREDENTIAL_JSON_BASE64)
);

const firebaseAdminApp = admin.initializeApp({
  credential: admin.credential.cert(cred),
});

export const firebaseStorage = firebaseAdminApp.storage();
