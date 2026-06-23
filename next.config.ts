import type { NextConfig } from "next";

// Baseline security headers applied to every response. Conservative defaults that
// don't break the app: no MIME sniffing, deny framing (clickjacking), tight
// referrer policy, opt out of legacy browser features, and HSTS for HTTPS.
// (No CSP yet — it needs per-app tuning against Firebase/Google domains; tracked
// as a follow-up in PATH-TO-PRODUCTION.md.)
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Load these heavy native/ESM packages via runtime require instead of letting
  // Next bundle them into the server build. pdf-parse (pdfjs-dist) breaks when
  // bundled ("Object.defineProperty called on non-object"); mammoth is large and
  // safer left external too.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
