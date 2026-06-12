# Plan: Alur End-to-End autom8 (Doc → AI Task → Assign → GitHub → Discord)

## Context

`autom8` saat ini sudah punya **task board berbasis Firestore** dengan assign berbasis peran (Admin/PM/Member), API (`/api/tasks`, `/api/tasks/update`), dan CLI `scripts/autom8.mjs` yang dipanggil Claude Code untuk menempel commit ke task secara manual. Yang **belum** ada: upload dokumen, AI auto-generate task, **webhook GitHub yang baca commit otomatis** (yang lama berbasis CLI, bukan webhook), dan notifikasi Discord.

Dokumen ini memetakan **alur produk lengkap** sesuai visi PM, supaya kamu bisa revisi alurnya sebelum implementasi. Keputusan yang sudah dikonfirmasi:

- **Multi-repo:** 1 repo = 1 project (mapping disimpan di settings project).
- **Commit linking:** commit masuk ke **level project** (activity feed project), task ditandai selesai **manual** oleh assignee/PM.
- **Discord:** **laporan harian (digest)**, bukan per-task real-time.
- **AI provider:** **Claude (Anthropic)**.

---

## Alur Lengkap (target)

```
1. PM upload dokumen (docx/pdf)
        │
        ▼
2. AI (Claude) baca dokumen → generate draft task (FE/BE/dll)
        │
        ▼
3. PM review draft → assign manual ke orang
        │
        ▼
4. Dev kerja → push commit ke GitHub
        │   (repo ter-mapping ke project; webhook baca commit)
        ▼
5. Commit (judul + detail) masuk otomatis ke ACTIVITY FEED PROJECT
        │   (task ditandai Completed secara MANUAL oleh assignee/PM)
        ▼
6. Sekali sehari → digest laporan dikirim ke channel Discord Aixel
```

Catatan penting: tidak semua project pakai GitHub (divisi tertentu manual). Maka **integrasi GitHub bersifat opsional per-project** — kalau field repo kosong, project itu murni manual.

---

## Tahap 1 — Upload Dokumen (docx/pdf)

**Tujuan:** PM unggah dokumen project, disimpan untuk diproses AI.

- Tambah Firebase Storage (belum ada). Set `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` + rules.
- API baru: `POST /api/projects/[id]/document` (multipart) → simpan file ke Storage, catat metadata di Firestore (`projectId`, `fileName`, `mimeType`, `storagePath`, `uploadedBy`).
- Parser teks:
  - PDF → `pdf-parse`
  - DOCX → `mammoth`
- UI: tombol "Upload dokumen" di halaman project (`src/app/dashboard/projects/`), reuse pola dialog yang ada (`project-dialog.tsx`).

**File baru/diubah:** `src/lib/storage.ts` (baru), `src/app/api/projects/[id]/document/route.ts` (baru), `src/lib/firestore.ts` (tambah koleksi `documents`).

---

## Tahap 2 — AI Auto-Generate Task (Claude)

**Tujuan:** dari teks dokumen → daftar draft task terstruktur per kategori (FE/BE/Design/QA/dll).

- Tambah dependency `@anthropic-ai/sdk`. Env `ANTHROPIC_API_KEY` (server-only).
- API baru: `POST /api/projects/[id]/generate-tasks`:
  1. Ambil teks dokumen (hasil parse tahap 1).
  2. Panggil Claude (model terbaru, mis. `claude-opus-4-8` / `claude-sonnet-4-6`) dengan **tool use / structured output** agar balikannya JSON array task: `{ name, category, priority, estimate?, description }`.
  3. Simpan sebagai **draft task** (`status: "Pending"`, `assigneeId: null`, `memberGenerated: false`, flag baru `aiGenerated: true`).
- Reuse tipe `Task` di `src/lib/data.ts` — tambah field `aiGenerated?: boolean` dan opsional `category?: string`.
- UI: panel review draft (PM bisa edit/hapus/approve sebelum masuk board).

**File baru/diubah:** `src/lib/ai.ts` (baru, klien Claude + prompt+schema), `src/app/api/projects/[id]/generate-tasks/route.ts` (baru), `src/lib/data.ts` (extend tipe).

> Sebelum menulis kode Claude/Anthropic, baca skill `claude-api` untuk model id, pricing, dan pola tool-use yang benar.

---

## Tahap 3 — Assign Manual

**Tujuan:** PM tetapkan draft task ke orang.

- **Sudah ada** — reuse `task-dialog.tsx`, `src/lib/access.ts`, dan mutasi `updateTask`/`addTask` di `src/components/dashboard/provider.tsx`.
- Hanya perlu menyambung tombol "Approve & assign" dari panel draft (tahap 2) ke flow assign existing.

---

## Tahap 4 — Integrasi GitHub (webhook, baca commit otomatis)

**Tujuan:** baca isi commit (judul + detail) dari repo yang ter-mapping, masukkan otomatis ke **project**. Opsional per-project.

