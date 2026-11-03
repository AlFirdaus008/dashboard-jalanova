**Jalanova AI — dashboard proyek Surabaya**

Aplikasi Vite + React dengan peta Leaflet. Antarmuka berbahasa Indonesia dan membaca hasil ekspor proyek, tanpa backend inferensi palsu atau angka acak.

Jalankan dari direktori ini dengan Node.js 22.12+ atau 24:

Di Windows, Anda juga dapat membuka `start-dashboard.cmd`, lalu membuka alamat Local yang ditampilkan. Instalasi pertama membutuhkan internet; dependensi sudah terpasang pada workspace saat pembuatan.

```sh
npm install
npm run dev
```

Build produksi:

```sh
npm test
npm run build
npm run preview
```

Halaman: pengenalan proyek, peta interaktif, kewenangan jalan, daftar prioritas, estimasi biaya, jadwal kerja, evaluasi, serta pengumpulan data/metode/referensi. Rute menggunakan hash agar dapat dibuka ulang pada hosting statis.

Halaman awal memakai ilustrasi jalan isometrik di `src/StreetScene.jsx` sebagai pengantar visual; gambar itu bukan peta atau foto lokasi Surabaya. Tautan di bawahnya membuka peta analisis yang sebenarnya. Pilihan akses masyarakat dan petugas ditempatkan di dua kartu setelah pembuka. Masyarakat dapat membuat laporan, masuk, atau membuka pendaftaran langsung melalui `#/account?mode=register`; pendaftaran biasa hanya memberi peran masyarakat. Petugas masuk lewat tombol di kartu petugas atau tombol Dashboard pada header. Navigasi atas tidak lagi menampilkan strip akun/laporan. Sidebar dashboard memakai hijau gelap dari palet proyek, sedangkan area analisis tetap terang.

Halaman **Data & metode** memakai seluruh lebar area konten, termasuk tabel sumber data. Tab **Alur analisis** menyediakan enam panel buka/tutup dengan 18 gambar asli dari `output_jalanova/visualizations`. Galeri dimuat ketika tahap dibuka; setiap gambar dapat diperbesar dan diunduh. Pemetaan tahap, nama berkas, caption, dan sel pembuatnya ada pada `src/content/method.mjs`. Jalankan `npm run prepare:figures` untuk menyalin ulang gambar tanpa mengubah data analisis; `prepare:data` juga menggunakan pemetaan yang sama.

Tab **Fokus pengembangan** menampilkan tiga cuplikan komponen antarmuka yang membaca data dashboard: status/pengelola ruas, grafik hasil uji kualitas foto, dan dimensi satu titik hasil deteksi. Cuplikan berupa tampilan data langsung, bukan berkas screenshot. Grafik kualitas foto dan dimensi memakai komponen yang sama dengan halaman evaluasi serta panel detail titik. Narasi membedakan fitur yang tersedia dari integrasi layanan, pengujian cuaca lapangan, dan pengukuran kedalaman yang belum dikerjakan. **Referensi** dikelompokkan menjadi dataset/peta, model, dokumen kewenangan, serta bahan pengembangan.

Menu **Kewenangan jalan** (`#/authority`) memuat rujukan untuk 15 ruas, bukti dan batas kepastiannya. Filter kewenangan, label detail/tabel, pilihan warna peta, serta ekspor CSV memakai registry yang sama di `src/content/road-authorities.json`. Registry beserta sumber dapat diunduh dari halaman tersebut. Dasar riset dan hasil per ruas dijelaskan dalam [ROAD_AUTHORITY_RESEARCH.md](ROAD_AUTHORITY_RESEARCH.md).

Status ruas menggunakan tiga kategori: **Nasional** (Ahmad Yani, Kenjeran, Perak Timur), **Provinsi** (Mastrip), dan **Kota** (11 ruas lainnya). Filter menyediakan Semua status jalan, Nasional, Provinsi, dan Kota. Label yang sama berlaku pada peta, tabel, detail, ringkasan, dan ekspor CSV. Catatan sumber dan batas segmen tersedia di detail ruas. Koordinat titik kerusakan masih simulasi dan skor notebook tetap sama. Pengiriman laporan ke layanan pemerintah belum terintegrasi.

