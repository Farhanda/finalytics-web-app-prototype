# Panduan Penggunaan autom8

Dokumen ini menjelaskan **cara memakai** autom8 dari sisi pengguna: dari membuat
project, generate task lewat AI, menghubungkan GitHub per divisi, sampai laporan
harian ke Discord. (Untuk catatan teknis/implementasi, lihat kode di `src/`.)

Alur singkatnya:

```
Buat project → Upload dokumen → AI generate task → Review & assign
     → Dev push commit (webhook per divisi) → Feed project terisi otomatis
          → Sekali sehari: laporan digest ke channel Discord "aixel"
```

Tidak semua langkah wajib. Divisi yang tidak pakai GitHub cukup memakai board
secara manual — integrasi GitHub & Discord sifatnya opsional.

---

## Peran & hak akses

| Peran | Bisa apa |
|---|---|
| **Admin** | Semua. Kelola project, task, anggota, integrasi. |
| **PM** | Kelola project miliknya: upload dokumen, generate task, atur webhook, assign. |
| **Member** | Lihat board, kerjakan task yang di-assign, tandai selesai. |

Tombol kelola project (**Docs**, **GitHub**, **Manage**) hanya muncul untuk
Admin/PM pada project yang mereka kelola.

---

## 1. Buat project

1. Masuk ke **Dashboard → Projects**.
2. Klik **New project**, isi nama + detail, simpan.
3. Project baru muncul sebagai kartu. Tiga tombol kelola ada di kartu:
   - **Docs** — upload dokumen & generate task via AI.
   - **GitHub** — atur webhook commit per divisi.
   - **Manage** — edit/atur project.

---

## 2. Upload dokumen brief (PDF / DOCX)

1. Pada kartu project, klik **Docs**.
2. Pilih file `.pdf` atau `.docx` (brief / dokumen kebutuhan project).
3. Upload. App akan **mengekstrak teks** dokumen dan menyimpannya di project.

Catatan:
- Yang selalu disimpan adalah **teks** hasil ekstraksi (dipakai AI di langkah 3).
- Menyimpan **file asli** (binari) ke Firebase Storage sifatnya opsional — hanya
  jalan kalau Admin SDK + bucket sudah diset. Kalau belum, teksnya tetap tersimpan
  dan flow tetap jalan.

---

## 3. Generate task dengan AI (Claude)

1. Masih di dialog **Docs**, setelah dokumen ada, klik **Generate tasks**.
2. AI (Claude) membaca teks dokumen dan mengusulkan daftar task terstruktur,
   masing-masing punya: **nama, kategori/divisi, prioritas, deskripsi**.
3. Divisi yang dikenali: **Frontend, Backend, Design, QA, DevOps, Research, Other**.

> Butuh `ANTHROPIC_API_KEY` di environment. Kalau belum diisi, tombol generate
> akan menampilkan pesan 503 yang ramah (bukan error keras) — isi key dulu lalu
> coba lagi.

---

## 4. Review & assign task

1. Hasil AI muncul sebagai **draft** untuk di-review (bisa edit/hapus sebelum masuk board).
2. Setujui draft → task masuk board dengan key berurutan (`AUT-1`, `AUT-2`, …).
3. Assign tiap task ke anggota lewat dialog task seperti biasa.
4. Task ditandai **selesai secara manual** oleh assignee/PM. Commit GitHub
   **tidak** otomatis menyelesaikan task — commit hanya mengisi feed project.

---

## 5. Hubungkan GitHub (webhook per divisi)

Tiap project bisa punya **beberapa webhook — satu per divisi**. Jadi commit dari
repo Frontend masuk dengan tag `Frontend`, repo Backend dengan tag `Backend`, dst.

**Buat webhook di app:**
1. Pada kartu project, klik **GitHub**.
2. Tambah webhook, pilih **divisi**-nya.
3. App membuat **URL webhook + secret unik** dan menampilkannya **sekali**.
   Salin keduanya sekarang.

