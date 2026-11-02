// Preserve every linked report, including records whose extra details are not available yet.
export function siteReportRecords(site, reports = [], schedules = []) {
  const ids = [...new Set(site.reportIds)];
  const index = new Map(reports.filter(report => report.siteId === site.id && ids.includes(report.id)).map(report => [report.id,report]));
  return {
    reports:ids.map(id => index.get(id) || { id, siteId:site.id, duplicate:id !== site.id, photos:[], location:{}, reporter:{} }),
    schedules:schedules.filter(schedule => schedule.road_id === site.roadId),
  };
}
