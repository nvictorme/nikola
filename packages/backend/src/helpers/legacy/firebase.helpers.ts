import admin from "firebase-admin";
import { resolve } from "path";

const credentials = resolve(__dirname + "/credentials.json");

admin.initializeApp({
  credential: admin.credential.cert(credentials),
  databaseURL: "https://inflalo.firebaseio.com",
});

const db = admin.firestore();

export { admin, db };
