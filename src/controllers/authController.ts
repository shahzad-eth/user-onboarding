import AuthService from "../services/authServices.js";
import type { Request, Response } from "express";
import ApiError from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import type { AuthenticatedRequest } from "../utils/types.js";

export default class AuthController {
    static signup = asyncHandler(async (req: Request, res: Response) => {
        const { username, email, password } = req.body;
        console.log("Data Found")

        // To be validated by external validator middleware later
        if (!username || !email || !password) {
            return res.status(400).json(
                new ApiError(400, "All fields are required: username, email, password")
            )
        }

        console.log("registering user")
        const user = await AuthService.registerUser(username, email, password)

        // excluding sensitive fields
        const { password: extractedPassword, ...safeUser } = user;

        console.log("Registration Success")

        return res.status(201).json(safeUser)
    })

    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const jwtToken = await AuthService.loginUser(email, password);

        return res.status(200).json({ jwtToken })
    })

    static getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;

        if (!user) throw new ApiError(401, "Access Denied");

        const userId: number = user.userId;

        const foundUser = await AuthService.findUserById(userId);

        if (!foundUser) throw new ApiError(400, "User not found")

        // excluding sensitive fields
        const { password, ...safeUser } = foundUser;

        return res.status(200).json(safeUser)
    })
}