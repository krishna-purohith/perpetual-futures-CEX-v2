import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { envConfig } from "./utils/env";
import { type EngineRequest } from "./types";
import { requireAuth } from "./middleware/requireAuth";
import { appRouter } from "./routes";
import redis, { createClient } from "redis";

export const publisher = await createClient()
  .on("error", (err) => console.error("Redis publisher error", err))
  .connect();
export const subscriber = await createClient()
  .on("error", (err) => console.error("Redis subscriber error", err))
  .connect();

const app = express();
app.use(express.json());

app.use(appRouter);

// app.get("/")

app.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    userId: req.userId,
  });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    console.error(err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Internal_server_error",
    });
  }
});

app.listen(envConfig.port, () =>
  console.log(`Backend started on port ${envConfig.port}`)
);
