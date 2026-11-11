/* Data: písmena, tahy, slova. Souřadnice tahů: x 0–100 (CH 0–200), y 0 = horní linka, 100 = základní linka. */
'use strict';

const HACEK = cx => `M${cx - 15} -32 L${cx} -14 L${cx + 15} -32`;
const ARC_C = 'M84 24 A40 50 0 1 0 84 76';
const STEM = x => `M${x} 0 L${x} 100`;

const IGLOO = `<svg viewBox="0 0 100 100" class="pic-svg"><path d="M8 80 A42 42 0 0 1 92 80 Z" fill="#E6F3FB" stroke="#7FB2D6" stroke-width="3" stroke-linejoin="round"/><path d="M14 60 H86 M26 44 H74 M50 38 V44 M34 44 V60 M66 44 V60 M24 60 V80 M76 60 V80 M50 60 V64" stroke="#7FB2D6" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M38 80 V68 A12 12 0 0 1 62 68 V80 Z" fill="#5B7FA6"/><path d="M2 80 H98" stroke="#BFD9EA" stroke-width="4" stroke-linecap="round"/></svg>`;

/* Pořadí odpovídá obvyklému postupu českých slabikářů (A, M, L, E, S, O, P, U, I …). */
const LETTERS = [
  // 1. skupina
  { id: 'A', word: 'ananas', emoji: '🍍', strokes: ['M50 0 L10 100', 'M50 0 L90 100', 'M25 64 L75 64'] },
  { id: 'M', word: 'motýl', emoji: '🦋', strokes: [STEM(12), 'M12 0 L50 62 L88 0 L88 100'] },
  { id: 'L', word: 'lev', emoji: '🦁', strokes: ['M20 0 L20 100 L80 100'] },
  { id: 'E', word: 'elf', emoji: '🧝', strokes: [STEM(18), 'M18 0 L80 0', 'M18 50 L68 50', 'M18 100 L80 100'] },
  { id: 'S', word: 'slunce', emoji: '☀️', strokes: ['M82 20 C70 -6 18 -6 18 26 C18 50 82 48 82 76 C82 106 28 106 16 80'] },
  // 2. skupina
  { id: 'O', word: 'opice', emoji: '🐒', strokes: ['M50 0 A40 50 0 0 0 50 100 A40 50 0 0 0 50 0'] },
  { id: 'P', word: 'pes', emoji: '🐶', strokes: [STEM(15), 'M15 0 L50 0 C82 0 82 52 50 52 L15 52'] },
  { id: 'U', word: 'ucho', emoji: '👂', strokes: ['M15 0 L15 62 C15 112 85 112 85 62 L85 0'] },
  { id: 'I', word: 'iglú', svg: IGLOO, strokes: [STEM(50)] },
  { id: 'T', word: 'tygr', emoji: '🐯', strokes: ['M10 0 L90 0', STEM(50)] },
  // 3. skupina
  { id: 'J', word: 'jablko', emoji: '🍎', strokes: ['M65 0 L65 70 C65 108 20 108 18 72'] },
  { id: 'N', word: 'nos', emoji: '👃', strokes: [STEM(15), 'M15 0 L85 100 L85 0'] },
  { id: 'V', word: 'vlak', emoji: '🚂', strokes: ['M10 0 L50 100 L90 0'] },
  { id: 'Z', word: 'zebra', emoji: '🦓', strokes: ['M12 0 L88 0 L12 100 L88 100'] },
  { id: 'D', word: 'dům', emoji: '🏠', strokes: [STEM(15), 'M15 0 L40 0 C96 0 96 100 40 100 L15 100'] },
  // 4. skupina
  { id: 'K', word: 'kočka', emoji: '🐱', strokes: [STEM(18), 'M80 0 L20 52', 'M20 52 L82 100'] },
  { id: 'Š', word: 'šnek', emoji: '🐌', strokes: ['M82 20 C70 -6 18 -6 18 26 C18 50 82 48 82 76 C82 106 28 106 16 80', HACEK(50)] },
  { id: 'R', word: 'raketa', emoji: '🚀', strokes: [STEM(15), 'M15 0 L50 0 C82 0 82 52 50 52 L15 52', 'M45 52 L85 100'] },
  { id: 'C', word: 'citron', emoji: '🍋', strokes: [ARC_C] },
  { id: 'H', word: 'had', emoji: '🐍', strokes: [STEM(15), STEM(85), 'M15 50 L85 50'] },
  // 5. skupina
  { id: 'B', word: 'banán', emoji: '🍌', strokes: [STEM(15), 'M15 0 L50 0 C78 0 78 47 50 47 L15 47', 'M15 47 L55 47 C88 47 88 100 55 100 L15 100'] },
  { id: 'Č', word: 'čokoláda', emoji: '🍫', strokes: [ARC_C, HACEK(50)] },
  { id: 'Ž', word: 'žirafa', emoji: '🦒', strokes: ['M12 0 L88 0 L12 100 L88 100', HACEK(50)] },
  { id: 'Ř', word: 'řetěz', emoji: '⛓️', strokes: [STEM(15), 'M15 0 L50 0 C82 0 82 52 50 52 L15 52', 'M45 52 L85 100', HACEK(42)] },
  { id: 'F', word: 'foťák', emoji: '📷', strokes: [STEM(18), 'M18 0 L80 0', 'M18 50 L68 50'] },
  // 6. skupina
  { id: 'G', word: 'gorila', emoji: '🦍', strokes: ['M84 24 A40 50 0 1 0 88 66 L88 54 L56 54'] },
  { id: 'CH', w: 200, word: 'chleba', emoji: '🍞', strokes: [ARC_C, STEM(120), STEM(190), 'M120 50 L190 50'] },
  { id: 'Ď', word: 'ďábel', emoji: '😈', strokes: [STEM(15), 'M15 0 L40 0 C96 0 96 100 40 100 L15 100', HACEK(42)] },
  { id: 'Ť', word: 'ťapka', emoji: '🐾', strokes: ['M10 0 L90 0', STEM(50), HACEK(50)] },
  { id: 'Ň', word: 'ňam', emoji: '😋', strokes: [STEM(15), 'M15 0 L85 100 L85 0', HACEK(50)] },
  // 7. skupina – méně častá písmena (inside = písmeno je uvnitř slova; noFirst = nehodí se do hry na první hlásku)
  { id: 'Y', word: 'ryba', emoji: '🐟', inside: true, noFirst: true, strokes: ['M10 0 L50 50', 'M90 0 L50 50 L50 100'] },
  { id: 'X', word: 'taxi', emoji: '🚕', inside: true, noFirst: true, strokes: ['M12 0 L88 100', 'M88 0 L12 100'] },
  { id: 'W', word: 'wifi', emoji: '📶', noFirst: true, strokes: ['M5 0 L28 100 L50 30 L72 100 L95 0'] },
  { id: 'Q', word: 'Quido', emoji: '👦', noFirst: true, strokes: ['M50 0 A40 50 0 0 0 50 100 A40 50 0 0 0 50 0', 'M62 72 L92 108'] },
];

