// Expression engine: tokenizer -> parser (AST) -> evaluator over real and complex numbers.
//
//   precedence, loosest to tightest:  + -  |  * / mod nCr nPr  |  unary + -  |  juxtaposition (2pi, 3(4+5), 2sin(x))  |  ^ (right-assoc)  |  postfix ! ² ³ ⁻¹ % °
// Juxtaposition binds tighter than "/", so 1/2pi = 1/(2*pi), as on a handheld scientific calculator.
import {
  C, isC, toC, simplify, cabs, carg, cconj, cadd, csub, cmul, cdiv, cexp, cln, csqrt, cpow,
  csin, ccos, ctan, csinh, ccosh, ctanh, casin, cacos, catan, casinh, cacosh, catanh,
} from './complex.js';
import {
  trig, fromRad, degTo, gamma, factorial, nCr, nPr, gcd, lcm, modFloor, roundHalfAway, roundTo, toFraction,
  integrate, derivative, findRoot,
} from './mathx.js';

export class CalcError extends Error {
  // code: 'syntax' | 'math' | 'range' | 'arg' | 'undef'
  constructor(code, detail) { super(code + (detail ? ': ' + detail : '')); this.code = code; this.detail = detail; }
}

export function makeCtx(over) {
  return Object.assign({ angle: 'deg', complex: false, comma: false, ans: 0,
    vars: { a: 0, b: 0, c: 0, d: 0, x: 0, y: 0, m: 0 } }, over || {});
}

const isNum = v => typeof v === 'number';

// ---------------------------------------------------------------- functions
const tidy = v => { const r = Math.round(v); return Math.abs(v - r) < 1e-13 * Math.max(1, Math.abs(v)) ? r : v; };
const logb = (x, b) => b === 10 ? Math.log10(x) : b === 2 ? Math.log2(x) : tidy(Math.log(x) / Math.log(b));
const oddRoot = (n, x) => (x < 0 && Number.isInteger(n) && n % 2 !== 0) ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n);

let K = makeCtx();   // the context of the call in progress

