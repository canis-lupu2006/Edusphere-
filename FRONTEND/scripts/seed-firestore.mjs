/**
 * Seed Firestore de test pour EduSphere (sans Auth obligatoire).
 * Usage: node scripts/seed-firestore.mjs
 *
 * Si Auth Email/Password est activé, crée aussi les comptes de test.
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

const IDS = {
  ecole: 'ecole_demo_lycee',
  classe: 'classe_2nde_a',
  courseMath: 'course_math_equations',
  courseFr: 'course_fr_dissertation',
  exerciseMath: 'exo_math_qcm1',
  exerciseFr: 'exo_fr_vrai_faux',
  announcement: 'annonce_rentree',
  attempt: 'attempt_demo_1',
  ticket: 'ticket_demo_1',
  progressMath: 'progress_math_demo',
  progressFr: 'progress_fr_demo',
}

/** UIDs de secours si Auth n'est pas encore configuré */
const FALLBACK_UIDS = {
  eleve: 'uid_eleve_demo',
  enseignant: 'uid_enseignant_demo',
  parent: 'uid_parent_demo',
  admin: 'uid_admin_demo',
  ministere: 'uid_ministere_demo',
}

const ACCOUNTS = [
  { key: 'eleve', email: 'eleve@edusphere.test', displayName: 'Awa Diallo', role: 'eleve' },
  { key: 'enseignant', email: 'enseignant@edusphere.test', displayName: 'M. Ndiaye', role: 'enseignant' },
  { key: 'parent', email: 'parent@edusphere.test', displayName: 'Mme Diallo', role: 'parent' },
  { key: 'admin', email: 'admin@edusphere.test', displayName: 'Admin Collège', role: 'admin' },
  { key: 'ministere', email: 'ministere@edusphere.test', displayName: 'Agent Ministère', role: 'ministere' },
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
        console.log(`  ✓ Auth créé: ${account.email}`)
      } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
          uids[account.key] = await signInExisting(account)
          console.log(`  → Auth existant: ${account.email}`)
        } else {
          throw e
        }
      }
    } catch (e) {
      authOk = false
      console.log(`  ✗ Auth indisponible (${e.code || e.message})`)
      console.log('  → Seed Firestore avec UIDs de démo (active Email/Password puis relance)')
      break
    }
  }

  if (!authOk) {
    Object.assign(uids, FALLBACK_UIDS)
  }

  return { uids, authOk }
}

