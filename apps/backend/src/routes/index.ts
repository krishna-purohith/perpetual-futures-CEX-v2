import { Router } from "express";
import { authRouter } from "./auth.route";
import { engineRouter } from "./engine.router";

export const appRouter = Router();

appRouter.use(authRouter);
appRouter.use(engineRouter);