// n: arity or [min, max];  r: real implementation (NaN = outside the real domain);  c: complex implementation
export const FUNCS = {
  sin: { n: 1, r: x => trig('sin', x, K.angle), c: csin },
  cos: { n: 1, r: x => trig('cos', x, K.angle), c: ccos },
  tan: { n: 1, r: x => trig('tan', x, K.angle), c: ctan },
  asin: { n: 1, r: x => fromRad(Math.asin(x), K.angle), c: casin },
  acos: { n: 1, r: x => fromRad(Math.acos(x), K.angle), c: cacos },
  atan: { n: 1, r: x => fromRad(Math.atan(x), K.angle), c: catan },
  sec: { n: 1, r: x => 1 / trig('cos', x, K.angle) },
  csc: { n: 1, r: x => 1 / trig('sin', x, K.angle) },
  cot: { n: 1, r: x => 1 / trig('tan', x, K.angle) },
  sinh: { n: 1, r: Math.sinh, c: csinh },
  cosh: { n: 1, r: Math.cosh, c: ccosh },
  tanh: { n: 1, r: Math.tanh, c: ctanh },
  asinh: { n: 1, r: Math.asinh, c: casinh },
  acosh: { n: 1, r: Math.acosh, c: cacosh },
  atanh: { n: 1, r: Math.atanh, c: catanh },
  atan2: { n: 2, r: (y, x) => fromRad(Math.atan2(y, x), K.angle) },

  ln: { n: 1, r: Math.log, c: cln },
  log: { n: [1, 2], r: (x, b) => b === undefined ? Math.log10(x) : logb(x, b), c: (z, b) => b === undefined ? cdiv(cln(z), C(Math.LN10, 0)) : cdiv(cln(z), cln(b)) },
  log10: { n: 1, r: Math.log10, c: z => cdiv(cln(z), C(Math.LN10, 0)) },
  log2: { n: 1, r: Math.log2, c: z => cdiv(cln(z), C(Math.LN2, 0)) },
  exp: { n: 1, r: Math.exp, c: cexp },
  sqrt: { n: 1, r: Math.sqrt, c: csqrt },
  cbrt: { n: 1, r: Math.cbrt, c: z => cpow(z, C(1 / 3, 0)) },
  root: { n: 2, r: oddRoot, c: (n, z) => cpow(z, cdiv(C(1, 0), n)) },
  pow: { n: 2, r: (a, b) => powReal(a, b, K), c: cpow },

  abs: { n: 1, r: Math.abs, c: cabs },
  sign: { n: 1, r: Math.sign },
  floor: { n: 1, r: Math.floor },
  ceil: { n: 1, r: Math.ceil },
  trunc: { n: 1, r: Math.trunc },
  frac: { n: 1, r: x => x - Math.trunc(x) },
  round: { n: [1, 2], r: (x, n) => n === undefined ? roundHalfAway(x) : roundTo(x, n) },

  fact: { n: 1, r: factorial },
  gamma: { n: 1, r: x => (Number.isInteger(x) && x <= 0) ? NaN : gamma(x) },
  ncr: { n: 2, r: nCr },
  npr: { n: 2, r: nPr },
  gcd: { n: 2, r: gcd },
  lcm: { n: 2, r: lcm },
  mod: { n: 2, r: modFloor },
  max: { n: [1, 99], r: (...a) => Math.max(...a.filter(isNum)) },
  min: { n: [1, 99], r: (...a) => Math.min(...a.filter(isNum)) },
  hypot: { n: [1, 99], r: (...a) => Math.hypot(...a.filter(isNum)) },

  rand: { n: 0, r: () => Math.random() },
  randint: { n: 2, r: (a, b) => (Number.isInteger(a) && Number.isInteger(b) && b >= a) ? a + Math.floor(Math.random() * (b - a + 1)) : NaN },
  deg: { n: 1, r: x => x * 180 / Math.PI },
  rad: { n: 1, r: x => x * Math.PI / 180 },

  re: { n: 1, r: x => x, c: z => z.re },
  im: { n: 1, r: () => 0, c: z => z.im },
  conj: { n: 1, r: x => x, c: cconj },
  arg: { n: 1, r: x => x >= 0 ? 0 : degTo(180, K.angle), c: z => fromRad(carg(z), K.angle) },
};
// arity-0 functions have no argument that could be complex; the rest see isC() before r()

const MULTI = new Set(['max', 'min', 'hypot']);   // numbers only: a complex argument is a domain error
const LAZY = { sum: 1, prod: 1, int: 1, diff: 1, solve: 1 };   // their first argument is an expression, evaluated by the function itself
const INFIX = new Set(['mod', 'ncr', 'npr']);
const CONSTS = new Set(['pi', 'e', 'i']);
const VARS = ['a', 'b', 'c', 'd', 'x', 'y', 'm', 'ans'];
const INVERSE = { sin: 'asin', cos: 'acos', tan: 'atan', sinh: 'asinh', cosh: 'acosh', tanh: 'atanh' };

const KNOWN = [...Object.keys(FUNCS), ...Object.keys(LAZY), ...CONSTS, ...VARS, 'mod', 'arcsin', 'arccos', 'arctan', 'sqrt', 'lg']
  .sort((a, b) => b.length - a.length);
export const NAMES = KNOWN;   // every name the tokenizer knows (the delete key removes a whole name at once)
const ALIAS = { arcsin: 'asin', arccos: 'acos', arctan: 'atan', lg: 'log10' };

