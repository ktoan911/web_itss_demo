/* eslint-disable n/no-process-exit */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const soundsDir = path.join(root, 'public', 'sounds');

function listMp3(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(mp3|ogg|wav|m4a)$/i.test(f))
    .sort();
}

const manifest = {
  ambient: listMp3(path.join(soundsDir, 'ambient')).map((f) => ({
    file: f,
    label: prettify(f),
  })),
  music: listMp3(path.join(soundsDir, 'music')).map((f) => ({
    file: f,
    label: prettify(f),
  })),
};

function prettify(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

const outPath = path.join(soundsDir, 'manifest.json');
fs.mkdirSync(soundsDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');

const total = manifest.ambient.length + manifest.music.length;
console.log(
  `[sounds] manifest written (${manifest.ambient.length} ambient, ${manifest.music.length} music — total ${total})`,
);
