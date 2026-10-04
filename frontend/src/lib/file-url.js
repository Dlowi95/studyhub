import { API_URL } from "./api.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function normalizeFileUrl(fileUrl, { apiUrl = API_URL, pageOrigin = window.location.origin } = {}) {
  if (!fileUrl) return "";

  try {
    const apiBase = new URL(apiUrl, pageOrigin);
    const parsedUrl = new URL(fileUrl, pageOrigin);
    const isBackendFilePath = /^\/(?:api\/files|uploads)\//i.test(parsedUrl.pathname);
    const isLocalApiUrl = LOCAL_HOSTS.has(parsedUrl.hostname) && isBackendFilePath;
    const isRelativeUrl = !/^[a-z][a-z\d+.-]*:/i.test(fileUrl) && !fileUrl.startsWith("//");

    if (isBackendFilePath && (isLocalApiUrl || isRelativeUrl)) {
      return new URL(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`, apiBase.origin).href;
    }

    return parsedUrl.href;
  } catch {
    return fileUrl;
  }
}
