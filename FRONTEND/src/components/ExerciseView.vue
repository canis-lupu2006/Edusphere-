<template>
  <div class="mx-auto max-w-5xl">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      @click="$router.back()"
    >
      <ArrowLeft class="h-4 w-4" /> Retour
    </button>

    <div v-if="loading" class="py-16 text-center text-slate-400">Chargement de l'exercice…</div>
    <div v-else-if="!exercise" class="glass-card py-12 text-center text-slate-400">
      Exercice introuvable.
    </div>
    <template v-else>
      <header class="mb-6">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-blue-600">Exercice</p>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {{ exercise.kind || 'qcm' }}
          </span>
          <span
            v-if="exercise.source === 'ia'"
            class="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700"
          >
            Proposé par l’IA
          </span>
        </div>
        <h1 class="page-title">{{ exercise.titre }}</h1>
        <p v-if="exercise.description" class="page-sub">{{ exercise.description }}</p>
        <p class="mt-1 text-xs text-slate-500">
          {{ exercise.matiere || '—' }}
          <span v-if="exercise.competence"> · {{ exercise.competence }}</span>
        </p>
      </header>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Document PDF -->
        <section v-if="exercise.documentUrl" class="glass-card overflow-hidden p-0">
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 class="text-sm font-semibold">Document</h2>
            <a
              :href="exercise.documentUrl"
              target="_blank"
              rel="noopener"
              class="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ouvrir ↗
            </a>
          </div>
          <iframe
            :src="exercise.documentUrl"
            class="h-[min(70vh,640px)] w-full bg-white"
            :title="exercise.documentName || 'Document exercice'"
          />
        </section>

        <!-- Réponses -->
        <section :class="exercise.documentUrl ? '' : 'lg:col-span-2'">
          <form class="space-y-5" @submit.prevent="submit">
            <div v-if="!questions.length && exercise.documentUrl" class="glass-card p-5">
              <p class="mb-3 text-sm text-slate-600">
                Lis le document, puis indique ce que tu as compris et tes réponses libres.
              </p>
              <label class="block text-sm">
                <span class="mb-1 block text-slate-500">Ta réponse / résolution</span>
                <textarea
                  v-model="freeAnswer"
                  rows="8"
                  class="input-field !pl-4"
                  placeholder="Rédige ici ta démarche et ta réponse…"
                  required
                />
              </label>
            </div>

            <div
              v-for="(q, idx) in questions"
              :key="q.id || idx"
              class="glass-card p-5"
            >
              <p class="mb-3 text-sm font-medium">
                <span class="mr-2 text-slate-400">{{ idx + 1 }}.</span>
                {{ q.enonce || q.question }}
              </p>

              <div v-if="q.type === 'qcm'" class="space-y-2">
                <label
                  v-for="(opt, oi) in q.options || []"
                  :key="oi"
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-blue-500/40"
                  :class="{ 'border-blue-500/60 bg-blue-500/10': answers[q.id] === optionValue(opt) }"
                >
                  <input
                    v-model="answers[q.id]"
                    type="radio"
                    class="accent-blue-500"
                    :value="optionValue(opt)"
                    :name="`q-${q.id}`"
                  />
                  <span class="text-sm">{{ optionLabel(opt) }}</span>
                </label>
              </div>

              <div v-else-if="q.type === 'vrai_faux' || q.type === 'vrai-faux'" class="flex gap-3">
                <button
                  type="button"
                  class="flex-1 rounded-xl border px-4 py-3 text-sm transition"
                  :class="answers[q.id] === true ? 'border-emerald-500 bg-emerald-100' : 'border-slate-200'"
                  @click="answers[q.id] = true"
                >
                  Vrai
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-xl border px-4 py-3 text-sm transition"
                  :class="answers[q.id] === false ? 'border-red-500 bg-red-100' : 'border-slate-200'"
                  @click="answers[q.id] = false"
                >
                  Faux
                </button>
              </div>

              <input
                v-else
                v-model="answers[q.id]"
                type="text"
                class="input-field !pl-4"
                placeholder="Votre réponse…"
              />
            </div>

            <div class="flex flex-wrap gap-3">
              <button type="submit" class="btn-primary" :disabled="submitting">
                {{ submitting ? 'Analyse…' : 'Soumettre & analyser' }}
              </button>
              <button type="button" class="btn-secondary" @click="openTicket = true">
                Je ne comprends pas
              </button>
            </div>
          </form>
        </section>
      </div>

      <div v-if="result" class="glass-card mt-6 border-emerald-500/20 p-5">
        <h2 class="font-display text-lg font-semibold">
          Résultat
          <span v-if="result.max"> : {{ result.percent }}%</span>
        </h2>
        <p v-if="result.max" class="mt-1 text-sm text-slate-500">
          {{ result.score }} / {{ result.max }} bonnes réponses
        </p>
        <div v-if="lacunes.length" class="mt-4">
          <p class="mb-2 text-sm font-semibold text-amber-700">Lacunes détectées</p>
          <ul class="flex flex-wrap gap-2">
            <li
              v-for="(l, i) in lacunes"
              :key="i"
              class="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
            >
              {{ l }}
            </li>
          </ul>
        </div>
        <div v-if="aiAnalysis" class="mt-4 rounded-xl bg-blue-50 p-4 text-sm">
          <p class="mb-1 font-semibold text-blue-700">Analyse IA</p>
          <p class="whitespace-pre-wrap text-slate-700">{{ aiAnalysis }}</p>
        </div>
        <p v-if="recommendation" class="mt-3 text-sm text-slate-600">
          <span class="font-semibold">Conseil :</span> {{ recommendation }}
        </p>
        <RouterLink to="/student/progression" class="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Voir ma progression mise à jour →
        </RouterLink>
      </div>

      <div
        v-if="openTicket"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="openTicket = false"
      >
        <div class="glass-card w-full max-w-md p-6">
          <h3 class="font-display text-lg font-semibold">Demander de l'aide</h3>
          <textarea
            v-model="ticketMessage"
            rows="4"
            class="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500/50"
            placeholder="Décrivez ce que vous ne comprenez pas…"
          />
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" class="btn-secondary text-sm" @click="openTicket = false">
              Annuler
            </button>
            <button type="button" class="btn-primary text-sm" :disabled="ticketLoading" @click="createTicket">
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore'
import { ArrowLeft } from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useCloudFunctions } from '@/composables/useCloudFunctions'
import {
  buildLocalAnalysis,
  enrichAnalysisWithGemini,
  writeProgressFromAttempt,
} from '@/composables/useExerciseAnalysis'
import { computeScore, nowTimestamp } from '@/utils/scoring'
import type { Exercise, ScoreResult, QuestionOption } from '@/types/models'

