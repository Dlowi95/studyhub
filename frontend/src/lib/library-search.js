export const SEARCH_DEFAULTS = {
  q: '', subject: '', sort: 'latest', fileType: '', minRating: '', minDownloads: '',
  from: '', to: '', searchIn: 'all', match: 'all',
};

export function readSearchParams(params) {
  return Object.fromEntries(Object.entries(SEARCH_DEFAULTS).map(([key, fallback]) => [key, params.get(key) ?? (key === 'q' ? params.get('search') : null) ?? fallback]));
}

export function updateSearchParams(current, updates) {
  const params = new URLSearchParams(current);
  params.delete('search');
  for (const [key, value] of Object.entries(updates)) {
    if (!Object.hasOwn(SEARCH_DEFAULTS, key) && key !== 'page') continue;
    if (value === '' || value === SEARCH_DEFAULTS[key] || (key === 'page' && Number(value) === 1)) params.delete(key);
    else params.set(key, String(value));
  }
  if (!Object.hasOwn(updates, 'page')) params.delete('page');
  return params;
}

export function searchRequestParams(filters, page = 1, limit = 12) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, String(value));
  return params;
}

const HISTORY_KEY = 'studyhub_search_history';
export function readSearchHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.length <= 200).slice(0, 6) : [];
  } catch { return []; }
}

export function rememberSearch(value) {
  const query = value.trim().slice(0, 200);
  if (!query) return readSearchHistory();
  const history = [query, ...readSearchHistory().filter(item => item.toLocaleLowerCase('vi') !== query.toLocaleLowerCase('vi'))].slice(0, 6);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* Search still works without local storage. */ }
  return history;
}

export function clearSearchHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* Private browsing can disable local storage. */ }
}
