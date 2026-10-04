import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFileUrl } from "../src/lib/file-url.js";

test("normalizes old local GridFS URLs to the deployed API origin", () => {
  assert.equal(
    normalizeFileUrl(
      "http://localhost:5000/api/files/507f1f77bcf86cd799439011?download=1",
      { apiUrl: "https://studyhub-api.onrender.com/api", pageOrigin: "https://studyhub.vercel.app" }
    ),
    "https://studyhub-api.onrender.com/api/files/507f1f77bcf86cd799439011?download=1"
  );
});

test("normalizes relative local upload paths and preserves remote storage URLs", () => {
  assert.equal(
    normalizeFileUrl("/uploads/lesson.pdf", {
      apiUrl: "https://studyhub-api.onrender.com/api",
      pageOrigin: "https://studyhub.vercel.app",
    }),
    "https://studyhub-api.onrender.com/uploads/lesson.pdf"
  );
  assert.equal(
    normalizeFileUrl("https://res.cloudinary.com/studyhub/documents/lesson.pdf", {
      apiUrl: "https://studyhub-api.onrender.com/api",
      pageOrigin: "https://studyhub.vercel.app",
    }),
    "https://res.cloudinary.com/studyhub/documents/lesson.pdf"
  );
});
