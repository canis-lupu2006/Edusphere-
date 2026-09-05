<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
        PROFESSEUR
      </p>
      <h1 class="page-title">Devoirs & Exercices</h1>
      <p class="page-sub">
        Créez des QCM, joignez un PDF, ou générez des questions avec l’IA — les élèves répondent sur
        la plateforme.
      </p>
    </header>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="t in createTabs"
        :key="t.key"
        type="button"
        class="rounded-xl px-4 py-2 text-sm font-semibold transition"
        :class="
          createMode === t.key
            ? 'bg-violet-600 text-white'
            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        "
        @click="createMode = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <form class="glass-card mb-6 space-y-4 p-5" @submit.prevent="submit">
      <h2 class="font-display text-lg font-semibold">
        {{ createMode === 'qcm' ? 'Nouvel exercice QCM' : createMode === 'pdf' ? 'Exercice avec PDF' : 'Générer un QCM (IA)' }}
      </h2>

      <div class="grid gap-4 md:grid-cols-2">
        <input v-model="form.titre" required class="input-field !pl-4" placeholder="Titre" />
        <input v-model="form.matiere" required class="input-field !pl-4" placeholder="Matière" />
        <select v-model="form.classeId" required class="input-field !pl-4">
          <option value="" disabled>Classe</option>
          <option v-for="cl in classes" :key="cl.id" :value="cl.id">
            {{ cl.nom || cl.id }}
          </option>
        </select>
        <select v-model="form.courseId" class="input-field !pl-4">
          <option value="">Cours lié (optionnel)</option>
          <option v-for="c in coursesForClasse" :key="c.id" :value="c.id">
            {{ c.titre }}
          </option>
        </select>
        <select v-model="form.difficulte" class="input-field !pl-4">
          <option value="facile">Facile</option>
          <option value="moyen">Moyen</option>
          <option value="difficile">Difficile</option>
        </select>
        <input
          v-model="form.competence"
          class="input-field !pl-4"
          placeholder="Compétence / notion"
        />
      </div>
      <textarea
        v-model="form.description"
        rows="2"
        class="input-field !pl-4"
        placeholder="Consigne pour l’élève (optionnel)"
      />

      <!-- PDF -->
      <div v-if="createMode === 'pdf' || createMode === 'qcm'">
        <label class="mb-1 block text-sm text-slate-500">
          Document PDF {{ createMode === 'pdf' ? '(obligatoire)' : '(optionnel)' }}
        </label>
        <input type="file" accept=".pdf,application/pdf" class="text-sm" @change="onPdf" />
        <p v-if="pdfName" class="mt-1 text-xs text-emerald-700">{{ pdfName }}</p>
      </div>

      <!-- QCM builder -->
      <div v-if="createMode === 'qcm' || createMode === 'ia'" class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-slate-800">Questions</h3>
          <div class="flex gap-2">
            <button
              v-if="createMode === 'ia'"
              type="button"
              class="btn-secondary text-xs"
              :disabled="generating"
              @click="generateAi"
            >
              {{ generating ? 'Génération…' : 'Générer avec Gemini' }}
            </button>
            <button type="button" class="btn-secondary text-xs" @click="addQuestion">
              + Question
            </button>
          </div>
        </div>
        <div
          v-for="(q, qi) in form.questions"
          :key="q.id"
          class="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
        >
          <input
            v-model="q.enonce"
            class="input-field mb-2 !pl-4"
            :placeholder="`Énoncé question ${qi + 1}`"
            required
          />
          <div class="grid gap-2 sm:grid-cols-2">
            <input
              v-for="(opt, oi) in q.options"
              :key="oi"
              v-model="q.options![oi]"
              class="input-field !pl-4 text-sm"
              :placeholder="`Option ${oi + 1}`"
            />
          </div>
          <label class="mt-2 block text-xs text-slate-500">
            Bonne réponse
            <select v-model="q.correctAnswer" class="input-field mt-1 !pl-4 text-sm">
              <option v-for="(opt, oi) in q.options" :key="oi" :value="opt">
                {{ opt || `Option ${oi + 1}` }}
              </option>
            </select>
          </label>
          <button type="button" class="mt-2 text-xs text-red-600" @click="removeQuestion(qi)">
            Retirer
          </button>
        </div>
        <p v-if="!form.questions.length" class="text-sm text-slate-400">
          Ajoutez des questions ou générez-les avec l’IA.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button type="submit" class="btn-primary text-sm" :disabled="saving">
          {{ saving ? 'Publication…' : 'Publier pour les élèves' }}
        </button>
      </div>
      <p v-if="msg" class="text-sm" :class="msgOk ? 'text-emerald-700' : 'text-red-600'">{{ msg }}</p>
    </form>

    <div class="glass-card overflow-hidden">
      <div class="border-b border-slate-100 px-5 py-4">
        <h2 class="font-display text-lg font-semibold">Exercices publiés</h2>
      </div>
      <div v-if="loading" class="p-8 text-center text-slate-400">Chargement…</div>
      <div v-else-if="!items.length" class="p-8 text-center text-slate-400">
        Aucun exercice pour le moment.
      </div>
      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="ex in items"
          :key="ex.id"
          class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm"
        >
          <div>
            <p class="font-medium">{{ ex.titre }}</p>
            <p class="text-xs text-slate-400">
              {{ ex.matiere }} · {{ ex.classeId }} ·
              {{ ex.kind || 'qcm' }} · {{ ex.source || 'enseignant' }}
              <span v-if="ex.documentUrl"> · PDF</span>
              · {{ (ex.questions || []).length }} question(s)
            </p>
          </div>
          <span class="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
            Publié
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { ClassRecord, Course, Exercise, ExerciseQuestion } from '@/types/models'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'
import { generateQcmWithAi } from '@/composables/useExerciseAnalysis'

