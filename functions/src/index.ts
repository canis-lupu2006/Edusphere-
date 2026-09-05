/**
 * EduSphere — Cloud Functions
 * Callable: tutorAI, analyzeAttempt, getTicketSummary,
 * createSchoolWithAdmin, createTeacher, createStudentWithParent
 */
import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10, region: "us-central1"});

initializeApp();
const db = getFirestore();
const authAdmin = getAuth();

type ScoreDetail = {
  questionId?: string;
  correct?: boolean;
};

type AttemptData = {
  eleveId?: string;
  exerciseId?: string;
  courseId?: string;
  classeId?: string;
  score?: number;
  scoreDetail?: {
    score?: number;
    max?: number;
    percent?: number;
    details?: ScoreDetail[];
  };
  answers?: Record<string, unknown>;
};

type TicketData = {
  message?: string;
  status?: string;
  classeId?: string;
  courseId?: string;
  eleveNom?: string;
  courseTitre?: string;
};

type ExerciseQuestion = {
  id?: string;
  enonce?: string;
  type?: string;
};

/**
 * Réponse tuteur pédagogique (règles locales, démo hackathon).
 * @param {string} message Question de l'élève
 * @return {string} Réponse guidée
 */
function tutorReply(message: string): string {
  const m = message.toLowerCase();

  if (/équation|equation|ax\s*\+|résoudre|resoudre/.test(m)) {
    return (
      "Pour une équation du type ax + b = c :\n" +
      "1) Isole le terme en x (soustrais b des deux côtés).\n" +
      "2) Divise par a (si a ≠ 0).\n" +
      "Exemple : 2x + 4 = 10 → 2x = 6 → x = 3.\n" +
      "Dis-moi où tu bloques exactement " +
      "(isolement ou division) ?"
    );
  }

  if (/fraction|numérateur|denominateur|dénominateur/.test(m)) {
    return (
      "Avec des fractions : mets au même dénominateur " +
      "avant d’additionner, et pour une équation multiplie " +
      "les deux côtés par le dénominateur pour simplifier.\n" +
      "Tu peux me donner l’équation précise ?"
    );
  }

  if (/dissertation|introduction|problématique|plan/.test(m)) {
    return (
      "Une intro de dissertation = accroche + " +
      "présentation du sujet + problématique + " +
      "annonce du plan.\n" +
      "Commence par reformuler le sujet en une " +
      "question claire. Quel est ton sujet exact ?"
    );
  }

  if (/qcm|exercice|réviser|reviser|aide/.test(m)) {
    return (
      "Je peux t’aider pas à pas. Décris la question " +
      "ou la notion (ex. équations, fractions, " +
      "dissertation) et je te guide sans te donner " +
      "directement la réponse finale."
    );
  }

  return (
    `Tu as écrit : « ${message.trim()} ».\n` +
    "Je suis ton tuteur EduSphere. Reformule ta " +
    "difficulté en une phrase (matière + ce que tu " +
    "ne comprends pas), et on avance étape par étape."
  );
}

/**
 * Construit analyse + recommandation à partir du score.
 * @param {AttemptData} attempt Tentative Firestore
 * @param {string[]} wrongEnonces Énoncés ratés
 * @return {{analyse: string, recommendation: string, summary: string}}
 */
