export function parseCSV(text: string) {
  console.log("📄 Parsing CSV text");

  const lines = text.trim().split("\n");
  if (lines.length === 0) return [];

  // 🔍 Detect delimiter (comma OR semicolon)
  const delimiter = lines[0].includes(";") ? ";" : ",";
  console.log("🔎 Detected CSV delimiter:", delimiter);

  const headers = lines[0]
    .split(delimiter)
    .map(h => h.trim());

  console.log("🧾 CSV headers:", headers);

  return lines.slice(1).map((line, index) => {
    const values = line.split(delimiter).map(v => v.trim());

    const data: Record<string, string> = {};
    headers.forEach((h, i) => {
      data[h] = values[i] ?? "";
    });

    console.log(`📦 Parsed row ${index + 2}:`, data);

    return {
      index: index + 2,
      data,
    };
  });
}