**Pasang di repo GitHub:**
1. Buka repo → **Settings → Webhooks → Add webhook**.
2. **Payload URL**: tempel URL dari app.
3. **Content type**: `application/json`.
4. **Secret**: tempel secret dari app.
5. **Events**: pilih **Just the `push` event**.
6. Simpan. GitHub mengirim `ping` → app membalas `pong` (cek "Recent Deliveries").

Setelah itu, setiap **push** ke repo otomatis mengirim commit-nya ke feed project,
diberi tag sesuai divisi webhook. Signature commit diverifikasi (HMAC SHA-256) —
payload tanpa secret yang benar **ditolak**.

> Divisi yang tidak pakai GitHub cukup lewati langkah ini — task tetap dikelola
> manual di board.

---

## 6. Lihat aktivitas commit di project

1. Buka project, pilih tab **Commits**.
2. Feed menggabungkan dua sumber:
   - **Commit dari webhook** — diberi **chip divisi** (warna per divisi).
   - **Commit yang ditautkan ke task** lewat CLI `scripts/autom8.mjs` — diberi key `AUT-N`.
3. Tiap baris menampilkan judul + detail commit, penulis, dan waktu.

---

## 7. Laporan harian ke Discord

Sekali sehari, autom8 merangkum aktivitas dan mengirim **digest** ke channel
Discord **aixel**:

- **Task yang selesai** dalam 24 jam terakhir.
- **Jumlah commit per project**, dipecah **per divisi**.

**Jadwal:** Vercel Cron menjalankan `/api/reports/daily` setiap hari pukul
**10:00 UTC = 17:00 WIB**.

**Coba manual / preview:**
- Preview tanpa kirim: `GET /api/reports/daily?dryRun=1` (mengembalikan JSON laporan).
- Atur jendela waktu: tambahkan `?hours=N`.
- Endpoint ini terproteksi — perlu header `Authorization: Bearer <CRON_SECRET>`
  (atau `AUTOM8_API_TOKEN` untuk trigger manual).

> Butuh `DISCORD_WEBHOOK_URL` (Incoming Webhook channel aixel). Kalau belum diisi,
> `?dryRun=1` tetap bisa preview JSON-nya; pengiriman asli akan 503 sampai URL diisi.

---

## Environment yang perlu diisi

Semua opsional untuk dev — fitur terkait akan menampilkan pesan ramah kalau kosong.
Salin `.env.example` ke `.env.local` lalu isi:

| Variabel | Untuk | Wajib? |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Koneksi Firestore (client) | Ya, agar app jalan |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Admin SDK (webhook & report aman) | Opsional (fallback ke client SDK) |
| `ANTHROPIC_API_KEY` | Generate task via Claude (langkah 3) | Hanya untuk fitur AI |
| `DISCORD_WEBHOOK_URL` | Kirim laporan harian (langkah 7) | Hanya untuk Discord |
| `CRON_SECRET` | Proteksi endpoint laporan | Disarankan untuk produksi |
| `AUTOM8_API_TOKEN` | CLI `scripts/autom8.mjs` & trigger report manual | Untuk integrasi CLI |
| `FIREBASE_STORAGE_BUCKET` | Simpan file dokumen asli (opsional) | Tidak |

> Catatan: webhook GitHub **tidak** pakai secret global. Tiap webhook punya secret
> sendiri yang dibuat app saat kamu menambahkannya.

---

## Ringkasan endpoint (rujukan)

| Endpoint | Fungsi |
|---|---|
| `POST /api/projects/[id]/document` | Upload + ekstrak teks dokumen |
| `POST /api/projects/[id]/generate-tasks` | Generate draft task via AI |
| `GET/POST/DELETE /api/projects/[id]/webhooks` | Kelola webhook per divisi |
| `… /api/projects/[id]/webhooks/[webhookId]` | Hapus/kelola satu webhook |
| `GET /api/projects/[id]/commits` | Feed commit project |
| `POST /api/github/webhook/[id]` | Penerima push GitHub (per webhook) |
| `GET/POST /api/reports/daily` | Bangun & kirim laporan harian |
