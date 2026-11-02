**Pemeriksaan Jalanova, termasuk tema dan penyuntingan narasi**

Build produksi Vite berhasil. Output berada di `dist/`: 14 berkas, sekitar 15,73 MB termasuk data, jaringan OSM, inisialisasi tema, dan lima gambar proyek. Model `.pt` dan `.joblib` tidak disertakan sebagai aset web.

Seluruh 13 pengujian Node lulus. Tujuh pengujian data:

1. Jumlah titik, relasi laporan, koordinat, dan urutan rentang biaya.
2. Gabungan filter dan pencarian tanpa mengubah skor tersimpan.
3. Agregasi per ruas serta pemisahan median total Monte Carlo dari jumlah median titik.
4. Hubungan setiap ruas dengan dua jadwal dan pemetaan nama dari notebook.
5. Reproduksi pengurangan tundaan 89,8% dan penandaan jadwal lintas tengah malam.
6. Ekspor dan pembacaan CSV, termasuk BOM, koma, tanda kutip, baris baru, dan hasil kosong.
7. Validitas koordinat 4.748 segmen jaringan jalan lokal.

Enam pengujian tema:

1. Default mengikuti perangkat; Terang/Gelap tetap mengikuti pilihan eksplisit.
2. Preferensi tersimpan dan diterapkan kembali, termasuk atribut color-scheme dan warna browser.
3. Perubahan tema perangkat berlaku langsung dalam Default; listener dibersihkan saat controller dilepas.
4. Pemilihan tema tetap bekerja ketika localStorage diblokir.
5. Sinkronisasi pilihan antar-tab dan pengembalian ke Default saat preferensi dihapus.
6. Script sebelum paint memberikan hasil yang sama dengan controller pada seluruh kombinasi preferensi/perangkat. Pemeriksaan ini memakai VM Node, bukan screenshot browser.

Label `SURABAYA, JAWA TIMUR / INOVBOYP 2.0` di atas judul telah dihapus dari komponen pembuka. Pilihan tema ada di kedua header; peta dasar memakai CARTO light_all/dark_all sesuai tema. Narasi pembuka, latar belakang, tujuan, alur, dan judul halaman analisis sudah disunting tanpa mengubah nilai hasil eksperimen.

Pada pemeriksaan versi pertama, server pengembangan berhasil berjalan pada loopback. Pemeriksaan HTTP untuk `/`, `/src/main.jsx`, dan `/data/project.json` mengembalikan status 200.

Pemeriksaan visual dan interaksi browser belum terverifikasi. Browser access host tidak tersedia; percobaan membuka browser native tidak memperoleh akses sebelum timeout. Tidak ada screenshot atau klaim bahwa seluruh tata letak telah diperiksa secara visual. CSS menyediakan breakpoint untuk desktop, tablet, dan ponsel serta pengaturan reduced motion.

Penerbitan belum dilakukan. Persetujuan otomatis menolak perintah sinkronisasi source ke Sites karena izin pengunggahan source/aset dan publikasi ke tujuan eksternal belum diberikan pengguna. Identitas Site yang telah dibuat dipertahankan dalam manifest agar dapat digunakan kembali setelah izin eksplisit.

Notebook asli tidak berubah. SHA256: `C2DDCA466BD41618A86B6A69F9C821FE695C0F3F640C03A76B7C112114F602AD`.

Pembaruan kewenangan, 1 November 2026:

- `npm.cmd test`: 19 pengujian lulus, termasuk enam pengujian tambahan untuk cakupan 15 ruas, ketidakpastian segmen, sumber resmi, filter gabungan, agregasi biaya, dan jejak rujukan pada CSV.
- Pemeriksaan render server React berhasil: 15 baris ruas dapat dirender, bukti nasional tertaut, Perak Timur tetap belum dipastikan, panel detail menggunakan disclosure, dan filter kosong memiliki pesan yang sesuai. Pemeriksaan ini tidak menguji klik atau tata letak di browser.
- Build produksi Vite berhasil. Aset notebook dan logo tidak diedit.
- Sumber nasional Kepmen 1688/2022 halaman PDF 63–64 dan RTRW 2025 halaman PDF 27–28, 254–255 diperiksa melalui teks dan raster. Tabel Lampiran V halaman 204–209 ditelusuri dari PDF resmi. Status kota pada registry adalah interpretasi rencana, bukan klaim telah membaca lampiran SK kota terbaru.
- Semua titik mempertahankan `spatiallyVerified: false`. Peta warna kewenangan menampilkan rujukan per nama ruas, tanpa mengklaim batas spasial resmi.
- Browser QA tetap belum terverifikasi karena akses browser tidak tersedia pada lingkungan yang digunakan. Tidak ada publikasi atau penerusan laporan ke layanan pemerintah pada pembaruan ini.


