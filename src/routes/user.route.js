module.exports = (app) => {
  const router = require("express").Router();
  const authController = require("../controllers/user.controller"); // <- use the auth controller

  // POST request for signup
  router.post("/signup", authController.signup);
  // POST /user/signin
  router.post("/signin", authController.signin);
  // ✅ New route to get all users
  router.get("/users", authController.getAllUsers);

  // Mount the router on /user
  app.use("/user", router);
};
