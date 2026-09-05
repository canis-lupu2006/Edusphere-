<template>
  <div>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
          Ministère
        </p>
        <h1 class="font-display text-2xl font-semibold text-emerald-950">Programmes officiels</h1>
        <p class="mt-1 text-sm text-emerald-900/55">
          Référentiels et versions par niveau et matière
        </p>
      </div>
      <label class="block text-sm">
        <span class="sr-only">Niveau</span>
        <select
          v-model="selectedNiveau"
          class="min-w-[10rem] rounded-xl border border-emerald-900/10 bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white outline-none"
        >
          <option v-for="n in niveaux" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
    </header>

    <div v-if="loading" class="py-12 text-center text-emerald-900/40">Chargement…</div>
    <div
      v-else-if="!subjectCards.length"
      class="rounded-2xl bg-white p-10 text-center text-emerald-900/45 shadow-sm"
    >
      Aucun programme pour {{ selectedNiveau }}.
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="card in subjectCards"
        :key="card.matiere"
        class="flex flex-col rounded-2xl border border-emerald-900/8 bg-white p-6 shadow-sm"
      >
        <h2 class="font-display text-xl font-semibold text-emerald-950">{{ card.matiere }}</h2>
        <p class="mt-1 text-sm text-emerald-900/50">
          {{ String(card.count).padStart(2, '0') }} Chapitre{{ card.count > 1 ? 's' : '' }}
        </p>
        <div class="mt-6 flex flex-1 flex-col justify-end gap-2">
          <button
            type="button"
            class="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
            @click="openView(card)"
          >
            Voir le programme
          </button>
          <button
            type="button"
            class="w-full rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            @click="openPublish(card)"
          >
            Publier une version
          </button>
        </div>
      </article>
    </div>

    <!-- Modal voir -->
    <div
      v-if="viewCard"
      class="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4"
      @click.self="viewCard = null"
    >
      <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="font-display text-lg font-semibold text-emerald-950">
          {{ viewCard.matiere }} · {{ selectedNiveau }}
        </h2>
        <p class="mt-1 text-sm text-emerald-900/50">{{ viewChapters.length }} chapitre(s)</p>

        <div
          v-if="latestVersion"
          class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-[#166534]">
            Dernière version PDF
          </p>
          <p class="mt-1 truncate text-sm text-emerald-900">{{ latestVersion.fileName }}</p>
          <a
            :href="latestVersion.url"
            target="_blank"
            rel="noopener"
            class="mt-2 inline-flex text-sm font-medium text-[#166534] underline"
          >
            Ouvrir le PDF
          </a>
        </div>

        <ul v-if="viewChapters.length" class="mt-4 divide-y divide-emerald-900/5">
          <li
            v-for="(ch, i) in viewChapters"
            :key="ch.id"
            class="flex items-start gap-3 py-2.5 text-sm"
          >
            <span class="w-6 shrink-0 text-emerald-900/35">{{ i + 1 }}.</span>
            <div>
              <p class="font-medium text-emerald-950">{{ ch.titre }}</p>
              <p v-if="ch.status" class="text-xs capitalize text-emerald-900/45">{{ ch.status }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="mt-4 text-sm text-emerald-900/45">
          Aucun chapitre détaillé. Publiez un PDF pour partager le référentiel.
        </p>

        <div class="mt-5 flex justify-end">
          <button type="button" class="btn-ghost" @click="viewCard = null">Fermer</button>
        </div>
      </div>
    </div>

    <!-- Modal publier -->
    <div
      v-if="publishCard"
      class="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4"
      @click.self="closePublish"
    >
      <div class="w-full max-w-md rounded-2xl bg-[#f4f7f5] p-6 shadow-xl">
        <h2 class="font-display text-sm font-bold uppercase tracking-wide text-emerald-950">
          Nouvelle version
        </h2>
        <p class="mt-1 text-sm text-emerald-900/50">
          {{ publishCard.matiere }} · {{ selectedNiveau }}
        </p>

        <label
          class="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-900/20 bg-white px-6 py-10 text-center transition hover:border-[#166534]/40"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf,.pdf"
            class="hidden"
            @change="onFilePick"
          />
          <p class="text-sm font-medium text-emerald-900/70">
            Glissez vos fichiers ici, ou
            <span class="text-[#166534] underline">parcourez votre ordinateur</span>
          </p>
          <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-900/40">PDF</p>
          <p v-if="selectedFile" class="mt-3 max-w-full truncate text-sm text-[#166534]">
            {{ selectedFile.name }}
          </p>
        </label>

        <p v-if="publishError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ publishError }}
        </p>

        <button
          type="button"
          class="mt-5 w-full rounded-xl bg-[#166534] py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          :disabled="!selectedFile || publishing"
          @click="publish"
        >
          {{ publishing ? 'Publication…' : 'Publier' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import type { ProgramChapter, ProgramSubject, ProgramVersion } from '@/types/models'

interface SubjectCard {
  matiere: string
  count: number
}

const DEFAULT_NIVEAUX = ['Terminale D', 'Première D', 'Seconde', 'Troisième']

const auth = useAuthStore()
const loading = ref(true)
const chapters = ref<ProgramChapter[]>([])
const subjects = ref<ProgramSubject[]>([])
const versions = ref<ProgramVersion[]>([])
const selectedNiveau = ref('Terminale D')

const viewCard = ref<SubjectCard | null>(null)
const publishCard = ref<SubjectCard | null>(null)
const selectedFile = ref<File | null>(null)
const publishing = ref(false)
const publishError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const niveaux = computed(() => {
  const fromData = [
    ...subjects.value.map((s) => s.niveau),
    ...chapters.value.map((c) => c.niveau),
  ].filter(Boolean) as string[]
  return [...new Set([...DEFAULT_NIVEAUX, ...fromData])]
})

const subjectCards = computed<SubjectCard[]>(() => {
  const niveau = selectedNiveau.value
  const meta = subjects.value.filter((s) => s.niveau === niveau)
  if (meta.length) {
    return meta
      .map((s) => ({
        matiere: s.matiere || 'Matière',
        count: Number(s.chapitresCount ?? 0),
      }))
      .sort((a, b) => a.matiere.localeCompare(b.matiere, 'fr'))
  }
  const map = new Map<string, number>()
  for (const c of chapters.value) {
    if (c.niveau !== niveau || !c.matiere) continue
    map.set(c.matiere, (map.get(c.matiere) || 0) + 1)
  }
  return [...map.entries()]
    .map(([matiere, count]) => ({ matiere, count }))
    .sort((a, b) => a.matiere.localeCompare(b.matiere, 'fr'))
})

const viewChapters = computed(() => {
  if (!viewCard.value) return []
  return chapters.value
    .filter(
      (c) => c.niveau === selectedNiveau.value && c.matiere === viewCard.value!.matiere,
    )
    .sort((a, b) => (a.titre || '').localeCompare(b.titre || '', 'fr'))
})

const latestVersion = computed(() => {
  if (!viewCard.value) return null
  const list = versions.value
    .filter(
      (v) => v.niveau === selectedNiveau.value && v.matiere === viewCard.value!.matiere,
    )
    .sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0))
  return list[0] || null
})

function openView(card: SubjectCard) {
  viewCard.value = card
}

function openPublish(card: SubjectCard) {
  publishCard.value = card
  selectedFile.value = null
  publishError.value = ''
}

function closePublish() {
  publishCard.value = null
  selectedFile.value = null
  publishError.value = ''
}

function onFilePick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) acceptFile(file)
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) acceptFile(file)
}

