import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GenerateStrategicMap } from '../src/application/war/GenerateStrategicMap.js';
import { buildStrategicMapPreviewHtml } from '../src/ui/war/buildStrategicMapPreviewHtml.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputArg = process.argv[2] ?? 'dist/map-preview/index.html';
const outputPath = path.resolve(repoRoot, outputArg);

const generatedMap = new GenerateStrategicMap().execute();
const html = buildStrategicMapPreviewHtml(generatedMap, {
  generatedAt: new Date().toISOString(),
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, html, 'utf8');

console.log(`Alpha: strategic map preview written to ${path.relative(repoRoot, outputPath)}`);
console.log(`Alpha: open file://${outputPath} or capture it with your screenshot tool.`);
