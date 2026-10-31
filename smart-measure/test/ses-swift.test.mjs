// iPhone'daki ses işleme (ios/App/App/SesIsleyici.swift) ile sayfadaki (olcum/ses.js) birebir aynı sonucu verir.
// swiftc yoksa atlanır (Linux); macOS'taki iOS derleme işi (ios-kucuk.yml) çalıştırır.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as S from '../www/js/olcum/ses.js';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = path.join(KOK, 'ios', 'App', 'App', 'SesIsleyici.swift');
const swiftc = spawnSync('swiftc', ['--version']).status === 0;

test('SesIsleyici.swift = createProcessor (48 kHz, gürültü + iki ton)', { skip: !swiftc && 'swiftc yok' }, () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'ses-'));
  try {
    const sos = S.aWeightingSos(48000);
    let tohum = 12345;
    const rnd = () => { tohum = (tohum * 1103515245 + 12345) % 2147483648; return tohum / 2147483648 - 0.5; };
    const bloklar = Array.from({ length: 12 }, (_, k) => Array.from({ length: 4800 }, (_, i) => {
      const t = (k * 4800 + i) / 48000;
      return Math.max(-32768, Math.min(32767, Math.round(8000 * Math.sin(2 * Math.PI * 125 * t) + 3000 * Math.sin(2 * Math.PI * 3150 * t) + 4000 * rnd())));
    }));
    const p = S.createProcessor(48000, sos);
    const js = bloklar.map((b) => p(Int16Array.from(b)));
    fs.writeFileSync(path.join(d, 'girdi.txt'), [sos.map((s) => s.join(' ')).join('\n'), ...bloklar.map((b) => b.join(' '))].join('\n'));
    // 16 bitlik örnek / 32768 Float'ta tam gösterilir: AVAudioEngine'in Float32 örnekleriyle aynı girdi
    fs.writeFileSync(path.join(d, 'main.swift'), `
import Foundation
let s = try! String(contentsOfFile: CommandLine.arguments[1], encoding: .utf8).split(separator: "\\n").map(String.init)
let sos = (0..<3).map { i in s[i].split(separator: " ").map { Double($0)! } }
let p = SesIsleyici(ornekleme: 48000, bolumler: sos)!
for k in 3..<s.count {
  let b = s[k].split(separator: " ").map { Float(Int($0)!) / 32768 }
  let r = b.withUnsafeBufferPointer { p.blok($0.baseAddress!, b.count) }
  print("\\(r.hizli) \\(r.blok) \\(r.tepe) \\(r.kirpma)")
}`);
    execFileSync('swiftc', ['-O', '-o', path.join(d, 'dene'), KAYNAK, path.join(d, 'main.swift')], { stdio: 'pipe' });
    const cikti = execFileSync(path.join(d, 'dene'), [path.join(d, 'girdi.txt')], { encoding: 'utf8' }).trim().split('\n');
    assert.equal(cikti.length, js.length);
    cikti.forEach((satir, i) => {
      const [hizli, blok, tepe, kirpma] = satir.split(' ');
      assert.ok(Math.abs(Number(hizli) - js[i].fast) < 1e-9, `blok ${i} hızlı: ${hizli} / ${js[i].fast}`);
      assert.ok(Math.abs(Number(blok) - js[i].block) < 1e-9, `blok ${i} ortalama`);
      assert.ok(Math.abs(Number(tepe) - js[i].peak) < 1e-12, `blok ${i} tepe`);
      assert.equal(kirpma === 'true', js[i].clipping);
    });
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});
