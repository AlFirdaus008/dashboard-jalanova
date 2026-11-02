export const WORK_BUCKET = 'report-work-evidence';
export const WORK_FILE_LIMIT = 10 * 1024 * 1024;
const imageTypes = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const documentTypes = {...imageTypes,'application/pdf':'pdf'};

export function checkEvidenceFile(file,document = false) {
  if (!file) return null;
  if (!Object.hasOwn(document ? documentTypes : imageTypes,file.type) || file.size<=0 || file.size>WORK_FILE_LIMIT) {
    return document ? 'Gunakan JPG, PNG, WebP, atau PDF hingga 10 MB.' : 'Gunakan foto JPG, PNG, atau WebP hingga 10 MB.';
  }
  return null;
}

export function evidencePath(reportId,entryId,kind,file) {
  if (!/^[0-9a-f-]{36}$/i.test(reportId) || !/^[0-9a-f-]{36}$/i.test(entryId)) throw Error('Nomor laporan tidak valid.');
  const ext=(kind==='expense' ? documentTypes : imageTypes)[file.type];
  if (!ext) throw Error('Jenis berkas tidak didukung.');
  return `${reportId}/${entryId}/${kind}.${ext}`;
}

export async function saveWorkUpdate(client,{report,status,urgency,roadId,agency,note,workedAt,spentIdr,workPhoto,expenseDocument}) {
  const entryId=crypto.randomUUID(), uploaded=[];
  const upload=async(kind,file)=>{
    if (!file) return null;
    const problem=checkEvidenceFile(file,kind==='expense');
    if (problem) throw Error(problem);
    const path=evidencePath(report.id,entryId,kind,file);
    const result=await client.storage.from(WORK_BUCKET).upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if (result.error) throw result.error;
    uploaded.push(path);
    return path;
  };
  try {
    const workPath=await upload('work',workPhoto);
    const documentPath=await upload('expense',expenseDocument);
    const result=await client.rpc('record_report_work',{
      p_id:report.id,p_status:status,p_urgency:urgency,p_road_id:roadId || null,
      p_agency:agency,p_note:note,p_expected_updated_at:report.updated_at,
      p_worked_at:workedAt ? new Date(workedAt).toISOString() : null,
      p_spent_idr:spentIdr === '' ? null : Number(spentIdr),
      p_work_photo_path:workPath,p_expense_document_path:documentPath,
    });
    if (result.error) throw result.error;
    return result.data;
  } catch(error) {
    if (uploaded.length) await client.storage.from(WORK_BUCKET).remove(uploaded).catch(()=>{});
    throw error;
  }
}