Laporan yang dikirim warga muncul di antrean dan peta petugas dengan penanda berbeda dari titik eksperimen notebook. Petugas dapat mengubah status dan prioritas, mencatat waktu pekerjaan, biaya aktual, foto hasil, serta dokumen pengeluaran. Pelapor melihat catatan dan bukti itu di riwayat laporannya. Berkas bukti bersifat privat.

### Laporan contoh di Supabase

Untuk mencoba alur kedua dashboard, periksa rencana isi lalu simpan tiga laporan contoh:

```sh
node scripts/seed-demo-reports.mjs
node scripts/seed-demo-reports.mjs --apply
```

Perintah kedua meminta kata sandi akun contoh tanpa menampilkannya. Akun `userwarga` membuat laporan melalui API yang sama dengan formulir warga; akun petugas `usergovernence` memperbarui status pada dua laporan. Ketiga laporan memiliki ilustrasi jalan bertanda **DEMO**, lokasi simulasi, dan label **Data demo** pada daftar, peta, dan detail. Skrip memakai ID tetap sehingga aman dijalankan ulang tanpa menggandakan laporan. Foto tersimpan di Supabase Storage privat dan laporan di database. Data ini hanya untuk memperagakan alur, bukan dokumentasi kerusakan atau pekerjaan lapangan.

Pelaporan warga melalui foto dan lokasi kini memakai Supabase Auth, database, dan Storage privat. Dua jenis akun adalah masyarakat dan pemangku kepentingan; pendaftaran biasa selalu menjadi masyarakat, sedangkan akses petugas diberikan pengelola. Konfigurasi proyek, langkah pengaturan URL email, dan persetujuan petugas dijelaskan dalam [SUPABASE_SETUP.md](SUPABASE_SETUP.md). Pekerjaan AI dan integrasi layanan berikutnya disimpan di [BACKLOG.md](BACKLOG.md).

Tombol Dashboard membuka dua pilihan login yang bergeser saat dipilih. Setelah masuk, masyarakat mendapat dashboard sendiri untuk mengambil foto melalui formulir, melihat jumlah laporan, riwayat, status, dan catatan petugas. Petugas tetap memakai dashboard analisis beserta antrean laporan. Perubahan status sampai **Selesai** dan catatannya muncul di dashboard warga; halaman memeriksa pembaruan setiap 30 detik dan saat kembali aktif. Pemberitahuan email belum tersedia. Dua akun lokal `userwarga` dan `usergovernence` telah disiapkan di Supabase dengan sandi yang ditentukan pemilik, tanpa menaruh sandi di kode aplikasi. Akun `usergovernance` sebelumnya tetap menjadi pratinjau terbatas.

Hover peta menampilkan nama jalan dan skor prioritas. Pada detail titik, kartu rekomendasi dapat diklik untuk membaca alasan pemilihan metode dan langkah kerja. ID di tab Aduan juga dapat diklik untuk membuka informasi laporan, foto, lokasi, pelapor dan kontak. Data yang belum ada ditampilkan sebagai “Belum tersedia”; contoh dataset tidak dipakai sebagai foto lokasi. Sumber tambahan `public/data/report-details.json` saat ini masih kosong. Format dan batas datanya dijelaskan pada [REPORT_DETAILS.md](REPORT_DETAILS.md).

Dialog rekomendasi diawali ringkasan untuk pemangku kebijakan: unit koordinator, tindakan pertama, metode, estimasi biaya dan waktu, serta tiga langkah tindak lanjut. Rincian teknis tersedia dalam bagian yang dapat dibuka. Tombol petunjuk arah pada dialog dan panel titik membuka Google Maps; koordinat aduan diprioritaskan, sedangkan titik simulasi proyek diberi label pratinjau yang jelas.

Tampilan sementara dikunci ke mode terang pada seluruh halaman, termasuk peta. Pilihan Terang/Gelap/Default disembunyikan; pilihan lama di browser dan tema perangkat tidak mengubah tampilan. Preferensi lama tetap tersimpan agar dapat digunakan jika fitur tema diaktifkan kembali. Halaman awal dan seluruh halaman analisis kini memakai header yang sama: logo, Tentang proyek, Data & metode, Hasil evaluasi, tombol Dashboard, serta “Surabaya, Jawa Timur, Indonesia” rata kanan. Breadcrumb dan label Data eksperimen pada header dihapus.