Revisi klasifikasi tiga status, 1 November 2026 (menggantikan klasifikasi sementara pada catatan sebelumnya):

- Semua 15 ruas dikelompokkan Nasional (3), Provinsi (1), atau Kota (11). Ahmad Yani, Kenjeran, dan Perak Timur masuk Nasional; Mastrip masuk Provinsi.
- Filter menyediakan Semua status jalan, Nasional, Provinsi, dan Kota. Kategori sementara dan label indikasi dihapus dari ringkasan, filter, badge, legenda, dan CSV.
- Sumber tambahan Perak Timur diverifikasi langsung pada RKPD 2024, Tabel II.182 halaman PDF 250, baris 39; teks dan raster sesuai.
- Enam pengujian kewenangan diperbarui untuk memeriksa tiga kategori, semua opsi filter, pembagian 659 titik dan biaya, sumber, serta CSV. Seluruh 19 pengujian lulus.
- Catatan segmen dan spatiallyVerified: false dipertahankan terpisah dari kategori status. Notebook dan aset logo tidak diedit.

Penyederhanaan header dan penonaktifan tema, 2 November 2026:

- Header dashboard menampilkan satu baris lokasi “Surabaya, Jawa Timur, Indonesia” di kiri; sisi kanan kosong. Breadcrumb Ruang analisis, ikon pemisah, serta badge Data eksperimen di header dihapus. Tombol menu ponsel dipertahankan.
- Pemilih tema dilepas dari halaman pembuka dan dashboard. Provider dan script sebelum paint mengunci mode terang, termasuk ketika browser menyimpan tema gelap atau perangkat memakai dark mode. Preferensi lama tidak dihapus; controller yang mendukung pilihan tema tetap tersedia untuk pengembangan berikutnya.
- `npm.cmd test`: 20 pengujian lulus. Pemeriksaan tema tambahan membuktikan bahwa mode terang tetap berlaku setelah perubahan tema perangkat, event penyimpanan antar-tab, dan permintaan perubahan tema; bootstrap diuji pada seluruh kombinasi preferensi/perangkat.
- `npm.cmd run build`: berhasil. Pemeriksaan visual browser belum dilakukan pada revisi ini.

Navigasi buka/tutup dan transisi halaman, 2 November 2026:

- Sidebar menggunakan animasi geser 300 ms pada desktop dan ponsel. Margin konten desktop berubah mengikuti keadaan sidebar; panel ponsel menggunakan scrim yang memudar. Blok SBY/Surabaya di atas menu dihapus.
- Tombol header tersedia di semua ukuran layar, dengan aria-expanded dan aria-controls. Panel tertutup menggunakan inert serta aria-hidden. Menu ponsel mengunci scroll halaman, menahan fokus keyboard dalam panel, dan memulihkan fokus serta scroll saat ditutup atau breakpoint berubah.
- Lokasi header sekarang rata kanan. Mode terang tetap dikunci.
- Perpindahan halaman menggunakan View Transitions dan flushSync pada callback browser, dengan fallback CSS dan dukungan reduced motion. Pengujian tambahan memeriksa urutan snapshot/commit, navigasi cepat, fallback, dan pembatalan saat teardown.
- Seluruh 24 pengujian lulus; build produksi berhasil. Modul main, header, dan stylesheet navigasi pada server lokal mengembalikan HTTP 200.
- Percobaan pemeriksaan browser mengembalikan “The browser access host is unavailable”; inventaris aplikasi native juga tidak tersedia karena native pipe tidak ditemukan. Animasi dan tata letak belum dapat diverifikasi secara visual pada revisi ini.

Revisi penempatan tombol navigasi, 2 November 2026:

- Hanya satu tombol buka/tutup, berada di bawah logo dan di atas menu. Tombol X pada sidebar dan tombol di header dihapus. Header hanya menampilkan lokasi rata kanan.
- Sidebar tertutup menyisakan kolom logo dan tombol. Area menu menggunakan inert dan aria-hidden ketika ditutup, sementara tombol tetap dapat digunakan. Animasi lebar sidebar dan margin konten mempertahankan transisi 300 ms.
- Seluruh 24 pengujian lulus. Pemeriksaan source memastikan hanya satu elemen navigation-toggle; build produksi berhasil. Batas pemeriksaan visual browser tetap berlaku.

