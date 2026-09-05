<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
        PROFESSEUR
      </p>
      <h1 class="page-title">Contenus & Validation IA</h1>
      <p class="page-sub">
        Importez vos ressources et validez les contenus générés par l'IA avant diffusion.
      </p>
    </header>

    <div class="glass-card mb-6 p-5">
      <h2 class="mb-4 font-display text-lg font-semibold">Importer des ressources</h2>
      <p class="mb-3 text-sm text-slate-500">
        Pour qu’un fichier apparaisse chez les élèves, rattachez-le à un cours (ou utilisez
        <RouterLink to="/teacher/cours" class="font-semibold text-violet-600 hover:underline">Mes cours</RouterLink>).
      </p>
      <label class="mb-3 block text-sm">
        <span class="mb-1 block text-slate-500">Cours cible (recommandé)</span>
        <select v-model="selectedCourseId" class="input-field">
          <option value="">Bibliothèque seule (pas visible élève)</option>
          <option v-for="c in myCourses" :key="c.id" :value="c.id">
            {{ c.titre }} — {{ c.matiere || '' }}
          </option>
        </select>
      </label>
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 px-6 py-10 text-center transition hover:border-blue-400/50 hover:bg-blue-500/10"
      >
        <UploadCloud class="h-8 w-8 text-blue-600" />
        <p class="text-sm text-slate-600">
          Glissez vos fichiers ici, ou
          <span class="font-semibold text-blue-600">parcourez votre ordinateur</span>
        </p>
        <p class="text-xs text-slate-400">PDF, vidéos, liens et notes de cours</p>
        <input type="file" class="hidden" @change="onFile" />
      </label>
      <p v-if="uploadMsg" class="mt-3 text-sm" :class="uploadOk ? 'text-emerald-700' : 'text-red-600'">
        {{ uploadMsg }}
      </p>
      <p v-if="uploading" class="mt-2 text-sm text-slate-400">Upload en cours…</p>
    </div>

    <div class="glass-card overflow-hidden">
      <div class="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <h2 class="font-display text-lg font-semibold">
          Contenus générés par l'IA en attente de validation
        </h2>
        <span
          class="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-600"
        >
          {{ pending.length }} en attente
        </span>
      </div>

      <div v-if="loading" class="p-8 text-center text-slate-400">Chargement…</div>
      <div v-else-if="!pending.length" class="p-8 text-center text-slate-400">
        Aucun contenu en attente.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th class="px-5 py-3 font-medium">Notion</th>
              <th class="px-5 py-3 font-medium">Type</th>
              <th class="px-5 py-3 font-medium">Aperçu</th>
              <th class="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="c in pending" :key="c.id" class="hover:bg-slate-50">
              <td class="px-5 py-3 font-medium">{{ c.notion }}</td>
              <td class="px-5 py-3 text-slate-500">{{ c.type }}</td>
              <td class="max-w-xs truncate px-5 py-3 text-slate-500">{{ c.apercu }}</td>
              <td class="px-5 py-3">
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn-primary !px-3 !py-1.5 text-xs" @click="validate(c)">
                    Valider
                  </button>
                  <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" @click="edit(c)">
                    Modifier
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Unsubscribe } from 'firebase/firestore'
import type { AiContent, Course, ResourceItem } from '@/types/models'
import {
  arrayUnion,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { UploadCloud } from 'lucide-vue-next'
import { db, storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'

const auth = useAuthStore()
const pending = ref<AiContent[]>([])
const myCourses = ref<Course[]>([])
const selectedCourseId = ref('')
const loading = ref(true)
const uploading = ref(false)
const uploadMsg = ref('')
const uploadOk = ref(false)
let unsub: Unsubscribe | null = null
let unsubCourses: Unsubscribe | null = null

onMounted(() => {
  const uid = auth.user?.uid
  if (!uid) {
    loading.value = false
    return
  }
  const q = query(
    collection(db, 'ai_contents'),
    where('enseignantId', '==', uid),
    where('status', '==', 'en_attente'),
  )
  unsub = onSnapshot(q, (snap) => {
    pending.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AiContent))
    loading.value = false
  })
  unsubCourses = onSnapshot(
    query(collection(db, 'courses'), where('enseignantId', '==', uid)),
    (snap) => {
      myCourses.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
    },
  )
})

onUnmounted(() => {
  unsub?.()
  unsubCourses?.()
})

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !auth.user) return

  uploading.value = true
  uploadMsg.value = ''
  try {
    const courseId = selectedCourseId.value
    const path = courseId
      ? `courses/${courseId}/${Date.now()}_${file.name}`
      : `resources/${auth.user.uid}/${Date.now()}_${file.name}`
    const sRef = storageRef(storage, path)
    await uploadBytes(sRef, file)
    const url = await getDownloadURL(sRef)
    const course = myCourses.value.find((c) => c.id === courseId)

    await addDoc(collection(db, 'resources'), {
      titre: file.name,
      fileName: file.name,
      fileType: file.type,
      url,
      storagePath: path,
      enseignantId: auth.user.uid,
      courseId: courseId || null,
      classeId: course?.classeId || null,
      createdAt: nowTimestamp(),
    })

    if (courseId) {
      const item: ResourceItem = {
        id: `${Date.now()}`,
        titre: file.name,
        name: file.name,
        url,
        fileType: file.type,
        storagePath: path,
        uploadedAt: new Date().toISOString(),
      }
      await updateDoc(doc(db, 'courses', courseId), {
        ressources: arrayUnion(item),
        updatedAt: nowTimestamp(),
      })
    }

    uploadOk.value = true
    uploadMsg.value = courseId
      ? `« ${file.name} » ajouté au cours — visible pour les élèves.`
      : `« ${file.name} » importé (bibliothèque seule).`
  } catch {
    uploadOk.value = false
    uploadMsg.value = "Échec de l'import."
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function validate(c: AiContent) {
  await updateDoc(doc(db, 'ai_contents', c.id), { status: 'valide' })
}

async function edit(c: AiContent) {
  const next = window.prompt('Modifier l’aperçu', c.apercu || '')
  if (next === null) return
  await updateDoc(doc(db, 'ai_contents', c.id), { apercu: next })
}
</script>