// ---------------------------------------------------------------- tokenizer
export function tokenize(src, opt) {
  const out = [];
  const comma = !!(opt && opt.comma);
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === ' ') { i++; continue; }
    if ((ch >= '0' && ch <= '9') || ch === '.' || (comma && ch === ',' && /\d/.test(src[i + 1] || ''))) {
      let j = i, seenDot = false;
      while (j < n) {
        const c = src[j];
        if (c >= '0' && c <= '9') j++;
        else if ((c === '.' || (comma && c === ',')) && !seenDot) { seenDot = true; j++; }
        else break;
      }
      const text = src.slice(i, j).replace(',', '.');
      if (text === '.') throw new CalcError('syntax', i);
      let v = parseFloat(text);
      const m = /^[Eᴇ]([+\-−]?\d+)/.exec(src.slice(j));
      if (m) { v = parseFloat(text + 'e' + m[1].replace('−', '-')); j += m[0].length; }
      out.push({ t: 'num', v, p: i });
      i = j;
      continue;
    }
    if (/[A-Za-zͰ-Ͽ]/.test(ch)) {
      if (ch === 'π') { out.push({ t: 'id', v: 'pi', p: i }); i++; continue; }
      let j = i;
      while (j < n && /[A-Za-z0-9]/.test(src[j])) j++;
      const run = src.slice(i, j).toLowerCase();
      let pos = 0;
      while (pos < run.length) {
        const rest = run.slice(pos);
        const hit = KNOWN.find(k => rest.startsWith(k));
        if (hit) { out.push({ t: 'id', v: ALIAS[hit] || hit, p: i + pos }); pos += hit.length; continue; }
        if (/[a-z]/.test(rest[0])) { out.push({ t: 'id', v: rest[0], p: i + pos }); pos++; continue; }
        break;   // a digit that starts no known name: back to the number lexer
      }
      i += pos;
      if (pos === 0) throw new CalcError('syntax', i);
      continue;
    }
    if (ch === '(') { out.push({ t: 'lp', p: i }); i++; continue; }
    if (ch === ')') { out.push({ t: 'rp', p: i }); i++; continue; }
    if (ch === ',' || ch === ';') { out.push({ t: 'sep', p: i }); i++; continue; }
    if (src.startsWith('⁻¹', i)) { out.push({ t: 'op', v: '⁻¹', p: i }); i += 2; continue; }
    const map = { '×': '*', '·': '*', '⋅': '*', '÷': '/', '−': '-', '–': '-', '∕': '/', 'π': 'pi' };
    const o = map[ch] || ch;
    if ('+-*/^!%°²³√∛'.includes(o)) { out.push({ t: 'op', v: o, p: i }); i++; continue; }
    throw new CalcError('syntax', i);
  }
  out.push({ t: 'end', p: n });
  return out;
}

// ---------------------------------------------------------------- parser
class Parser {
  constructor(tokens) { this.tk = tokens; this.i = 0; }
  peek(o = 0) { return this.tk[Math.min(this.i + o, this.tk.length - 1)]; }
  next() { return this.tk[this.i++]; }
  isOp(v, o = 0) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
  fail() { throw new CalcError('syntax', this.peek().p); }

