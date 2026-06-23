// Document-kind detection (src/lib/doc-parse.ts). The heavy PDF/DOCX parsers are
// mocked away so we can unit-test the pure detection helpers. extractText itself
// needs real binary input + native libs and is left to integration testing.

import { describe, expect, it, vi } from "vitest";

vi.mock("mammoth", () => ({ default: { extractRawText: vi.fn() } }));
vi.mock("pdf-parse", () => ({ PDFParse: vi.fn() }));

import { detectDocKind, mimeForKind } from "@/lib/doc-parse";

const PDF = "application/pdf";
const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("detectDocKind", () => {
  it("detects by MIME type", () => {
    expect(detectDocKind("x", PDF)).toBe("pdf");
    expect(detectDocKind("x", DOCX)).toBe("docx");
  });
  it("falls back to file extension (case-insensitive)", () => {
    expect(detectDocKind("Brief.PDF", "")).toBe("pdf");
    expect(detectDocKind("Spec.DocX", "application/octet-stream")).toBe("docx");
  });
  it("returns null for unsupported files", () => {
    expect(detectDocKind("notes.txt", "text/plain")).toBeNull();
    expect(detectDocKind("image.png", "image/png")).toBeNull();
  });
});

describe("mimeForKind", () => {
  it("maps a kind back to its canonical MIME", () => {
    expect(mimeForKind("pdf")).toBe(PDF);
    expect(mimeForKind("docx")).toBe(DOCX);
  });
});
