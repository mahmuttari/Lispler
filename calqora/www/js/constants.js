// Physical, mathematical and engineering constants (CODATA 2018 / SI 2019; astronomical values are the IAU nominal ones).
// s: symbol, v: value, u: unit. The names are in lang/<code>.js (consts.<group id>[index]), in the order of the constants here.
const K = (s, v, u) => ({ s, v, u });

export const CONSTANT_GROUPS = [
  { id: 'math', items: [
    K('π', Math.PI, ''), K('e', Math.E, ''),
    K('φ', (1 + Math.sqrt(5)) / 2, ''), K('γ', 0.5772156649015329, ''),
    K('√2', Math.SQRT2, ''), K('ln 2', Math.LN2, ''), K('ln 10', Math.LN10, '')] },
  { id: 'universal', items: [
    K('c', 299792458, 'm/s'), K('h', 6.62607015e-34, 'J·s'),
    K('ħ', 6.62607015e-34 / (2 * Math.PI), 'J·s'), K('G', 6.6743e-11, 'm³/(kg·s²)'),
    K('ε₀', 8.8541878128e-12, 'F/m'), K('μ₀', 1.25663706212e-6, 'N/A²'),
    K('Z₀', 376.730313668, 'Ω'), K('α', 7.2973525693e-3, '')] },
  { id: 'atomic', items: [
    K('e', 1.602176634e-19, 'C'), K('mₑ', 9.1093837015e-31, 'kg'),
    K('mₚ', 1.67262192369e-27, 'kg'), K('mₙ', 1.67492749804e-27, 'kg'),
    K('u', 1.6605390666e-27, 'kg'), K('a₀', 5.29177210903e-11, 'm'),
    K('R∞', 10973731.56816, '1/m'), K('μB', 9.2740100783e-24, 'J/T')] },
  { id: 'thermo', items: [
    K('NA', 6.02214076e23, '1/mol'), K('kB', 1.380649e-23, 'J/K'),
    K('R', 8.31446261815324, 'J/(mol·K)'), K('F', 96485.33212331, 'C/mol'),
    K('σ', 5.670374419e-8, 'W/(m²·K⁴)'), K('b', 2.897771955e-3, 'm·K'),
    K('Vm', 22.41396954e-3, 'm³/mol'), K('T₀', 273.15, 'K')] },
  { id: 'astro', items: [
    K('AU', 149597870700, 'm'), K('ly', 9460730472580800, 'm'), K('pc', 3.0856775814913673e16, 'm'),
    K('M☉', 1.98847e30, 'kg'), K('R☉', 6.957e8, 'm'),
    K('M⊕', 5.9722e24, 'kg'), K('R⊕', 6.371e6, 'm')] },
  { id: 'eng', items: [
    K('g', 9.80665, 'm/s²'), K('patm', 101325, 'Pa'),
    K('γw', 9.81, 'kN/m³'), K('ρw', 1000, 'kg/m³'),
    K('ρair', 1.225, 'kg/m³'), K('vs', 343, 'm/s'),
    K('Es', 210, 'GPa'), K('γc', 25, 'kN/m³')] },
];