  parseAll() {
    if (this.peek().t === 'end') return null;
    const e = this.parseAdd();
    if (this.peek().t !== 'end') this.fail();
    return e;
  }
  parseAdd() {
    let a = this.parseMul();
    for (;;) {
      if (this.isOp('+') || this.isOp('-')) { const op = this.next().v; a = { k: 'bin', op, a, b: this.parseMul() }; }
      else return a;
    }
  }
  parseMul() {
    let a = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t.t === 'op' && (t.v === '*' || t.v === '/')) { this.next(); a = { k: 'bin', op: t.v, a, b: this.parseUnary() }; }
      else if (t.t === 'id' && INFIX.has(t.v)) { this.next(); a = { k: 'bin', op: t.v, a, b: this.parseUnary() }; }
      else return a;
    }
  }
  parseUnary() {
    if (this.isOp('-')) { this.next(); return { k: 'neg', a: this.parseUnary() }; }
    if (this.isOp('+')) { this.next(); return this.parseUnary(); }
    return this.parseImplicit();
  }
  startsFactor() {
    const t = this.peek();
    if (t.t === 'num' || t.t === 'lp') return true;
    if (t.t === 'id') return !INFIX.has(t.v);
    return t.t === 'op' && (t.v === '√' || t.v === '∛');
  }
  parseImplicit() {
    let a = this.parsePower();
    while (this.startsFactor()) a = { k: 'bin', op: '*', a, b: this.parsePower() };
    return a;
  }
  parsePower() {
    const base = this.parsePostfix();
    if (this.isOp('^')) { this.next(); return { k: 'bin', op: '^', a: base, b: this.parseExponent() }; }
    return base;
  }
  parseExponent() {
    if (this.isOp('-')) { this.next(); return { k: 'neg', a: this.parseExponent() }; }
    if (this.isOp('+')) { this.next(); return this.parseExponent(); }
    return this.parsePower();
  }
  parsePostfix() {
    let a = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t.t === 'op' && (t.v === '!' || t.v === '²' || t.v === '³' || t.v === '⁻¹' || t.v === '%' || t.v === '°')) { this.next(); a = { k: 'post', op: t.v, a }; }
      else return a;
    }
  }
  // the argument of a function written without parentheses (sin x, sqrt 2): one factor, sign allowed
  parseBareArg() {
    if (this.isOp('-')) { this.next(); return { k: 'neg', a: this.parseBareArg() }; }
    if (this.isOp('+')) { this.next(); return this.parseBareArg(); }
    return this.parsePower();
  }
  parseArgs() {
    const args = [];
    this.next();   // (
    if (this.peek().t === 'rp') { this.next(); return args; }
    for (;;) {
      args.push(this.parseAdd());
      const t = this.peek();
      if (t.t === 'sep') { this.next(); continue; }
      if (t.t === 'rp') { this.next(); return args; }
      if (t.t === 'end') return args;   // unclosed parenthesis at the end is closed for the user
      this.fail();
    }
  }
  parsePrimary() {
    const t = this.next();
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'lp') {
      const e = this.parseAdd();
      if (this.peek().t === 'rp') this.next();
      else if (this.peek().t !== 'end') this.fail();
      return e;
    }
    if (t.t === 'op' && (t.v === '√' || t.v === '∛')) return { k: 'call', fn: t.v === '√' ? 'sqrt' : 'cbrt', args: [this.parseBareArg()] };
    if (t.t === 'id') {
      const name = t.v;
      if (CONSTS.has(name)) return { k: 'const', n: name };
      if (FUNCS[name] || LAZY[name]) {
        let fn = name, wrap = null;
        // sin²(x) and sin⁻¹(x)
        const m = this.peek();
        if (m.t === 'op' && (m.v === '²' || m.v === '³' || m.v === '⁻¹') && this.peek(1).t === 'lp') {
          this.next();
          if (m.v === '⁻¹') { if (!INVERSE[fn]) this.fail(); fn = INVERSE[fn]; } else wrap = m.v;
        }
        const args = this.peek().t === 'lp' ? this.parseArgs() : (FUNCS[fn] && FUNCS[fn].n === 0 ? [] : [this.parseBareArg()]);
        const call = { k: 'call', fn, args };
        return wrap ? { k: 'post', op: wrap, a: call } : call;
      }
      return { k: 'var', n: name };
    }
    this.i--;
    this.fail();
  }
}

const cache = new Map();
export function parse(src, opt) {
  const key = (opt && opt.comma ? 'c' : 'd') + src;
  if (cache.has(key)) return cache.get(key);
  const ast = new Parser(tokenize(src, opt)).parseAll();
  if (cache.size > 300) cache.clear();
  cache.set(key, ast);
  return ast;
}

// ---------------------------------------------------------------- evaluator
function powReal(a, b, ctx) {
  if (a < 0 && !Number.isInteger(b)) {
    if (ctx.complex) return NaN;
    const f = toFraction(b, 99);
    if (f && f.d % 2 === 1) return (f.n % 2 === 0 ? 1 : -1) * Math.pow(-a, b);   // (-8)^(1/3) = -2 on the real line
    return NaN;
  }
  return Math.pow(a, b);
}

