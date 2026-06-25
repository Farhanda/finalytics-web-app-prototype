import type { NextConfig } from "next";

// Content-Security-Policy, tuned for this app's actual origins: it runs on
// Firebase (Auth + Firestore + Storage) and signs users in with Google. Each
// directive is the minimum that keeps those flows working.
//
// Trade-off: `script-src`/`style-src` keep `'unsafe-inline'` because Next.js
// injects inline hydration scripts and several UI primitives inject inline
// styles; eliminating it needs a per-request nonce via middleware (a worthwhile
// future hardening step, tracked in PATH-TO-PRODUCTION.md). Everything else is
// locked to the specific Google/Firebase hosts below.
//
// `'unsafe-eval'` is added in DEVELOPMENT ONLY: `next dev` ships each module
// wrapped in eval() (webpack eval-source-map) and React Fast Refresh also evals,
// so without it the CSP blocks all client JS in dev and the app never hydrates
// (it freezes on the server-rendered loading screen). Production builds contain
// no eval(), so the prod policy stays strict.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  isDev ? "'unsafe-eval'" : "",
  "https://apis.google.com https://www.gstatic.com",
]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // Google account avatars + inline/data images.
  "img-src 'self' data: blob: https://*.googleusercontent.com https://www.gstatic.com",
  // Firebase Auth, Firestore (incl. the realtime listen stream over WSS) and Storage.
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://*.firebasedatabase.app wss://*.firebaseio.com",
  // The Google / Firebase sign-in popup + iframe.
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
].join("; ");

// Baseline security headers applied to every response. Conservative defaults that
// don't break the app: no MIME sniffing, deny framing (clickjacking), tight
// referrer policy, opt out of legacy browser features, HSTS for HTTPS, and a
// Firebase/Google-tuned Content-Security-Policy.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Google sign-in opens a cross-origin popup (accounts.google.com) and the
  // Firebase SDK polls `popup.closed` to know when it's done. A strict COOP
  // ('same-origin') severs the opener↔popup link, so the browser blocks that
  // read ("Cross-Origin-Opener-Policy policy would block the window.closed
  // call") and signInWithPopup can hang. 'same-origin-allow-popups' keeps the
  // page isolated but lets popups we open ourselves retain the opener handle.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "Content-Security-Policy", value: csp },
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
