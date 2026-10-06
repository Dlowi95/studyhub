export const getDocumentPreviewPath = (documentId) =>
  `/documents/${encodeURIComponent(String(documentId || ""))}/preview`;

const supportedExtensions = new Set(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"]);

const extensionFromType = (value = "") => {
  const type = String(value).toLowerCase();
  if (type.includes("pdf")) return "pdf";
  if (type.includes("wordprocessing") || type === "docx") return "docx";
  if (type.includes("msword") || type === "doc") return "doc";
  if (type.includes("presentationml") || type === "pptx") return "pptx";
  if (type.includes("powerpoint") || type === "ppt") return "ppt";
  if (type.includes("spreadsheetml") || type === "xlsx") return "xlsx";
  if (type.includes("ms-excel") || type === "xls") return "xls";
  if (type.includes("text") || type === "txt") return "txt";
  return "";
};

export const getDocumentExtension = (document = {}) => {
  const fileName = String(document.fileName || "").split(/[?#]/, 1)[0];
  const filenameExtension = fileName.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase();
  if (filenameExtension && supportedExtensions.has(filenameExtension)) return filenameExtension;
  return extensionFromType(document.type || document.fileType) || "pdf";
};

export const getSuggestedDownloadName = (document = {}) => {
  const extension = getDocumentExtension(document);
  const title = String(document.title || "tai-lieu").trim();
  const baseName = title.replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)$/i, "").trim() || "tai-lieu";
  return `${baseName}.${extension}`;
};

export const normalizeDownloadName = (value, document = {}) => {
  const extension = getDocumentExtension(document);
  const fallback = getSuggestedDownloadName(document).replace(/\.[a-z0-9]{1,8}$/i, "");
  const printableName = [...String(value || "")]
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint >= 32 && codePoint !== 127;
    })
    .join("");
  const safeBaseName = printableName
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)$/i, "")
    .replace(/[. ]+$/g, "")
    .slice(0, 160);
  return `${safeBaseName || fallback}.${extension}`;
};
