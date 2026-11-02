import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIPELINE_STEPS } from '../src/content/method.mjs';

export function copyNotebookFigures() {
  const source = path.resolve(import.meta.dirname,'../../output_jalanova/visualizations');
  const destination = path.resolve(import.meta.dirname,'../public/figures');
  fs.mkdirSync(destination,{recursive:true});
  const files = [...new Set(PIPELINE_STEPS.flatMap(step => step.figures.map(figure => figure.file)))];
  for (const file of files) fs.copyFileSync(path.join(source,file),path.join(destination,file));
  return files.length;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`${copyNotebookFigures()} original notebook figures prepared.`);
