import { Router } from "express";
import { signup, signin } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
