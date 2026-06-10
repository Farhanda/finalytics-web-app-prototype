<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# autom8 task sync (keep the board in step with your work)

Work is tracked as **tasks on the autom8 board**, each with a short key like `AUT-12`.
Commit messages stay clean — you do **not** put the key in commits. Instead, tell
autom8 what you're doing via the CLI (`scripts/autom8.mjs`). It reads your latest
commit automatically and updates Firestore.

When the user asks you to work on an autom8 task:

1. **See the tasks** (find the right key):
   ```bash
   node scripts/autom8.mjs list
   ```
2. **Start it** (marks In-progress):
   ```bash
   node scripts/autom8.mjs start AUT-12
   ```
3. **After a work-in-progress commit** (attaches the commit, stays In-progress):
   ```bash
   git commit -m "..."        # write a clear, detailed message
   node scripts/autom8.mjs commit AUT-12
   ```
4. **When the task is finished** (attaches the final commit + ticks it off):
   ```bash
   git commit -m "..."
   node scripts/autom8.mjs done AUT-12
   ```

Notes:
- Write **descriptive multi-line commit messages** (subject + body / bullets) — the
  body is stored on the task and feeds the daily progress report.
- Only call `done` when the task is genuinely complete. WIP commits use `commit`.
- The CLI needs `AUTOM8_API_TOKEN` in `.env.local` and the app reachable
  (`pnpm dev`, or `AUTOM8_BASE_URL` for a deployed instance).
