import express from "express";
import { login, logout, refreshAccessToken, register, requestPasswordReset, resetPassword } from "../controllers/authController.js";
import { sendOtp, verifyOtp } from "../controllers/otpController.js";
import { emailValidation, loginValidation, registerValidation, verifyOtpValidation } from "../validators/authValidator.js";
import { validate } from "../middleware/validateData.js";
import { authenticate } from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/register",  validate(registerValidation), register);
authRouter.post("/send-otp", validate(emailValidation), sendOtp);
authRouter.post("/verify-otp", validate(verifyOtpValidation), verifyOtp);
authRouter.post("/login", validate(loginValidation), login);
authRouter.post("/refresh-token", refreshAccessToken);
authRouter.post("/logout", authenticate, logout);
authRouter.post('/forget-password', validate(emailValidation), requestPasswordReset)
authRouter.post('/reset-password', resetPassword)

export default authRouter;