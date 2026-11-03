export const REPORT_STATUSES = {draft:'Belum dikirim',received:'Diterima Jalanova',reviewing:'Sedang diperiksa',scheduled:'Dijadwalkan',in_progress:'Dalam penanganan',resolved:'Selesai',rejected:'Tidak ditindaklanjuti'};
export const REVIEW_STATUSES = Object.entries(REPORT_STATUSES).filter(([key]) => !['draft','received'].includes(key));
export const URGENCY = {unassessed:'Belum ditentukan',routine:'Rutin',priority:'Prioritas',urgent:'Mendesak'};
export const NEXT_STATUSES = {received:['reviewing','rejected'],reviewing:['reviewing','scheduled','rejected'],scheduled:['scheduled','in_progress','reviewing'],in_progress:['in_progress','resolved','reviewing'],resolved:['reviewing'],rejected:['reviewing']};
export const PHOTO_BUCKET = 'citizen-report-photos';
export const PHOTO_LIMIT = 5 * 1024 * 1024;
export const DEMO_REPORT_MARKER = '[JALANOVA_DATA_DEMO]';
export function isDemoReport(report) { return typeof report?.description === 'string' && report.description.startsWith(DEMO_REPORT_MARKER); }
export function reportDescription(report) { return isDemoReport(report) ? report.description.slice(DEMO_REPORT_MARKER.length).trim() : report?.description || ''; }
export function loginEmail(identifier) {
  const value=identifier.trim().toLowerCase();
  const localAccounts = {usergovernance:'usergovernance@demo.jalanova.invalid',usergovernence:'usergovernence@demo.jalanova.invalid',userwarga:'userwarga@demo.jalanova.invalid'};
  return localAccounts[value] || value;
}
export function validateCitizenReport(values,photo) {
  const errors = {};
  if ((values.roadName || '').trim().length < 3) errors.roadName = 'Tuliskan nama jalan atau ruas yang dilaporkan.';
  if ((values.address || '').trim().length < 5) errors.address = 'Tambahkan alamat atau patokan agar lokasi mudah ditemukan.';
  if ((values.description || '').trim().length < 20) errors.description = 'Jelaskan kerusakan setidaknya 20 karakter.';
  const lat = Number(values.latitude), lng = Number(values.longitude);
  if (values.latitude === '' || values.longitude === '' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) errors.location = 'Pilih titik di peta atau isi koordinat yang benar.';
  if (!photo) errors.photo = 'Tambahkan satu foto kerusakan.';
  else if (!['image/jpeg','image/png','image/webp'].includes(photo.type) || photo.size <= 0 || photo.size > PHOTO_LIMIT) errors.photo = 'Gunakan foto JPG, PNG, atau WebP dengan ukuran maksimal 5 MB.';
  if (!values.consent) errors.consent = 'Setujui penggunaan data untuk penanganan laporan.';
  return errors;
}
export function reportPhotoPath(userId,reportId,type) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(userId) || !uuid.test(reportId)) throw Error('Identitas laporan tidak valid.');
  const ext = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type];
  if (!ext) throw Error('Format foto tidak didukung.');
  return `${userId}/${reportId}/photo.${ext}`;
}
