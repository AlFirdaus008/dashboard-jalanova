import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attachReportDetails, photosForSite, mapTooltip, photoUrl, reportCoordinates, reportDate } from '../src/lib/reports.mjs';
import { explainTreatment, treatmentFor } from '../src/lib/treatment.mjs';
const project = JSON.parse(fs.readFileSync(new URL('../public/data/project.json',import.meta.url),'utf8'));

test('missing report details remain missing and never inherit simulated coordinates or example images', () => {
  const result = attachReportDetails(project);
  assert.equal(result.reports.length,850);
  result.reports.forEach((r,i) => {
    assert.equal(r.id,project.reports[i].id); assert.equal(r.siteId,project.reports[i].siteId);
    assert.equal(r.duplicate,project.reports[i].duplicate);
    assert.equal(r.reporter.name,null); assert.equal(r.reporter.contact,null);
    assert.equal(r.location.coordinates,null); assert.equal(r.location.address,null);
    assert.equal(r.description,null); assert.equal(r.submittedAt,null); assert.deepEqual(r.photos,[]);
  });
  assert.equal(project.reports[0].reporter,undefined);
});
test('photo and reporter enrichment joins by exact report ID, including duplicate reports', () => {
  const site = project.sites.find(s => s.reportIds.length > 1);
  const id = site.reportIds[1];
  const result = attachReportDetails(project,{reports:[{id,description:'QA-only report fixture',reporter:{name:'Test Reporter',contact:'test@example.test'},location:{address:'QA-only address',coordinates:[112.7,-7.2]},photos:[{src:'/qa-test-photo.jpg',caption:'QA-only image'}]}]});
  const report = result.reports.find(r => r.id === id);
  assert.equal(report.reporter.name,'Test Reporter'); assert.equal(report.description,'QA-only report fixture');
  assert.deepEqual(report.location.coordinates,[112.7,-7.2]);
  assert.equal(photosForSite(site,result.reports)[0].reportId,id);
  const other = project.sites.find(s => s.id !== site.id);
  assert.equal(photosForSite(other,result.reports).length,0);
  assert.throws(() => attachReportDetails(project,{reports:[{id:'not-an-existing-report'}]}),/tidak ditemukan/);
  assert.throws(() => attachReportDetails(project,{reports:[{id},{id}]}),/dua kali/);
});
test('invalid photo URLs and coordinates are excluded instead of displayed as report evidence', () => {
  for (const url of ['javascript:alert(1)','data:text/html,test','file:///private/photo.jpg','//untrusted.test/image.jpg','/\\untrusted.test/image.jpg']) assert.equal(photoUrl(url),null);
  assert.equal(photoUrl('/photos/example.jpg'),'/photos/example.jpg');
  assert.equal(photoUrl('https://example.test/photo.jpg'),'https://example.test/photo.jpg');
  for (const coordinates of [[200,0],[0,100],[NaN,0],['112.7',-7.2],null]) assert.equal(reportCoordinates(coordinates),null);
  assert.deepEqual(reportCoordinates([0,0]),[0,0]);
  assert.equal(reportDate('invalid-date'),'Belum tersedia'); assert.equal(reportDate(null),'Belum tersedia');
});
test('map hover includes only road and a score bounded to 0–100', () => {
  assert.equal(mapTooltip({...project.sites[0],priority:100}),'Jl. Basuki Rahmat | 100/100');
  assert.equal(mapTooltip({...project.sites[0],priority:0}),'Jl. Basuki Rahmat | 0/100');
  assert.equal(mapTooltip({...project.sites[0],priority:120}),'Jl. Basuki Rahmat | 100/100');
  for (const site of project.sites) {
    const label = mapTooltip(site);
    assert.equal(label.split('|').length,2);
    assert(!label.includes(site.id) && !label.includes(site.damage) && !label.includes('status ruas'));
  }
});
test('treatment explanations reproduce notebook cell 76 for every saved site and all 15 rule combinations', () => {
  const expected = {
    Pothole:['tambal','tambal','rekonstruksi'],
    'Alligator Crack':['tambal','overlay','rekonstruksi'],
    'Rutting/Depression':['overlay','overlay','rekonstruksi'],
    'Longitudinal Crack':['segel_retak','segel_retak','segel_retak'],
    'Transverse Crack':['segel_retak','segel_retak','segel_retak'],
  };
  for (const [damage,treatments] of Object.entries(expected)) ['Rusak Ringan','Rusak Sedang','Rusak Berat'].forEach((severity,i) => assert.equal(treatmentFor(damage,severity),treatments[i]));
  for (const site of project.sites) {
    const plan = explainTreatment(site);
    assert.equal(plan.matches,true); assert.equal(plan.expected,site.treatment);
    assert.equal(plan.steps.length,6); assert(plan.steps[0][1].includes(site.road));
    assert(plan.reason.includes(site.severity.toLowerCase()));
    assert(plan.sources.every(s => new URL(s.url).hostname === 'binamarga.pu.go.id'));
  }
  assert.equal(treatmentFor('unknown','Rusak Berat'),null);
  assert.equal(treatmentFor('Pothole','unknown'),null);
});
test('a conflicting stored treatment is flagged rather than given a matching explanation', () => {
  const site = {...project.sites[0],damage:'Pothole',severity:'Rusak Berat',treatment:'segel_retak'};
  const plan = explainTreatment(site);
  assert.equal(plan.matches,false); assert.equal(plan.expected,'rekonstruksi');
  assert(plan.reason.includes('dicocokkan kembali'));
});
