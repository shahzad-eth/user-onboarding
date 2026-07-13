import AuthService from "../services/authServices.js";
import type { Request, Response } from "express";
import ApiError from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export default class AuthController {
    static signup = asyncHandler(async (req: Request, res: Response) => {
        const { username, email, password } = req.body;

        // Soon to be validated by external validator middleware
        if (!username || !email || !password) {
            return res.status(400).json(
                new ApiError(400, "All fields are required: username, email, password")
            )
        }

        const user = await AuthService.registerUser(username, email, password)

        return res.status(201).json(user)
    })

    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const jwtToken = await AuthService.loginUser(email, password)

        return res.status(200).json({ jwtToken })
    })
}