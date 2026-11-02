import fs from 'node:fs';
import { authorityRegistry } from '../src/lib/authority.mjs';
const project = JSON.parse(fs.readFileSync(new URL('../public/data/project.json',import.meta.url),'utf8'));
const literal = value => "'" + value.replaceAll("'","''") + "'";
const rows = project.roads.map(road => {const authority=authorityRegistry.roads.find(row=>row.roadId===road.id);return '('+[road.id,road.name,authority.authority,authority.owner].map(literal).join(',')+')';});
fs.writeFileSync(new URL('../supabase/seed-road-registry.sql',import.meta.url),`-- Reference names/status only; simulated coordinates are not used to assign real reports.\ninsert into public.road_registry(id,road_name,authority,owner) values\n${rows.join(',\n')}\non conflict(id) do update set road_name=excluded.road_name,authority=excluded.authority,owner=excluded.owner;\n`);
console.log('Prepared 15 road references for Supabase.');
