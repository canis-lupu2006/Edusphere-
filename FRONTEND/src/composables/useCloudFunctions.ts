import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

type TicketSummaryPayload = {
  classeId?: string
  courseId?: string
}

export type CreateSchoolPayload = {
  nom: string
  region: string
  ville: string
  type: string
  niveau?: string
  elevesCount?: number
  enseignantsCount?: number
  maitrise?: number
  adminEmail: string
  adminNom: string
}

export type CreateSchoolResult = {
  ecoleId: string
  adminUid: string
  adminEmail: string
  adminNom: string
  tempPassword: string
  ecoleNom: string
}

export type CreateTeacherPayload = {
  nom: string
  email: string
  classeId?: string
}

export type CreateTeacherResult = {
  uid: string
  email: string
  nom: string
  tempPassword: string
  role: string
  ecoleId: string
  classeId: string | null
  classeNom: string | null
}

export type CreateStudentPayload = {
  eleveNom: string
  eleveEmail: string
  classeId: string
  parentNom: string
  parentEmail: string
}

export type CreateStudentResult = {
  eleve: { uid: string; email: string; nom: string; tempPassword: string }
  parent: { uid: string; email: string; nom: string; tempPassword: string }
  classeId: string
  classeNom: string
  ecoleId: string
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
    createSchoolWithAdmin: (payload: CreateSchoolPayload) =>
      call<CreateSchoolResult>('createSchoolWithAdmin', { ...payload }),
    createTeacher: (payload: CreateTeacherPayload) =>
      call<CreateTeacherResult>('createTeacher', { ...payload }),
    createStudentWithParent: (payload: CreateStudentPayload) =>
      call<CreateStudentResult>('createStudentWithParent', { ...payload }),
  }
}
