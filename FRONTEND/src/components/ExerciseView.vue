<template>
  <div class="mx-auto max-w-3xl">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
      @click="$router.back()"
    >
      <ArrowLeft class="h-4 w-4" /> Retour
    </button>

    <div v-if="loading" class="py-16 text-center text-white/40">Chargement de l'exercice…</div>
    <div v-else-if="!exercise" class="glass-card py-12 text-center text-white/40">
      Exercice introuvable.
    </div>
    <template v-else>
      <header class="mb-6">
        <p class="text-xs font-semibold uppercase tracking-wide text-blue-400">Exercice</p>
        <h1 class="page-title">{{ exercise.titre }}</h1>
        <p v-if="exercise.description" class="page-sub">{{ exercise.description }}</p>
      </header>

      <form class="space-y-5" @submit.prevent="submit">
        <div
          v-for="(q, idx) in questions"
          :key="q.id || idx"
          class="glass-card p-5"
        >
          <p class="mb-3 text-sm font-medium">
            <span class="mr-2 text-white/35">{{ idx + 1 }}.</span>
            {{ q.enonce || q.question }}
          </p>

          <!-- QCM -->
          <div v-if="q.type === 'qcm'" class="space-y-2">
            <label
              v-for="(opt, oi) in q.options || []"
              :key="oi"
              class="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition hover:border-blue-500/40"
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

          <!-- Vrai / Faux -->
          <div v-else-if="q.type === 'vrai_faux' || q.type === 'vrai-faux'" class="flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border px-4 py-3 text-sm transition"
              :class="answers[q.id] === true ? 'border-emerald-500 bg-emerald-500/15' : 'border-white/10'"
              @click="answers[q.id] = true"
            >
              Vrai
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl border px-4 py-3 text-sm transition"
              :class="answers[q.id] === false ? 'border-red-500 bg-red-500/15' : 'border-white/10'"
              @click="answers[q.id] = false"
            >
              Faux
            </button>
          </div>

          <!-- Réponse courte -->
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
            {{ submitting ? 'Envoi…' : 'Soumettre' }}
          </button>
          <button type="button" class="btn-secondary" @click="openTicket = true">
            Je ne comprends pas
          </button>
        </div>
      </form>

      <!-- Résultat -->
      <div v-if="result" class="glass-card mt-6 border-emerald-500/20 p-5">
        <h2 class="font-display text-lg font-semibold">Résultat : {{ result.percent }}%</h2>
        <p class="mt-1 text-sm text-white/50">
          {{ result.score }} / {{ result.max }} bonnes réponses
        </p>
        <div v-if="aiAnalysis" class="mt-4 rounded-xl bg-violet-500/10 p-4 text-sm text-violet-100">
          <p class="mb-1 font-semibold text-violet-300">Analyse IA</p>
          <p class="whitespace-pre-wrap text-white/70">{{ aiAnalysis }}</p>
        </div>
      </div>

      <!-- Modal ticket -->
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
            class="mt-3 w-full rounded-xl border border-white/10 bg-[#0d1424] p-3 text-sm outline-none focus:border-blue-500/50"
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
import { useRoute } from 'vue-router'
import { doc, getDoc, addDoc, collection } from 'firebase/firestore'
import { ArrowLeft } from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useCloudFunctions } from '@/composables/useCloudFunctions'
import { computeScore, nowTimestamp } from '@/utils/scoring'
import type { Exercise, ScoreResult, QuestionOption } from '@/types/models'

const route = useRoute()
const auth = useAuthStore()
const { analyzeAttempt } = useCloudFunctions()

const loading = ref(true)
const exercise = ref<Exercise | null>(null)
const answers = reactive<Record<string, unknown>>({})
const submitting = ref(false)
const result = ref<ScoreResult | null>(null)
const aiAnalysis = ref('')
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
  try {
    const scored = computeScore(questions.value, answers)
    result.value = scored

    const attemptRef = await addDoc(collection(db, 'attempts'), {
      eleveId: auth.user.uid,
      exerciseId: exercise.value.id,
      courseId: exercise.value.courseId || null,
      classeId: auth.profile?.classeId || null,
      answers: { ...answers },
      score: scored.percent,
      scoreDetail: scored,
      createdAt: nowTimestamp(),
    })

    try {
      const analysis = await analyzeAttempt(attemptRef.id)
      if (typeof analysis === 'string') {
        aiAnalysis.value = analysis
      } else {
        const obj = analysis as { summary?: string; analyse?: string }
        aiAnalysis.value = obj?.summary || obj?.analyse || JSON.stringify(analysis)
      }
    } catch (e) {
      console.warn('analyzeAttempt:', e)
      aiAnalysis.value = 'Analyse IA indisponible pour le moment.'
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
