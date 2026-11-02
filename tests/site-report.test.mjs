import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { siteReportRecords } from '../src/lib/site-report.mjs';
const project = JSON.parse(fs.readFileSync(new URL('../public/data/project.json',import.meta.url),'utf8'));

test('each location report includes every linked complaint once and only schedules from that road', () => {
  const before = JSON.stringify(project);
  for (const site of project.sites) {
    const result = siteReportRecords(site,project.reports,project.schedules);
    assert.deepEqual(result.reports.map(report => report.id),site.reportIds);
    assert.equal(result.reports.length,site.reports);
    assert(result.reports.every(report => report.siteId === site.id));
    assert.equal(result.schedules.length,2);
    assert(result.schedules.every(schedule => schedule.road_id === site.roadId));
  }
  assert.equal(JSON.stringify(project),before);
});

test('missing linked complaints remain in the report without borrowing another location or reporter', () => {
  const site = project.sites.find(site => site.reportIds.length > 1);
  const id = site.reportIds[1];
  const wrong = {id,siteId:'another-site',reporter:{name:'Wrong reporter'},location:{coordinates:[112.7,-7.2]}};
  const result = siteReportRecords({...site,reportIds:[...site.reportIds,id]},[wrong],[]);
  assert.equal(result.reports.length,site.reportIds.length);
  const missing = result.reports.find(report => report.id === id);
  assert.deepEqual(missing.reporter,{}); assert.deepEqual(missing.location,{}); assert.deepEqual(missing.photos,[]);
  assert.equal(missing.duplicate,true); assert.equal(missing.siteId,site.id);
  assert.equal(result.schedules.length,0);
});

test('all attachments and supplied report details are retained by exact location and report ID', () => {
  const site = project.sites.find(site => site.reportIds.length > 1);
  const report = {id:site.id,siteId:site.id,reporter:{name:'QA only'},photos:[{src:'/qa-one.jpg'},{src:'/qa-two.jpg'}],location:{coordinates:[112.71,-7.21]}};
  const result = siteReportRecords(site,[report],project.schedules);
  assert.equal(result.reports[0],report);
  assert.equal(result.reports[0].photos.length,2);
  assert.deepEqual(result.reports[0].location.coordinates,[112.71,-7.21]);
});
