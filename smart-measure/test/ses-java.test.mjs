// Telefondaki ses işleme (SesIsleyici.java) ile sayfadaki (olcum/ses.js) birebir aynı sonucu verir. javac yoksa atlanır.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as S from '../www/js/olcum/ses.js';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAYNAK = path.join(KOK, 'android', 'app', 'src', 'main', 'java', 'com', 'poyrazworkshop', 'smartmeasure', 'SesIsleyici.java');
const javac = spawnSync('javac', ['-version']).status === 0;

test('SesIsleyici.java = createProcessor (48 kHz, gürültü + iki ton)', { skip: !javac && 'javac yok' }, () => {
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
    fs.writeFileSync(path.join(d, 'Dene.java'), `
import com.poyrazworkshop.smartmeasure.SesIsleyici;
import java.nio.file.*; import java.util.*;
public class Dene { public static void main(String[] a) throws Exception {
  List<String> s = Files.readAllLines(Paths.get(a[0]));
  double[][] sos = new double[3][5];
  for (int i = 0; i < 3; i++) { String[] n = s.get(i).trim().split(" "); for (int j = 0; j < 5; j++) sos[i][j] = Double.parseDouble(n[j]); }
  SesIsleyici p = new SesIsleyici(48000, sos);
  for (int k = 3; k < s.size(); k++) { String[] n = s.get(k).trim().split(" "); short[] b = new short[n.length];
    for (int i = 0; i < n.length; i++) b[i] = (short) Integer.parseInt(n[i]);
    SesIsleyici.Sonuc r = p.blok(b, b.length); System.out.println(r.hizli + " " + r.blok + " " + r.tepe + " " + r.kirpma); }
} }`);
    execFileSync('javac', ['-d', d, KAYNAK, path.join(d, 'Dene.java')], { stdio: 'pipe' });
    const cikti = execFileSync('java', ['-cp', d, 'Dene', path.join(d, 'girdi.txt')], { encoding: 'utf8' }).trim().split('\n');
    assert.equal(cikti.length, js.length);
    cikti.forEach((satir, i) => {
      const [hizli, blok, tepe, kirpma] = satir.split(' ');
      assert.ok(Math.abs(Number(hizli) - js[i].fast) < 1e-9, `blok ${i} hızlı`);
      assert.ok(Math.abs(Number(blok) - js[i].block) < 1e-9, `blok ${i} ortalama`);
      assert.ok(Math.abs(Number(tepe) - js[i].peak) < 1e-12, `blok ${i} tepe`);
      assert.equal(kirpma === 'true', js[i].clipping);
    });
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
});
