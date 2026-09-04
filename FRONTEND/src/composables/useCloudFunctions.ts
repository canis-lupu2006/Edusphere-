import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

type TicketSummaryPayload = {
  classeId?: string
  courseId?: string
}

/**
 * Wrappers des Cloud Functions EduSphere.
 */
export function useCloudFunctions() {
  async function call<T = unknown>(name: string, payload: Record<string, unknown> = {}): Promise<T> {
    const fn = httpsCallable(functions, name)
    const result = await fn(payload)
    return result.data as T
  }

  return {
    tutorAI: (message: string) => call('tutorAI', { message }),
    analyzeAttempt: (attemptId: string) => call('analyzeAttempt', { attemptId }),
    getTicketSummary: ({ classeId, courseId }: TicketSummaryPayload = {}) =>
      call('getTicketSummary', { classeId, courseId }),
  }
}
