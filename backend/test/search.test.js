const test = require('node:test');
const assert = require('node:assert/strict');
const Document = require('../models/Document');
const { buildPublicDocumentQuery } = require('../utils/documentQuery');
const { getSearchSuggestions, getDocuments } = require('../controllers/documentController');

const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('advanced filters combine with approved-only accent-insensitive search', () => {
  const { query } = buildPublicDocumentQuery({ status: 'pending', q: 'giai tich', fileType: 'pdf', minRating: '4', minDownloads: '12', from: '2026-09-01', to: '2026-09-30', searchIn: 'title', match: 'phrase' });
  assert.equal(query.status, 'approved');
  assert.equal(query.avgRating.$gte, 4);
  assert.equal(query.downloadCount.$gte, 12);
  assert.ok(new RegExp(query.fileType.$regex, 'i').test('PDF'));
  assert.equal(query.createdAt.$gte.toISOString(), '2026-08-31T17:00:00.000Z');
  assert.equal(query.createdAt.$lt.toISOString(), '2026-09-30T17:00:00.000Z');
  assert.equal(query.$and.length, 1);
  assert.deepEqual(Object.keys(query.$and[0].$or[0]), ['title']);
  const regex = new RegExp(query.$and[0].$or[0].title.$regex, 'i');
  assert.ok(regex.test('Giải tích 1'));
  assert.ok(!regex.test('Giải nâng cao tích phân'));
});

test('tag-only search and all-words mode cannot silently search other fields', () => {
  const { query } = buildPublicDocumentQuery({ q: 'C++ co ban', searchIn: 'tags' });
  assert.equal(query.$and.length, 3);
  assert.ok(query.$and.every(term => term.$or.length === 1 && term.$or[0].tags));
  assert.ok(new RegExp(query.$and[0].$or[0].tags.$regex, 'i').test('C++'));
  assert.ok(!new RegExp(query.$and[0].$or[0].tags.$regex, 'i').test('CCC'));
});

test('invalid ratings, dates, ranges, downloads and search modes return 400', () => {
  const invalid = [{ minRating: '6' }, { minRating: '-1' }, { minRating: { $gte: 0 } }, { minDownloads: '2.5' }, { minDownloads: 'NaN' }, { from: '2026-02-30' }, { to: 'not-a-date' }, { from: '2026-10-02', to: '2026-10-01' }, { searchIn: '__proto__' }, { match: 'regex' }];
  for (const params of invalid) assert.throws(() => buildPublicDocumentQuery(params), error => error.status === 400);
  assert.doesNotThrow(() => buildPublicDocumentQuery({ from: '2024-02-29', to: '2024-02-29', minDownloads: '0' }));
});

test('invalid advanced filter is rejected before any database query', async (t) => {
  let queried = false;
  t.mock.method(Document, 'find', () => { queried = true; throw new Error('unexpected query'); });
  const res = response();
  await getDocuments({ query: { from: '2026-02-30' } }, res);
  assert.equal(res.code, 400); assert.equal(queried, false);
});

test('suggestions prioritize title matches, deduplicate, limit results and never check files', async (t) => {
  const first = { _id: 'a', title: 'Giải tích', subjectName: 'Giải tích', fileType: 'PDF' };
  const broader = [first, ...Array.from({length: 6}, (_, i) => ({ _id: `other-${i}`, title: `Ghi chú ${i}`, subjectName: 'Giải tích', fileType: 'DOCX' }))];
  let calls = 0;
  t.mock.method(Document, 'find', filter => {
    const base = filter.$and?.[0]?.status ? filter.$and[0] : filter;
    assert.equal(base.status, 'approved'); assert.equal(base.avgRating.$gte, 3);
    const items = ++calls === 1 ? [first] : broader;
    return { sort() { return this; }, limit(count) { assert.equal(count, 6); return this; }, select(fields) { assert.equal(fields, 'title subjectName fileType variantGroupId'); return this; }, lean: async () => items };
  });
  t.mock.method(Document, 'aggregate', async pipeline => {
    assert.equal(pipeline[0].$match.$and[0].status, 'approved');
    assert.ok(pipeline.some(stage => stage.$limit === 3));
    return [{ name: 'Giải tích', count: 2 }];
  });
  const res = response(); await getSearchSuggestions({query:{q:'giai',minRating:'3'}},res);
  assert.equal(res.code, 200); assert.equal(res.body.documents.length, 6);
  assert.equal(res.body.documents[0]._id, 'a'); assert.equal(new Set(res.body.documents.map(doc=>doc._id)).size, 6);
  assert.equal(res.body.subjects[0].name, 'Giải tích');
});

test('one-character suggestions do not query the database', async (t) => {
  t.mock.method(Document,'find',()=>{throw new Error('unexpected query');});
  const res=response();await getSearchSuggestions({query:{q:'g'}},res);
  assert.deepEqual(res.body,{documents:[],subjects:[]});
});
