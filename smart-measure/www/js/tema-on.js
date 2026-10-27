// Tema ilk boyamadan önce uygulanır (koyu/açık titremesin); asıl ayar app.js'tedir. Klasik betik, modül değil.
try {
  var s = JSON.parse(localStorage.getItem('smartmeasure.v1') || 'null');
  var th = s && s.settings && s.settings.theme;
  var dark = th === 'dark' || (th !== 'light' && (!window.matchMedia || window.matchMedia('(prefers-color-scheme: dark)').matches));
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
} catch (e) { /* depo kapalı */ }