const GROUPS = [
  { name: 'První písmena', ids: ['A', 'M', 'L', 'E', 'S'] },
  { name: 'Druhá parta', ids: ['O', 'P', 'U', 'I', 'T'] },
  { name: 'Třetí parta', ids: ['J', 'N', 'V', 'Z', 'D'] },
  { name: 'Čtvrtá parta', ids: ['K', 'Š', 'R', 'C', 'H'] },
  { name: 'Pátá parta', ids: ['B', 'Č', 'Ž', 'Ř', 'F'] },
  { name: 'Šestá parta', ids: ['G', 'CH', 'Ď', 'Ť', 'Ň'] },
  { name: 'Vzácná písmena', ids: ['Y', 'X', 'W', 'Q'] },
];

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);

/* Tvarově podobná písmena – používají se jako těžší „rušiče“ až u písmen, která dítě už zná. */
const SIMILAR = {
  A: ['V', 'H'], B: ['P', 'R', 'D'], C: ['G', 'O', 'Č'], Č: ['C', 'G', 'Š'], D: ['O', 'B', 'Ď'], Ď: ['D', 'Ť'],
  E: ['F', 'L'], F: ['E', 'T'], G: ['C', 'O'], H: ['N', 'K', 'A'], I: ['J', 'L', 'T'], J: ['I', 'U'],
  K: ['X', 'H', 'R'], L: ['I', 'E'], M: ['N', 'W'], N: ['M', 'Z', 'Ň'], Ň: ['N', 'M'], O: ['Q', 'C', 'D'],
  P: ['B', 'R', 'F'], Q: ['O', 'G'], R: ['P', 'B', 'Ř'], Ř: ['R', 'P'], S: ['Š', 'Z'], Š: ['S', 'Ž'],
  T: ['I', 'Ť', 'F'], Ť: ['T', 'Ď'], U: ['V', 'J'], V: ['U', 'Y', 'A'], W: ['M', 'V'], X: ['K', 'Y'],
  Y: ['V', 'X'], Z: ['Ž', 'S', 'N'], Ž: ['Z', 'Š'], CH: ['H', 'C'],
};

const PRAISE = ['Výborně!', 'Paráda!', 'To je ono!', 'Skvělá práce!', 'Jde ti to!', 'Nádhera!', 'Přesně tak!'];
const RETRY = ['Zkus to ještě jednou.', 'Skoro! Zkus jiné.', 'Poslechni si to znovu.'];
