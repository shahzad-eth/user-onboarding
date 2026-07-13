import type { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";

export interface CustomPayload extends JwtPayload {
    userId: number,
    email: string
}

export interface AuthenticatedRequest extends Request {
    user?: CustomPayload;
}