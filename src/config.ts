import path from "node:path";

export interface AppConfig {
  port: number;
  jwtSecret: string;
  databasePath: string;
}

export function getConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: process.env.JWT_SECRET ?? "finance-dashboard-dev-secret",
    databasePath:
      process.env.DATABASE_PATH ??
      path.join(process.cwd(), "data", "finance-dashboard.sqlite"),
  };
}
