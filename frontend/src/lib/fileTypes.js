const FORMAT_GROUPS = [
  { key: "pdf", matches: ["PDF"] },
  { key: "docx", matches: ["DOC", "WORD"] },
  { key: "pptx", matches: ["PPT", "POWERPOINT", "SLIDE"] },
  { key: "xlsx", matches: ["XLS", "EXCEL", "SHEET"] },
  { key: "txt", matches: ["TXT", "TEXT"] },
];

export function getFileTypeKey(format) {
  const value = String(format || "").trim().toUpperCase();
  return FORMAT_GROUPS.find(({ matches }) => matches.some((match) => value.includes(match)))?.key || "file";
}
