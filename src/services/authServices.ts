import bcrypt from "bcryptjs"
import prisma from "../config/db.js"
import { type User } from "../generated/prisma/client.js"
import ApiError from "../utils/api-error.js"
import jwt from "jsonwebtoken"

export default class AuthService {
    static registerUser = async (username: string, email: string, password: string): Promise<User> => {

        const existingUser = await AuthService.findUserByEmail(email)

        if (existingUser) throw new ApiError(400, "User Already Exists")

        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // find the user in the db
        const user = await prisma.user.create({
            data: {
                username, email, password: hashedPassword
            }
        });

        return user;
    }

    static findUserByEmail = async (email: string) => {
        return await prisma.user.findUnique({ where: { email } })
    }

    static loginUser = async (email: string, password: string) => {
        const user = await AuthService.findUserByEmail(email);

        if (!user) throw new ApiError(400, "User not found");

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) throw new ApiError(400, "Password is incorrect");

        const accesstoken = jwt.sign({
            userId: user.id,
            email: user.email,
        }, process.env.ACCESS_TOKEN_SECRET!, {
            expiresIn: "1h"
        })

        return accesstoken;
    }
}