Detail titik, aduan dan penjelasan penanganan, 2 November 2026:

- Hover dibatasi menjadi nama jalan dan skor/100. Kalimat waktu kerja berubah menjadi “Perbaikan jalan disarankan dilakukan pada jam tersebut.” Notice panjang di akhir panel detail dihapus sesuai permintaan.
- Panel foto hanya menggunakan foto yang terhubung ke ID aduan. Data tambahan saat ini kosong sesuai persetujuan pemilik proyek; seluruh data asli yang belum tersedia ditandai. Koordinat simulasi tidak dijadikan koordinat laporan asli dan contoh dataset tidak dijadikan foto lokasi.
- Detail laporan dan penjelasan penanganan memakai dialog dengan pemulihan fokus, Tab trap, penutupan Escape, serta penanganan dialog bertumpuk pada halaman prioritas.
- Penjelasan metode mereproduksi cell 76 notebook untuk seluruh 659 titik. Langkah kerja serta sumber pedoman dibedakan dari aturan pemilihan metode dan asumsi biaya.
- `npm.cmd test`: 30 pengujian lulus, termasuk enam pengujian tambahan untuk data kosong, penggabungan per ID, validasi media/koordinat, tooltip, pemetaan 15 kombinasi aturan dan ketidaksesuaian metode.
- Build Vite berhasil. Pemeriksaan render server React untuk panel, detail laporan dan enam langkah kerja lulus; modul serta sumber data tambahan pada server lokal mengembalikan HTTP 200.
- Pemeriksaan ini belum memverifikasi interaksi dan tata letak di browser; akses browser tidak tersedia pada percobaan sesi sebelumnya.

Ringkasan kebijakan dan petunjuk arah, 2 November 2026:

- Ringkasan rekomendasi memprioritaskan unit koordinator, tindakan berdasarkan triase, metode, estimasi biaya, waktu, serta tiga langkah tindak lanjut. Penjelasan teknis dan enam langkah lapangan berada pada bagian yang dapat dibuka.
- Tautan Google Maps tersedia pada dialog rekomendasi dan panel titik. Koordinat aduan induk diprioritaskan, diikuti aduan terkait; fallback titik simulasi diberi label eksplisit. Tidak ada tautan jika koordinat tidak valid, tidak ada tebakan titik keberangkatan, dan tidak ada pengambilan GPS oleh dashboard.
- Seluruh 34 pengujian lulus, termasuk empat tambahan untuk format tujuan, penggabungan lokasi per ID, fallback simulasi/data kosong, serta ringkasan koordinator/tindakan/jadwal. Skor dan biaya sumber tidak diubah.
- Render server React memeriksa ringkasan, tautan arah, tiga tindakan kebijakan, dan enam langkah teknis. Pemeriksaan visual/interaksi browser tetap belum tersedia.

Header bersama dan penyederhanaan navbar, 2 November 2026:

- Tombol buka/tutup sidebar hanya menampilkan ikon. Panah kanan pada halaman aktif serta tautan bawah sidebar dihapus; ikon di kiri menu dipertahankan.
- Header yang sama digunakan pada halaman pengenalan dan analisis. Logo, tiga tautan proyek, tombol Dashboard serta lokasi tetap tersedia; sidebar analisis berada di bawah header. Breakpoint header dan tinggi sidebar menggunakan variabel yang sama agar tidak bertumpuk.
- Data eksperimen memiliki tooltip konteks pada hover/fokus/ketukan. Tooltip dirender melalui portal agar tidak terpotong sidebar dan dapat ditutup melalui blur, klik luar, scroll, resize atau Escape.
- Document Analysis Jalanova menggantikan subteks lama. Konfigurasi URL GitHub tetap null sampai pemilik memberikan tautan; tidak ada URL contoh atau navigasi palsu.
- Seluruh 34 pengujian lulus. Render server memeriksa tautan header dan logo pada enam rute serta label dokumentasi tanpa tautan palsu. Modul/stylesheet baru pada server lokal mengembalikan HTTP 200. Batas pemeriksaan visual browser tetap berlaku.

