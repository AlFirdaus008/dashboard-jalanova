import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attachAuthorities } from '../src/lib/authority.mjs';
import { directionsUrl, siteDestination } from '../src/lib/location.mjs';
import { policySummary } from '../src/lib/policy.mjs';
const project = attachAuthorities(JSON.parse(fs.readFileSync(new URL('../public/data/project.json',import.meta.url),'utf8')));
const site = project.sites.find(s => s.reportIds.length > 1);

test('directions use latitude-longitude in a properly encoded Google Maps URL without a guessed origin', () => {
  const url = new URL(directionsUrl([112.7,-7.2]));
  assert.equal(url.origin,'https://www.google.com'); assert.equal(url.pathname,'/maps/dir/');
  assert.equal(url.searchParams.get('api'),'1'); assert.equal(url.searchParams.get('destination'),'-7.2,112.7');
  assert(!url.searchParams.has('origin')); assert(!url.searchParams.has('dir_action'));
  assert.equal(directionsUrl([180,100]),null); assert.equal(directionsUrl(null),null);
});
test('routing prefers the parent report coordinates and excludes unrelated reports', () => {
  const parent = {id:site.id,siteId:site.id,location:{address:'QA-only location',coordinates:[112.71,-7.21]}};
  const duplicate = {id:site.reportIds[1],siteId:site.id,location:{coordinates:[112.72,-7.22]}};
  const unrelated = {id:'unrelated',siteId:site.id,location:{coordinates:[112.73,-7.23]}};
  const result = siteDestination(site,[unrelated,duplicate,parent]);
  assert.equal(result.source,'report'); assert.equal(result.reportId,site.id);
  assert.deepEqual(result.coordinates,parent.location.coordinates);
  assert.equal(siteDestination(site,[duplicate]).reportId,duplicate.id);
  assert.equal(siteDestination(site,[unrelated]).source,'project');
  assert.equal(siteDestination(site,[{...parent,siteId:'other-site'}]).source,'project');
});
test('project coordinates remain explicitly simulated and absent coordinates never become a route', () => {
  const result = siteDestination(site,project.reports);
  assert.equal(result.source,'project'); assert.equal(result.reportId,null);
  assert.deepEqual(result.coordinates,site.coordinates);
  assert(result.url);
  const missing = siteDestination({...site,coordinates:null},[]);
  assert.equal(missing.source,'missing'); assert.equal(missing.url,null);
});
test('policy summaries give an owner, action, cost and selected day without changing analysis scores', () => {
  const before = JSON.stringify(project.sites);
  for (const s of project.sites) {
    const schedule = project.schedules.find(t => t.road_id === s.roadId && t.tipe_hari === 'Weekend');
    const result = policySummary(s,schedule);
    assert.equal(result.owner,s.jurisdiction.owner); assert.equal(result.steps.length,3);
    assert(result.coordinator.includes(s.jurisdiction.authority === 'national' ? 'BBPJN' : s.jurisdiction.authority === 'city' ? 'DSDABM' : 'Provinsi Jawa Timur'));
    assert(result.time.includes('Akhir pekan') && result.time.includes('WIB'));
    assert(result.steps[0].text.includes(s.id));
    assert(result.steps[1].text.includes('ukur') || result.steps[1].text.includes('mengukur'));
    if (s.triage === 'Perlu Penanganan Mendesak') assert(result.action.includes('Dahulukan'));
    else if (s.triage === 'Penanganan Terjadwal Prioritas') assert(result.action.includes('rencana penanganan'));
    else assert(result.action.includes('pemantauan'));
  }
  const missing = policySummary({...site,jurisdiction:null},null);
  assert.equal(missing.owner,'Pengelola ruas belum tercatat');
  assert.equal(missing.coordinator,missing.owner);
  assert(missing.time.includes('perlu ditentukan'));
  assert.equal(JSON.stringify(project.sites),before);
});