Sidebar berada di bawah header, dengan satu tombol ikon untuk meringkas atau memperluas menu. Saat diperluas, menu menampilkan ikon dan nama halaman pada bidang hijau gelap; saat diringkas, ikon tetap dapat diklik dan memiliki label aksesibel. Menu berisi lima halaman analisis dan antrean Laporan masyarakat. Evaluasi model, Data & metode, serta Tentang proyek diakses melalui header atas. Data & metode serta Hasil evaluasi dari area publik memakai layout tanpa sidebar; tautan dari header dashboard mempertahankan konteks sidebar lewat parameter from=dashboard. Tombol Dashboard mengarah ke akun petugas; pratinjau data notebook tersedia secara eksplisit tanpa memberikan akses laporan warga. Halaman aktif memakai warna area konten terang. Tidak ada tombol silang atau panah kanan pada tautan. Scrollbar sidebar disembunyikan, tetapi scroll mouse, sentuhan, dan keyboard tetap tersedia. Logo tampil pada header bersama agar tidak berulang. Lebar sidebar dan area analisis desktop berubah dengan animasi. Pada ponsel, menu terbuka memakai latar penutup dan otomatis menutup setelah halaman dipilih. Escape dan klik latar dapat menutup menu; fokus keyboard dibatasi ke panel saat menu ponsel terbuka.

Koordinat tujuan pada detail titik kini berada dalam satu blok dengan nama jalan. Tombol **Cetak laporan / PDF** di bawah judul titik membuka pratinjau gabungan penanganan dan semua aduan terkait. Laporan mencakup lokasi, hasil analisis, dimensi, kewenangan beserta sumbernya, biaya, kedua rekomendasi jadwal, tindak lanjut, urutan teknis, serta informasi dan seluruh foto setiap aduan. Data yang belum tersedia tetap ditandai, dan koordinat simulasi tidak menjadi lokasi asli laporan. Pilih **Cetak / Simpan PDF**, lalu **Simpan sebagai PDF** di dialog cetak browser. CSS cetak memakai ukuran A4, menyembunyikan antarmuka aplikasi, dan membiarkan isi laporan mengalir ke halaman berikutnya. Tidak ada layanan eksternal untuk membuat berkas PDF.

