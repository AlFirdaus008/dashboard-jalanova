export const DATA_SOURCES = [
  { id:'rdd', name:'RDD2022', scope:'3.745 citra dari 3 kelompok asal data', role:'2.993 citra latih, 387 validasi, dan 365 uji' },
  { id:'bpid', name:'BPID', scope:'161 citra beranotasi', role:'Penyesuaian model pada data lain; 24 citra uji' },
  { id:'reports', name:'Pengaduan', scope:'850 laporan pada 15 ruas', role:'Menggabungkan laporan terkait dan memperkirakan tingkat kerusakan' },
  { id:'traffic', name:'Lalu lintas', scope:'720 baris profil', role:'24 jam × 2 tipe hari × 15 ruas, untuk membandingkan waktu kerja' },
  { id:'cost', name:'AHSP & riwayat pekerjaan', scope:'8 item harga dan 40 riwayat', role:'Menghitung estimasi biaya dan lama pekerjaan' },
  { id:'roads', name:'Jaringan OpenStreetMap', scope:'4.748 segmen hasil ekspor', role:'Membentuk lokasi simulasi dan menampilkan jaringan jalan' },
];

export const PIPELINE_STEPS = [
  {
    id:'detection', number:'01', title:'Mendeteksi kerusakan pada foto',
    description:'Model mencari bagian jalan yang rusak dan memberi kotak penanda. Gambar berikut memperlihatkan data contoh, pelatihan, dan hasil pengujiannya.',
    method:'YOLO11s dilatih pada empat kelas kerusakan, lalu disesuaikan dengan data BPID. Ambang confidence model akhir adalah 0,25. Hasilnya berupa kotak deteksi.',
    note:'Foto berasal dari dataset RDD2022 dan BPID, bukan dokumentasi titik aduan di Surabaya. Gambar perbandingan BPID dibuat sebelum ambang akhir ditetapkan.',
    figures:[
      { file:'sampel_citra_beranotasi.png', cell:21, title:'Contoh foto dan anotasi', caption:'Enam foto contoh dengan penanda jenis kerusakan dari dataset.' },
      { file:'sebaran_kondisi_kamera.png', cell:21, title:'Kondisi foto dalam dataset', caption:'Sebaran pencahayaan dan ketajaman pada setiap kelompok asal foto.' },
      { file:'contoh_degradasi_kamera.png', cell:25, title:'Contoh perubahan kualitas foto', caption:'Satu foto yang dibuat gelap, buram, dan mengalami perubahan kualitas lain untuk pengujian sintetis.' },
      { file:'kurva_pelatihan.png', cell:31, title:'Perkembangan pelatihan model', caption:'Perubahan kesalahan deteksi dan ketepatan model selama pelatihan awal pada RDD2022.' },
      { file:'f1_per_kelompok.png', cell:46, title:'Hasil deteksi menurut kondisi foto', caption:'Skor F1 model akhir menurut asal data, pencahayaan, dan ketajaman foto.' },
      { file:'ketahanan_degradasi.png', cell:46, title:'Hasil uji kualitas foto', caption:'Perbandingan ketepatan deteksi pada foto asli dan foto yang kualitasnya diubah.' },
      { file:'bpid_sebelum_sesudah.png', cell:44, title:'Sebelum dan sesudah penyesuaian BPID', caption:'Hijau menunjukkan anotasi referensi, merah menunjukkan prediksi. Ambang pada gambar ini berbeda dari ambang akhir 0,25.' },
    ],
  },
  {
    id:'deduplication', number:'02', title:'Menggabungkan aduan tentang kejadian yang sama',
    description:'Isi laporan, nama ruas, jarak, dan waktu laporan dibandingkan agar satu kerusakan tidak dihitung berkali-kali.',
    method:'Konfigurasi terpilih memakai radius 25 meter, kemiripan teks 0,6, dan selang waktu 168 jam. Hasilnya 659 titik dari 850 laporan.',
    note:'Koordinat dalam eksperimen dibentuk kembali pada jaringan OpenStreetMap. Peta ini belum menunjukkan koordinat asli setiap laporan.',
    figures:[
      { file:'kosakata_pengaduan.png', cell:53, title:'Kata yang muncul dalam aduan', caption:'Gambaran isi laporan melalui sebaran kata dan kata yang paling sering muncul.' },
      { file:'confusion_duplikat.png', cell:59, title:'Hasil pemeriksaan laporan ganda', caption:'Perbandingan label laporan unik atau ganda dengan hasil prediksi pada paruh akhir data.' },
      { file:'sebaran_geospasial.png', cell:61, title:'Sebaran titik pada peta simulasi', caption:'Titik laporan ditempatkan pada jaringan jalan Surabaya untuk kebutuhan eksperimen.' },
    ],
  },
  {
    id:'dimensions', number:'03', title:'Memperkirakan ukuran dan tingkat kerusakan',
    description:'Kotak deteksi dipakai untuk memperkirakan panjang, lebar, dan luas. Informasi foto dan isi aduan membantu menentukan tingkat kerusakan.',
    method:'Perkiraan ukuran memakai asumsi kamera dengan 200 sampel Monte Carlo. Prediksi tingkat kerusakan menggabungkan jenis kerusakan, urgensi, informasi teks, dan fitur visual.',
    note:'Foto contoh dipasangkan menurut kelas kerusakan. Sebanyak 383 dari 659 titik memakai ukuran imputasi. Kedalaman lubang belum diukur.',
    figures:[
      { file:'overlay_dimensi.png', cell:69, title:'Contoh perkiraan luas pada foto', caption:'Kotak prediksi dan rentang perkiraan luas ditampilkan pada contoh foto dataset.' },
      { file:'distribusi_luas.png', cell:69, title:'Sebaran perkiraan luas', caption:'Luas hasil deteksi untuk kelas lubang dan retak buaya, ditampilkan pada skala logaritmik.' },
      { file:'confusion_keparahan.png', cell:73, title:'Hasil prediksi tingkat kerusakan', caption:'Perbandingan tingkat kerusakan referensi dan prediksi uji silang berkelompok, dirata-ratakan dari 10 ulangan.' },
    ],
  },
  {
    id:'cost', number:'04', title:'Memilih penanganan dan memperkirakan biaya',
    description:'Jenis dan tingkat kerusakan menentukan usulan perbaikan. Ukuran pekerjaan dan komponen harga menjadi dasar perhitungan biaya.',
    method:'Aturan proyek memilih tambal, lapis ulang, rekonstruksi, atau segel retak. Perhitungan menghasilkan biaya P10, median (P50), dan P90.',
    note:'Grafik notebook menjumlahkan sampel biaya per ruas sebelum menghitung persentil. Jumlah median titik pada filter dashboard adalah statistik yang berbeda.',
    figures:[{ file:'komposisi_dan_rab_per_ruas.png', cell:80, title:'Komponen biaya dan estimasi per ruas', caption:'Proporsi komponen biaya serta median dan rentang P10–P90 per ruas dari simulasi notebook.' }],
  },
  {
    id:'priority', number:'05', title:'Menyusun urutan prioritas perbaikan',
    description:'Setiap titik mendapat skor 0–100 dari lima pertimbangan. Skor yang lebih tinggi menunjukkan kebutuhan penanganan yang lebih dahulu.',
    method:'Kriterianya adalah tingkat kerusakan, lalu lintas, fungsi jalan, skala kerusakan, dan jumlah aduan. Bobot menggabungkan AHP 70% dan entropi 30%.',
    note:'Kategori penanganan mengikuti pembagian skor pada data eksperimen. Urutan ini menjadi bahan peninjauan petugas, bukan keputusan pelaksanaan otomatis.',
    figures:[
      { file:'pembobotan_dan_prioritas.png', cell:86, title:'Bobot, kestabilan, dan titik prioritas', caption:'Perbandingan bobot kriteria, perubahan peringkat saat bobot diuji, dan titik dengan skor tertinggi.' },
      { file:'sebaran_skor_prioritas.png', cell:84, title:'Sebaran skor seluruh titik', caption:'Jumlah titik pada setiap rentang skor prioritas 0–100.' },
    ],
  },
  {
    id:'schedule', number:'06', title:'Membandingkan waktu pelaksanaan',
    description:'Beberapa pilihan jam kerja dibandingkan untuk mencari waktu yang mengurangi gangguan lalu lintas.',
    method:'Simulasi mempertimbangkan antrean kendaraan, penurunan kapasitas zona kerja, jam malam, dan panas siang. Rekomendasi dibuat per ruas untuk hari kerja dan akhir pekan.',
    note:'Hasilnya adalah rekomendasi jam kerja, belum berupa tanggal pelaksanaan. Jumlah kru, cuaca, dan benturan antarpekerjaan belum dimodelkan.',
    figures:[
      { file:'evaluasi_penjadwalan.png', cell:94, title:'Perbandingan pilihan jadwal', caption:'Tundaan simulasi beberapa strategi pada hari kerja, disertai contoh profil lalu lintas dan kapasitas zona kerja.' },
      { file:'matriks_kelayakan_jadwal.png', cell:96, title:'Pilihan jam mulai pada setiap ruas', caption:'Skor kelayakan jam mulai 0–100 untuk hari kerja. Nilai lebih tinggi berarti lebih sesuai menurut model.' },
    ],
  },
];

