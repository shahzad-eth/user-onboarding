import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import ApiError from "./src/utils/api-error.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: process.env.ALLOWED_CORS?.split(",") || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import AuthRouter from "./src/routes/authRoutes.js";
app.use("/api", AuthRouter)

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "API server is Healthy" });
});

// Global error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors
        })
    }

    // unexpected error (e.g., Syntax error, DB connection drop)
    console.error("UNEXPECTED ERROR: ", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
})

export default app;