Bagian keikutsertaan kompetisi berada setelah pembuka halaman Tentang proyek. Bagian ini memakai tiga aset asli dari `public/`: `pemkotsurabaya.svg`, `bridasby.svg`, dan `inovboyo.svg`. Logo mempertahankan warna aslinya, sedangkan antarmuka tetap memakai palet aplikasi. Narasi menyatakan tujuan keikutsertaan Jalanova, tanpa klaim dukungan resmi atau status pemenang. Tautan informasi mengarah ke [halaman INOVBOYO 2.0 BRIDA Surabaya](https://brida.surabaya.go.id/program/inovboyo); akses yang sama tersedia pada bagian bawah sidebar. Ejaan nama kompetisi pada tampilan diperbaiki menjadi INOVBOYO 2.0.

Label Data eksperimen di kiri bawah memiliki penjelasan saat hover, fokus keyboard, atau ketukan. Penjelasan menyebut sumber skor/biaya/jadwal serta batas data simulasi. Label dokumentasi sekarang **Document Analysis Jalanova**. URL GitHub belum diberikan sehingga teks tersebut belum menjadi tautan aktif; nantinya isi `PROJECT_DOCUMENTATION_URL` pada `src/content/navigation.mjs`.

Perpindahan halaman memakai transisi memudar, termasuk antara Tentang proyek dan halaman analisis. Browser yang mendukung View Transitions menjalankan pergantian dari tampilan lama ke baru; fallback CSS menampilkan animasi masuk. Pengaturan prefers-reduced-motion menonaktifkan animasi. Pengujian navigasi memastikan klik cepat tidak mengembalikan pengguna ke halaman sebelumnya.

Label lokasi/lomba di atas judul pembuka telah dihapus. Narasi pembuka, latar belakang, tujuan, alur, dan judul halaman analisis telah disunting dengan kalimat yang lebih langsung. Angka hasil dan catatan keterbatasan data tetap disertakan.

Halaman pembuka kini memakai judul “Lebih cepat dengar aduan, lebih akurat tentukan perbaikan.” dan label “Lokasi yang dianalisis”. Latar belakang serta tujuan menonjolkan tiga fokus: kejelasan kewenangan jalan, deteksi pada kondisi foto yang sulit, serta estimasi ukuran dan volume untuk kebutuhan material. Konten yang sama tersedia pada tab “Fokus pengembangan” di halaman Data & metode.

Setiap fokus membedakan kemampuan prototipe dari rencana berikutnya. Penerusan aduan ke layanan pemerintah lain, pengolahan citra hujan/malam, pengukuran kedalaman dari foto, dan LiDAR belum diimplementasikan dalam dashboard ini. Konten ada di `src/content/project.mjs`, dengan rujukan layanan resmi dan dokumentasi teknis pada bagian referensi pengembangan. Estimasi 2D dan pengujian degradasi sintetis yang sudah tersedia tetap dijelaskan sesuai notebook.

Data aplikasi siap pakai ada di `public/data/project.json` dan `public/data/roads.geojson`. Hasil normalisasi dicatat di `provenance`. Peta membawa 4.748 segmen jaringan OSM lokal; peta dasar CARTO/OSM dan font Google memakai koneksi internet. Jika peta dasar tidak tersedia, segmen jalan dan titik tetap tampil. Tombol layer dapat beralih ke jaringan lokal.

Untuk memperbarui data dari direktori proyek induk:

```sh
npm run prepare:data
```

Perintah tersebut membutuhkan `../Jalanova_AI.ipynb` dan `../output_jalanova`. Mapping ID ruas diambil dari tabel HTML tersimpan sel 88, bukan ditebak dari kemiripan nama atau jadwal. Konversi GeoPackage memakai `node:sqlite` (Node.js 24 disarankan). Build produksi memakai salinan data yang sudah disiapkan dan tidak membutuhkan direktori induk.

Filter saling terhubung pada peta, prioritas, dan biaya. Ekspor CSV mengikuti filter. Klik titik membuka dimensi, rekomendasi penanganan, rentang biaya, anggota klaster aduan, dan jendela kerja ruas. Jadwal memisahkan Weekday/Weekend dan menandai lintas tengah malam.

Koordinat merupakan rekonstruksi eksperimen pada OSM. Foto contoh berasal dari RDD/BPID dan tidak menjadi bukti visual masing-masing titik Surabaya. Ukuran sebagian besar titik berasal dari imputasi. KPI seluruh data memakai median total Monte Carlo dari ringkasan; biaya hasil filter merupakan jumlah median titik. Kedua statistik tersebut tidak dapat dipertukarkan. Harga, durasi segel retak, dan rekomendasi memerlukan pemeriksaan sebelum penggunaan lapangan.

Bobot prioritas ditampilkan sebagai penjelasan hasil tersimpan; aplikasi tidak berpura-pura menjalankan perhitungan ulang ketika input kriteria belum tersedia. Model `.pt` dan `.joblib` tidak dipaketkan sebagai aset publik. Inferensi foto baru membutuhkan layanan terpisah.

Bahasa antarmuka mengikuti prinsip skill no-ai-slop: istilah konkret, angka dengan konteks, tanpa klaim data resmi atau dampak lapangan yang belum dibuktikan. Desain memakai latar hangat, hijau tua, serif pada halaman pengenalan, dan tata letak analisis yang lebih rapat pada dashboard.

Penerbitan belum dilakukan. Sites privat sudah diregistrasikan pada manifest, tetapi persetujuan otomatis menolak pengunggahan source/aset karena publikasi ke tujuan eksternal belum diizinkan pengguna. Jangan menyebut URL dari manifest/metadata sebagai situs yang sudah aktif. Penerbitan berikutnya harus menunggu izin pengguna, kemudian memakai ID Sites yang sama dan kredensial baru.
# dashboard-jalanova
