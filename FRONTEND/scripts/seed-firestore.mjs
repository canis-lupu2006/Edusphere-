/**
 * Seed Firestore + Auth pour EduSphere (toutes maquettes).
 * Usage: node scripts/seed-firestore.mjs
 */
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCHlvCFiWB82SkRFE7AdYmxnTk4Iuqmtm4',
  authDomain: 'edusphere-69403.firebaseapp.com',
  projectId: 'edusphere-69403',
  storageBucket: 'edusphere-69403.firebasestorage.app',
  messagingSenderId: '912184776703',
  appId: '1:912184776703:web:0613d35297dfe9af1239ca',
}

const PASSWORD = 'Test1234!'
const now = () => Timestamp.now()

const IDS = {
  ecole: 'ecole_demo_lycee',
  ecole2: 'ecole_demo_ceg',
  classe: 'classe_tle_d',
  courseMath: 'course_math',
  courseFr: 'course_fr',
  coursePc: 'course_pc',
  courseSvt: 'course_svt',
  courseAng: 'course_ang',
  courseHg: 'course_hg',
  exerciseMath: 'exo_math_suites',
  exercisePc: 'exo_pc_circuits',
  announcement: 'annonce_rentree',
  attempt: 'attempt_demo_1',
  ticket1: 'ticket_suites',
  ticket2: 'ticket_equations',
  progressMath: 'progress_math',
  progressFr: 'progress_fr',
  progressSvt: 'progress_svt',
  progressAng: 'progress_ang',
  progressPhil: 'progress_phil',
  progressPc: 'progress_pc',
}

const FALLBACK_UIDS = {
  eleve: 'uid_eleve_demo',
  enseignant: 'uid_enseignant_demo',
  parent: 'uid_parent_demo',
  admin: 'uid_admin_demo',
  ministere: 'uid_ministere_demo',
}

const ACCOUNTS = [
  { key: 'eleve', email: 'eleve@edusphere.test', displayName: 'Ava Mensah', role: 'eleve' },
  { key: 'enseignant', email: 'enseignant@edusphere.test', displayName: 'Kodjo Aziaka', role: 'enseignant' },
  { key: 'parent', email: 'parent@edusphere.test', displayName: 'Boris Mensah', role: 'parent' },
  { key: 'admin', email: 'admin@edusphere.test', displayName: 'Sarah Adjowa', role: 'admin' },
  { key: 'ministere', email: 'ministere@edusphere.test', displayName: 'Ministère Éducation', role: 'ministere' },
]

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function ensureAuthUser({ email }) {
  const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD)
  await signOut(auth).catch(() => {})
  return cred.user.uid
}

async function signInExisting({ email }) {
  const cred = await signInWithEmailAndPassword(auth, email, PASSWORD)
  await signOut(auth).catch(() => {})
  return cred.user.uid
}

async function resolveUids() {
  const uids = { ...FALLBACK_UIDS }
  let authOk = true
  console.log('1) Comptes Auth…')
  for (const account of ACCOUNTS) {
    try {
      try {
        uids[account.key] = await ensureAuthUser(account)
        console.log(`  ✓ ${account.email}`)
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
          uids[account.key] = await signInExisting(account)
          console.log(`  → ${account.email}`)
        } else throw e
      }
    } catch (e) {
      authOk = false
      console.log(`  ✗ Auth: ${e.code || e.message}`)
      Object.assign(uids, FALLBACK_UIDS)
      break
    }
  }
  // Rester connecté pour les écritures Firestore (règles auth != null)
  if (authOk) {
    await signInWithEmailAndPassword(auth, 'admin@edusphere.test', PASSWORD)
    console.log('  ✓ Session admin pour le seed')
  }
  return { uids, authOk }
}