const checkReal = (v, kind) => {
  if (!Number.isFinite(v)) throw new CalcError(Number.isNaN(v) ? 'math' : (kind || 'math'));
  return v;
};
const checkC = z => {
  if (!Number.isFinite(z.re) || !Number.isFinite(z.im)) throw new CalcError('math');
  return simplify(z);
};

function add(a, b, sign) {
  if (isNum(a) && isNum(b)) {
    const r = sign > 0 ? a + b : a - b;
    // cancellation noise (0.1+0.2-0.3) is zero at the 15 digits the machine can hold
    if (r !== 0 && Math.abs(r) < 1e-15 * Math.max(Math.abs(a), Math.abs(b))) return 0;
    return checkReal(r, 'range');
  }
  return checkC(sign > 0 ? cadd(toC(a), toC(b)) : csub(toC(a), toC(b)));
}
function mul(a, b) {
  if (isNum(a) && isNum(b)) return checkReal(a * b, 'range');
  return checkC(cmul(toC(a), toC(b)));
}
function div(a, b) {
  if (isNum(a) && isNum(b)) { if (b === 0) throw new CalcError('math'); return checkReal(a / b, 'range'); }
  const d = toC(b);
  if (d.re === 0 && d.im === 0) throw new CalcError('math');
  return checkC(cdiv(toC(a), d));
}
function pow(a, b, ctx) {
  if (isNum(a) && isNum(b)) {
    if (a === 0 && b < 0) throw new CalcError('math');
    const r = powReal(a, b, ctx);
    if (Number.isNaN(r)) {
      if (!ctx.complex) throw new CalcError('math');
      return checkC(cpow(toC(a), toC(b)));
    }
    return checkReal(r, 'range');
  }
  const x = toC(a), y = toC(b);
  if (x.re === 0 && x.im === 0 && (y.re < 0 || (y.re === 0 && y.im !== 0))) throw new CalcError('math');
  return checkC(cpow(x, y));
}

function callFn(name, def, args, ctx) {
  K = ctx;
  if (MULTI.has(name) && args.some(isC)) throw new CalcError('math');
  if (args.some(isC)) {
    if (!def.c) throw new CalcError('math');
    const r = def.c(...args.map(toC));
    return isNum(r) ? checkReal(r) : checkC(r);
  }
  const r = def.r(...args);
  if (typeof r === 'number' && !Number.isFinite(r)) {
    if (Number.isNaN(r) && ctx.complex && def.c) return checkC(def.c(...args.map(toC)));
    throw new CalcError(Number.isNaN(r) ? 'math' : (name === 'exp' || name === 'fact' || name === 'gamma' ? 'range' : 'math'));
  }
  return r;
}

function lookupVar(name, ctx, scope) {
  if (scope && name in scope) return scope[name];
  if (name === 'ans') return ctx.ans;
  if (name in ctx.vars) return ctx.vars[name];
  throw new CalcError('undef', name);
}

function realOf(ast, name, ctx, scope) {
  const s = Object.create(scope || null);
  return x => {
    s[name] = x;
    const v = evalAst(ast, ctx, s);
    return isNum(v) ? v : (v.im === 0 ? v.re : NaN);
  };
}
function intArg(v) {
  if (!isNum(v) || !Number.isInteger(v)) throw new CalcError('math');
  return v;
}