Identitas kompetisi dan sidebar ringkas, 2 November 2026:

- Bagian khusus di bawah pembuka menampilkan logo Pemkot Surabaya, BRIDA Surabaya, dan maskot INOVBOYO, beserta narasi keikutsertaan dan tautan informasi resmi BRIDA. Ejaan kompetisi pada tampilan menggunakan INOVBOYO 2.0. Tidak ada klaim dukungan resmi atau hasil kompetisi.
- Sidebar yang diperluas menampilkan ikon dan nama halaman; sidebar ringkas tetap menyediakan delapan tautan halaman sebagai ikon. Satu tombol ikon mengubah kedua keadaan dengan animasi. Warna antarmuka tetap menggunakan variabel palet yang sudah ada.
- Logo SVG tidak diedit. Pemeriksaan byte memastikan ketiga aset di `public/` sama dengan salinan pada build `dist/`.
- Seluruh 34 pengujian lulus dan build produksi berhasil. Vite memberi peringatan ukuran satu chunk JavaScript sedikit di atas 500 kB; ini tidak menggagalkan build.
- Render server React memeriksa delapan tautan pada kedua keadaan sidebar, satu tombol ikon, penanda halaman aktif, tiga logo, tautan kompetisi, serta header bersama pada enam rute. Modul sidebar dan tiga aset logo pada server lokal mengembalikan HTTP 200.
- Pratinjau aset logo diperiksa, tetapi tata letak dan interaksi web belum dapat diverifikasi secara visual karena akses browser tidak tersedia. Tidak ada penerbitan pada revisi ini.

Penyederhanaan menu dan laporan per titik, 2 November 2026:

- Sidebar kini berisi lima halaman analisis. Evaluasi model, Data & metode, dan Tentang proyek dihapus dari sidebar; header tetap menyediakan akses ke ketiganya dan tombol Dashboard langsung menuju peta utama. Render server memeriksa kedua keadaan sidebar serta header pada enam rute.
- Scrollbar sidebar disembunyikan untuk Firefox dan browser berbasis WebKit/Blink, dengan overflow-y tetap auto. Koordinat tujuan dipindahkan ke dalam blok teks nama jalan; render server memeriksa struktur tersebut.
- Tombol cetak membuka laporan gabungan satu titik dengan seluruh aduan terkait, kedua jadwal ruas, kewenangan dan sumber, estimasi dimensi/biaya, langkah kebijakan/teknis, serta semua foto lampiran yang tersedia. Informasi kosong tetap ditandai. Print CSS A4 mengisolasi portal laporan dari aplikasi, melepas batas tinggi/overflow dialog, serta memberi pemisah halaman antaraduan.
- Print menggunakan dialog browser, tanpa backend atau dependensi PDF tambahan. Logo, font, dan foto dimuat sebelum permintaan cetak; teks tujuan cetak menjelaskan cara menyimpan sebagai PDF.
- Seluruh 37 pengujian lulus. Tiga pengujian tambahan mencakup relasi seluruh 659 titik dengan aduan/jadwal, pencegahan pengambilan data lokasi lain, data kosong, dan retensi semua lampiran. Pemeriksaan render server tambahan memeriksa isi laporan, HTML escaping, koordinat asli/simulasi, serta struktur dan aturan CSS cetak.
- Build produksi berhasil, dengan peringatan ukuran chunk JavaScript di atas 500 kB. Modul laporan, stylesheet cetak, dan sidebar pada server lokal mengembalikan HTTP 200.
- Tata letak halaman cetak, pagination PDF, interaksi klik, dan dialog cetak native belum dapat diverifikasi lewat browser karena akses browser sesi ini tidak tersedia. Tidak ada PDF final yang dibuat atau diterbitkan pada revisi ini.

Data dan metode, output notebook, serta cuplikan fitur, 2 November 2026:

