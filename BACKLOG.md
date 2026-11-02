# Catatan pengembangan Jalanova

## Pelaporan warga: fondasi sudah dibuat

Warga dapat mendaftar/masuk, mengirim foto kerusakan, mengonfirmasi lokasi di peta, dan menulis keterangan. Laporan mendapat nomor pelacakan dan dapat dibaca kembali melalui Laporan saya. Supabase menyimpan laporan, foto privat, profil pengguna, serta riwayat tindak lanjut. Petugas yang disetujui dapat membaca antrean, mencocokkan ruas, mencatat instansi koordinasi, menetapkan prioritas manual, dan memperbarui status dengan catatan untuk pelapor. Detail setup ada di SUPABASE_SETUP.md.

Alur yang dibahas: periksa kualitas foto → deteksi kerusakan → cocokkan kewenangan ruas → periksa duplikasi → hitung usulan prioritas → verifikasi petugas → pantau tindak lanjut. Aduan berulang digabung per kerusakan agar jumlah unggahan tidak langsung menentukan ranking. Hasil AI dan ukuran perkiraan perlu diperiksa petugas sebelum menjadi dasar pekerjaan.

Yang belum selesai: inferensi foto baru, pemeriksaan kualitas citra otomatis, pengaburan wajah/plat otomatis, pencocokan geospasial kewenangan, penggabungan laporan ganda, perhitungan skor AI untuk laporan baru, impor/survei petugas ke antrean yang sama, kebijakan retensi dan pembersihan draf, perlindungan spam lanjutan, serta notifikasi. Batas awal tiga draf per menit dan 20 per hari sudah diterapkan per akun.

Penerusan ke layanan pemerintah masih memerlukan akses integrasi dan kesepakatan dengan pengelola layanan. Penetapan nama instansi koordinasi di antrean tidak berarti laporan dikirim ke WargaKu atau Jalan Kita. Antrean laporan baru dipisahkan dari 659 titik eksperimen agar data lapangan tidak dianggap sudah dianalisis oleh notebook.

## Tahap saat ini: informasi kewenangan ruas

Menelusuri sumber resmi untuk 15 nama ruas pada notebook, menampilkan status rujukan, batas segmen, kualitas bukti, sumber, dan tanggal pemeriksaan. Pencocokan awal menggunakan ID ruas proyek. Koordinat simulasi tidak dipakai sebagai bukti kewenangan lokasi.

Tahap berikutnya membutuhkan lampiran SK status jalan terbaru beserta geometri ruas dan batas awal/akhir. Setelah lokasi laporan lapangan tersedia, lakukan pencocokan spasial dengan toleransi jarak dan pemeriksaan manual pada simpang, frontage, batas kota, serta ruas yang memiliki beberapa kewenangan.
