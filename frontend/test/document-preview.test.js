import test from "node:test";
import assert from "node:assert/strict";
import {
  getDocumentExtension,
  getDocumentPreviewPath,
  getSuggestedDownloadName,
  normalizeDownloadName,
} from "../src/lib/document-preview.js";

test("safe preview path opens the app preview route for each document", () => {
  assert.equal(getDocumentPreviewPath("507f1f77bcf86cd799439011"), "/documents/507f1f77bcf86cd799439011/preview");
});

test("download name defaults to the display title and keeps the source extension", () => {
  const document = { title: "Từ vựng HSK1-HSK6", fileName: "Tâª Va»NG.xlsx" };
  assert.equal(getDocumentExtension(document), "xlsx");
  assert.equal(getSuggestedDownloadName(document), "Từ vựng HSK1-HSK6.xlsx");
});

test("custom download name is sanitized and retains the original format", () => {
  const document = { title: "Bài tập", fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
  assert.equal(normalizeDownloadName("  Slide: tuần 1.pdf  ", document), "Slide- tuần 1.pptx");
});
