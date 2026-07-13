import { Router } from "express";
import AuthController from "../controllers/authController.js";
import AuthMiddleware from "../middlewares/authMiddlewares.js";

const router = Router();

router.route("/auth/register")
    .post(AuthController.signup);
router.route("/auth/login")
    .post(AuthController.login);
router.route("/user/profile")
    .get(AuthMiddleware.authenticate, AuthController.getUserById)

export default router;