import type { Timestamp, FieldValue } from 'firebase/firestore'
import type { Component } from 'vue'

/** Rôles applicatifs EduSphere */
export type UserRole = 'eleve' | 'enseignant' | 'parent' | 'admin' | 'ministere'

export interface UserProfile {
  uid: string
  id?: string
  role: UserRole | null
  email?: string
  displayName?: string
  nom?: string
  classeId?: string
  classeIds?: string[]
  classeNom?: string
  ecoleId?: string
  ecoleNom?: string
  enfantIds?: string[]
  [key: string]: unknown
}

export interface ResourceItem {
  titre?: string
  name?: string
  url: string
}

export interface Course {
  id: string
  titre?: string
  matiere?: string
  description?: string
  classeId?: string
  enseignantId?: string
  enseignantNom?: string
  ressources?: ResourceItem[]
  resources?: ResourceItem[]
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

export type QuestionType = 'qcm' | 'vrai_faux' | 'vrai-faux' | 'court' | 'reponse_courte'

export type QuestionOption = string | { label?: string; value?: string }

export interface ExerciseQuestion {
  id: string
  type: QuestionType | string
  enonce?: string
  question?: string
  options?: QuestionOption[]
  correctAnswer?: string | boolean
  reponseCorrecte?: string | boolean
}

export interface Exercise {
  id: string
  titre?: string
  description?: string
  courseId?: string
  enseignantId?: string
  matiere?: string
  questions?: ExerciseQuestion[]
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

export type TicketStatus = 'ouvert' | 'en_cours' | 'resolu' | string

export interface Ticket {
  id: string
  eleveId?: string
  eleveNom?: string
  classeId?: string
  courseId?: string
  courseTitre?: string
  exerciseId?: string
  message?: string
  status?: TicketStatus
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

export interface Attempt {
  id: string
  eleveId?: string
  eleveNom?: string
  exerciseId?: string
  courseId?: string
  classeId?: string
  answers?: Record<string, unknown>
  score?: number
  scoreDetail?: ScoreResult
  recommendation?: string
  analyse?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

export interface ProgressRecord {
  id: string
  eleveId?: string
  matiere?: string
  courseTitre?: string
  percent?: number
  maitrise?: number
  [key: string]: unknown
}

export interface ScoreDetail {
  questionId: string
  correct: boolean
}

export interface ScoreResult {
  score: number
  max: number
  percent: number
  details: ScoreDetail[]
}

export interface NavItem {
  to: string
  label: string
  icon: Component
  exact?: boolean
  badge?: string | number
}

export interface SchoolAnnouncement {
  id: string
  titre?: string
  title?: string
  message?: string
  contenu?: string
  ecoleId?: string
  [key: string]: unknown
}

export interface School {
  id: string
  nom?: string
  name?: string
  region?: string
  ville?: string
  [key: string]: unknown
}

export interface ClassRecord {
  id: string
  nom?: string
  niveau?: string
  ecoleId?: string
  enseignantIds?: string[]
  eleveIds?: string[]
  [key: string]: unknown
}
