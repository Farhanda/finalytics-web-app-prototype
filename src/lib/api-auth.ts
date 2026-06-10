// Shared bearer-token check for the autom8 task API. The CLI (and Claude) send
// `Authorization: Bearer <AUTOM8_API_TOKEN>`. Returns true when the token matches.

export const apiTokenSet = Boolean(process.env.AUTOM8_API_TOKEN);

export function isAuthorized(req: Request): boolean {
  const token = process.env.AUTOM8_API_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  return provided.length > 0 && provided === token;
}
