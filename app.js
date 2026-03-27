import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./src/routes/authRoutes.js";
import { globalErrorHandler } from "./src/middleware/globalErrorHandler.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);



app.use(globalErrorHandler);

export default app;