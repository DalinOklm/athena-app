import sql, { type config as SqlConfig } from "mssql";

const rawServer = process.env.DB_SERVER?.trim() || "127.0.0.1";
const normalizedServer = rawServer.toLowerCase() === "localhost" ? "127.0.0.1" : rawServer;
const parsedPort = Number(process.env.DB_PORT || 1433);

const config: SqlConfig = {
  user: process.env.DB_USER?.trim() || "athena_app_login",
  password: process.env.DB_PASSWORD || "StrongPassword!123",
  server: normalizedServer,
  port: Number.isFinite(parsedPort) ? parsedPort : 1433,
  database: process.env.DB_NAME?.trim() || "Athena_app",
  connectionTimeout: 15000,
  requestTimeout: 15000,
  options: {
    encrypt: String(process.env.DB_ENCRYPT || "false").toLowerCase() === "true",
    trustServerCertificate:
      String(process.env.DB_TRUST_CERT || "true").toLowerCase() === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

declare global {
  // eslint-disable-next-line no-var
  var __dbPoolPromise: Promise<sql.ConnectionPool> | undefined;
}

export async function getDb() {
  if (!global.__dbPoolPromise) {
    console.log("[getDb] connecting to SQL Server", {
      server: config.server,
      port: config.port,
      database: config.database,
      trustServerCertificate: config.options?.trustServerCertificate,
      encrypt: config.options?.encrypt,
    });

    global.__dbPoolPromise = sql.connect(config).catch((error) => {
      global.__dbPoolPromise = undefined;
      throw error;
    });
  }

  return global.__dbPoolPromise;
}