function buildAttemptAnalysis(
  attempt: AttemptData,
  wrongEnonces: string[],
): {
  analyse: string;
  recommendation: string;
  summary: string;
} {
  const percent = attempt.score ?? attempt.scoreDetail?.percent ?? 0;
  const details = attempt.scoreDetail?.details || [];
  const wrong = details.filter((d) => d.correct === false).length;
  const total = details.length || attempt.scoreDetail?.max || 0;

  let analyse: string;
  let recommendation: string;

  if (percent >= 80) {
    analyse =
      `Très bon résultat (${percent}%). ` +
      (total ? `${total - wrong}/${total} correctes. ` : "") +
      "Les notions ciblées semblent bien maîtrisées.";
    recommendation =
      "Passe à un exercice un peu plus difficile " +
      "sur le même thème, ou aide un camarade.";
  } else if (percent >= 50) {
    analyse =
      `Résultat moyen (${percent}%). ` +
      (wrong ? `${wrong} erreur(s). ` : "") +
      (wrongEnonces.length ?
        `À revoir : ${wrongEnonces.slice(0, 3).join(" | ")}` :
        "Revois les notions des questions manquées.");
    recommendation =
      "Refais l’exercice en te concentrant sur les " +
      "questions ratées, puis ouvre un ticket si besoin.";
  } else {
    analyse =
      `Résultat fragile (${percent}%). ` +
      "Il manque encore des bases sur ce chapitre.";
    recommendation =
      "Relis le cours, utilise le tuteur IA, " +
      "puis retente. Crée un ticket si tu bloques.";
  }

  return {analyse, recommendation, summary: analyse};
}

/**
 * Résume une liste de tickets ouverts.
 * @param {TicketData[]} tickets Tickets Firestore
 * @return {string} Texte de synthèse
 */
function summarizeTickets(tickets: TicketData[]): string {
  if (!tickets.length) {
    return "Aucun ticket ouvert pour ces filtres.";
  }

  const themes: Record<string, number> = {};
  for (const t of tickets) {
    const msg = (t.message || "").toLowerCase();
    let theme = "Autre";
    if (/équation|math|fraction|calcul/.test(msg)) {
      theme = "Mathématiques";
    } else if (/dissertation|français|orthographe|texte/.test(msg)) {
      theme = "Français";
    } else if (/exercice|qcm|devoir/.test(msg)) {
      theme = "Exercices";
    } else if (/cours|ressource|pdf|vidéo|video/.test(msg)) {
      theme = "Cours / ressources";
    }
    themes[theme] = (themes[theme] || 0) + 1;
  }

  const themeLines = Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `• ${k} : ${v}`)
    .join("\n");

  const samples = tickets
    .slice(0, 3)
    .map((t) => {
      const nom = t.eleveNom || "Élève";
      const msg = (t.message || "").slice(0, 80);
      return `- ${nom} : « ${msg} »`;
    })
    .join("\n");

  return (
    `Résumé IA — ${tickets.length} ticket(s) ouvert(s)\n\n` +
    `Répartition des thèmes :\n${themeLines}\n\n` +
    `Extraits :\n${samples}\n\n` +
    "Suggestion : traiter d’abord le thème le plus " +
    "fréquent en remédiation collective."
  );
}

/**
 * Met à jour (ou crée) la progression élève / matière.
 * @param {AttemptData} attempt Tentative
 * @param {number} percent Score en %
 * @return {Promise<void>}
 */
async function maybeUpdateProgress(
  attempt: AttemptData,
  percent: number,
): Promise<void> {
  if (!attempt.eleveId || !attempt.courseId) return;

  const courseSnap = await db
    .collection("courses")
    .doc(attempt.courseId)
    .get();
  const course = courseSnap.data() || {};
  const matiere = (course.matiere as string) || "Général";
  const courseTitre = (course.titre as string) || "";

  const existing = await db
    .collection("progress")
    .where("eleveId", "==", attempt.eleveId)
    .where("matiere", "==", matiere)
    .limit(1)
    .get();

  const payload = {
    eleveId: attempt.eleveId,
    matiere,
    courseTitre,
    percent,
    maitrise: percent,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (existing.empty) {
    await db.collection("progress").add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    const prev = existing.docs[0].data().percent as number | undefined;
    const blended = typeof prev === "number" ?
      Math.round(prev * 0.4 + percent * 0.6) :
      percent;
    await existing.docs[0].ref.update({
      ...payload,
      percent: blended,
      maitrise: blended,
    });
  }
}

/**
 * Tuteur IA conversationnel.
 * Input: { message: string }
 * Output: { reply: string }
 */
export const tutorAI = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }

  const message = String(request.data?.message || "").trim();
  if (!message) {
    throw new HttpsError(
      "invalid-argument",
      "Le message est requis.",
    );
  }

  logger.info("tutorAI", {uid: request.auth.uid, len: message.length});
  const reply = tutorReply(message);
  return {reply, message: reply, response: reply};
});

