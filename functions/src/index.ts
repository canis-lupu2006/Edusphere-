/**
 * EduSphere — Cloud Functions
 * Callable: tutorAI, analyzeAttempt, getTicketSummary
 */
import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {
  getFirestore,
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

setGlobalOptions({maxInstances: 10, region: "us-central1"});

initializeApp();
const db = getFirestore();

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
