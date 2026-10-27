// Unit names in the languages other than Turkish and English.
//
// units.js carries the English name of every unit, built from a small vocabulary: "kilogram-force/square centimetre", "watt/(metre·kelvin)", "newton·metre²".
// A language file (lang/xx.js) translates that vocabulary - about 120 words and phrases ("atoms") - and compose() puts a name together again with the same
// separators (/ · and parentheses) and the same superscripts. So a word is translated once and a name can never disagree with the unit next to it.
//
//   compose('kilogram-force/square centimetre', DE)  ->  'Kilopond/Quadratzentimeter'
//
// A name that needs another shape in a language is given whole: the glossary may hold the complete English name as a key ('horsepower (hp, 550 ft·lbf/s)').

/** words that read the same in every language (the symbol-like ones); a glossary of a language may override any of them */
export const COMMON = { '°C': '°C', '°F': '°F', 'gal': 'gal', 'hp': 'hp', 'IT': 'IT', 'PS': 'PS', 'gon': 'gon' };

/** the pieces of a name between / and · outside parentheses, and the separators between them */
function splitTop(s) {
  const parts = [], seps = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth === 0 && (ch === '/' || ch === '·')) { parts.push(cur); seps.push(ch); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return { parts, seps };
}

/**
 * English name -> name in the language of glossary `g`. Words the glossary lacks stay English and are reported to `missing(word)`.
 */
export function compose(en, g, missing = () => {}) {
  const gl = k => (g[k] !== undefined ? g[k] : COMMON[k]);
  const piece = p => {
    p = p.trim();
    if (p.startsWith('(') && p.endsWith(')') && splitTop(p.slice(1, -1)).parts.length >= 1 && !/\)\s*\(/.test(p)) return '(' + whole(p.slice(1, -1)) + ')';
    const sup = (/[²³⁴]+$/.exec(p) || [''])[0];
    const core = p.slice(0, p.length - sup.length);
    if (gl(core) !== undefined) return gl(core) + sup;
    const m = /^(.*?)\s*\((.+)\)$/.exec(core);                       // "gallon (US)": the word and its qualifier
    if (m) return piece(m[1]) + ' (' + whole(m[2]) + ')' + sup;
    missing(core);
    return p;
  };
  const whole = s => {
    if (gl(s) !== undefined) return gl(s);
    const { parts, seps } = splitTop(s);
    return parts.map((p, i) => piece(p) + (seps[i] || '')).join('');
  };
  return whole(en);
}
