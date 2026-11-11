// Kelime Bilcek — ESLint (kelime-denetim.yml). www/*.js tarayıcıda düz <script> olarak, aynı genel ad alanında
// yüklenir: kelime.js → reklam.js → bot.js → klavye.js → oyun.js. Dosyalar arası adlar burada "globals" olarak bildirilir.
import js from '@eslint/js';
import globals from 'globals';

const kelimeAdlari = Object.fromEntries(['CATEGORIES', 'CATEGORY_WORDS', 'CATEGORY_EMOJI', 'CATEGORY_LOOKUP',
  'normalizeWord', 'isInCategory', 'localCategoryPreCheck', 'turkishLastLetter', 'turkishFirstLetter', 'chainLetterFor',
  'getChainNextLetter', 'isWordInLocalDict', 'kelimeBicimiGecerli', 'kullaniciAdiGecerli', 'isMatchOver',
  'KELIME_EN_UZUN'].map((a) => [a, 'readonly']));
const reklamAdlari = Object.fromEntries(['REKLAM', 'reklam', 'reklamBaslat', 'reklamMacBitti', 'reklamLobiyeDonus',
  'reklamEkranDegisti', 'reklamGizlilikSecenekleri', 'BOT', 'YerelOda', 'botBaslat', 'botDurdur', 'klavyeKur'].map((a) => [a, 'readonly']));

export default [
  { ignores: ['www/vendor/**', 'android/**', 'node_modules/**', 'firebase/node_modules/**'] },
  js.configs.recommended,
  {
    files: ['www/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, firebase: 'readonly', module: 'writable' },
    },
    rules: {
      // Dosyalar arası paylaşılan işlevler (ör. kelime.js'teki) bu dosyada "kullanılmamış" görünür
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  { files: ['www/oyun.js'], languageOptions: { globals: { ...kelimeAdlari, ...reklamAdlari } } },
  { files: ['www/bot.js'], languageOptions: { globals: { ...kelimeAdlari, nowServer: 'readonly' } } },
  {
    files: ['test/**/*.mjs', 'araclar/**/*.mjs', 'firebase/*.mjs', 'firebase/test/**/*.mjs', 'site/**/*.mjs', 'worker/**/*.{js,mjs}', '*.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node, caches: 'readonly' } },
    rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }] },
  },
  {
    // Bu dosyalardaki page.evaluate(() => …) gövdeleri tarayıcıda, oyunun genel ad alanında çalışır
    files: ['test/arayuz.test.mjs', 'test/akis.test.mjs', 'araclar/magaza-gorsel.mjs', 'araclar/ekranlar.mjs'],
    rules: { 'no-undef': 'off' },
  },
];
