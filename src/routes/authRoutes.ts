import { Router } from "express";
import AuthController from "../controllers/authController.js";

const router = Router();

router.post("/auth/register", AuthController.signup);

export default router;