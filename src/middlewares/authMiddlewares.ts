import type { Response, NextFunction } from "express";

import { verifyToken } from "../utils/verify-token.js";
import type { AuthenticatedRequest } from "../utils/types.js";
import ApiError from "../utils/api-error.js";

export default class AuthMiddleware {
    static authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const token = req.header('Authorization')?.replace("Bearer ", "")

        if (!token) throw new ApiError(401, "Auth token missing");

        const decodedToken = verifyToken(token);

        req.user = decodedToken;

        next();
    }
}