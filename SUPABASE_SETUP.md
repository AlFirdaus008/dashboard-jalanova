# Supabase Jalanova

Proyek yang digunakan: `kfevjvfmbsudfgahxmuj`. Project URL dan publishable key sudah dipasang di `.env.local`, yang diabaikan oleh Git. Password database tidak disimpan dalam aplikasi atau aset web.

Sudah diterapkan pada 2 November 2026:

- Tabel `profiles`, `road_registry`, `citizen_reports`, dan `report_events`.
- Row Level Security untuk masyarakat, petugas yang disetujui, dan pembatasan akun demo.
- Bucket privat `citizen-report-photos`, batas 5 MB, format JPG/PNG/WebP.
- Bucket privat `report-work-evidence`, batas 10 MB, untuk foto pekerjaan dan dokumen biaya.
- 15 rujukan nama/status ruas. Lokasi simulasi notebook tidak dipakai untuk mencocokkan laporan baru secara otomatis.
- Akun demo `usergovernance`, menggunakan sandi yang ditentukan pemilik proyek. Identitas internalnya memakai domain `.invalid`; tidak ada email konfirmasi yang dikirim ke alamat contoh tersebut.

Untuk demo lokal terbaru, tersedia dua akun tambahan yang memakai sandi bersama sesuai permintaan pemilik: `userwarga` (masyarakat) dan `usergovernence` (petugas). Keduanya dibuat di Supabase dengan email internal `.invalid` yang telah dikonfirmasi, tanpa mengirim email nyata. Sandi tidak disimpan dalam repo. Berbeda dari akun lama `usergovernance` yang hanya membaca eksperimen, akun `userwarga` dapat mengirim laporan dan akun `usergovernence` dapat meninjau serta memperbarui status laporan. Ganti atau hapus kredensial bersama tersebut sebelum website dibuka untuk umum.

## Mencoba aplikasi

Jalankan `npm.cmd run dev`, atau gunakan `start-dashboard.cmd`. Buka alamat Local yang ditampilkan.

1. **Masyarakat:** tombol Dashboard → pilih Masyarakat → masuk sebagai `userwarga` → ambil foto dan kirim laporan → pantau ringkasan, kabar petugas, dan riwayat di dashboard warga.
2. **Petugas:** tombol Dashboard → pilih Petugas dan instansi → masuk sebagai `usergovernence` → buka Laporan masyarakat. Periksa foto dan lokasi, tentukan ruas, instansi koordinasi, prioritas, dan catatan tindak lanjut. Saat pekerjaan dimulai, catat waktunya. Untuk status Selesai, isi biaya aktual dan unggah foto hasil serta dokumen pengeluaran.
3. **Akun demo lama:** `usergovernance` tetap hanya membaca hasil eksperimen; tidak dapat membaca atau menangani laporan warga.

Halaman Data & metode serta Hasil evaluasi tidak memakai sidebar ketika dibuka dari area publik. Tautan dari header dashboard menyertakan `from=dashboard` agar konteks sidebar dipertahankan. `preview=1` hanya membuka data notebook yang memang tersedia sebagai aset publik; parameter tersebut tidak memberikan akses laporan warga.

## Pengaturan email yang perlu dilakukan pemilik proyek

Pengaturan ini berada di dashboard pengelolaan Supabase dan tidak diubah lewat koneksi PostgreSQL aplikasi.

