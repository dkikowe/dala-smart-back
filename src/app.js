import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { animalRouter } from "./routes/animal.routes.js";
import { farmRouter } from "./routes/farm.routes.js";
import { breedingGroupRouter } from "./routes/breedingGroup.routes.js";
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
  app.use("/api/farm", farmRouter);
  app.use("/api/breeding-groups", breedingGroupRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