export const NOTEBOOK_REFERENCES = [
  { id:'rdd', title:'RDD2022', desc:'Asal dataset citra kerusakan jalan. Notebook memakai subset India, China_MotorBike, dan Czech.', url:'https://github.com/sekilab/RoadDamageDetector', publisher:'Repositori pengembang RoadDamageDetector', group:'data' },
  { id:'kaggle', title:'RDD2022 dalam format YOLO', desc:'Salinan dataset yang diunduh notebook untuk menyiapkan pelatihan.', url:'https://www.kaggle.com/datasets/sreekaraditya/rdd2022-yolo-crackscan-v2', publisher:'Kaggle', group:'data' },
  { id:'bpid', title:'Bandung Pothole Image Dataset (BPID)', desc:'Foto lubang untuk menguji dan menyesuaikan model pada kelompok data lain.', url:'https://data.mendeley.com/datasets/rgymy6dwdd/1', publisher:'Mendeley Data', group:'data' },
  { id:'osm', title:'OpenStreetMap', desc:'Jaringan jalan untuk peta dan pembentukan koordinat simulasi.', url:'https://www.openstreetmap.org/copyright', publisher:'OpenStreetMap, sumber data dan atribusi', group:'data' },
  { id:'yolo', title:'Ultralytics YOLO11', desc:'Dokumentasi model pendeteksi kerusakan pada foto.', url:'https://docs.ultralytics.com/models/yolo11/', publisher:'Ultralytics', group:'models' },
  { id:'text', title:'Model teks multilingual MiniLM', desc:'Model untuk mengubah isi laporan menjadi representasi teks yang bisa dibandingkan.', url:'https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', publisher:'Keterangan model Sentence Transformers', group:'models' },
];