**Mapping repo → project (1:1):**
- Tambah field di project: `repoFullName` (mis. `aixel/finalytics-web`). Disetel di settings project.
- Kalau kosong → project manual, webhook abaikan.

**Webhook:**
- API baru: `POST /api/github/webhook` (menggantikan pendekatan CLI lama untuk baca commit otomatis).
  1. Verifikasi `X-Hub-Signature-256` (HMAC dengan `GITHUB_WEBHOOK_SECRET`).
  2. Pada event `push`: ambil `repository.full_name` → cari project dengan `repoFullName` cocok.
  3. Untuk tiap commit: simpan `{ sha, message (judul), body (detail), url, author, timestamp }` ke **activity feed project** (bukan ke task tertentu).
- Pakai `octokit` (sudah terpasang) untuk verifikasi/format bila perlu.
- Setup: satu **GitHub App / org webhook** menunjuk ke endpoint ini; jadi semua repo org mengirim ke satu endpoint, dipilah by `repoFullName`.

**Task → Completed = manual** (sesuai keputusan). Commit hanya memperkaya konteks project, tidak meng-auto-complete task.

**File baru/diubah:** `src/app/api/github/webhook/route.ts` (baru), `src/lib/dashboard-data.ts` (tambah `repoFullName` di `DashboardProject`), `src/lib/firestore.ts` (fungsi `appendProjectActivityFromCommit`), settings UI untuk isi repo.

> Catatan: CLI `scripts/autom8.mjs` (commit/done) bisa tetap dipertahankan untuk workflow Claude Code, ATAU dipensiunkan kalau webhook sudah menutup kebutuhan. Perlu kamu putuskan saat revisi.

---

## Tahap 5 — Laporan Harian ke Discord

**Tujuan:** sekali sehari, rangkum task yang selesai + aktivitas commit, kirim ke channel Discord Aixel.

- Env `DISCORD_WEBHOOK_URL` (Incoming Webhook channel Aixel — paling simpel, tanpa bot).
- API/route: `POST /api/reports/daily`:
  1. Query Firestore: task `Completed` hari itu + ringkasan commit per project.
  2. Format jadi Discord embed (per project: task selesai, jumlah commit, kontributor).
  3. POST ke `DISCORD_WEBHOOK_URL`.
- Penjadwalan: Vercel Cron (`vercel.json`) atau GitHub Action terjadwal memanggil endpoint sekali sehari (mis. 17:00 WIB).

**File baru/diubah:** `src/lib/discord.ts` (baru), `src/app/api/reports/daily/route.ts` (baru), `vercel.json` (cron) atau `.github/workflows/daily-report.yml`.

---

## Ringkasan File

| Area | File | Status |
|---|---|---|
| Storage + upload | `src/lib/storage.ts`, `src/app/api/projects/[id]/document/route.ts` | baru |
| Parser dokumen | `pdf-parse`, `mammoth` (dep baru) | baru |
| AI task-gen | `src/lib/ai.ts`, `src/app/api/projects/[id]/generate-tasks/route.ts`, `@anthropic-ai/sdk` | baru |
| Tipe task | `src/lib/data.ts` (`aiGenerated`, `category`) | ubah |
| Assign | `task-dialog.tsx`, `provider.tsx`, `src/lib/access.ts` | reuse |
| GitHub webhook | `src/app/api/github/webhook/route.ts`, `repoFullName` di project | baru/ubah |
| Discord | `src/lib/discord.ts`, `src/app/api/reports/daily/route.ts`, cron | baru |

## Env Vars Baru
```
ANTHROPIC_API_KEY=...
GITHUB_WEBHOOK_SECRET=...
DISCORD_WEBHOOK_URL=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...   # jika belum ada
```

---

## Verifikasi (end-to-end)

1. **Upload:** unggah `.pdf` & `.docx` di halaman project → cek file di Storage + metadata di Firestore.
2. **AI:** trigger generate-tasks → muncul draft task terstruktur (FE/BE/dll) dengan `aiGenerated: true`.
3. **Assign:** approve + assign draft ke user → task muncul di board dengan assignee benar (cek role permission).
4. **GitHub:** isi `repoFullName` di satu project, push commit dummy → activity feed project bertambah; project tanpa `repoFullName` tidak terpengaruh. Uji verifikasi signature (payload tanpa signature valid ditolak).
5. **Discord:** panggil `/api/reports/daily` manual → embed muncul di channel; lalu cek cron berjalan sesuai jadwal.

---

## Hal yang Masih Perlu Kamu Revisi/Putuskan

1. **Nasib CLI `autom8.mjs`** setelah webhook ada — dipertahankan untuk Claude Code, atau dipensiunkan?
2. **Granularitas mapping** — yakin 1 repo = 1 project cukup? (monorepo dengan banyak project akan butuh pendekatan lain).
3. **Auto-complete task dari commit** — sekarang murni manual; apakah nanti mau ada opsi konvensi branch (`feature/AUT-12-...`) untuk auto-complete?
4. **Format & jam digest Discord** — jam berapa, dikelompokkan per project atau per orang?