1. Buka [Authentication → URL Configuration](https://supabase.com/dashboard/project/kfevjvfmbsudfgahxmuj/auth/url-configuration).
2. Untuk pengembangan lokal, isi **Site URL** dengan `http://127.0.0.1:5173`.
3. Tambahkan **Redirect URLs** `http://127.0.0.1:5173/**` dan `http://localhost:5173/**`.
4. Pertahankan konfirmasi email. Endpoint konfigurasi yang diperiksa menunjukkan pendaftaran email aktif dan konfirmasi email diperlukan.
5. Untuk situs yang diterbitkan nanti, tambahkan domain HTTPS sebenarnya dan gunakan sebagai Site URL. Sesuaikan konfigurasi SMTP serta batas pengiriman email sebelum menerima pendaftaran publik.

Tautan konfirmasi akun kembali ke halaman pengenalan. Pemulihan kata sandi diarahkan ke formulir kata sandi baru melalui event `PASSWORD_RECOVERY`. Perilaku email dan browser tetap perlu diuji dengan akun email nyata milik pengelola; tidak ada email nyata yang dikirim dalam pemeriksaan otomatis sesi ini.

## Memberi akses petugas nyata

Daftarkan dan konfirmasikan akun melalui aplikasi terlebih dahulu. Pengelola lalu menjalankan SQL berikut pada SQL Editor Supabase, setelah mengganti kedua placeholder dan memeriksa identitas pemilik akun:

```sql
update public.profiles
set role = 'stakeholder',
    agency = 'NAMA_INSTANSI'
where id = (
  select id from auth.users
  where lower(email) = lower('EMAIL_PETUGAS')
    and email_confirmed_at is not null
)
and not is_demo;
```

Periksa hasilnya sebelum digunakan:

```sql
select p.id, p.full_name, p.role, p.agency, p.is_demo
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('EMAIL_PETUGAS');
```

Tidak ada pilihan pendaftaran mandiri sebagai petugas. Metadata signup tidak menentukan peran. Akun demo tetap dibatasi meskipun perannya bertuliskan `stakeholder`; jangan mengubahnya menjadi akun petugas nyata.

Setelah peran diberikan, keluar lalu masuk kembali agar aplikasi membaca profil terbaru.

## Penyimpanan dan tindak lanjut

Laporan disimpan sebagai draf privat, lalu foto diunggah. Setelah foto tersedia, RPC mengubah status menjadi Diterima Jalanova dan membuat riwayat. Jika unggahan gagal, laporan belum masuk antrean petugas. Pengiriman ulang menggunakan ID yang sama agar laporan tidak terduplikasi.

Status berikutnya mengikuti alur: diterima → diperiksa → dijadwalkan → dalam penanganan → selesai. Penolakan dan pembukaan ulang memerlukan catatan. Catatan petugas terlihat oleh pelapor. Penjadwalan memerlukan ruas, instansi, dan prioritas yang telah ditentukan. Konflik pembaruan antarpetugas ditolak sampai data dimuat ulang.

Dashboard warga memuat ringkasan laporan, riwayat, dan kabar dari `report_events`. Saat petugas menyimpan status **Selesai**, pelapor melihat status dan catatan di dashboard. Halaman memeriksa pembaruan tiap 30 detik dan saat tab kembali aktif. Pemberitahuan saat ini berada di dalam aplikasi; email atau pesan ke nomor telepon belum diaktifkan.

Laporan yang berhasil dikirim juga muncul di panel dan peta dashboard petugas. Titik laporan warga memakai koordinat dari pelapor. Titik notebook tetap terpisah karena model belum memproses foto baru. Petugas mencocokkan ruas dan menetapkan prioritas secara manual, lalu menyimpan perkembangan pada laporan yang sama.

Setiap catatan pekerjaan menyimpan status, waktu kerja, dan biaya yang ditulis petugas. Status **Selesai** mensyaratkan foto hasil dan dokumen pengeluaran. Pelapor dapat membuka keduanya pada riwayat laporannya; berkas disimpan privat dan tautan bacanya berlaku sementara. Biaya ini adalah catatan aktual dari petugas, terpisah dari perkiraan RAB notebook. Jalanova belum memverifikasi keaslian foto, kuitansi, atau nominal secara independen.

Prioritas laporan baru berasal dari penilaian petugas, bukan skor AI 0–100 hasil notebook. Laporan warga tetap terpisah dari 659 titik eksperimen meskipun keduanya terlihat pada peta petugas. Inferensi foto, penggabungan duplikat, estimasi dimensi foto baru, pencocokan geospasial otomatis, dan pengiriman ke layanan pemerintah lain merupakan pekerjaan lanjutan.

Foto dibaca menggunakan signed URL selama lima menit. Ekspor antrean hanya memuat halaman yang sedang ditampilkan, tanpa kontak pelapor atau URL foto privat. Laporan dibatasi tiga draf baru per menit dan 20 per hari untuk setiap akun. Draf gagal serta foto yang tidak lagi dipakai perlu dibersihkan pengelola sesuai kebijakan retensi yang ditetapkan nanti.

## Berkas dan verifikasi

- `supabase/migrations/202611020001_citizen_reports.sql`: tabel, fungsi, kebijakan akses, dan bucket.
- `supabase/migrations/202611020002_demo_access.sql`: pembatasan akun demo.
- `supabase/migrations/202611020003_work_evidence.sql`: catatan waktu kerja, biaya, foto hasil, dokumen pengeluaran, dan aturan akses privat. Sudah diterapkan pada proyek Supabase ini.
- `supabase/migrations/202611020004_work_upload_access.sql`: petugas dapat memeriksa dan membersihkan unggahan bukti yang gagal dicatat. Sudah diterapkan.
- `supabase/migrations/202611020005_work_any_road.sql`: laporan dari ruas di luar 15 ruas notebook tetap bisa ditangani setelah petugas menentukan prioritas dan instansi. Sudah diterapkan.
- `supabase/seed-road-registry.sql`: 15 rujukan ruas; disiapkan melalui `node scripts/prepare-road-registry.mjs`.
- `scripts/configure-supabase.mjs`: setup khusus proyek ini, kredensial melalui stdin tersembunyi, koneksi TLS dengan verifikasi CA dan hostname. Tidak perlu dijalankan ulang untuk proyek yang sudah disiapkan.
- `scripts/provision-local-accounts.mjs`: membuat dua akun lokal atas permintaan pemilik; sandi diterima lewat stdin tersembunyi dan tidak ditulis ke berkas.
- `supabase/certs/prod-ca-2021.crt`: sertifikat CA publik; sumber unduhan dicocokkan dengan konfigurasi Supabase Studio, bukan diambil dari sertifikat server yang belum dipercaya.
- `tests/supabase-policies.test.mjs`: pengujian SQL/RLS dengan PostgreSQL tersemat. Schema Auth/Storage untuk pengujian merupakan tiruan kontrak Supabase, bukan pengganti uji layanan Supabase langsung.

Pemeriksaan live membuktikan API referensi ruas merespons 200, sedangkan pembacaan profil dan laporan tanpa login ditolak 401. Seluruh empat tabel memakai RLS dan bucket foto privat. Login akun demo telah diuji melalui endpoint Auth; API tindak lanjut menolak akun tersebut, lalu sesi pengujian ditutup. Pendaftaran email nyata, unggahan melalui browser, pemulihan kata sandi, dan interaksi visual belum diuji menyeluruh.

## Dokumentasi resmi

- [Supabase Auth untuk React](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Publishable dan secret keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Akses Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Konfigurasi koneksi PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Verifikasi SSL](https://supabase.com/docs/guides/platform/ssl-enforcement)
