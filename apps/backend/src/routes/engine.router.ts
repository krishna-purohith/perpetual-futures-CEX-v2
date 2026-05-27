import { Router } from "express";
import { order } from "../controllers/engine.controller";
import { requireAuth } from "../middleware/requireAuth";

export const engineRouter = Router();

engineRouter.post("/order", requireAuth, order);
