import sql, { type config as SqlConfig } from "mssql";

const config: SqlConfig = {
  user: "athena_app_login",
  password: "StrongPassword!123",
  server: "localhost",
  port: 1433,
  database: "Athena_app",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getDb() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}
