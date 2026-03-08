export function parseCSV(text: string) {

  const lines = text.trim().split("\n");
  if (lines.length === 0) return [];

  // 🔍 Detect delimiter (comma OR semicolon)
  const delimiter = lines[0].includes(";") ? ";" : ",";

  const headers = lines[0]
    .split(delimiter)
    .map(h => h.trim());


  return lines.slice(1).map((line, index) => {
    const values = line.split(delimiter).map(v => v.trim());

    const data: Record<string, string> = {};
    headers.forEach((h, i) => {
      data[h] = values[i] ?? "";
    });


    return {
      index: index + 2,
      data,
    };
  });
}

