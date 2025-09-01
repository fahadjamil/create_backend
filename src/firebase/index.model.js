let { initializeApp } = require("firebase/app");

var admin = require("firebase-admin");
const firebaseWebConfig = require("../config/Firebase.web.config");
const adminconfig = require("../config/Firebase.config");

const app = initializeApp(firebaseWebConfig);
const adminApp = admin.initializeApp({
  credential: admin.credential.cert(adminconfig),
});
module.exports = {
  app,
  adminApp,
};