const LAZYFN = {
  sum: (args, ctx, scope, prod) => {
    if (args.length !== 4 || args[1].k !== 'var') throw new CalcError('arg', prod ? 'prod' : 'sum');
    const k = args[1].n, a = intArg(evalAst(args[2], ctx, scope)), b = intArg(evalAst(args[3], ctx, scope));
    if (b - a > 2e6) throw new CalcError('range');
    const s = Object.create(scope || null);
    let acc = prod ? 1 : 0;
    for (let j = a; j <= b; j++) { s[k] = j; const v = evalAst(args[0], ctx, s); acc = prod ? mul(acc, v) : add(acc, v, 1); }
    return acc;
  },
  prod: (args, ctx, scope) => LAZYFN.sum(args, ctx, scope, true),
  int: (args, ctx, scope) => {
    if (args.length !== 3) throw new CalcError('arg', 'int');
    const a = evalAst(args[1], ctx, scope), b = evalAst(args[2], ctx, scope);
    if (!isNum(a) || !isNum(b)) throw new CalcError('math');
    return checkReal(integrate(realOf(args[0], 'x', ctx, scope), a, b));
  },
  diff: (args, ctx, scope) => {
    if (args.length !== 2) throw new CalcError('arg', 'diff');
    const x0 = evalAst(args[1], ctx, scope);
    if (!isNum(x0)) throw new CalcError('math');
    return checkReal(derivative(realOf(args[0], 'x', ctx, scope), x0));
  },
  solve: (args, ctx, scope) => {
    if (args.length < 1 || args.length > 2) throw new CalcError('arg', 'solve');
    const x0 = args.length === 2 ? evalAst(args[1], ctx, scope) : 0;
    if (!isNum(x0)) throw new CalcError('math');
    return checkReal(findRoot(realOf(args[0], 'x', ctx, scope), x0));
  },
};

export function evalAst(n, ctx, scope) {
  switch (n.k) {
    case 'num': return n.v;
    case 'const': return n.n === 'pi' ? Math.PI : n.n === 'e' ? Math.E : C(0, 1);
    case 'var': return lookupVar(n.n, ctx, scope);
    case 'neg': { const v = evalAst(n.a, ctx, scope); return isNum(v) ? -v : C(-v.re, -v.im); }
    case 'bin': {
      const a = evalAst(n.a, ctx, scope), b = evalAst(n.b, ctx, scope);
      switch (n.op) {
        case '+': return add(a, b, 1);
        case '-': return add(a, b, -1);
        case '*': return mul(a, b);
        case '/': return div(a, b);
        case '^': return pow(a, b, ctx);
        default: return callFn(n.op, FUNCS[n.op], [a, b], ctx);   // mod, ncr, npr
      }
    }
    case 'post': {
      const v = evalAst(n.a, ctx, scope);
      switch (n.op) {
        case '!': return callFn('fact', FUNCS.fact, [v], ctx);
        case '²': return mul(v, v);
        case '³': return mul(mul(v, v), v);
        case '⁻¹': return div(1, v);
        case '%': return div(v, 100);
        case '°': return isNum(v) ? degTo(v, ctx.angle) : mul(v, degTo(1, ctx.angle));
      }
      throw new CalcError('syntax');
    }
    case 'call': {
      if (LAZYFN[n.fn]) return LAZYFN[n.fn](n.args, ctx, scope);
      const def = FUNCS[n.fn];
      const [lo, hi] = Array.isArray(def.n) ? def.n : [def.n, def.n];
      if (n.args.length < lo || n.args.length > hi) throw new CalcError('arg', n.fn);
      return callFn(n.fn, def, n.args.map(a => evalAst(a, ctx, scope)), ctx);
    }
  }
  throw new CalcError('syntax');
}

// Evaluate text. Empty text gives null.
export function evaluate(src, ctx) {
  const ast = parse(src, ctx);
  return ast === null ? null : evalAst(ast, ctx, null);
}

// A one-variable real function for plotting: x -> number (NaN where undefined or complex)
export function compileReal(src, ctx, name = 'x') {
  const ast = parse(src, ctx);
  if (ast === null) return null;
  const s = {};
  return x => {
    s[name] = x;
    try {
      const v = evalAst(ast, ctx, s);
      return isNum(v) ? v : (v.im === 0 ? v.re : NaN);
    } catch (e) { return NaN; }
  };
}
