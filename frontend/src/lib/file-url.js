export function normalizeFileUrl(fileUrl) {
  if (!fileUrl) return "";

  try {
    return new URL(fileUrl, window.location.origin).href;
  } catch {
    return fileUrl;
  }
}
