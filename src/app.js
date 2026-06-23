import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { animalRouter } from "./routes/animal.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, product: "Dala Smart API" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/animals", animalRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
