import { PHOTO_BUCKET, reportPhotoPath } from './citizen-reports.mjs';

export async function submitCitizenReport(client,{id,userId,values,photo,onStage = () => {}}) {
  const path = reportPhotoPath(userId,id,photo.type);
  onStage('Menyimpan keterangan laporan…');
  const draft = await client.rpc('create_report_draft',{p_id:id,p_road_name:values.roadName.trim(),p_address:values.address.trim(),p_description:values.description.trim(),p_latitude:Number(values.latitude),p_longitude:Number(values.longitude),p_contact:(values.contact || '').trim(),p_photo_path:path});
  if (draft.error) throw draft.error;
  // A retry after a lost response must not upload again or duplicate the report.
  if (draft.data.status !== 'draft') return draft.data;
  onStage('Mengunggah foto kerusakan…');
  const upload = await client.storage.from(PHOTO_BUCKET).upload(path,photo,{contentType:photo.type,upsert:true,cacheControl:'3600'});
  if (upload.error) throw upload.error;
  onStage('Mengirim ke antrean petugas…');
  const submitted = await client.rpc('submit_citizen_report',{p_id:id});
  if (submitted.error) throw submitted.error;
  return submitted.data;
}
export function friendlyReportError(error) {
  if (/batas|terlalu banyak/i.test(error?.message || '')) return 'Batas pengiriman tercapai. Coba lagi nanti.';
  return 'Laporan belum berhasil dikirim. Periksa koneksi lalu coba lagi. Jangan tutup halaman agar foto dan keterangan tetap tersedia.';
}