type CreateMode = 'qcm' | 'pdf' | 'ia'

const auth = useAuthStore()
const items = ref<Exercise[]>([])
const classes = ref<ClassRecord[]>([])
const courses = ref<Course[]>([])
const loading = ref(true)
const saving = ref(false)
const generating = ref(false)
const msg = ref('')
const msgOk = ref(false)
const createMode = ref<CreateMode>('qcm')
const pdfFile = ref<File | null>(null)
const pdfName = ref('')
let unsub: Unsubscribe | null = null

const createTabs = [
  { key: 'qcm' as const, label: 'QCM manuel' },
  { key: 'pdf' as const, label: 'PDF + réponses' },
  { key: 'ia' as const, label: 'Généré par IA' },
]

const form = reactive({
  titre: '',
  matiere: '',
  classeId: '',
  courseId: '',
  difficulte: 'moyen',
  competence: '',
  description: '',
  questions: [] as ExerciseQuestion[],
})

const coursesForClasse = computed(() =>
  courses.value.filter((c) => !form.classeId || c.classeId === form.classeId),
)

function blankQuestion(): ExerciseQuestion {
  return {
    id: `q${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'qcm',
    enonce: '',
    options: ['', '', '', ''],
    correctAnswer: '',
  }
}

function addQuestion() {
  form.questions.push(blankQuestion())
}

function removeQuestion(i: number) {
  form.questions.splice(i, 1)
}

function onPdf(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null
  pdfFile.value = f
  pdfName.value = f?.name || ''
}

watch(createMode, (m) => {
  if ((m === 'qcm' || m === 'ia') && !form.questions.length) addQuestion()
})

async function loadClasses() {
  const uid = auth.user?.uid
  if (!uid) return
  const map = new Map<string, ClassRecord>()
  const profileIds =
    auth.profile?.classeIds || (auth.profile?.classeId ? [auth.profile.classeId] : [])
  for (const id of profileIds) map.set(id, { id, nom: id })
  try {
    const snap = await getDocs(
      query(collection(db, 'classes'), where('enseignantIds', 'array-contains', uid)),
    )
    snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as ClassRecord))
  } catch {
    /* ignore */
  }
  for (const id of [...map.keys()]) {
    try {
      const s = await getDoc(doc(db, 'classes', id))
      if (s.exists()) map.set(id, { id, ...s.data() } as ClassRecord)
    } catch {
      /* ignore */
    }
  }
  classes.value = Array.from(map.values())
  if (classes.value.length && !form.classeId) form.classeId = classes.value[0].id
}

onMounted(async () => {
  await loadClasses()
  const uid = auth.user?.uid
  if (!uid) {
    loading.value = false
    return
  }
  addQuestion()
  unsub = onSnapshot(
    query(collection(db, 'exercises'), where('enseignantId', '==', uid)),
    (snap) => {
      items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise))
      loading.value = false
    },
    () => {
      loading.value = false
    },
  )
  onSnapshot(query(collection(db, 'courses'), where('enseignantId', '==', uid)), (snap) => {
    courses.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
  })
})

onUnmounted(() => unsub?.())

async function generateAi() {
  if (!form.matiere.trim() || !form.titre.trim()) {
    msgOk.value = false
    msg.value = 'Indiquez titre et matière avant de générer.'
    return
  }
  generating.value = true
  msg.value = ''
  try {
    form.questions = await generateQcmWithAi({
      matiere: form.matiere,
      sujet: form.competence || form.titre,
      count: 4,
    })
    msgOk.value = true
    msg.value = `${form.questions.length} questions générées — vérifiez les bonnes réponses puis publiez.`
  } catch (e) {
    msgOk.value = false
    msg.value =
      e instanceof Error && e.message === 'NO_GEMINI_KEY'
        ? 'Ajoutez VITE_GEMINI_API_KEY dans .env pour générer avec l’IA.'
        : 'Génération IA impossible. Réessayez ou créez le QCM manuellement.'
  } finally {
    generating.value = false
  }
}

async function submit() {
  if (!auth.user) return
  msg.value = ''
  if (createMode.value === 'pdf' && !pdfFile.value) {
    msgOk.value = false
    msg.value = 'Ajoutez un PDF pour ce type d’exercice.'
    return
  }
  if (createMode.value !== 'pdf' && !form.questions.length) {
    msgOk.value = false
    msg.value = 'Ajoutez au moins une question.'
    return
  }

  const cleaned = form.questions
    .map((q) => ({
      ...q,
      options: (q.options || []).map((o) => String(o).trim()).filter(Boolean),
      enonce: (q.enonce || '').trim(),
      correctAnswer: q.correctAnswer || (q.options || [])[0],
    }))
    .filter((q) => q.enonce)

  if (createMode.value !== 'pdf' && !cleaned.length) {
    msgOk.value = false
    msg.value = 'Les questions sont incomplètes.'
    return
  }

  saving.value = true
  try {
    let documentUrl: string | null = null
    let documentName: string | null = null
    let storagePath: string | null = null
    if (pdfFile.value) {
      storagePath = `exercises/${auth.user.uid}/${Date.now()}_${pdfFile.value.name}`
      const sRef = storageRef(storage, storagePath)
      await uploadBytes(sRef, pdfFile.value)
      documentUrl = await getDownloadURL(sRef)
      documentName = pdfFile.value.name
    }

    const kind =
      createMode.value === 'pdf'
        ? cleaned.length
          ? 'mixte'
          : 'pdf'
        : documentUrl
          ? 'mixte'
          : 'qcm'

    const exRef = await addDoc(collection(db, 'exercises'), {
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      matiere: form.matiere.trim(),
      competence: form.competence.trim() || null,
      difficulte: form.difficulte,
      classeId: form.classeId,
      courseId: form.courseId || null,
      enseignantId: auth.user.uid,
      enseignantNom: auth.displayName || 'Enseignant',
      kind,
      source: createMode.value === 'ia' ? 'ia' : 'enseignant',
      documentUrl,
      documentName,
      storagePath,
      questions: cleaned,
      status: 'a_faire',
      createdAt: nowTimestamp(),
    })

    await addDoc(collection(db, 'homework'), {
      titre: form.titre.trim(),
      matiere: form.matiere.trim(),
      classeId: form.classeId,
      exerciseId: exRef.id,
      status: 'a_faire',
      enseignantId: auth.user.uid,
      createdAt: nowTimestamp(),
    })

    form.titre = ''
    form.description = ''
    form.competence = ''
    form.questions = [blankQuestion()]
    pdfFile.value = null
    pdfName.value = ''
    msgOk.value = true
    msg.value = 'Exercice publié — visible pour les élèves de la classe.'
  } catch (e) {
    console.error(e)
    msgOk.value = false
    msg.value = "Échec de la publication (Storage ou Firestore)."
  } finally {
    saving.value = false
  }
}
</script>
