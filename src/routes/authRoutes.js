import express from "express";
import { register } from "../controllers/authController.js";
import { globalErrorHandler } from "../middleware/globalErrorHandler.js";

const authRouter = express.Router();

authRouter.post("/register", register, globalErrorHandler);

export default authRouter;