/** Couleurs / icônes par matière (maquettes élève) */
export interface SubjectTheme {
  key: string
  bg: string
  text: string
  bar: string
  btn: string
  badge: string
  glyph: string
}

const themes: Record<string, SubjectTheme> = {
  mathematiques: {
    key: 'math',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    bar: 'from-blue-500 to-cyan-400',
    btn: 'bg-blue-600 hover:bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    glyph: 'Σ',
  },
  maths: {
    key: 'math',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    bar: 'from-blue-500 to-cyan-400',
    btn: 'bg-blue-600 hover:bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    glyph: 'Σ',
  },
  francais: {
    key: 'fr',
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    bar: 'from-violet-600 to-indigo-500',
    btn: 'bg-violet-600 hover:bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    glyph: 'Aa',
  },
  'physique-chimie': {
    key: 'pc',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    bar: 'from-teal-500 to-emerald-400',
    btn: 'bg-teal-600 hover:bg-teal-500',
    badge: 'bg-teal-100 text-teal-700',
    glyph: '⚡',
  },
  physique: {
    key: 'pc',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    bar: 'from-teal-500 to-emerald-400',
    btn: 'bg-teal-600 hover:bg-teal-500',
    badge: 'bg-teal-100 text-teal-700',
    glyph: '⚗',
  },
  'histoire-geographie': {
    key: 'hg',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    bar: 'from-amber-500 to-orange-400',
    btn: 'bg-amber-600 hover:bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    glyph: '🌍',
  },
  svt: {
    key: 'svt',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    bar: 'from-emerald-500 to-green-400',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    glyph: '🍃',
  },
  anglais: {
    key: 'en',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    bar: 'from-rose-500 to-red-400',
    btn: 'bg-rose-600 hover:bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    glyph: 'Aa',
  },
  philosophie: {
    key: 'philo',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    bar: 'from-indigo-500 to-violet-400',
    btn: 'bg-indigo-600 hover:bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700',
    glyph: 'φ',
  },
}

const fallback: SubjectTheme = {
  key: 'default',
  bg: 'bg-blue-100',
  text: 'text-blue-700',
  bar: 'from-blue-600 to-blue-400',
  btn: 'bg-blue-600 hover:bg-blue-500',
  badge: 'bg-blue-100 text-blue-700',
  glyph: '•',
}

function normalize(matiere?: string) {
  return (matiere || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

export function subjectTheme(matiere?: string): SubjectTheme {
  const key = normalize(matiere)
  if (themes[key]) return themes[key]
  for (const [k, v] of Object.entries(themes)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return { ...fallback, glyph: (matiere || '?').slice(0, 1).toUpperCase() }
}
