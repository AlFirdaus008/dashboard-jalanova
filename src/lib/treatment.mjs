import { damageNames, treatments } from './data.mjs';

const specs = { title:'Spesifikasi Umum Bina Marga 2025', url:'https://binamarga.pu.go.id/uploads/files/2104/Spesifikasi-Umum-2025-untuk-Pekerjaan-Konstruksi-Jalan-dan-Jembatan.pdf' };
const patch = { title:'Pedoman penambalan perkerasan beraspal, SE 40/SE/M/2015', url:'https://binamarga.pu.go.id/index.php/nspk/detail/pedoman-pelaksanaan-pemeliharaan-perkerasan-beraspal-dengan-teknik-penambalan' };
const design = { title:'Manual Desain Perkerasan Jalan 2024', url:'https://binamarga.pu.go.id/uploads/files/2027/03mbm2024-manual-desain-perkerasan-jalan-2024.pdf' };
const routine = { title:'Manual perbaikan standar untuk pemeliharaan rutin jalan', url:'https://binamarga.pu.go.id/uploads/files/2057/no-001-02mbm2011-manual-perbaikan-standar-untuk-pemeliharaan-rutin-jalan.pdf' };
export const treatmentProfiles = {
  tambal: { aim:'Memperbaiki bagian yang rusak secara setempat.', assumption:'Penambalan manual cepat tanggap; volume biaya dihitung berdasarkan luas kerja.', sources:[patch, specs], steps:[
    ['Siapkan bidang tambalan', 'Bersihkan lubang dan material yang lepas, lalu rapikan batas bidang yang akan diperbaiki.'],
    ['Isi dan padatkan', 'Siapkan permukaan dan bahan pengikat sesuai metode, isi campuran tambalan, lalu padatkan.'],
    ['Ratakan sambungan', 'Sesuaikan elevasi tambalan dengan permukaan jalan di sekelilingnya.'],
  ] },
  overlay: { aim:'Memperbaiki lapisan permukaan dan kerataan jalan.', assumption:'Notebook menghitung milling 5 cm, AC-WC 5 cm, dan tack coat. Ketebalan pekerjaan ditentukan melalui pemeriksaan serta desain teknis.', sources:[design, specs], steps:[
    ['Siapkan permukaan', 'Periksa kebutuhan perbaikan setempat, lalu kupas lapisan lama sesuai rencana pekerjaan.'],
    ['Pasang lapisan pengikat', 'Bersihkan permukaan dan aplikasikan tack coat sesuai spesifikasi.'],
    ['Hampar dan padatkan', 'Hampar lapisan aspal, padatkan, lalu periksa kerataan serta sambungannya.'],
  ] },
  rekonstruksi: { aim:'Memperbaiki susunan perkerasan pada area yang memerlukan penanganan lebih menyeluruh.', assumption:'Asumsi biaya notebook: galian 10 cm, agregat A 15 cm, AC-BC 6 cm, AC-WC 4 cm, dan tack coat dua lapis. Susunan aktual mengikuti hasil pemeriksaan dan desain teknis.', sources:[design, specs], steps:[
    ['Buka area perkerasan', 'Bongkar bagian yang ditetapkan dalam desain, lalu periksa kondisi fondasi dan drainase.'],
    ['Perbaiki fondasi', 'Tangani penyebab penurunan dan susun kembali lapisan fondasi sesuai desain.'],
    ['Pasang lapisan perkerasan', 'Kerjakan lapisan aspal dan pengikat, lalu padatkan setiap lapisan sesuai spesifikasi.'],
  ] },
  segel_retak: { aim:'Menutup celah agar air tidak mudah masuk melalui retakan.', assumption:'Notebook menggunakan sealant elastomerik; biaya dihitung berdasarkan panjang retak.', sources:[routine, specs], steps:[
    ['Siapkan celah', 'Periksa pola dan lebar retak, lalu bersihkan celah dari kotoran dan material yang lepas.'],
    ['Isi retakan', 'Siapkan celah dan aplikasikan bahan pengisi sesuai spesifikasi serta petunjuk material.'],
    ['Periksa hasil pengisian', 'Pastikan pengisian merata dan material siap menerima lalu lintas.'],
  ] },
};
export function treatmentFor(damage, severity) {
  if (!['Rusak Ringan','Rusak Sedang','Rusak Berat'].includes(severity)) return null;
  if (['Longitudinal Crack','Transverse Crack'].includes(damage)) return 'segel_retak';
  if (!['Pothole','Alligator Crack','Rutting/Depression'].includes(damage)) return null;
  if (severity === 'Rusak Berat') return 'rekonstruksi';
  if (damage === 'Pothole' || (damage === 'Alligator Crack' && severity === 'Rusak Ringan')) return 'tambal';
  return 'overlay';
}
export function explainTreatment(site) {
  const profile = treatmentProfiles[site.treatment];
  if (!profile) return null;
  const expected = treatmentFor(site.damage, site.severity);
  const matches = expected === site.treatment;
  return { ...profile, matches, expected,
    reason: matches ? `Aturan proyek memetakan ${damageNames[site.damage].toLowerCase()} dengan tingkat ${site.severity.toLowerCase()} ke ${treatments[site.treatment].toLowerCase()}.` : `Metode tersimpan adalah ${treatments[site.treatment].toLowerCase()}. Hasil ini perlu dicocokkan kembali dengan aturan penanganan proyek.`,
    steps:[['Periksa titik kerusakan', `Cocokkan lokasi di ${site.road}, ukur bidang kerusakan, dan tentukan batas pekerjaan.`], ['Atur area kerja','Siapkan pengaturan lalu lintas dan rambu sebelum pekerjaan dimulai.'], ...profile.steps, ['Periksa dan dokumentasikan','Periksa mutu hasil pekerjaan, dokumentasikan sebelum–sesudah, lalu buka kembali area yang sudah siap.']],
  };
}
