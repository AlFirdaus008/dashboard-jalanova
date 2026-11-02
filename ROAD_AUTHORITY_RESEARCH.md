# Status jalan pada dashboard Jalanova

Diperbarui 1 November 2026. Cakupan: 15 ruas proyek.

## Klasifikasi yang digunakan

Sesuai arahan pemilik proyek, dashboard memakai tiga kategori status: Nasional, Provinsi, dan Kota. Catatan sumber, cakupan koridor, dan verifikasi titik ditempatkan pada detail ruas. Filter menyediakan Semua status jalan serta ketiga kategori tersebut.

| Status | Ruas proyek | Jumlah ruas |
| --- | --- | --- |
| Nasional | Ahmad Yani, Kenjeran, Perak Timur | 3 |
| Provinsi | Mastrip | 1 |
| Kota | Raya Darmo, Mayjen Sungkono, HR Muhammad, Kertajaya, Rungkut Industri Raya, Dupak, Dr. Ir. H. Soekarno (MERR), Basuki Rahmat, Tunjungan, Raya Wiyung, Manukan Kulon | 11 |

## Sumber utama

1. [Perwali Surabaya 69/2023 — RKPD Kota Surabaya 2024](https://jdih.surabaya.go.id/uploads/peraturan/2023perwali3578069.pdf#page=250). Tabel II.182, halaman PDF 250 (halaman cetak II-183), baris 39 secara eksplisit menyebut Jl. Perak Timur dengan kewenangan nasional. Tabel berisi data lalu lintas 2018–2022. Teks dan raster PDF resmi sudah diperiksa. Ini melengkapi rujukan sebelumnya yang menggunakan nama koridor Tanjung Perak.
2. [Kepmen PUPR 1688/KPTS/M/2022 — penetapan ruas jalan nasional](https://binamarga.pu.go.id/index.php/peraturan/detail/keputusan-menteri-pupr-nomor-430kptsm2022-tentang-penetapan-ruas-jalan-menurut-statusnya-sebagai-jalan-nasional). Lampiran Jawa Timur halaman PDF 64: Kenjeran 01112K, 1,83 km; Tanjung Perak 00914K, 3,69 km. Slug URL berbeda dari nomor yang tercantum pada dokumen. Peta Surabaya berada pada halaman PDF 63.
3. [Pemkot Surabaya — pembahasan JPO Ahmad Yani, 30 Juli 2024](https://www.surabaya.go.id/id/berita/22712/audiensi-dengan-kai-daop-8-wali-kota-eri-cahyadi-bahas-pembangunan-saluran-air-hingga-jpo-jalan-ahmad-yani). Keterangan resmi menyebut posisi JPO melintasi jalan nasional dan perizinan kepada Balai Besar Jalan Nasional. Dashboard mengklasifikasikan jalur utama Ahmad Yani sebagai Nasional sesuai keterangan ini dan arahan pemilik proyek.
4. [Perda Surabaya 3/2025 — RTRW 2025–2045](https://jdih.surabaya.go.id/uploads/peraturan/2025perda3578003.pdf). Pasal 11, Lampiran V dan program penyelenggaraan jalan halaman PDF 252–255 digunakan untuk konteks koridor, jalan kota, serta Mastrip pada penyelenggaraan jalan provinsi. Status Kota pada registry merupakan klasifikasi berdasarkan hubungan daftar ruas dengan program penyelenggaraan kota, bukan klaim pembacaan lampiran SK kota terbaru.
5. [Renja Dishub Jawa Timur 2023](https://www.dishub.jatimprov.go.id/wp-content/uploads/2023/07/RENJA-2023-dishub-jatim.pdf). Bab II halaman tercetak II.190, kegiatan 362–368 menyebut lokasi Mastrip, Karangpilang, Surabaya sebagai ruas jalan provinsi. Akses server penerbit dapat dibatasi; rujukan utama Mastrip pada implementasi adalah RTRW 2025.

Tautan Google yang dikirim pemilik proyek tidak dapat diresolusikan melalui alat riset. Sumber langsung di atas digunakan agar rujukan bisa ditelusuri dari dashboard. Sebutan kewenangan tidak disimpulkan dari warna marka atau kelas fungsi jalan saja.

## Catatan cakupan

Kenjeran diklasifikasikan Nasional untuk koridor 01112K. RTRW juga menyebut nama Kenjeran pada jaringan arteri sekunder; batas koridor tetap dicatat pada detailnya. Untuk Perak Timur, tabel RKPD menyebut namanya secara langsung; batas koridor Tanjung Perak dan akses internal pelabuhan tetap perlu dicocokkan saat penugasan lapangan. Jalur utama Ahmad Yani dibedakan dari akses/frontage dalam catatan ruas.

Koordinat kerusakan notebook masih simulasi pada OSM. Kategori status melekat pada ruas proyek; setiap titik mempertahankan spatiallyVerified: false. Belum ada pencocokan titik GPS lapangan dengan geometri kewenangan resmi. Catatan ini tidak menjadi kategori status tambahan.

## Implementasi

Sumber data status berada di src/content/road-authorities.json. Halaman #/authority, label titik, tabel, legenda warna peta, filter, ringkasan dan CSV menggunakan tiga label yang sama. CSV menyertakan Status Jalan, dasar bukti, penanggung jawab, cakupan, catatan, sumber, tanggal pemeriksaan, dan verifikasi lokasi. Registry beserta sumber dapat diunduh dari halaman kewenangan.

Status membantu memilah koordinasi tanpa mengubah skor, triase, ukuran, biaya, atau jadwal notebook. Jumlah median RAB per status tetap merupakan hasil eksperimen, bukan alokasi anggaran instansi. Belum ada penerusan laporan otomatis ke layanan pemerintah.

Apabila ruas baru ditambahkan, status dan sumber harus dikonfigurasi di registry terlebih dahulu. Sistem menolak ruas tanpa konfigurasi agar tidak menebak statusnya. Rencana pelaporan warga tersimpan pada BACKLOG.md.
