const express = require("express");
const {
  registerUser,
  verifyEmail,
  resendVerifyEmail,
  loginUser,
  getCurrentUser,
  logoutUser,
  updateSubscription,
  updateAvatar,
} = require("../../controllers/auth");
const { validateBody, authenticate, upload } = require("../../middlewares");
const { schemas } = require("../../models/user");

const authRouter = express.Router();

// Sign up
authRouter.post(
  "/register",
  validateBody(schemas.registerOrLoginSchema),
  registerUser
);

authRouter.get("/users/verify/:verificationToken", verifyEmail);

authRouter.post(
  "/users/verify",
  validateBody(schemas.verifySchema),
  resendVerifyEmail
);

// Sign in
authRouter.post(
  "/login",
  validateBody(schemas.registerOrLoginSchema),
  loginUser
);

authRouter.get("/current", authenticate, getCurrentUser);

authRouter.post("/logout", authenticate, logoutUser);

// Updates
authRouter.patch(
  "/users",
  authenticate,
  validateBody(schemas.subscriptionSchema),
  updateSubscription
);

authRouter.patch(
  "/users/avatars",
  authenticate,
  upload.single("avatar"),
  updateAvatar
);

module.exports = authRouter;