- Batas lebar 1.100 px pada konten metodologi diganti menjadi seluruh area konten. Tabel memakai lebar 100%, pembagian kolom tetap, header baris/kolom semantik, dan pembungkusan teks. Pada layar sempit, tabel dapat digulir mendatar.
- Enam tahap analisis memakai panel details/summary. Galeri baru dirender ketika tahap dibuka, dengan tombol perbesar melalui dialog dan unduh gambar. Seluruh 18 PNG utama dari direktori visualizations terpetakan satu kali ke tahap yang sesuai. Sel pembuat gambar dicocokkan dengan source notebook; gambar F1 serta ketahanan menggunakan hasil final sel 46. Perbedaan ambang pada contoh BPID dan median biaya per ruas tetap dijelaskan.
- Pemeriksaan byte memastikan seluruh PNG di public/figures sama dengan output asli dan hasil build dist/figures. Script prepare:figures dan prepare:data menggunakan manifest yang sama. Model terlatih tidak disalin sebagai aset web.
- Tiga cuplikan fitur dirender sebagai komponen antarmuka dengan data yang sama, bukan screenshot browser: kewenangan ruas, pengujian kualitas foto, dan dimensi titik hasil deteksi. Grafik dan dimensi dibagikan dengan halaman evaluasi serta detail titik. Narasi disunting memakai prinsip no-ai-slop; status fitur dan rencana berikutnya dibedakan.
- Referensi disusun menjadi empat kelompok berisi 15 tautan eksternal yang sudah digunakan proyek. Dokumen kewenangan memakai registry yang sama, dengan tautan ke catatan per ruas. CSV yang asal pengumpulannya belum diketahui tetap dijelaskan terpisah.
- Seluruh 37 pengujian lulus. Pemeriksaan render server mencakup empat tab, tabel, enam panel galeri, pemetaan 18 gambar ke source notebook, ketiga cuplikan, dan kelompok referensi. Pemeriksaan laporan cetak tetap lulus setelah komponen dimensi dibagikan.
- Build produksi berhasil, dengan peringatan chunk JavaScript di atas 500 kB. Modul metodologi dan contoh gambar baru pada server lokal mengembalikan HTTP 200. Notebook asli mempertahankan SHA256 yang dicatat sebelumnya.
- Contact sheet 18 gambar sumber diperiksa. Akses browser mengembalikan daftar aplikasi/browser kosong, native pipe tidak tersedia, dan browser access host tidak tersedia; tata letak akhir, klik tab, buka/tutup panel, serta perbesar gambar belum diverifikasi di browser. Tidak ada publikasi pada revisi ini.

Halaman publik, dua jenis akun, dan Supabase, 2 November 2026:

- Data & metode serta Hasil evaluasi dibuka tanpa sidebar secara default. Tautan dari dashboard membawa konteks from=dashboard; kembali ke Tentang proyek menghapus konteks tersebut. Pratinjau hanya mencakup data eksperimen yang sudah menjadi aset publik dan tidak memberi akses antrean warga.
- Halaman masyarakat mencakup pendaftaran/login, konfirmasi email, pemulihan kata sandi, foto, pilihan titik/GPS/manual, persetujuan data, pengiriman, nomor laporan, daftar milik sendiri, dan riwayat status. Halaman petugas mencakup antrean berpaginasi, filter, foto privat, petunjuk arah, verifikasi ruas, prioritas manual, instansi koordinasi, riwayat, dan ekspor halaman tanpa kontak atau URL foto.
- Supabase telah dikonfigurasi pada proyek pemilik: empat tabel menggunakan RLS, 15 rujukan ruas, tiga RPC pengiriman/peninjauan, trigger profil, serta bucket foto privat dengan batas MIME dan ukuran 5 MB. Kredensial PostgreSQL hanya diproses melalui stdin tersembunyi. TLS memakai CA resmi dari sumber unduhan yang digunakan Supabase Studio dan tetap memverifikasi hostname.
- Pemeriksaan layanan live: referensi ruas merespons HTTP 200, pembacaan profil serta laporan tanpa login ditolak HTTP 401. Database mengonfirmasi RLS aktif pada keempat tabel serta bucket privat. Endpoint Auth mengonfirmasi pendaftaran email aktif dengan konfirmasi email wajib.
- Akun usergovernance dibuat atas permintaan pemilik sebagai akun demo, menggunakan domain internal .invalid tanpa mengirim email ke alamat contoh. Login dan pembacaan profilnya berhasil melalui Supabase Auth. Flag is_demo membatasi akses meskipun role stakeholder: tidak dapat membaca laporan warga asli, mengirim laporan, atau menjalankan tindak lanjut. Sesi pengujian ditutup setelah pemeriksaan.
- Seluruh 48 pengujian lulus. Pengujian PostgreSQL tersemat memakai skema tiruan Auth/Storage untuk menjalankan migrasi dan menguji penolakan eskalasi peran, anon, akses antarwarga, draf tanpa foto, unggahan orang lain, perubahan foto terkirim, alur status/catatan, konflik pembaruan, idempotensi, dan pembatasan demo.
- Pemeriksaan render server tambahan memverifikasi layout informasi publik tanpa sidebar, tautan header berkonteks, kolom login username, formulir warga, dan pembatasan tampilan demo. Modul baru pada server lokal merespons HTTP 200 dan Project URL telah terinjeksi oleh Vite.
- Build produksi berhasil. Chunk JavaScript utama masih di atas 500 kB dan menghasilkan peringatan Vite. Notebook, angka eksperimen, dan aset logo tidak diubah.
- Browser/native pipe tetap tidak tersedia. Signup email nyata, pengiriman foto melalui browser, reset kata sandi, dan interaksi visual belum diverifikasi ujung ke ujung. Pengaturan Site URL/Redirect URLs masih harus diselesaikan pemilik melalui dashboard pengelolaan Supabase sesuai SUPABASE_SETUP.md. Tidak ada pengiriman ke layanan pemerintah atau publikasi website pada revisi ini.

