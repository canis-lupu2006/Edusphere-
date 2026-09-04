import { serverTimestamp, type FieldValue } from 'firebase/firestore'
import type { ExerciseQuestion, ScoreResult } from '@/types/models'

/** Helpers Firestore / scoring exercices */

export function nowTimestamp(): FieldValue {
  return serverTimestamp()
}

/**
 * Calcule le score côté client pour un exercice soumis.
 */
export function computeScore(
  questions: ExerciseQuestion[] = [],
  answers: Record<string, unknown> = {},
): ScoreResult {
  if (!questions.length) return { score: 0, max: 0, percent: 0, details: [] }

  let correct = 0
  const details = questions.map((q) => {
    const given = answers[q.id]
    let ok = false

    if (q.type === 'qcm') {
      ok = given === q.correctAnswer || given === q.reponseCorrecte
    } else if (q.type === 'vrai_faux' || q.type === 'vrai-faux') {
      ok = Boolean(given) === Boolean(q.correctAnswer ?? q.reponseCorrecte)
    } else if (q.type === 'court' || q.type === 'reponse_courte') {
      const expected = String(q.correctAnswer ?? q.reponseCorrecte ?? '')
        .trim()
        .toLowerCase()
      ok = String(given ?? '')
        .trim()
        .toLowerCase() === expected
    }

    if (ok) correct += 1
    return { questionId: q.id, correct: ok }
  })

  const max = questions.length
  const percent = Math.round((correct / max) * 100)
  return { score: correct, max, percent, details }
}
