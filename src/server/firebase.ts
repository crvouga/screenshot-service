import admin from "firebase-admin";

const credEnv = process.env.FIREBASE_ADMIN_CREDENTIAL_JSON;

if (!credEnv) {
  throw new Error("process.env.FIREBASE_ADMIN_CREDENTIAL_JSON is undefined");
}

const cred = JSON.parse(credEnv);

export const firebaseAdminApp = admin.initializeApp({
  credential: admin.credential.cert(cred),
});
