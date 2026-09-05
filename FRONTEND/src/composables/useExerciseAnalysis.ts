import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { nowTimestamp } from '@/utils/scoring'
import type { Exercise, ExerciseQuestion, ScoreResult } from '@/types/models'

function geminiKey() {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || ''
}

function modelName() {
  return (
    (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim() || 'gemini-flash-latest'
  )
}

/** Analyse locale des lacunes (sans Cloud Functions). */
export function buildLocalAnalysis(
  exercise: Exercise,
  scored: ScoreResult,
  questions: ExerciseQuestion[],
): { analyse: string; lacunes: string[]; recommendation: string } {
  const wrong = scored.details.filter((d) => !d.correct)
  const lacunes: string[] = []
  for (const d of wrong) {
    const q = questions.find((x) => x.id === d.questionId)
    const label = (q?.enonce || q?.question || d.questionId).slice(0, 80)
    lacunes.push(label)
  }
  const matiere = exercise.matiere || 'cette matière'
  const analyse =
    wrong.length === 0
      ? `Excellent travail sur « ${exercise.titre || 'cet exercice'} » (${scored.percent}%). Continue ainsi en ${matiere}.`
      : `Score ${scored.percent}%. ${wrong.length} point(s) à retravailler en ${matiere} :\n` +
        lacunes.map((l, i) => `${i + 1}. ${l}`).join('\n')
  const recommendation =
    wrong.length === 0
      ? 'Passe à un exercice un peu plus difficile ou aide un camarade sur cette notion.'
      : `Revois ces notions, puis refais un exercice ciblé. Tu peux aussi demander au tuteur IA ou ouvrir un ticket.`
  return { analyse, lacunes, recommendation }
}

/** Enrichit l’analyse avec Gemini si une clé est disponible. */
export async function enrichAnalysisWithGemini(
  exercise: Exercise,
  scored: ScoreResult,
  local: { analyse: string; lacunes: string[]; recommendation: string },
): Promise<{ analyse: string; lacunes: string[]; recommendation: string }> {
  const key = geminiKey()
  if (!key) return local
  try {
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: modelName() })
    const prompt = `Tu es un pédagogue. Analyse cette tentative d'exercice scolaire.
Matière: ${exercise.matiere || '?'}
Titre: ${exercise.titre || '?'}
Score: ${scored.percent}% (${scored.score}/${scored.max})
Lacunes détectées: ${local.lacunes.join(' | ') || 'aucune'}
Réponds en français, JSON strict uniquement:
{"analyse":"texte court 3-6 phrases","lacunes":["notion1","notion2"],"recommendation":"conseil actionnable"}`
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return local
    const parsed = JSON.parse(jsonMatch[0]) as {
      analyse?: string
      lacunes?: string[]
      recommendation?: string
    }
    return {
      analyse: parsed.analyse || local.analyse,
      lacunes: Array.isArray(parsed.lacunes) && parsed.lacunes.length ? parsed.lacunes : local.lacunes,
      recommendation: parsed.recommendation || local.recommendation,
    }
  } catch {
    return local
  }
}

/** Met à jour progress + frequent_errors côté client. */
export async function writeProgressFromAttempt(opts: {
  eleveId: string
  matiere: string
  percent: number
  lacunes: string[]
  exerciseTitre?: string
}) {
  const { eleveId, matiere, percent, lacunes, exerciseTitre } = opts
  if (!eleveId || !matiere) return

  const pq = query(
    collection(db, 'progress'),
    where('eleveId', '==', eleveId),
    where('matiere', '==', matiere),
    limit(1),
  )
  const snap = await getDocs(pq)
  if (snap.empty) {
    await addDoc(collection(db, 'progress'), {
      eleveId,
      matiere,
      percent,
      previousPercent: 0,
      topics: lacunes.slice(0, 5).map((t) => ({
        titre: t,
        percent: Math.max(0, percent - 15),
      })),
      updatedAt: nowTimestamp(),
    })
  } else {
    const ref = snap.docs[0].ref
    const prev = Number(snap.docs[0].data().percent || 0)
    const blended = Math.round(prev * 0.6 + percent * 0.4)
    const existingTopics = (snap.docs[0].data().topics || []) as { titre?: string; percent?: number }[]
    const topicMap = new Map(existingTopics.map((t) => [t.titre || '', t]))
    for (const lacune of lacunes) {
      const cur = topicMap.get(lacune)
      topicMap.set(lacune, {
        titre: lacune,
        percent: Math.max(0, Math.round((cur?.percent ?? 40) * 0.7)),
      })
    }
    await updateDoc(ref, {
      previousPercent: prev,
      percent: blended,
      topics: Array.from(topicMap.values()).slice(0, 12),
      updatedAt: nowTimestamp(),
    })
  }

  for (const lacune of lacunes.slice(0, 5)) {
    await addDoc(collection(db, 'frequent_errors'), {
      eleveId,
      matiere,
      titre: lacune,
      notion: lacune,
      competence: lacune,
      exerciseTitre: exerciseTitre || null,
      count: 1,
      createdAt: nowTimestamp(),
    })
  }
}

/** Génère un QCM via Gemini pour le professeur. */
export async function generateQcmWithAi(opts: {
  matiere: string
  sujet: string
  niveau?: string
  count?: number
}): Promise<ExerciseQuestion[]> {
  const key = geminiKey()
  if (!key) throw new Error('NO_GEMINI_KEY')
  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({ model: modelName() })
  const n = opts.count || 4
  const prompt = `Génère ${n} questions QCM pour des lycéens.
Matière: ${opts.matiere}
Sujet: ${opts.sujet}
Niveau: ${opts.niveau || 'Terminale'}
JSON strict uniquement, tableau:
[{"id":"q1","type":"qcm","enonce":"...","options":["A","B","C","D"],"correctAnswer":"A"}]
correctAnswer doit être exactement une des options.`
  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('BAD_AI_JSON')
  const parsed = JSON.parse(jsonMatch[0]) as ExerciseQuestion[]
  return parsed.map((q, i) => ({
    id: q.id || `q${i + 1}`,
    type: 'qcm',
    enonce: q.enonce || q.question || `Question ${i + 1}`,
    options: q.options || [],
    correctAnswer: q.correctAnswer ?? q.reponseCorrecte,
  }))
}

export function randomInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}
