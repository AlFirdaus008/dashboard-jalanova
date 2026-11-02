# Detail aduan dan foto lokasi

Pembaruan 2 November 2026. Pemilik proyek meminta tampilan detail dilanjutkan dengan penanda “Belum tersedia” untuk informasi yang belum ada.

Ekspor notebook memuat ID aduan, hubungan ke titik unik, dan tanda duplikat. Foto asli per aduan, teks, waktu, nama/kontak pelapor, alamat rinci, serta koordinat asli belum tersedia di berkas ekspor. Contoh citra RDD yang dipasangkan menurut kelas tidak digunakan sebagai foto lokasi. Koordinat simulasi tetap dipisahkan dari koordinat laporan asli.

## Tampilan

- Hover titik: Nama Jalan | skor/100.
- Detail titik: jenis dan tingkat kerusakan, panel foto lokasi, kewenangan, dimensi, rekomendasi, biaya, dan jam kerja.
- Kartu rekomendasi dapat dibuka untuk membaca aturan pemilihan metode, urutan kerja, asumsi biaya, waktu, serta referensi teknis.
- Bagian awal rekomendasi menampilkan ringkasan untuk pemangku kebijakan: unit yang perlu dihubungi, tindakan pertama menurut triase, usulan metode, estimasi biaya, dan waktu. Tiga langkah tindak lanjut mendahului rencana teknis yang dapat dibuka bila diperlukan.
- Tombol arah ada pada ringkasan rekomendasi dan detail titik. URL Google Maps menggunakan koordinat tujuan dalam urutan latitude, longitude, dengan parameter api=1 serta tanpa menebak titik keberangkatan.
- Tab Aduan berisi tombol setiap ID laporan. Detailnya menampilkan foto, isi aduan, tanggal/sumber, pelapor/kontak, alamat, kecamatan, kelurahan, patokan, koordinat laporan dan analisis titik terkait.
- Data yang belum tersedia ditampilkan sebagai “Belum tersedia”. Foto kosong memiliki penanda tanpa gambar contoh. Foto tidak dapat dimuat memiliki pesan tersendiri.

## Sumber detail tambahan

`public/data/report-details.json` merupakan sumber tambahan yang dibaca aplikasi. Saat ini berisi array kosong. Data yang ditambahkan nanti harus menggunakan ID yang sudah ada pada `project.json`, tanpa mengubah hasil analisis atau hubungan deduplikasi.

Struktur setiap entri:

```json
{
  "schemaVersion": 1,
  "reports": [
    {
      "id": "ID_ADUAN_YANG_SUDAH_ADA",
      "description": null,
      "submittedAt": null,
      "channel": null,
      "reporter": {
        "name": null,
        "contact": null
      },
      "location": {
        "address": null,
        "district": null,
        "subdistrict": null,
        "landmark": null,
        "coordinates": null
      },
      "photos": []
    }
  ]
}
```

`submittedAt` dan `photos[].capturedAt` memakai ISO 8601 dengan zona waktu. Koordinat menggunakan `[longitude, latitude]` dari laporan asli. Entri foto berisi `src`, `caption`, dan `capturedAt`; URL dapat berupa path aset website atau HTTP(S). Nama/kontak pelapor tidak dibuat otomatis. Data dari ID lain tidak dipinjam untuk mengisi aduan yang kosong.

Adaptor menolak ID yang tidak dikenal dan ID berulang, mengecek rentang koordinat, serta mengecualikan URL foto yang tidak valid. File detail tambahan yang belum ada (404) diperlakukan sebagai daftar kosong. Berkas ini adalah sumber data tampilan, belum merupakan backend pelaporan atau sistem hak akses. Jika data pelapor asli digunakan di layanan yang dipublikasikan, pengambilan kontak perlu dipindahkan ke backend dengan akses petugas; jangan memasukkan kontak pribadi ke aset publik.

Tujuan rute mengutamakan koordinat aduan induk; jika belum ada, koordinat aduan terkait digunakan dengan menyebut ID sumbernya. Aduan dari titik lain tidak digunakan. Jika koordinat laporan asli belum tersedia, tombol berlabel “Pratinjau rute titik proyek” dan penjelasan simulasi ditampilkan. Jika seluruh koordinat tidak tersedia, tautan rute tidak dibuat. Tidak ada permintaan GPS atau API geocoding dari dashboard. Format tautan mengikuti [dokumentasi Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started#directions).

Unit koordinator menggunakan nama lengkap DSDABM Kota Surabaya, Dinas PU Bina Marga Jawa Timur, serta BBPJN Jawa Timur–Bali sesuai kategori ruas. Rujukan nama unit nasional tersedia pada [situs resmi BBPJN Jawa Timur–Bali](https://binamarga.pu.go.id/balai-jatim-bali); nama DSDABM dikonfirmasi pada [publikasi Pemkot Surabaya 2026](https://www.surabaya.go.id/id/berita/25124/pemkot-surabaya-tambah-delapan-rumah-pompa-baru-tahun-ini-ditargetkan-tuntas-oktober). Kewenangan provinsi mengikuti rujukan RTRW pada registry. Dashboard tidak mengirim aduan atau menetapkan penugasan ke unit tersebut.

## Dasar penjelasan rekomendasi

`src/lib/treatment.mjs` mengikuti tabel SCHEME pada cell 76 notebook. Jenis kerusakan dan tingkat kerusakan menentukan metode; skor prioritas tetap berasal dari notebook. Seluruh 659 hasil tersimpan sudah dicocokkan dengan aturan ini.

Urutan kerja adalah ringkasan rencana awal berdasarkan metode yang dipilih. Penjelasan tidak mengklaim SHAP, peta perhatian model, atau pemeriksaan fondasi otomatis. Ketebalan lapisan pada bagian asumsi biaya merupakan parameter notebook; petugas menyesuaikan pekerjaan dengan pemeriksaan dan desain teknis.

Referensi yang ditampilkan pada dialog:

- [Pedoman penambalan perkerasan beraspal, SE 40/SE/M/2015](https://binamarga.pu.go.id/index.php/nspk/detail/pedoman-pelaksanaan-pemeliharaan-perkerasan-beraspal-dengan-teknik-penambalan).
- [Spesifikasi Umum Bina Marga 2025](https://binamarga.pu.go.id/uploads/files/2104/Spesifikasi-Umum-2025-untuk-Pekerjaan-Konstruksi-Jalan-dan-Jembatan.pdf).
- [Manual Desain Perkerasan Jalan 2024](https://binamarga.pu.go.id/uploads/files/2027/03mbm2024-manual-desain-perkerasan-jalan-2024.pdf).
- [Manual perbaikan standar untuk pemeliharaan rutin jalan](https://binamarga.pu.go.id/uploads/files/2057/no-001-02mbm2011-manual-perbaikan-standar-untuk-pemeliharaan-rutin-jalan.pdf).
