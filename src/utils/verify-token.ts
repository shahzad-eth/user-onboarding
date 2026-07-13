import jwt from "jsonwebtoken";
import ApiError from "./api-error.js";
import type { CustomPayload } from "../utils/types.js";
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET;

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET!) as CustomPayload;
    } catch (error) {
        throw new ApiError(400, "Something went wrong")
    }
}