import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load these heavy native/ESM packages via runtime require instead of letting
  // Next bundle them into the server build. pdf-parse (pdfjs-dist) breaks when
  // bundled ("Object.defineProperty called on non-object"); mammoth is large and
  // safer left external too.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
};

export default nextConfig;
