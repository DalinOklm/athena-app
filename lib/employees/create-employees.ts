import { getDb } from "@/lib/db";
import sql from "mssql";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function createEmployees({
  companyId,
  employees,
}: {
  companyId: number;
  employees: any[];
}) {
  console.log("🗄️ CREATE EMPLOYEES START");
  console.log("🏢 Company ID:", companyId);
  console.log("👥 Employees received:", employees.length);

  const db = await getDb(); // ✅ YOUR DB CONNECTION
  const transaction = new sql.Transaction(db);

  let inserted = 0;
  let skipped = 0;

  try {
    console.log("🔐 Starting SQL transaction");
    await transaction.begin();

    for (const emp of employees) {
      console.log("👤 Processing employee:", emp.email);

      // ===============================
      // 1️⃣ Check duplicate per company
      // ===============================
      const checkReq = new sql.Request(transaction);
      checkReq.input("email", sql.VarChar, emp.email);
      checkReq.input("companyId", sql.Int, companyId);

      const existing = await checkReq.query(`
        SELECT id
        FROM dbo.users
        WHERE email = @email
          AND company_id = @companyId
      `);

      if (existing.recordset.length > 0) {
        console.warn("⚠️ Employee already exists, skipping:", emp.email);
        skipped++;
        continue;
      }

      // ===============================
      // 2️⃣ Generate temporary password
      // ===============================
      const tempPassword = randomBytes(16).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      console.log("🔑 Temp password generated for:", emp.email);

      // ===============================
      // 3️⃣ Insert employee
      // ===============================
      const insertReq = new sql.Request(transaction);
      insertReq.input("email", sql.VarChar, emp.email);
      insertReq.input("passwordHash", sql.VarChar, passwordHash);
      insertReq.input("companyId", sql.Int, companyId);
      insertReq.input("role", sql.Int, 3); // EMPLOYEE
      insertReq.input("firstName", sql.VarChar, emp.firstName);
      insertReq.input("lastName", sql.VarChar, emp.lastName);
      insertReq.input("department", sql.VarChar, emp.department);
      insertReq.input("status", sql.VarChar, "INVITED");

      await insertReq.query(`
        INSERT INTO dbo.users (
          email,
          password_hash,
          company_id,
          role,
          first_name,
          last_name,
          department,
          status,
          created_at
        )
        VALUES (
          @email,
          @passwordHash,
          @companyId,
          @role,
          @firstName,
          @lastName,
          @department,
          @status,
          GETDATE()
        )
      `);

      inserted++;
      console.log("✅ Inserted:", emp.email);
    }

    await transaction.commit();
    console.log("🟢 TRANSACTION COMMITTED");

    console.log("📊 INSERT SUMMARY", {
      inserted,
      skipped,
    });

    return {
      inserted,
      skipped,
    };
  } catch (error) {
    console.error("❌ TRANSACTION FAILED — rolling back", error);
    await transaction.rollback();
    throw error;
  }
}
