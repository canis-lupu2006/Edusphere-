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
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    bar: 'from-blue-500 to-cyan-400',
    btn: 'bg-blue-600 hover:bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-300',
    glyph: 'Σ',
  },
  maths: {
    key: 'math',
    bg: 'bg-blue-500/20',
    text: 'text-blue-300',
    bar: 'from-blue-500 to-cyan-400',
    btn: 'bg-blue-600 hover:bg-blue-500',
    badge: 'bg-blue-500/15 text-blue-300',
    glyph: 'Σ',
  },
  francais: {
    key: 'fr',
    bg: 'bg-violet-500/20',
    text: 'text-violet-300',
    bar: 'from-violet-600 to-indigo-500',
    btn: 'bg-violet-600 hover:bg-violet-500',
    badge: 'bg-violet-500/15 text-violet-300',
    glyph: 'Aa',
  },
  'physique-chimie': {
    key: 'pc',
    bg: 'bg-teal-500/20',
    text: 'text-teal-300',
    bar: 'from-teal-500 to-emerald-400',
    btn: 'bg-teal-600 hover:bg-teal-500',
    badge: 'bg-teal-500/15 text-teal-300',
    glyph: '⚡',
  },
  physique: {
    key: 'pc',
    bg: 'bg-teal-500/20',
    text: 'text-teal-300',
    bar: 'from-teal-500 to-emerald-400',
    btn: 'bg-teal-600 hover:bg-teal-500',
    badge: 'bg-teal-500/15 text-teal-300',
    glyph: '⚗',
  },
  'histoire-geographie': {
    key: 'hg',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    bar: 'from-amber-500 to-orange-400',
    btn: 'bg-amber-600 hover:bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-300',
    glyph: '🌍',
  },
  svt: {
    key: 'svt',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    bar: 'from-emerald-500 to-green-400',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-300',
    glyph: '🍃',
  },
  anglais: {
    key: 'en',
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    bar: 'from-rose-500 to-red-400',
    btn: 'bg-rose-600 hover:bg-rose-500',
    badge: 'bg-rose-500/15 text-rose-300',
    glyph: 'Aa',
  },
  philosophie: {
    key: 'philo',
    bg: 'bg-violet-500/20',
    text: 'text-violet-300',
    bar: 'from-violet-500 to-fuchsia-400',
    btn: 'bg-violet-600 hover:bg-violet-500',
    badge: 'bg-violet-500/15 text-violet-300',
    glyph: 'φ',
  },
}

const fallback: SubjectTheme = {
  key: 'default',
  bg: 'bg-blue-500/20',
  text: 'text-blue-300',
  bar: 'from-blue-600 to-violet-500',
  btn: 'bg-blue-600 hover:bg-blue-500',
  badge: 'bg-blue-500/15 text-blue-300',
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