Dashboard warga dan pintu masuk dua peran, 2 November 2026:

- Halaman `#/warga` menampilkan ringkasan laporan milik akun, tombol foto/lapor, kabar terbaru dari riwayat status, dan daftar laporan dengan dialog foto serta catatan petugas. Pemeriksaan pembaruan berjalan setiap 30 detik dan saat tab aktif kembali; status Selesai ditampilkan sebagai kabar di aplikasi, tanpa mengklaim email terkirim.
- Halaman masuk menampilkan dua panel Masyarakat dan Petugas dan instansi. Panel yang dipilih melebar dengan transisi; formulir pada panel yang ditutup dilepas dari DOM agar isian sandi tidak tertinggal. Tombol Dashboard di header mengarah ke pintu masuk untuk pengunjung, dashboard warga untuk akun masyarakat, dan dashboard analisis untuk petugas.
- Dua akun baru `userwarga` dan `usergovernence` dibuat di proyek Supabase pemilik menggunakan input sandi tersembunyi. Login keduanya berhasil melalui Supabase Auth dan profil API mengembalikan peran yang sesuai. Kata sandi tidak ditulis ke repo. Akun `usergovernance` lama tetap terbatas sebagai pratinjau eksperimen.
- Alur petugas yang sudah ada menyimpan status hingga Selesai beserta catatan dalam `report_events`; dashboard warga membaca event milik pelapor melalui RLS. Pengiriman foto dan alur status lengkap antar kedua akun belum diuji lewat browser karena browser/native pipe sesi ini tidak tersedia.
- Build produksi, 48 pengujian, serta render server untuk pintu masuk, rute dashboard per peran, dan dashboard warga lulus. Kredensial bersama hanya untuk demo lokal dan harus diganti sebelum situs diterbitkan.

Pembaruan tampilan halaman awal dan sidebar, 2 November 2026:

- Header tanpa garis pemisah bawah dan navigasi berbentuk pil. Kartu, tombol, formulir, dan panel utama memakai sudut membulat. Sidebar dashboard memakai hijau gelap; item terpilih menyatu secara visual dengan bidang konten terang.
- Pembuka memakai ilustrasi SVG isometrik berisi ruas jalan, kendaraan, taman, pohon, bangunan, dan rute. Teks pada gambar menyatakan bahwa ini ilustrasi, bukan peta lokasi. SVG sumber dirender menjadi PNG statis untuk memeriksa bentuk, warna, dan elemen utama.
- Strip akun/laporan di bawah header dihapus. Kartu masyarakat sekarang memiliki tautan lapor, masuk, dan daftar yang langsung membuka formulir pendaftaran. Kartu petugas mengarah ke jalur masuk dashboard, dengan keterangan bahwa akun petugas diberikan pengelola. Alur role dan aturan Supabase tidak berubah.
- Build produksi dan 48 pengujian lulus. Pemeriksaan render server memverifikasi keberadaan ilustrasi, posisi jalur akun pada halaman awal, tautan pendaftaran langsung, pemisahan halaman Data & metode/Hasil evaluasi dari sidebar, serta menu sidebar pada dua keadaan.
- Browser/native pipe sesi ini belum tersedia, sehingga tata letak dan interaksi pada browser belum dapat diperiksa langsung. Ilustrasi sudah diperiksa dari hasil render SVG, tanpa mengklaim pengujian seluruh halaman di browser.
