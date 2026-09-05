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
  status?: 'actif' | 'inactif' | string
  moyenne?: number
  photoURL?: string
  [key: string]: unknown
}

export interface ResourceItem {
  id?: string
  titre?: string
  name?: string
  url: string
  fileType?: string
  storagePath?: string
  uploadedAt?: Timestamp | FieldValue | string
}

export interface Course {
  id: string
  titre?: string
  matiere?: string
  description?: string
  /** Texte du cours (lecture élève) */
  contenuTexte?: string
  classeId?: string
  classeNom?: string
  enseignantId?: string
  enseignantNom?: string
  chapitres?: number | unknown[]
  ressources?: ResourceItem[]
  resources?: ResourceItem[]
  status?: 'brouillon' | 'publie' | string
  createdAt?: Timestamp | FieldValue
  updatedAt?: Timestamp | FieldValue
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

export type ExerciseDifficulty = 'facile' | 'moyen' | 'difficile' | string
export type ExerciseStatus = 'a_faire' | 'en_cours' | 'termine' | string

export interface Exercise {
  id: string
  titre?: string
  description?: string
  courseId?: string
  enseignantId?: string
  matiere?: string
  competence?: string
  difficulte?: ExerciseDifficulty
  status?: ExerciseStatus
  questions?: ExerciseQuestion[]
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

export type TicketStatus =
  | 'ouvert'
  | 'en_cours'
  | 'resolu'
  | 'nouveau'
  | 'intervention'
  | 'sans_reponse'
  | string

export interface TicketStep {
  label?: string
  titre?: string
  description?: string
  done?: boolean
  active?: boolean
  at?: string | Timestamp | FieldValue
}

export interface Ticket {
  id: string
  eleveId?: string
  eleveNom?: string
  classeId?: string
  classeNom?: string
  courseId?: string
  courseTitre?: string
  exerciseId?: string
  notion?: string
  matiere?: string
  message?: string
  status?: TicketStatus
  priorite?: 'normale' | 'urgent' | string
  assigneA?: string
  assigneNom?: string
  enseignantNom?: string
  enseignantId?: string
  steps?: TicketStep[]
  groupé?: boolean
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

export interface ProgressTopic {
  titre?: string
  notion?: string
  percent?: number
  maitrise?: number
}

export interface ProgressRecord {
  id: string
  eleveId?: string
  matiere?: string
  courseTitre?: string
  percent?: number
  maitrise?: number
  previousPercent?: number
  topics?: ProgressTopic[]
  competences?: ProgressTopic[]
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
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

export interface School {
  id: string
  nom?: string
  name?: string
  region?: string
  ville?: string
  type?: string
  niveau?: string
  elevesCount?: number
  enseignantsCount?: number
  maitrise?: number
  usageHorsLigne?: number
  [key: string]: unknown
}

export interface ClassRecord {
  id: string
  nom?: string
  niveau?: string
  ecoleId?: string
  enseignantIds?: string[]
  eleveIds?: string[]
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Contenus IA à valider (enseignant) */
export interface AiContent {
  id: string
  notion?: string
  type?: string
  apercu?: string
  status?: 'en_attente' | 'valide' | 'rejete' | string
  enseignantId?: string
  classeId?: string
  matiere?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Ressources importées */
export interface TeacherResource {
  id: string
  titre?: string
  url?: string
  fileName?: string
  fileType?: string
  storagePath?: string
  enseignantId?: string
  courseId?: string
  classeId?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Chapitres du programme officiel */
export type ChapterStatus = 'planifie' | 'en_cours' | 'termine' | 'a_planifier' | string

export interface ProgramChapter {
  id: string
  titre?: string
  pays?: string
  niveau?: string
  matiere?: string
  status?: ChapterStatus
  contenusIA?: 'valides' | 'en_attente' | string
  enseignantId?: string
  [key: string]: unknown
}

/** Fiche matière / niveau (vue ministère programmes) */
export interface ProgramSubject {
  id: string
  niveau?: string
  matiere?: string
  chapitresCount?: number
  pays?: string
  [key: string]: unknown
}

/** Version PDF publiée d'un programme */
export interface ProgramVersion {
  id: string
  niveau?: string
  matiere?: string
  fileName?: string
  url?: string
  storagePath?: string
  version?: number
  createdBy?: string | null
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Compréhension d'une notion par classe */
export interface ComprehensionTopic {
  id: string
  notion?: string
  classeId?: string
  classeNom?: string
  matiere?: string
  difficultePercent?: number
  maitrisePercent?: number
  enseignantId?: string
  [key: string]: unknown
}

/** Devoirs */
export type HomeworkStatus = 'a_faire' | 'en_cours' | 'a_venir' | 'rendu' | 'en_retard' | string

export interface Homework {
  id: string
  titre?: string
  matiere?: string
  classeId?: string
  eleveId?: string
  enseignantId?: string
  echeance?: Timestamp | FieldValue | string
  status?: HomeworkStatus
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Messages parent / admin / enseignant */
export interface MessageThread {
  id: string
  type?: 'enseignant' | 'administration' | string
  fromId?: string
  fromNom?: string
  fromRole?: string
  toId?: string
  eleveId?: string
  sujet?: string
  preview?: string
  lu?: boolean
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Alertes parent / admin */
export interface AlertItem {
  id: string
  type?: string
  titre?: string
  detail?: string
  eleveId?: string
  ecoleId?: string
  status?: string
  priorite?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Emploi du temps */
export interface ScheduleSlot {
  id: string
  classeId?: string
  jour?: string
  debut?: string
  fin?: string
  matiere?: string
  enseignantNom?: string
  salle?: string
  type?: 'cours' | 'examen' | 'activite' | string
  [key: string]: unknown
}

export interface SchoolEvent {
  id: string
  titre?: string
  dateLabel?: string
  ecoleId?: string
  classeId?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

export interface ActivityLog {
  id: string
  type?: string
  message?: string
  ecoleId?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Groupes d'entraide élève */
export interface Group {
  id: string
  nom?: string
  titre?: string
  matiere?: string
  description?: string
  memberIds?: string[]
  membresCount?: number
  proposeIA?: boolean
  status?: 'pending' | 'actif' | 'active' | 'refuse' | string
  temporaires?: boolean
  expiresInDays?: number
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Banque d'épreuves */
export interface Epreuve {
  id: string
  type?: string
  matiere?: string
  niveau?: string
  pays?: string
  etablissement?: string
  chapitre?: string
  url?: string
  titre?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Révisions programmées (répétition espacée) */
export interface Revision {
  id: string
  eleveId?: string
  titre?: string
  matiere?: string
  dueLabel?: string
  dueInDays?: number
  count?: number
  date?: Timestamp | FieldValue | string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Erreurs fréquentes détectées */
export interface FrequentError {
  id: string
  eleveId?: string
  titre?: string
  matiere?: string
  notion?: string
  competence?: string
  icon?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}

/** Sessions tuteur IA */
export interface TutorSession {
  id: string
  eleveId?: string
  titre?: string
  notion?: string
  matiere?: string
  icon?: string
  createdAt?: Timestamp | FieldValue
  [key: string]: unknown
}
