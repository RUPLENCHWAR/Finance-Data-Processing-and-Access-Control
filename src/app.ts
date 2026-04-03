import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { getConfig } from "./config.js";
import { FinanceDatabase } from "./db.js";
import { errorHandler, notFoundHandler } from "./middleware.js";
import { createRouter } from "./routes.js";

export interface AppContext {
  app: express.Express;
  db: FinanceDatabase;
}

export function createApp(databasePath = getConfig().databasePath): AppContext {
  const config = getConfig();
  const db = new FinanceDatabase(databasePath);
  db.seed();
  const publicDir = path.join(process.cwd(), "public");

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/api", createRouter(db, config.jwtSecret));
  app.use(express.static(publicDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, db };
}
