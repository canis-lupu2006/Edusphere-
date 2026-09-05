import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'
import app from '@/firebase'

const SYSTEM_INSTRUCTION = `Tu es le tuteur IA d'EduSphere, une plateforme scolaire.
Tu aides les élèves à comprendre leurs cours (maths, sciences, français, etc.).
Règles :
- Réponds en français, clairement, de façon encourageante.
- Guide pas à pas : ne donne pas la réponse finale trop vite ; pose des questions pour faire réfléchir.
- Adapte le niveau au collège / lycée.
- Si la question est hors sujet scolaire, recentre poliment sur l'apprentissage.
- Réponses concises (quelques phrases ou étapes courtes), sauf si l'élève demande plus de détail.`

/**
 * Modèles essayés dans l'ordre.
 * `*-latest` est volontairement inclus : certaines clés AI Studio
 * n'exposent que ces alias (les IDs figés renvoient 404).
 */
const DEFAULT_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-pro-latest',
]

export type TutorTurn = { role: 'user' | 'assistant'; text: string }

function toChatHistory(messages: TutorTurn[]) {
  return messages
    .filter((m) => m.text.trim())
    .map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.text }],
    }))
}

function modelCandidates() {
  const preferred = (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim()
  const list = preferred ? [preferred, ...DEFAULT_MODELS] : [...DEFAULT_MODELS]
  return [...new Set(list)]
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function isRetryable(msg: string) {
  return /503|high demand|overloaded|UNAVAILABLE|try again|resource.?exhausted|429/i.test(
    msg,
  )
}

function isNotFound(msg: string) {
  return /not found|404|is not found for API version/i.test(msg)
}

function isFatalKeyError(msg: string) {
  return /API_KEY_INVALID|API key not valid|invalid api key|PERMISSION_DENIED|API_KEY_SERVICE_BLOCKED/i.test(
    msg,
  )
}

function formatGeminiError(errors: string[]): string {
  const joined = errors.join('\n')
  if (errors.some(isFatalKeyError)) {
    return 'Clé API Gemini invalide. Créez une clé sur https://aistudio.google.com/apikey et mettez-la dans FRONTEND/.env, puis relancez le serveur.'
  }
  if (errors.some(isRetryable)) {
    return 'Gemini est temporairement saturé (forte demande). Réessaie dans 15–30 secondes.'
  }
  if (errors.length && errors.every(isNotFound)) {
    return 'Aucun modèle Gemini accessible avec cette clé. Dans .env mets VITE_GEMINI_MODEL=gemini-flash-latest puis relance.'
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(joined)) {
    return 'Réseau bloqué vers Gemini. Vérifie la connexion / le pare-feu.'
  }
  const short = joined.replace(/key=[^&\s]+/gi, 'key=***').slice(0, 220)
  return short || 'Erreur Gemini.'
}

export class TutorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TutorError'
  }
}

async function generateWithModel(
  send: () => Promise<string>,
  retries = 2,
): Promise<string> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await send()
    } catch (err) {
      lastErr = err
      const msg = err instanceof Error ? err.message : ''
      if (!isRetryable(msg) || attempt === retries) break
      await sleep(800 * (attempt + 1))
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Gemini failed')
}

/** Appel via clé Google AI Studio (VITE_GEMINI_API_KEY). */
async function askWithApiKey(history: TutorTurn[], message: string): Promise<string> {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
  if (!apiKey) throw new TutorError('NO_GEMINI_KEY')

  const genAI = new GoogleGenerativeAI(apiKey)
  const historyPayload = toChatHistory(history)
  const errors: string[] = []

  for (const modelName of modelCandidates()) {
    try {
      return await generateWithModel(async () => {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        })
        const chat = model.startChat({ history: historyPayload })
        const result = await chat.sendMessage(message)
        const out = result.response.text()?.trim()
        if (!out) throw new Error('EMPTY_RESPONSE')
        return out
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(msg)
      if (isFatalKeyError(msg)) break
    }
  }

  throw new TutorError(formatGeminiError(errors))
}

/** Fallback Firebase AI Logic (Gemini Developer API du projet Firebase). */
async function askWithFirebaseAi(history: TutorTurn[], message: string): Promise<string> {
  const ai = getAI(app, { backend: new GoogleAIBackend() })
  const errors: string[] = []

  for (const modelName of modelCandidates()) {
    try {
      return await generateWithModel(async () => {
        const model = getGenerativeModel(ai, {
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
        })
        const chat = model.startChat({ history: toChatHistory(history) })
        const result = await chat.sendMessage(message)
        const out = result.response.text()?.trim()
        if (!out) throw new Error('EMPTY_RESPONSE')
        return out
      })
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  throw new TutorError(formatGeminiError(errors))
}

export function isGeminiConfigured() {
  return Boolean((import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim())
}

/**
 * Envoie un message au tuteur Gemini.
 * Priorité : clé VITE_GEMINI_API_KEY, sinon Firebase AI Logic.
 */
export async function askTutor(history: TutorTurn[], message: string): Promise<string> {
  const trimmed = message.trim()
  if (!trimmed) throw new TutorError('EMPTY_MESSAGE')

  if (isGeminiConfigured()) {
    return askWithApiKey(history, trimmed)
  }
  try {
    return await askWithFirebaseAi(history, trimmed)
  } catch {
    throw new TutorError(
      'Pas de VITE_GEMINI_API_KEY. Ajoutez votre clé Google AI Studio dans FRONTEND/.env puis relancez npm run serve dans FRONTEND.',
    )
  }
}

export function useGeminiTutor() {
  return { askTutor, isGeminiConfigured }
}
