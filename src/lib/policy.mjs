import { damageNames, formatWindow, number, rupiah, treatments } from './data.mjs';

export function policySummary(site,schedule) {
  const urgent = site.triage === 'Perlu Penanganan Mendesak';
  const scheduled = site.triage === 'Penanganan Terjadwal Prioritas';
  const owner = site.jurisdiction?.owner || 'Pengelola ruas belum tercatat';
  const coordinator = ({
    national:'Balai Besar Pelaksanaan Jalan Nasional (BBPJN) Jawa Timur–Bali',
    provincial:'Dinas Pekerjaan Umum Bina Marga Provinsi Jawa Timur',
    city:'Dinas Sumber Daya Air dan Bina Marga (DSDABM) Kota Surabaya',
  })[site.jurisdiction?.authority] || owner;
  const time = schedule ? `${schedule.tipe_hari === 'Weekend' ? 'Akhir pekan' : 'Hari kerja'}, ${formatWindow(schedule.mulai_optimal,schedule.shift_jam)} WIB` : 'Waktu pelaksanaan perlu ditentukan';
  return {
    owner, coordinator, time,
    action:urgent ? 'Dahulukan peninjauan titik ini.' : scheduled ? 'Masukkan titik ini dalam rencana penanganan.' : 'Jadwalkan pemeriksaan dan pemantauan titik ini.',
    issue:`${damageNames[site.damage]} dengan tingkat ${site.severity.toLowerCase()}.`,
    method:treatments[site.treatment],
    steps:[
      { title:'Koordinasikan peninjauan', text:`Sampaikan nomor titik ${site.id}, lokasi, dan ringkasan kerusakan kepada ${coordinator}. ${urgent ? 'Minta tim mendahulukan pemeriksaan serta pengamanan area yang diperlukan.' : 'Tentukan tim yang akan memeriksa lokasi.'}` },
      { title:'Pastikan kebutuhan perbaikan', text:`Minta tim mengukur kerusakan dan menilai usulan ${treatments[site.treatment].toLowerCase()}. Lingkup kerja awal ${number(site.workVolume,2)} ${site.workUnit}; sesuaikan dengan temuan lapangan.` },
      { title:'Tetapkan jadwal dan anggaran', text:`Gunakan estimasi median ${rupiah(site.cost.p50)} sebagai bahan perencanaan. ${schedule ? `Waktu yang disarankan: ${time}.` : 'Tentukan waktu pelaksanaan bersama pengelola ruas.'} Tetapkan pelaksanaan setelah hasil pemeriksaan dan anggaran disetujui.` },
    ],
  };
}
