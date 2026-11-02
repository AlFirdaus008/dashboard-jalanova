export const PROJECT_HEADLINE_PARTS = ['Lebih cepat dengar aduan,', 'lebih akurat tentukan perbaikan.'];
export const PROJECT_HEADLINE = PROJECT_HEADLINE_PARTS.join(' ');

export const PROJECT_FOCUS = [
  {
    id: 'authority', number: '01', title: 'Mengetahui siapa yang menangani jalan', phase: 'Status 15 ruas tersedia',
    problem: 'Jalan di Surabaya bisa menjadi tanggung jawab pemerintah pusat, provinsi, atau kota. Warga perlu tahu ke mana laporan harus disampaikan.',
    direction: 'Tampilkan status jalan dan pengelolanya agar laporan sampai ke pihak yang sesuai.',
    current: 'Halaman Kewenangan jalan menampilkan status Nasional, Provinsi, atau Kota, beserta pengelola dan sumber untuk 15 ruas.',
    next: 'Cocokkan titik laporan warga dengan batas ruas yang tepat. Laporan sudah masuk ke antrean petugas Jalanova; pengiriman ke layanan pemerintah lain masih memerlukan kerja sama pengelola layanan.',
    reference: { title: 'Layanan pengaduan dan pembagian kanal di Surabaya', url: 'https://ppid.surabaya.go.id/layanan-pengaduan-masyarakat' },
  },
  {
    id: 'weather', number: '02', title: 'Membaca kerusakan pada foto yang kurang jelas', phase: 'Hasil uji foto tersedia',
    problem: 'Foto gelap, buram, atau tertutup genangan dapat membuat kerusakan sulit dikenali.',
    direction: 'Perbaiki kualitas foto sebelum deteksi, lalu periksa apakah hasilnya lebih akurat.',
    current: 'Halaman Hasil evaluasi memperlihatkan hasil uji pada foto yang dibuat gelap, buram, dan mengalami perubahan kualitas lain.',
    next: 'Kumpulkan foto lapangan saat hujan, malam, dan di bawah bayangan. Bandingkan hasil deteksi sebelum dan sesudah perbaikan foto. Pengujian sintetis saat ini belum menggantikan uji lapangan tersebut.',
    reference: { title: 'Lihat pengujian kualitas citra di proyek ini', url: '#/evaluation' },
  },
  {
    id: 'dimensions', number: '03', title: 'Memperkirakan ukuran untuk merencanakan perbaikan', phase: 'Panjang, lebar, dan luas tersedia',
    problem: 'Petugas perlu ukuran kerusakan untuk memperkirakan kebutuhan pekerjaan dan material.',
    direction: 'Lengkapi panjang dan lebar dengan kedalaman agar volume lubang dapat diperkirakan.',
    current: 'Detail titik menampilkan perkiraan panjang, lebar, dan luas, beserta sumber dimensinya. Kedalaman lubang belum tersedia.',
    next: 'Tambahkan pengukuran kedalaman dari foto atau LiDAR pada perangkat yang mendukung. Bandingkan hasilnya dengan ukuran di lapangan sebelum dipakai menghitung material.',
    reference: { title: 'Dasar estimasi kedalaman dari satu gambar', url: 'https://huggingface.co/docs/transformers/tasks/monocular_depth_estimation' },
  },
];

export const DEVELOPMENT_REFERENCES = [
  { title: 'Kanal pengaduan Pemerintah Kota Surabaya', desc: 'Akses WargaKu dan kanal untuk laporan di luar kewenangan pemerintah kota.', url: 'https://ppid.surabaya.go.id/layanan-pengaduan-masyarakat', label: 'PPID Surabaya' },
  { title: 'Perkiraan kedalaman dari satu foto', desc: 'Dokumentasi untuk mempelajari cara memperkirakan kedalaman dari gambar.', url: 'https://huggingface.co/docs/transformers/tasks/monocular_depth_estimation', label: 'Hugging Face Transformers' },
  { title: 'Pengukuran kedalaman dengan LiDAR', desc: 'Panduan mengambil data kedalaman pada perangkat Apple yang memiliki sensor LiDAR.', url: 'https://developer.apple.com/documentation/avfoundation/capturing-depth-using-the-lidar-camera', label: 'Apple Developer' },
];