async function seed() {
  console.log('\n=== Seed EduSphere (edusphere-69403) ===\n')

  const { uids, authOk } = await resolveUids()
  const now = Timestamp.now()

  console.log('\n2) ecoles…')
  await setDoc(doc(db, 'ecoles', IDS.ecole), {
    nom: 'Lycée Demo Dakar',
    name: 'Lycée Demo Dakar',
    region: 'Dakar',
    ville: 'Dakar',
    createdAt: now,
  })

  console.log('3) classes…')
  await setDoc(doc(db, 'classes', IDS.classe), {
    nom: '2nde A',
    niveau: '2nde',
    ecoleId: IDS.ecole,
    enseignantIds: [uids.enseignant],
    eleveIds: [uids.eleve],
    createdAt: now,
  })

  console.log('4) users…')
  await setDoc(doc(db, 'users', uids.eleve), {
    role: 'eleve',
    email: 'eleve@edusphere.test',
    displayName: 'Awa Diallo',
    nom: 'Awa Diallo',
    classeId: IDS.classe,
    classeNom: '2nde A',
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Demo Dakar',
  })
  await setDoc(doc(db, 'users', uids.enseignant), {
    role: 'enseignant',
    email: 'enseignant@edusphere.test',
    displayName: 'M. Ndiaye',
    nom: 'M. Ndiaye',
    classeIds: [IDS.classe],
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Demo Dakar',
  })
  await setDoc(doc(db, 'users', uids.parent), {
    role: 'parent',
    email: 'parent@edusphere.test',
    displayName: 'Mme Diallo',
    nom: 'Mme Diallo',
    enfantIds: [uids.eleve],
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Demo Dakar',
  })
  await setDoc(doc(db, 'users', uids.admin), {
    role: 'admin',
    email: 'admin@edusphere.test',
    displayName: 'Admin Collège',
    nom: 'Admin Collège',
    ecoleId: IDS.ecole,
    ecoleNom: 'Lycée Demo Dakar',
  })
  await setDoc(doc(db, 'users', uids.ministere), {
    role: 'ministere',
    email: 'ministere@edusphere.test',
    displayName: 'Agent Ministère',
    nom: 'Agent Ministère',
  })

  console.log('5) courses…')
  await setDoc(doc(db, 'courses', IDS.courseMath), {
    titre: 'Équations du 1er degré',
    matiere: 'Mathématiques',
    description: 'Résoudre des équations simples ax + b = c.',
    classeId: IDS.classe,
    enseignantId: uids.enseignant,
    enseignantNom: 'M. Ndiaye',
    ressources: [{ titre: 'Fiche résumé', url: 'https://example.com/equations.pdf' }],
    createdAt: now,
  })
  await setDoc(doc(db, 'courses', IDS.courseFr), {
    titre: 'Dissertation — intro',
    matiere: 'Français',
    description: 'Structurer une introduction de dissertation.',
    classeId: IDS.classe,
    enseignantId: uids.enseignant,
    enseignantNom: 'M. Ndiaye',
    ressources: [],
    createdAt: now,
  })

  console.log('6) exercises…')
  await setDoc(doc(db, 'exercises', IDS.exerciseMath), {
    titre: 'QCM — Équations',
    description: 'Vérifie tes bases.',
    courseId: IDS.courseMath,
    enseignantId: uids.enseignant,
    matiere: 'Mathématiques',
    questions: [
      {
        id: 'q0',
        type: 'qcm',
        enonce: 'Quelle est la solution de 2x + 4 = 10 ?',
        options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
        correctAnswer: 'x = 3',
      },
      {
        id: 'q1',
        type: 'vrai_faux',
        enonce: "Dans ax + b = 0, si a = 0 et b ≠ 0, il n'y a pas de solution.",
        correctAnswer: true,
      },
      {
        id: 'q2',
        type: 'court',
        enonce: 'Résous : x - 5 = 2 (répondre avec le nombre seulement)',
        correctAnswer: '7',
      },
    ],
    createdAt: now,
  })
  await setDoc(doc(db, 'exercises', IDS.exerciseFr), {
    titre: 'Vrai/Faux — Dissertation',
    description: 'Notions de base.',
    courseId: IDS.courseFr,
    enseignantId: uids.enseignant,
    matiere: 'Français',
    questions: [
      {
        id: 'q0',
        type: 'vrai_faux',
        enonce: 'Une introduction de dissertation contient une problématique.',
        correctAnswer: true,
      },
    ],
    createdAt: now,
  })

  console.log('7) attempts…')
  await setDoc(doc(db, 'attempts', IDS.attempt), {
    eleveId: uids.eleve,
    eleveNom: 'Awa Diallo',
    exerciseId: IDS.exerciseMath,
    courseId: IDS.courseMath,
    classeId: IDS.classe,
    answers: { q0: 'x = 3', q1: true, q2: '7' },
    score: 100,
    scoreDetail: {
      score: 3,
      max: 3,
      percent: 100,
      details: [
        { questionId: 'q0', correct: true },
        { questionId: 'q1', correct: true },
        { questionId: 'q2', correct: true },
      ],
    },
    recommendation: "Continue sur les systèmes d'équations.",
    analyse: 'Excellente maîtrise des équations simples.',
    createdAt: now,
  })

  console.log('8) tickets…')
  await setDoc(doc(db, 'tickets', IDS.ticket), {
    eleveId: uids.eleve,
    eleveNom: 'Awa Diallo',
    classeId: IDS.classe,
    courseId: IDS.courseMath,
    courseTitre: 'Équations du 1er degré',
    exerciseId: IDS.exerciseMath,
    message: 'Je bloque sur les équations avec fractions.',
    status: 'ouvert',
    createdAt: now,
  })

  console.log('9) progress…')
  await setDoc(doc(db, 'progress', IDS.progressMath), {
    eleveId: uids.eleve,
    matiere: 'Mathématiques',
    courseTitre: 'Équations du 1er degré',
    percent: 85,
    maitrise: 85,
  })
  await setDoc(doc(db, 'progress', IDS.progressFr), {
    eleveId: uids.eleve,
    matiere: 'Français',
    courseTitre: 'Dissertation — intro',
    percent: 60,
    maitrise: 60,
  })

  console.log('10) school_announcements…')
  await setDoc(doc(db, 'school_announcements', IDS.announcement), {
    titre: 'Rentrée 2026',
    title: 'Rentrée 2026',
    message: 'Bienvenue sur EduSphere. Les cours démarrent lundi.',
    contenu: 'Bienvenue sur EduSphere. Les cours démarrent lundi.',
    ecoleId: IDS.ecole,
    createdAt: now,
  })

  console.log('\n=== Seed terminé ===')
  console.log(`Auth: ${authOk ? 'OK' : 'non configuré (UIDs démo)'}`)
  if (authOk) {
    console.log(`Mot de passe: ${PASSWORD}`)
    for (const a of ACCOUNTS) console.log(`  ${a.role.padEnd(12)} ${a.email}`)
  } else {
    console.log('Active Authentication → Sign-in method → Email/Password, puis relance:')
    console.log('  node scripts/seed-firestore.mjs')
  }
  console.log('')
}

seed().catch((err) => {
  console.error('\nÉchec du seed:', err.code || '', err.message)
  if (err.code === 'permission-denied') {
    console.error('→ Règles Firestore trop strictes. Passe en mode test ou autorise write temporairement.')
  }
  process.exit(1)
})