/**
 * Analyse une tentative et met à jour attempts + progress.
 * Input: { attemptId: string }
 * Output: { summary, analyse, recommendation }
 */
export const analyzeAttempt = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }

  const attemptId = String(request.data?.attemptId || "").trim();
  if (!attemptId) {
    throw new HttpsError(
      "invalid-argument",
      "attemptId est requis.",
    );
  }

  const attemptRef = db.collection("attempts").doc(attemptId);
  const attemptSnap = await attemptRef.get();
  if (!attemptSnap.exists) {
    throw new HttpsError("not-found", "Tentative introuvable.");
  }

  const attempt = attemptSnap.data() as AttemptData;
  const wrongIds = (attempt.scoreDetail?.details || [])
    .filter((d) => d.correct === false)
    .map((d) => d.questionId)
    .filter(Boolean) as string[];

  const wrongEnonces: string[] = [];
  if (attempt.exerciseId && wrongIds.length) {
    const exoSnap = await db
      .collection("exercises")
      .doc(attempt.exerciseId)
      .get();
    const questions =
      (exoSnap.data()?.questions || []) as ExerciseQuestion[];
    for (const q of questions) {
      if (q.id && wrongIds.includes(q.id) && q.enonce) {
        wrongEnonces.push(q.enonce);
      }
    }
  }

  const result = buildAttemptAnalysis(attempt, wrongEnonces);
  const percent = attempt.score ?? attempt.scoreDetail?.percent ?? 0;

  await attemptRef.update({
    analyse: result.analyse,
    recommendation: result.recommendation,
    analyzedAt: Timestamp.now(),
  });

  try {
    await maybeUpdateProgress(attempt, percent);
  } catch (e) {
    logger.warn("progress update failed", e);
  }

  logger.info("analyzeAttempt", {attemptId, percent});
  return result;
});

/**
 * Résumé des tickets ouverts pour une classe / un cours.
 * Input: { classeId?: string, courseId?: string }
 * Output: { summary: string, count: number }
 */
export const getTicketSummary = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }

  const classeId = request.data?.classeId ?
    String(request.data.classeId) :
    undefined;
  const courseId = request.data?.courseId ?
    String(request.data.courseId) :
    undefined;

  let query = db
    .collection("tickets")
    .where("status", "==", "ouvert");

  if (classeId) {
    query = query.where("classeId", "==", classeId);
  } else if (courseId) {
    query = query.where("courseId", "==", courseId);
  }

  const snap = await query.limit(50).get();
  const tickets = snap.docs.map((d) => d.data() as TicketData);
  const summary = summarizeTickets(tickets);

  logger.info("getTicketSummary", {
    classeId,
    courseId,
    count: tickets.length,
  });

  return {summary, count: tickets.length};
});

/**
 * Génère un mot de passe temporaire lisible.
 * @return {string} Mot de passe
 */
function generateTempPassword(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `EduSphere${n}!`;
}

/**
 * Vérifie que l'appelant a le rôle ministère (ou admin).
 * @param {string} uid UID Firebase
 * @return {Promise<{role: string, ecoleId?: string, ecoleNom?: string}>}
 */
async function assertMinistereOrAdmin(uid: string): Promise<{
  role: string;
  ecoleId?: string;
  ecoleNom?: string;
}> {
  const snap = await db.collection("users").doc(uid).get();
  const data = snap.exists ? snap.data() || {} : {};
  const role = String(data.role || "");
  if (role !== "ministere" && role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Réservé à l'administration.",
    );
  }
  return {
    role,
    ecoleId: data.ecoleId ? String(data.ecoleId) : undefined,
    ecoleNom: data.ecoleNom ? String(data.ecoleNom) : undefined,
  };
}