async function seed() {
  console.log('\n=== Seed EduSphere (maquettes v1.1) ===\n')
  const { uids, authOk } = await resolveUids()
  const t = now()

  console.log('2) ecoles, classes, users…')
  const ecolesSeed = [
    [IDS.ecole, 'Lycée Moderne de Lomé', 'Maritime', 'Lomé', 'Lycée', 'Secondaire', 1250, 78, 85, 18],
    [IDS.ecole2, 'CEG de Kpélé-Atavié', 'Plateaux', 'Kpélé', 'Collège', 'Secondaire', 420, 22, 28, 45],
    ['ecole_kara_1', 'Lycée de Kara', 'Kara', 'Kara', 'Lycée', 'Secondaire', 980, 54, 72, 22],
    ['ecole_sokode', 'Lycée de Sokodé', 'Centrale', 'Sokodé', 'Lycée', 'Secondaire', 1100, 61, 68, 30],
    ['ecole_dapaong', 'Lycée de Dapaong', 'Savanes', 'Dapaong', 'Lycée', 'Secondaire', 870, 48, 61, 35],
    ['ecole_atakpame', 'CEG d\'Atakpamé', 'Plateaux', 'Atakpamé', 'CEG', 'Secondaire', 560, 31, 55, 28],
    ['ecole_aneho', 'Lycée d\'Aného', 'Maritime', 'Aného', 'Lycée', 'Secondaire', 740, 39, 77, 15],
    ['ecole_kpalime', 'Lycée de Kpalimé', 'Plateaux', 'Kpalimé', 'Lycée', 'Secondaire', 920, 50, 70, 20],
    ['ecole_tsevie', 'CEG de Tsévié', 'Maritime', 'Tsévié', 'CEG', 'Secondaire', 390, 21, 48, 40],
    ['ecole_bassar', 'Lycée de Bassar', 'Kara', 'Bassar', 'Lycée', 'Secondaire', 650, 34, 58, 33],
    ['ecole_vogan', 'École primaire de Vogan', 'Maritime', 'Vogan', 'École primaire', 'Primaire', 280, 12, 64, 25],
    ['ecole_notse', 'Lycée technique de Notsé', 'Plateaux', 'Notsé', 'Lycée technique', 'Technique', 510, 28, 52, 38],
  ]
  for (const [id, nom, region, ville, type, niveau, elevesCount, enseignantsCount, maitrise, usageHorsLigne] of ecolesSeed) {
    await setDoc(doc(db, 'ecoles', id), {
      nom,
      name: nom,
      region,
      ville,
      type,
      niveau,
      elevesCount,
      enseignantsCount,
      maitrise,
      usageHorsLigne,
      createdAt: t,
    })
  }
  console.log(`  ✓ ${ecolesSeed.length} établissements`)
  await setDoc(doc(db, 'classes', IDS.classe), {
    nom: 'Terminale D',
    niveau: 'Terminale D',
    ecoleId: IDS.ecole,
    enseignantIds: [uids.enseignant],
    eleveIds: [uids.eleve],
    createdAt: t,
  })

  await setDoc(doc(db, 'users', uids.eleve), {
    role: 'eleve',
    email: 'eleve@edusphere.test',
    displayName: 'Ava Mensah',
    nom: 'Ava Mensah',
    classeId: IDS.classe,
    classeNom: 'Terminale D',
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Moderne de Lomé',
    status: 'actif',
    moyenne: 15,
    streak: 5,
  })
  await setDoc(doc(db, 'users', uids.enseignant), {
    role: 'enseignant',
    email: 'enseignant@edusphere.test',
    displayName: 'Kodjo Aziaka',
    nom: 'Kodjo Aziaka',
    classeIds: [IDS.classe],
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Moderne de Lomé',
    status: 'actif',
  })
  await setDoc(doc(db, 'users', uids.parent), {
    role: 'parent',
    email: 'parent@edusphere.test',
    displayName: 'Boris Mensah',
    nom: 'Boris Mensah',
    enfantIds: [uids.eleve],
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Moderne de Lomé',
  })
  await setDoc(doc(db, 'users', uids.admin), {
    role: 'admin',
    email: 'admin@edusphere.test',
    displayName: 'Sarah Adjowa',
    nom: 'Sarah Adjowa',
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Moderne de Lomé',
  })
  await setDoc(doc(db, 'users', uids.ministere), {
    role: 'ministere',
    email: 'ministere@edusphere.test',
    displayName: 'Ministère Éducation',
    nom: 'Ministère Éducation',
  })

  console.log('3) courses, exercises, attempts…')
  const courses = [
    [IDS.courseMath, 'Mathématiques', 'M. Kodjo Aziaka', 8],
    [IDS.courseFr, 'Français', 'Mme Adjoa Lawson', 10],
    [IDS.coursePc, 'Physique-Chimie', 'Mme Essowè Bakoma', 13],
    [IDS.courseSvt, 'SVT', 'M. Yao Kpodar', 10],
    [IDS.courseAng, 'Anglais', 'Mme Julia Cole', 11],
    [IDS.courseHg, 'Histoire-Géographie', 'M. Sena Amégan', 15],
  ]
  for (const [id, titre, enseignantNom, chapitres] of courses) {
    await setDoc(doc(db, 'courses', id), {
      titre,
      matiere: titre,
      description: `Cours de ${titre}`,
      classeId: IDS.classe,
      enseignantId: uids.enseignant,
      enseignantNom,
      chapitres,
      ressources: [],
      createdAt: t,
    })
  }

  await setDoc(doc(db, 'exercises', IDS.exerciseMath), {
    titre: 'Suites arithmétiques',
    matiere: 'Mathématiques',
    competence: 'Suites numériques',
    difficulte: 'Moyen',
    status: 'en_cours',
    courseId: IDS.courseMath,
    enseignantId: uids.enseignant,
    questions: [
      {
        id: 'q0',
        type: 'qcm',
        enonce: 'La raison d’une suite arithmétique u_n = 3 + 2n est :',
        options: ['2', '3', '5', 'n'],
        correctAnswer: '2',
      },
    ],
    createdAt: t,
  })
  await setDoc(doc(db, 'exercises', IDS.exercisePc), {
    titre: 'Circuits en série et dérivation',
    matiere: 'Physique-Chimie',
    competence: 'Électricité',
    difficulte: 'Moyen',
    status: 'termine',
    courseId: IDS.coursePc,
    enseignantId: uids.enseignant,
    questions: [
      {
        id: 'q0',
        type: 'vrai_faux',
        enonce: 'En série, l’intensité est la même dans tout le circuit.',
        correctAnswer: true,
      },
    ],
    createdAt: t,
  })
  await setDoc(doc(db, 'attempts', IDS.attempt), {
    eleveId: uids.eleve,
    eleveNom: 'Ava Mensah',
    exerciseId: IDS.exercisePc,
    courseId: IDS.coursePc,
    classeId: IDS.classe,
    answers: { q0: true },
    score: 78,
    scoreDetail: { score: 1, max: 1, percent: 78, details: [{ questionId: 'q0', correct: true }] },
    createdAt: t,
  })

  console.log('4) progress, homework, tickets…')
  const progresses = [
    [IDS.progressMath, 'Mathématiques', 90, 85],
    [IDS.progressFr, 'Français', 50, 50],
    [IDS.progressSvt, 'SVT', 97, 89],
    [IDS.progressAng, 'Anglais', 70, 65],
    [IDS.progressPhil, 'Philosophie', 50, 50],
    [IDS.progressPc, 'Physique-Chimie', 49, 55],
  ]
  for (const [id, matiere, percent, previousPercent] of progresses) {
    const payload = {
      eleveId: uids.eleve,
      matiere,
      percent,
      maitrise: percent,
      previousPercent,
    }
    if (matiere === 'Mathématiques') {
      payload.topics = [
        { titre: 'Fonctions et dérivées', percent: 78 },
        { titre: 'Suites numériques', percent: 52 },
        { titre: 'Probabilités', percent: 84 },
      ]
    }
    await setDoc(doc(db, 'progress', id), payload)
  }

  await setDoc(doc(db, 'homework', 'hw_math'), {
    titre: 'Fonctions logarithmes',
    matiere: 'Mathématiques',
    classeId: IDS.classe,
    eleveId: uids.eleve,
    enseignantId: uids.enseignant,
    echeance: 'Aujourd’hui',
    status: 'a_faire',
    createdAt: t,
  })
  await setDoc(doc(db, 'homework', 'hw_ang'), {
    titre: 'Essai argumentatif',
    matiere: 'Anglais',
    classeId: IDS.classe,
    eleveId: uids.eleve,
    enseignantId: uids.enseignant,
    echeance: 'Lundi',
    status: 'a_venir',
    createdAt: t,
  })
  await setDoc(doc(db, 'homework', 'hw_svt'), {
    titre: 'Respiration cellulaire',
    matiere: 'SVT',
    classeId: IDS.classe,
    eleveId: uids.eleve,
    enseignantId: uids.enseignant,
    echeance: 'Vendredi',
    status: 'en_cours',
    createdAt: t,
  })
  await setDoc(doc(db, 'homework', 'hw_fr_late'), {
    titre: 'Dissertation — Français',
    matiere: 'Français',
    classeId: IDS.classe,
    eleveId: uids.eleve,
    enseignantId: uids.enseignant,
    echeance: 'Hier',
    status: 'en_retard',
    createdAt: t,
  })

  await setDoc(doc(db, 'tickets', IDS.ticket1), {
    eleveId: uids.eleve,
    eleveNom: 'Ava Mensah',
    classeId: IDS.classe,
    classeNom: 'Terminale D',
    courseId: IDS.courseMath,
    notion: 'Suites géométriques',
    matiere: 'Mathématiques',
    message: 'Je bloque sur la raison d’une suite géométrique.',
    status: 'en_cours',
    priorite: 'normale',
    enseignantNom: 'M. Aziaka',
    assigneNom: 'Kodjo Aziaka',
    steps: [
      { label: 'Création', message: 'Ticket lié à la notion « Suites géométriques ».', done: true, at: 'Aujourd’hui 10:18' },
      { label: 'Notification', message: 'M. Aziaka a été alerté.', done: true, at: 'Aujourd’hui 10:20' },
      { label: 'Intervention', message: 'Séance de soutien prévue jeudi à 13h.', done: false, current: true, at: 'Aujourd’hui 11:05' },
      { label: 'Suivi', message: 'En attente', done: false, at: '--' },
      { label: 'Validation', message: 'En attente', done: false, at: '--' },
      { label: 'Clôture', message: 'En attente', done: false, at: '--' },
    ],
    createdAt: t,
  })
  await setDoc(doc(db, 'tickets', IDS.ticket2), {
    eleveId: uids.eleve,
    eleveNom: 'Ava Mensah',
    classeId: IDS.classe,
    classeNom: 'Terminale D',
    notion: 'Équilibrage d’équations',
    matiere: 'Physique-Chimie',
    message: 'Besoin d’aide sur l’équilibrage.',
    status: 'resolu',
    priorite: 'normale',
    enseignantNom: 'Mme Bakoma',
    assigneNom: 'Sarah Adjowa',
    createdAt: t,
  })
  await setDoc(doc(db, 'tickets', 'ticket_urgent'), {
    eleveId: uids.eleve,
    eleveNom: 'Ava Mensah',
    classeId: IDS.classe,
    classeNom: 'Terminale D',
    notion: 'Géométrie dans l’espace',
    matiere: 'Mathématiques',
    message: 'Aucune réponse depuis 5 jours',
    status: 'sans_reponse',
    priorite: 'urgent',
    assigneNom: 'Sarah Adjowa',
    createdAt: t,
  })

  console.log('5) groupes, epreuves, revisions, erreurs…')
  await setDoc(doc(db, 'groups', 'group_pc'), {
    titre: 'Physique — TP du jeudi',
    matiere: 'Physique-Chimie',
    description: 'Préparation collective des comptes-rendus de travaux pratiques.',
    memberIds: [uids.eleve],
    membresCount: 9,
    proposeIA: false,
    createdAt: t,
  })
  await setDoc(doc(db, 'groups', 'group_math'), {
    titre: 'Terminale D — Maths entraide',
    matiere: 'Mathématiques',
    description: 'Groupe permanent de la classe pour s’entraider sur suites et fonctions.',
    memberIds: [uids.eleve],
    membresCount: 18,
    proposeIA: false,
    createdAt: t,
  })
  await setDoc(doc(db, 'groups', 'group_ia_suites'), {
    titre: 'Groupe temporaire — Suites géométriques',
    matiere: 'Mathématiques',
    description: '2 camarades ayant une bonne maîtrise peuvent t’aider à progresser.',
    memberIds: [],
    membresCount: 2,
    proposeIA: true,
    status: 'pending',
    createdAt: t,
  })

  await setDoc(doc(db, 'epreuves', 'ep_pc'), {
    type: 'Examen',
    matiere: 'Physique-chimie',
    niveau: 'Terminale D',
    pays: 'Togo',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    titre: 'Bac blanc Physique',
  })
  await setDoc(doc(db, 'epreuves', 'ep_svt'), {
    type: 'Examen',
    matiere: 'SVT',
    niveau: 'Terminale D',
    pays: 'Togo',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    titre: 'Épreuve SVT',
  })
  await setDoc(doc(db, 'epreuves', 'ep_math'), {
    type: 'Devoir',
    matiere: 'Mathématiques',
    niveau: 'Terminale D',
    pays: 'Togo',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    titre: 'Devoir Suites',
  })

  await setDoc(doc(db, 'revisions', 'rev1'), {
    eleveId: uids.eleve,
    titre: 'Vocabulaire de la cellule (SVT)',
    whenLabel: 'Aujourd’hui',
    matiere: 'SVT',
    count: 3,
  })
  await setDoc(doc(db, 'revisions', 'rev2'), {
    eleveId: uids.eleve,
    titre: 'Dérivées usuelles (Mathématiques)',
    whenLabel: 'Demain',
    matiere: 'Mathématiques',
    count: 5,
  })
  await setDoc(doc(db, 'revisions', 'rev3'), {
    eleveId: uids.eleve,
    titre: 'Conjugaison — prétérit (Anglais)',
    whenLabel: 'Dans 3 jours',
    matiere: 'Anglais',
    count: 4,
  })

  await setDoc(doc(db, 'frequent_errors', 'err1'), {
    eleveId: uids.eleve,
    titre: 'Confusion suite arithmétique / géométrique',
    matiere: 'Mathématiques',
    notion: 'Suites numériques',
  })
  await setDoc(doc(db, 'frequent_errors', 'err2'), {
    eleveId: uids.eleve,
    titre: 'Erreur de signe en dérivation',
    matiere: 'Mathématiques',
    notion: 'Fonctions et dérivées',
  })
  await setDoc(doc(db, 'frequent_errors', 'err3'), {
    eleveId: uids.eleve,
    titre: 'Accord du participe passé',
    matiere: 'Français',
    notion: 'Grammaire',
  })

  await setDoc(doc(db, 'tutor_sessions', 'ts1'), {
    eleveId: uids.eleve,
    titre: 'Fonctions et dérivées',
    createdAt: t,
  })
  await setDoc(doc(db, 'tutor_sessions', 'ts2'), {
    eleveId: uids.eleve,
    titre: 'Probabilités conditionnelles',
    createdAt: t,
  })

  console.log('6) teacher AI / programme / comprehension…')
  await setDoc(doc(db, 'ai_contents', 'ai1'), {
    notion: 'Suites géométriques',
    type: "Série d'exercices",
    apercu: '« Détermine la raison de la suite... »',
    status: 'en_attente',
    enseignantId: uids.enseignant,
    classeId: IDS.classe,
    matiere: 'Mathématiques',
    createdAt: t,
  })
  await setDoc(doc(db, 'ai_contents', 'ai2'), {
    notion: 'Dérivées composées',
    type: 'Explication alternative',
    apercu: '« Reprenons la règle de la chaîne... »',
    status: 'en_attente',
    enseignantId: uids.enseignant,
    createdAt: t,
  })
  await setDoc(doc(db, 'ai_contents', 'ai3'), {
    notion: 'Probabilités',
    type: 'Quiz de révision',
    apercu: '« 8 questions à choix multiples... »',
    status: 'en_attente',
    enseignantId: uids.enseignant,
    createdAt: t,
  })

  const programmeSubjects = [
    ['Terminale D', 'Mathématiques', 12],
    ['Terminale D', 'Physique-Chimie', 15],
    ['Terminale D', 'Français', 10],
    ['Terminale D', 'Histoire-Géographie', 15],
    ['Terminale D', 'Anglais', 9],
    ['Terminale D', 'SVT', 19],
    ['Première D', 'Mathématiques', 11],
    ['Première D', 'Physique-Chimie', 12],
    ['Première D', 'Français', 9],
    ['Première D', 'SVT', 14],
  ]
  for (const [niveau, matiere, chapitresCount] of programmeSubjects) {
    const id = `prog_${niveau}_${matiere}`.replace(/\s+/g, '_').toLowerCase()
    await setDoc(doc(db, 'programmes', id), {
      niveau,
      matiere,
      chapitresCount,
      pays: 'TOGO',
      updatedAt: t,
    })
  }

  const chapters = [
    ['ch1', 'Suites numériques', 'Mathématiques', 'Terminale D', 'planifie', 'valides'],
    ['ch2', 'Fonctions et dérivées', 'Mathématiques', 'Terminale D', 'en_cours', 'valides'],
    ['ch3', 'Probabilités conditionnelles', 'Mathématiques', 'Terminale D', 'termine', 'valides'],
    ['ch4', "Géométrie dans l'espace", 'Mathématiques', 'Terminale D', 'a_planifier', 'en_attente'],
    ['ch5', 'Intégrales', 'Mathématiques', 'Terminale D', 'planifie', 'valides'],
    ['ch6', 'Circuits électriques', 'Physique-Chimie', 'Terminale D', 'en_cours', 'valides'],
    ['ch7', 'Réactions d\'oxydoréduction', 'Physique-Chimie', 'Terminale D', 'planifie', 'en_attente'],
    ['ch8', 'Dissertation littéraire', 'Français', 'Terminale D', 'en_cours', 'valides'],
    ['ch9', 'Le monde depuis 1945', 'Histoire-Géographie', 'Terminale D', 'planifie', 'valides'],
    ['ch10', 'Reading comprehension', 'Anglais', 'Terminale D', 'termine', 'valides'],
    ['ch11', 'Génétique mendélienne', 'SVT', 'Terminale D', 'en_cours', 'valides'],
    ['ch12', 'Écosystèmes tropicaux', 'SVT', 'Terminale D', 'planifie', 'valides'],
  ]
  for (const [id, titre, matiere, niveau, status, contenusIA] of chapters) {
    await setDoc(doc(db, 'program_chapters', id), {
      titre,
      pays: 'TOGO',
      niveau,
      matiere,
      status,
      contenusIA,
      enseignantId: uids.enseignant,
    })
  }
  console.log(`  ✓ ${programmeSubjects.length} fiches programmes + ${chapters.length} chapitres`)

  const notions = [
    ['c1', 'Suites géométriques', 24, 76],
    ['c2', 'Dérivées composées', 41, 59],
    ['c3', 'Probabilités conditionnelles', 12, 88],
    ['c4', "Géométrie dans l'espace", 54, 46],
  ]
  for (const [id, notion, difficultePercent, maitrisePercent] of notions) {
    await setDoc(doc(db, 'comprehension', id), {
      notion,
      classeId: IDS.classe,
      classeNom: 'Terminale D',
      matiere: 'Mathématiques',
      difficultePercent,
      maitrisePercent,
      enseignantId: uids.enseignant,
    })
  }

  console.log('7) messages, alerts, schedules, events, logs…')
  await setDoc(doc(db, 'messages', 'msg1'), {
    type: 'enseignant',
    fromId: uids.enseignant,
    fromNom: 'M. Kodjo Aziaka',
    fromRole: 'Professeur de Mathématiques',
    toId: uids.parent,
    eleveId: uids.eleve,
    preview: 'Je vous propose un point rapide jeudi sur les suites géométriques.',
    lu: false,
    createdAt: t,
  })
  await setDoc(doc(db, 'messages', 'msg2'), {
    type: 'administration',
    fromNom: 'Administration',
    toId: uids.parent,
    eleveId: uids.eleve,
    preview: 'Rappel : réunion parents-professeurs le 5 septembre',
    lu: true,
    createdAt: t,
  })

  await setDoc(doc(db, 'alerts', 'al1'), {
    type: 'difficulte',
    titre: 'Difficulté persistante détectée',
    detail: 'Suites géométriques • Mathématiques',
    eleveId: uids.eleve,
    ecoleId: IDS.ecole,
    status: 'Ticket ouvert',
    priorite: 'haute',
    createdAt: t,
  })
  await setDoc(doc(db, 'alerts', 'al2'), {
    type: 'retard',
    titre: 'Devoir en retard',
    detail: 'Dissertation — Français, échéance dépassée de 1 jour',
    eleveId: uids.eleve,
    ecoleId: IDS.ecole,
    status: 'À suivre',
    createdAt: t,
  })
  await setDoc(doc(db, 'alerts', 'al3'), {
    type: 'admin',
    titre: 'Notation difficile détectée sur 3 classes',
    detail: "Géométrie dans l'espace",
    ecoleId: IDS.ecole,
    status: 'À surveiller',
    createdAt: t,
  })

  await setDoc(doc(db, 'schedules', 'sch1'), {
    classeId: IDS.classe,
    jour: 'Lun',
    debut: '7h00',
    fin: '7h45',
    matiere: 'Mathématiques',
    enseignantNom: 'Mme Kouassi',
    salle: 'Salle 203',
    type: 'cours',
  })
  await setDoc(doc(db, 'schedules', 'sch2'), {
    classeId: IDS.classe,
    jour: 'Mar',
    debut: '7h50',
    fin: '8h35',
    matiere: 'Histoire-Géo',
    enseignantNom: 'M. Amégan',
    salle: 'Salle 201',
    type: 'examen',
  })
  await setDoc(doc(db, 'schedules', 'sch3'), {
    classeId: IDS.classe,
    jour: 'Mer',
    debut: '9h40',
    fin: '10h25',
    matiere: 'EPS',
    enseignantNom: 'M. Traoré',
    salle: 'Gymnase',
    type: 'activite',
  })

  await setDoc(doc(db, 'events', 'ev1'), {
    titre: 'Réunion parents-professeurs',
    dateLabel: '5 septembre, 16h00',
    ecoleId: IDS.ecole,
    classeId: IDS.classe,
    createdAt: t,
  })
  await setDoc(doc(db, 'events', 'ev2'), {
    titre: 'Conseil de classe (Terminale D)',
    dateLabel: '12 septembre, 15h00',
    ecoleId: IDS.ecole,
    classeId: IDS.classe,
    createdAt: t,
  })

  await setDoc(doc(db, 'activity_logs', 'act1'), {
    type: 'eleve',
    message: 'Kossi A. en 2nde A inscrit',
    ecoleId: IDS.ecole,
    createdAt: t,
  })
  await setDoc(doc(db, 'activity_logs', 'act2'), {
    type: 'annonce',
    message: 'Réunion parents – 26 mai publiée',
    ecoleId: IDS.ecole,
    createdAt: t,
  })
  await setDoc(doc(db, 'activity_logs', 'act3'), {
    type: 'rapport',
    message: 'Rapport mensuel – Mai 2025 exporté',
    ecoleId: IDS.ecole,
    createdAt: t,
  })

  await setDoc(doc(db, 'school_announcements', IDS.announcement), {
    titre: 'Rentrée 2026',
    message: 'Bienvenue sur EduSphere. Les cours démarrent lundi.',
    ecoleId: IDS.ecole,
    createdAt: t,
  })

  console.log('\n=== Seed terminé ===')
  console.log(`Auth: ${authOk ? 'OK' : 'UIDs démo'}`)
  console.log(`Mot de passe: ${PASSWORD}`)
  for (const a of ACCOUNTS) console.log(`  ${a.role.padEnd(12)} ${a.email}`)
  console.log('')
  await signOut(auth).catch(() => {})
}

seed().catch((err) => {
  console.error('\nÉchec:', err.code || '', err.message)
  process.exit(1)
})