function acceptFile(file: File) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    publishError.value = 'Seuls les fichiers PDF sont acceptés.'
    return
  }
  publishError.value = ''
  selectedFile.value = file
}

async function publish() {
  if (!publishCard.value || !selectedFile.value) return
  publishing.value = true
  publishError.value = ''
  try {
    const matiere = publishCard.value.matiere
    const niveau = selectedNiveau.value
    const existing = versions.value.filter((v) => v.niveau === niveau && v.matiere === matiere)
    const nextVersion = existing.reduce((m, v) => Math.max(m, Number(v.version ?? 0)), 0) + 1
    const path = `programmes/${niveau}/${matiere}/v${nextVersion}_${Date.now()}.pdf`
    const sRef = storageRef(storage, path)
    await uploadBytes(sRef, selectedFile.value)
    const url = await getDownloadURL(sRef)
    const payload = {
      niveau,
      matiere,
      fileName: selectedFile.value.name,
      url,
      storagePath: path,
      version: nextVersion,
      createdBy: auth.user?.uid || null,
      createdAt: serverTimestamp(),
    }
    const docRef = await addDoc(collection(db, 'program_versions'), payload)
    versions.value = [{ id: docRef.id, ...payload, createdAt: undefined }, ...versions.value]
    closePublish()
  } catch (e) {
    publishError.value = e instanceof Error ? e.message : 'Échec de la publication.'
  } finally {
    publishing.value = false
  }
}

onMounted(async () => {
  try {
    const [chSnap, subSnap, verSnap] = await Promise.all([
      getDocs(collection(db, 'program_chapters')),
      getDocs(collection(db, 'programmes')),
      getDocs(collection(db, 'program_versions')),
    ])
    chapters.value = chSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgramChapter))
    subjects.value = subSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgramSubject))
    versions.value = verSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgramVersion))
    if (!niveaux.value.includes(selectedNiveau.value) && niveaux.value[0]) {
      selectedNiveau.value = niveaux.value[0]
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.btn-ghost {
  border-radius: 0.75rem;
  border: 1px solid rgba(6, 78, 59, 0.1);
  background: white;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(6, 78, 59, 0.7);
}
.btn-ghost:hover {
  background: #ecfdf5;
}
</style>