/**
 * Crée un user Auth + profil Firestore, avec rollback Auth si échec profil.
 * @param {object} p Params
 * @return {Promise<{uid: string, password: string}>}
 */
async function createAuthProfile(p: {
  email: string;
  nom: string;
  role: string;
  profile: Record<string, unknown>;
  createdBy: string;
}): Promise<{uid: string; password: string}> {
  const password = generateTempPassword();
  const userRecord = await authAdmin.createUser({
    email: p.email,
    password,
    displayName: p.nom,
    emailVerified: false,
    disabled: false,
  });
  try {
    await db.collection("users").doc(userRecord.uid).set({
      role: p.role,
      email: p.email,
      displayName: p.nom,
      nom: p.nom,
      status: "actif",
      mustChangePassword: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: p.createdBy,
      ...p.profile,
    });
  } catch (e) {
    try {
      await authAdmin.deleteUser(userRecord.uid);
    } catch {
      /* ignore */
    }
    throw e;
  }
  return {uid: userRecord.uid, password};
}

/**
 * Mappe les erreurs Auth vers HttpsError.
 * @param {unknown} e Erreur
 * @param {string} label Contexte
 * @return {never}
 */
function throwMappedAuthError(e: unknown, label: string): never {
  const err = e as {code?: string; message?: string};
  logger.error(label, err);
  if (err.code === "auth/email-already-exists") {
    throw new HttpsError(
      "already-exists",
      "Cet email est déjà utilisé.",
    );
  }
  if (err instanceof HttpsError) throw err;
  throw new HttpsError(
    "internal",
    err.message || "Échec de la création.",
  );
}

/**
 * Crée un établissement + compte admin lié.
 * Input: { nom, region, ville, type, niveau?, elevesCount?, enseignantsCount?,
 *          maitrise?, adminEmail, adminNom }
 * Output: { ecoleId, adminUid, adminEmail, tempPassword }
 */
export const createSchoolWithAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }
  await assertMinistereOrAdmin(request.auth.uid);

  const data = request.data || {};
  const nom = String(data.nom || "").trim();
  const region = String(data.region || "").trim();
  const ville = String(data.ville || "").trim();
  const type = String(data.type || "").trim();
  const niveau = String(data.niveau || "Secondaire").trim();
  const adminEmail = String(data.adminEmail || "").trim().toLowerCase();
  const adminNom = String(data.adminNom || "").trim();
  const elevesCount = Number(data.elevesCount) || 0;
  const enseignantsCount = Number(data.enseignantsCount) || 0;
  const maitrise = Math.min(100, Math.max(0, Number(data.maitrise) || 0));

  if (!nom || !region || !ville || !type) {
    throw new HttpsError(
      "invalid-argument",
      "Nom, région, ville et type sont requis.",
    );
  }
  if (!adminEmail || !adminEmail.includes("@")) {
    throw new HttpsError(
      "invalid-argument",
      "Email admin invalide.",
    );
  }
  if (!adminNom) {
    throw new HttpsError(
      "invalid-argument",
      "Le nom de l'administrateur est requis.",
    );
  }

  const ecoleRef = db.collection("ecoles").doc();
  let adminUid = "";

  try {
    await ecoleRef.set({
      nom,
      name: nom,
      region,
      ville,
      type,
      niveau,
      elevesCount,
      enseignantsCount,
      maitrise,
      usageHorsLigne: 0,
      adminEmail,
      adminNom,
      createdBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    const created = await createAuthProfile({
      email: adminEmail,
      nom: adminNom,
      role: "admin",
      createdBy: request.auth.uid,
      profile: {
        ecoleId: ecoleRef.id,
        ecoleNom: nom,
      },
    });
    adminUid = created.uid;

    await ecoleRef.update({
      adminUid,
    });

    logger.info("createSchoolWithAdmin", {
      ecoleId: ecoleRef.id,
      adminUid,
      by: request.auth.uid,
    });

    return {
      ecoleId: ecoleRef.id,
      adminUid,
      adminEmail,
      adminNom,
      tempPassword: created.password,
      ecoleNom: nom,
    };
  } catch (e: unknown) {
    if (adminUid) {
      try {
        await authAdmin.deleteUser(adminUid);
      } catch {
        /* ignore */
      }
      try {
        await db.collection("users").doc(adminUid).delete();
      } catch {
        /* ignore */
      }
    }
    try {
      await ecoleRef.delete();
    } catch {
      /* ignore */
    }
    throwMappedAuthError(e, "createSchoolWithAdmin failed");
  }
});