const route = useRoute()
const auth = useAuthStore()
const { analyzeAttempt } = useCloudFunctions()

const loading = ref(true)
const exercise = ref<Exercise | null>(null)
const answers = reactive<Record<string, unknown>>({})
const freeAnswer = ref('')
const submitting = ref(false)
const result = ref<ScoreResult | null>(null)
const aiAnalysis = ref('')
const recommendation = ref('')
const lacunes = ref<string[]>([])
const openTicket = ref(false)
const ticketMessage = ref('')
const ticketLoading = ref(false)

function optionValue(opt: QuestionOption): string {
  if (typeof opt === 'string') return opt
  return opt.value ?? opt.label ?? ''
}

function optionLabel(opt: QuestionOption): string {
  if (typeof opt === 'string') return opt
  return opt.label ?? opt.value ?? ''
}

const questions = computed(() =>
  (exercise.value?.questions || []).map((q, i) => ({
    ...q,
    id: q.id || `q${i}`,
  })),
)

onMounted(async () => {
  try {
    const id = String(route.params.id)
    const snap = await getDoc(doc(db, 'exercises', id))
    exercise.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as Exercise) : null
  } finally {
    loading.value = false
  }
})

async function submit() {
  if (!exercise.value || !auth.user) return
  submitting.value = true
  result.value = null
  aiAnalysis.value = ''
  recommendation.value = ''
  lacunes.value = []
  try {
    let scored: ScoreResult
    const payloadAnswers: Record<string, unknown> = { ...answers }

    if (questions.value.length) {
      scored = computeScore(questions.value, answers)
    } else {
      if (!freeAnswer.value.trim()) {
        alert('Écris ta réponse avant de soumettre.')
        return
      }
      payloadAnswers.freeText = freeAnswer.value.trim()
      scored = { score: 0, max: 0, percent: 0, details: [] }
    }

    result.value = scored

    const attemptRef = await addDoc(collection(db, 'attempts'), {
      eleveId: auth.user.uid,
      eleveNom: auth.displayName,
      exerciseId: exercise.value.id,
      courseId: exercise.value.courseId || null,
      classeId: auth.profile?.classeId || exercise.value.classeId || null,
      matiere: exercise.value.matiere || null,
      answers: payloadAnswers,
      score: scored.percent,
      scoreDetail: scored,
      createdAt: nowTimestamp(),
    })

    let local = buildLocalAnalysis(exercise.value, scored, questions.value)
    if (!questions.value.length) {
      local = {
        analyse: `Réponse libre enregistrée pour « ${exercise.value.titre} ». L’IA va repérer d’éventuelles lacunes à partir de ta rédaction.`,
        lacunes: [exercise.value.competence || exercise.value.matiere || 'Notion du document'].filter(Boolean) as string[],
        recommendation: 'Relis la correction du professeur ou demande au tuteur IA un feedback détaillé.',
      }
    }
    const enriched = await enrichAnalysisWithGemini(exercise.value, scored, local)

    try {
      const analysis = await analyzeAttempt(attemptRef.id)
      if (typeof analysis === 'string' && analysis.trim()) {
        enriched.analyse = analysis
      } else if (analysis && typeof analysis === 'object') {
        const obj = analysis as { summary?: string; analyse?: string; recommendation?: string }
        if (obj.analyse || obj.summary) enriched.analyse = obj.analyse || obj.summary || enriched.analyse
        if (obj.recommendation) enriched.recommendation = obj.recommendation
      }
    } catch {
      /* Spark / emulator — on garde l’analyse locale + Gemini */
    }

    await updateDoc(attemptRef, {
      analyse: enriched.analyse,
      recommendation: enriched.recommendation,
      lacunes: enriched.lacunes,
    })

    aiAnalysis.value = enriched.analyse
    recommendation.value = enriched.recommendation
    lacunes.value = enriched.lacunes

    try {
      await writeProgressFromAttempt({
        eleveId: auth.user.uid,
        matiere: exercise.value.matiere || 'Général',
        percent: scored.max ? scored.percent : Math.max(40, 100 - enriched.lacunes.length * 10),
        lacunes: enriched.lacunes,
        exerciseTitre: exercise.value.titre,
      })
    } catch (e) {
      console.warn('progress write', e)
    }
  } catch (e) {
    console.error(e)
    alert('Erreur lors de la soumission.')
  } finally {
    submitting.value = false
  }
}

async function createTicket() {
  if (!ticketMessage.value.trim() || !auth.user) return
  ticketLoading.value = true
  try {
    await addDoc(collection(db, 'tickets'), {
      eleveId: auth.user.uid,
      eleveNom: auth.displayName,
      classeId: auth.profile?.classeId || null,
      courseId: exercise.value?.courseId || null,
      exerciseId: exercise.value?.id || null,
      message: ticketMessage.value.trim(),
      status: 'ouvert',
      createdAt: nowTimestamp(),
    })
    openTicket.value = false
    ticketMessage.value = ''
    alert('Ticket envoyé à votre enseignant.')
  } catch (e) {
    console.error(e)
    alert('Impossible de créer le ticket.')
  } finally {
    ticketLoading.value = false
  }
}
</script>
