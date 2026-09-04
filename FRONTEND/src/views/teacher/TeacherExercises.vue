<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title">Exercices</h1>
      <p class="page-sub">Créez des QCM, vrai/faux et réponses courtes.</p>
    </header>

    <form class="glass-card mb-8 space-y-4 p-5" @submit.prevent="createExercise">
      <h2 class="font-display text-lg font-semibold">Nouvel exercice</h2>
      <input v-model="form.titre" required class="input-field !pl-4" placeholder="Titre de l'exercice" />
      <select v-model="form.courseId" required class="input-field !pl-4">
        <option value="" disabled>Cours lié</option>
        <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.titre }}</option>
      </select>
      <textarea
        v-model="form.description"
        rows="2"
        class="input-field !pl-4"
        placeholder="Description"
      />

      <div class="space-y-3">
        <div
          v-for="(q, qi) in form.questions"
          :key="qi"
          class="rounded-xl border border-white/10 bg-white/[0.03] p-4"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">Question {{ qi + 1 }}</span>
            <button type="button" class="text-xs text-red-400" @click="form.questions.splice(qi, 1)">
              Supprimer
            </button>
          </div>
          <select v-model="q.type" class="input-field mb-2 !pl-4">
            <option value="qcm">QCM</option>
            <option value="vrai_faux">Vrai / Faux</option>
            <option value="court">Réponse courte</option>
          </select>
          <input v-model="q.enonce" required class="input-field mb-2 !pl-4" placeholder="Énoncé" />
          <template v-if="q.type === 'qcm'">
            <input
              v-for="(_, oi) in q.options"
              :key="oi"
              v-model="q.options[oi]"
              class="input-field mb-2 !pl-4"
              :placeholder="`Option ${oi + 1}`"
            />
            <input v-model="q.correctAnswer" class="input-field !pl-4" placeholder="Bonne réponse (texte exact)" />
          </template>
          <template v-else-if="q.type === 'vrai_faux'">
            <select v-model="q.correctAnswer" class="input-field !pl-4">
              <option :value="true">Vrai</option>
              <option :value="false">Faux</option>
            </select>
          </template>
          <input
            v-else
            v-model="q.correctAnswer"
            class="input-field !pl-4"
            placeholder="Réponse attendue"
          />
        </div>
        <button type="button" class="btn-secondary text-sm" @click="addQuestion">+ Question</button>
      </div>

      <button type="submit" class="btn-primary text-sm" :disabled="saving">
        {{ saving ? 'Enregistrement…' : "Créer l'exercice" }}
      </button>
    </form>

    <ul class="space-y-2">
      <li v-for="ex in exercises" :key="ex.id" class="glass-card flex justify-between p-4 text-sm">
        <span>{{ ex.titre }}</span>
        <span class="text-white/40">{{ ex.questions?.length || 0 }} Q</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Course, Exercise } from '@/types/models'
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'

const auth = useAuthStore()
const courses = ref<Course[]>([])
const exercises = ref<Exercise[]>([])
const saving = ref(false)
let unsubs: Unsubscribe[] = []

const form = reactive({
  titre: '',
  courseId: '',
  description: '',
  questions: [emptyQuestion()],
})

function emptyQuestion() {
  return {
    type: 'qcm',
    enonce: '',
    options: ['', '', '', ''],
    correctAnswer: '',
  }
}

function addQuestion() {
  form.questions.push(emptyQuestion())
}

onMounted(() => {
  const uid = auth.user!.uid
  const cq = query(collection(db, 'courses'), where('enseignantId', '==', uid))
  unsubs.push(
    onSnapshot(cq, (snap) => {
      courses.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
    })
  )
  const eq = query(collection(db, 'exercises'), where('enseignantId', '==', uid))
  unsubs.push(
    onSnapshot(eq, (snap) => {
      exercises.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise))
    })
  )
})

onUnmounted(() => unsubs.forEach((u) => u()))

async function createExercise() {
  saving.value = true
  try {
    const questions = form.questions.map((q, i) => ({
      id: `q${i}`,
      type: q.type,
      enonce: q.enonce,
      options: q.type === 'qcm' ? q.options.filter(Boolean) : undefined,
      correctAnswer: q.type === 'vrai_faux' ? Boolean(q.correctAnswer) : q.correctAnswer,
    }))

    await addDoc(collection(db, 'exercises'), {
      titre: form.titre,
      description: form.description,
      courseId: form.courseId,
      enseignantId: auth.user!.uid,
      questions,
      createdAt: nowTimestamp(),
    })

    form.titre = ''
    form.description = ''
    form.questions = [emptyQuestion()]
  } catch (e) {
    console.error(e)
    alert('Erreur création exercice')
  } finally {
    saving.value = false
  }
}
</script>
