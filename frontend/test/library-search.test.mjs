import test from 'node:test';
import assert from 'node:assert/strict';
import { readSearchParams, updateSearchParams, searchRequestParams, SEARCH_DEFAULTS, rememberSearch, readSearchHistory, clearSearchHistory } from '../src/lib/library-search.js';
import { clearAccountSession } from '../src/lib/session.js';

function storage(t) {
  const values = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,String(value)), removeItem: key => values.delete(key) } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else delete globalThis.localStorage; });
  return values;
}

test('shared search URL restores all filters and supports old search links', () => {
  const filters=readSearchParams(new URLSearchParams('search=giai+tich&subject=Giải+tích&fileType=PDF&minRating=4&from=2026-09-01&match=phrase'));
  assert.equal(filters.q,'giai tich'); assert.equal(filters.subject,'Giải tích'); assert.equal(filters.fileType,'PDF');assert.equal(filters.minRating,'4');assert.equal(filters.sort,'latest');
  assert.equal(searchRequestParams(filters,2).get('page'),'2');
});

test('changing a filter resets pagination while changing pages preserves filters', () => {
  const changed=updateSearchParams('q=giai&page=5&fileType=PDF',{minRating:'4'});
  assert.equal(changed.get('page'),null);assert.equal(changed.get('q'),'giai');assert.equal(changed.get('fileType'),'PDF');
  const page=updateSearchParams(changed,{page:2});assert.equal(page.get('page'),'2');assert.equal(page.get('minRating'),'4');
  const cleared=updateSearchParams(page,SEARCH_DEFAULTS);assert.equal(cleared.toString(),'');
});

test('search history deduplicates case, stays bounded and can be cleared',t=>{
  storage(t);rememberSearch('Giải tích');rememberSearch('giải tích');
  assert.deepEqual(readSearchHistory(),['giải tích']);
  for(let i=0;i<10;i++)rememberSearch(`Từ khóa ${i}`);
  assert.equal(readSearchHistory().length,6);assert.equal(readSearchHistory()[0],'Từ khóa 9');
  clearSearchHistory();assert.deepEqual(readSearchHistory(),[]);
});

test('malformed local history does not break search',t=>{
  const values=storage(t);values.set('studyhub_search_history','{bad json');assert.deepEqual(readSearchHistory(),[]);
  values.set('studyhub_search_history',JSON.stringify([null,3,{},'hợp lệ']));assert.deepEqual(readSearchHistory(),['hợp lệ']);
});

test('logout clears account data while preserving display preferences and search history',t=>{
  const values=storage(t);for(const key of ['token','user','studyhub_bookmarks','studyhub_downloads','studyhub_theme','studyhub_search_history'])values.set(key,'saved');
  clearAccountSession();assert.equal(values.get('token'),undefined);assert.equal(values.get('studyhub_bookmarks'),undefined);
  assert.equal(values.get('studyhub_theme'),'saved');assert.equal(values.get('studyhub_search_history'),'saved');
});
