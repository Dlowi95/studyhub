// Account data is cleared on logout; display preferences and search history stay on this device.
export function clearAccountSession() {
  for (const key of ['token', 'user', 'studyhub_bookmarks', 'studyhub_downloads']) localStorage.removeItem(key);
}
