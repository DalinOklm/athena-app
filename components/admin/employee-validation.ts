const REQUIRED_FIELDS = ["first_name", "last_name", "email", "department"];

export function validateEmployeeRow(row: any) {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("🧪 Validating row:", row);

  // REQUIRED FIELDS
  if (!row.firstName) errors.push("Missing first name");
  if (!row.lastName) errors.push("Missing last name");
  if (!row.email) errors.push("Missing email");
  if (!row.department) errors.push("Missing department");

  // OPTIONAL (warnings, not errors)
  if (!row.phone) warnings.push("Phone missing");
  if (!row.employeeId) warnings.push("Employee ID missing");

  const valid = errors.length === 0;

  console.log("✅ Validation result:", {
    valid,
    errors,
    warnings,
  });

  return {
    valid,
    errors,
    warnings,
  };
}

