// Server-only plain-text extraction for uploaded project briefs.
//
// Supports PDF (pdf-parse v2 — class API) and DOCX (mammoth). The extracted text
// feeds the AI task-generation step (Tahap 2), so we only need raw text, not
// layout/images. Node runtime only.

import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type DocKind = "pdf" | "docx";

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Resolve the document kind from MIME type first, then filename extension as a
// fallback (browsers sometimes send an empty/generic type). Returns null for
// anything we can't parse.
export function detectDocKind(
  fileName: string,
  mimeType: string
): DocKind | null {
  const name = fileName.toLowerCase();
  if (mimeType === PDF_MIME || name.endsWith(".pdf")) return "pdf";
  if (mimeType === DOCX_MIME || name.endsWith(".docx")) return "docx";
  return null;
}

export function mimeForKind(kind: DocKind): string {
  return kind === "pdf" ? PDF_MIME : DOCX_MIME;
}

// Normalize non-breaking spaces to plain spaces, collapse Windows newlines and
// runs of blank lines so the stored text stays compact and prompt-friendly.
function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractText(
  buffer: Buffer,
  kind: DocKind
): Promise<string> {
  if (kind === "pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      // pageJoiner "" drops the default "-- N of M --" page markers so the
      // stored text is clean for the AI step.
      const result = await parser.getText({ pageJoiner: "" });
      return normalize(result.text);
    } finally {
      await parser.destroy();
    }
  }
  const result = await mammoth.extractRawText({ buffer });
  return normalize(result.value);
}
