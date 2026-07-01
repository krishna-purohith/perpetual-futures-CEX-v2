import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { envConfig } from "./utils/env";

import { requireAuth } from "./middleware/requireAuth";
import { appRouter } from "./routes";

console.log("adsfasdf");

const app = express();

app.use(express.json());

app.use(appRouter);

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
