type EmployeePayload = {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  employeeId?: string;
  phone?: string;
};

export function validateEmployeesServerSide(
  employees: EmployeePayload[],
  existingEmails: Set<string>,
  existingEmployeeIds: Set<string>
) {
  console.log("🛡️ SERVER VALIDATION STARTED");
  console.log("📦 Incoming employees:", employees.length);

  const accepted: EmployeePayload[] = [];
  const rejected: {
    row: number;
    email?: string;
    reasons: string[];
  }[] = [];

  employees.forEach((emp, index) => {
    const reasons: string[] = [];

    console.log(`🔍 Validating row ${index + 1}`, emp);

    // Required fields
    if (!emp.firstName) reasons.push("Missing first name");
    if (!emp.lastName) reasons.push("Missing last name");
    if (!emp.email) reasons.push("Missing email");
    if (!emp.department) reasons.push("Missing department");

    // Email format
    if (emp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
      reasons.push("Invalid email format");
    }

    // Uniqueness
    if (emp.email && existingEmails.has(emp.email)) {
      reasons.push("Email already exists");
    }

    if (emp.employeeId && existingEmployeeIds.has(emp.employeeId)) {
      reasons.push("Employee ID already exists");
    }

    if (reasons.length > 0) {
      console.warn(`❌ Row ${index + 1} rejected`, reasons);
      rejected.push({
        row: index + 1,
        email: emp.email,
        reasons,
      });
    } else {
      console.log(`✅ Row ${index + 1} accepted`);
      accepted.push(emp);
    }
  });

  console.log("📊 VALIDATION SUMMARY", {
    accepted: accepted.length,
    rejected: rejected.length,
  });

  return { accepted, rejected };
}