/**
 * Crée un enseignant pour l'école de l'admin connecté.
 * Input: { nom, email, classeId? }
 */
export const createTeacher = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }
  const caller = await assertMinistereOrAdmin(request.auth.uid);
  if (caller.role === "admin" && !caller.ecoleId) {
    throw new HttpsError(
      "failed-precondition",
      "Aucune école liée à ce compte admin.",
    );
  }

  const data = request.data || {};
  const nom = String(data.nom || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const classeId = data.classeId ? String(data.classeId).trim() : "";

  if (!nom) {
    throw new HttpsError("invalid-argument", "Le nom est requis.");
  }
  if (!email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Email invalide.");
  }

  let ecoleId = caller.ecoleId || "";
  let ecoleNom = caller.ecoleNom || "";
  let classeNom = "";
  const classeIds: string[] = [];

  if (classeId) {
    const classeSnap = await db.collection("classes").doc(classeId).get();
    if (!classeSnap.exists) {
      throw new HttpsError("not-found", "Classe introuvable.");
    }
    const c = classeSnap.data() || {};
    if (caller.role === "admin" && c.ecoleId && c.ecoleId !== caller.ecoleId) {
      throw new HttpsError(
        "permission-denied",
        "Cette classe n'appartient pas à votre école.",
      );
    }
    classeNom = String(c.nom || c.niveau || "");
    classeIds.push(classeId);
    if (!ecoleId && c.ecoleId) {
      ecoleId = String(c.ecoleId);
    }
  }

  if (!ecoleId) {
    throw new HttpsError(
      "failed-precondition",
      "Impossible de déterminer l'école.",
    );
  }
  if (!ecoleNom) {
    const ecoleSnap = await db.collection("ecoles").doc(ecoleId).get();
    ecoleNom = String(ecoleSnap.data()?.nom || ecoleSnap.data()?.name || "");
  }

  try {
    const created = await createAuthProfile({
      email,
      nom,
      role: "enseignant",
      createdBy: request.auth.uid,
      profile: {
        ecoleId,
        ecoleNom,
        classeIds,
        classeId: classeId || null,
        classeNom: classeNom || null,
      },
    });

    if (classeId) {
      await db.collection("classes").doc(classeId).update({
        enseignantIds: FieldValue.arrayUnion(created.uid),
      });
    }

    logger.info("createTeacher", {uid: created.uid, ecoleId});
    return {
      uid: created.uid,
      email,
      nom,
      tempPassword: created.password,
      role: "enseignant",
      ecoleId,
      classeId: classeId || null,
      classeNom: classeNom || null,
    };
  } catch (e) {
    throwMappedAuthError(e, "createTeacher failed");
  }
});

/**
 * Crée un élève + un parent liés.
 * Input: { eleveNom, eleveEmail, classeId, parentNom, parentEmail }
 */
export const createStudentWithParent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }
  const caller = await assertMinistereOrAdmin(request.auth.uid);
  if (caller.role === "admin" && !caller.ecoleId) {
    throw new HttpsError(
      "failed-precondition",
      "Aucune école liée à ce compte admin.",
    );
  }

  const data = request.data || {};
  const eleveNom = String(data.eleveNom || "").trim();
  const eleveEmail = String(data.eleveEmail || "").trim().toLowerCase();
  const parentNom = String(data.parentNom || "").trim();
  const parentEmail = String(data.parentEmail || "").trim().toLowerCase();
  const classeId = String(data.classeId || "").trim();

  if (!eleveNom || !parentNom) {
    throw new HttpsError(
      "invalid-argument",
      "Noms élève et parent requis.",
    );
  }
  if (!eleveEmail.includes("@") || !parentEmail.includes("@")) {
    throw new HttpsError("invalid-argument", "Emails invalides.");
  }
  if (eleveEmail === parentEmail) {
    throw new HttpsError(
      "invalid-argument",
      "L'élève et le parent doivent avoir des emails distincts.",
    );
  }
  if (!classeId) {
    throw new HttpsError("invalid-argument", "La classe est requise.");
  }

  const classeSnap = await db.collection("classes").doc(classeId).get();
  if (!classeSnap.exists) {
    throw new HttpsError("not-found", "Classe introuvable.");
  }
  const classe = classeSnap.data() || {};
  if (caller.role === "admin" && classe.ecoleId &&
      classe.ecoleId !== caller.ecoleId) {
    throw new HttpsError(
      "permission-denied",
      "Cette classe n'appartient pas à votre école.",
    );
  }

  const ecoleId = String(
    caller.ecoleId || classe.ecoleId || "",
  );
  if (!ecoleId) {
    throw new HttpsError(
      "failed-precondition",
      "Impossible de déterminer l'école.",
    );
  }
  let ecoleNom = caller.ecoleNom || "";
  if (!ecoleNom) {
    const ecoleSnap = await db.collection("ecoles").doc(ecoleId).get();
    ecoleNom = String(ecoleSnap.data()?.nom || ecoleSnap.data()?.name || "");
  }
  const classeNom = String(classe.nom || classe.niveau || "");

  let eleveUid = "";
  let parentUid = "";
  let elevePassword = "";
  let parentPassword = "";

  try {
    const eleve = await createAuthProfile({
      email: eleveEmail,
      nom: eleveNom,
      role: "eleve",
      createdBy: request.auth.uid,
      profile: {
        ecoleId,
        ecoleNom,
        classeId,
        classeNom,
        moyenne: 0,
        streak: 0,
      },
    });
    eleveUid = eleve.uid;
    elevePassword = eleve.password;

    const parent = await createAuthProfile({
      email: parentEmail,
      nom: parentNom,
      role: "parent",
      createdBy: request.auth.uid,
      profile: {
        ecoleId,
        ecoleNom,
        enfantIds: [eleveUid],
      },
    });
    parentUid = parent.uid;
    parentPassword = parent.password;

    await db.collection("users").doc(eleveUid).update({
      parentId: parentUid,
      parentEmail,
    });

    await db.collection("classes").doc(classeId).update({
      eleveIds: FieldValue.arrayUnion(eleveUid),
    });

    logger.info("createStudentWithParent", {
      eleveUid,
      parentUid,
      ecoleId,
      classeId,
    });

    return {
      eleve: {
        uid: eleveUid,
        email: eleveEmail,
        nom: eleveNom,
        tempPassword: elevePassword,
      },
      parent: {
        uid: parentUid,
        email: parentEmail,
        nom: parentNom,
        tempPassword: parentPassword,
      },
      classeId,
      classeNom,
      ecoleId,
    };
  } catch (e) {
    // Rollback
    for (const uid of [parentUid, eleveUid].filter(Boolean)) {
      try {
        await authAdmin.deleteUser(uid);
      } catch {
        /* ignore */
      }
      try {
        await db.collection("users").doc(uid).delete();
      } catch {
        /* ignore */
      }
    }
    throwMappedAuthError(e, "createStudentWithParent failed");
  }
});
