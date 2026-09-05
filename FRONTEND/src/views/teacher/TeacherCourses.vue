<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
          PROFESSEUR
        </p>
        <h1 class="page-title">Mes cours</h1>
        <p class="page-sub">
          Créez des cours pour vos classes, ajoutez le contenu et des fichiers — les élèves les voient
          immédiatement.
        </p>
      </div>
      <button type="button" class="btn-primary text-sm" @click="openCreate">
        <Plus class="mr-1.5 inline h-4 w-4" />
        Nouveau cours
      </button>
    </header>

    <div v-if="loading" class="py-12 text-center text-slate-400">Chargement…</div>
    <div v-else-if="!courses.length" class="glass-card py-12 text-center text-slate-400">
      Aucun cours. Créez-en un pour vos élèves.
    </div>
    <div v-else class="grid gap-4 lg:grid-cols-2">
      <article
        v-for="c in courses"
        :key="c.id"
        class="glass-card flex cursor-pointer flex-col p-5 transition hover:border-violet-300 hover:shadow-md"
        :class="selectedId === c.id ? 'ring-2 ring-violet-400/50' : ''"
        @click="selectCourse(c.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-xs font-medium text-violet-600">{{ c.matiere || 'Matière' }}</p>
            <h3 class="font-display text-lg font-semibold text-slate-900">{{ c.titre }}</h3>
            <p class="mt-1 text-xs text-slate-500">
              {{ c.classeNom || c.classeId || 'Classe' }} ·
              {{ resourceCount(c) }} ressource(s)
            </p>
          </div>
          <span
            class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            :class="
              c.status === 'publie'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            "
          >
            {{ c.status === 'publie' ? 'Publié' : 'Brouillon' }}
          </span>
        </div>
        <p v-if="c.description" class="mt-3 line-clamp-2 text-sm text-slate-500">
          {{ c.description }}
        </p>
      </article>
    </div>

    <!-- Panneau édition du cours sélectionné -->
    <section v-if="selected" class="glass-card mt-6 p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-display text-lg font-semibold">{{ selected.titre }}</h2>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn-secondary text-xs"
            :disabled="saving"
            @click="togglePublish"
          >
            {{ selected.status === 'publie' ? 'Repasser en brouillon' : 'Publier pour les élèves' }}
          </button>
          <button type="button" class="btn-secondary text-xs text-red-600" @click="removeCourse">
            Supprimer
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="block text-sm">
          <span class="mb-1 block text-slate-500">Titre</span>
          <input v-model="edit.titre" class="input-field" />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block text-slate-500">Matière</span>
          <input v-model="edit.matiere" class="input-field" />
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="mb-1 block text-slate-500">Description</span>
          <input v-model="edit.description" class="input-field" />
        </label>
        <label class="block text-sm md:col-span-2">
          <span class="mb-1 block text-slate-500">Contenu du cours (texte lu par l’élève)</span>
          <textarea
            v-model="edit.contenuTexte"
            rows="8"
            class="input-field !pl-4 font-normal"
            placeholder="Rédigez le cours ici (notions, exemples, exercices d’application…)"
          />
        </label>
      </div>
      <div class="mt-3 flex justify-end">
        <button type="button" class="btn-primary text-sm" :disabled="saving" @click="saveMeta">
          {{ saving ? 'Enregistrement…' : 'Enregistrer le contenu' }}
        </button>
      </div>
      <p v-if="metaMsg" class="mt-2 text-sm" :class="metaOk ? 'text-emerald-700' : 'text-red-600'">
        {{ metaMsg }}
      </p>

      <div class="mt-8 border-t border-slate-100 pt-5">
        <h3 class="mb-3 font-display text-base font-semibold">Fichiers & ressources</h3>
        <label
          class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-400/40 bg-violet-500/5 px-6 py-8 text-center transition hover:border-violet-400/70"
        >
          <UploadCloud class="h-7 w-7 text-violet-600" />
          <p class="text-sm text-slate-600">
            Ajouter un PDF, document ou image
            <span class="font-semibold text-violet-600">pour ce cours</span>
          </p>
          <input type="file" class="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt" @change="onUpload" />
        </label>
        <p v-if="uploading" class="mt-2 text-sm text-slate-400">Upload en cours…</p>
        <p v-if="uploadMsg" class="mt-2 text-sm" :class="uploadOk ? 'text-emerald-700' : 'text-red-600'">
          {{ uploadMsg }}
        </p>

        <ul v-if="selectedResources.length" class="mt-4 divide-y divide-slate-100">
          <li
            v-for="(r, i) in selectedResources"
            :key="r.id || r.url + i"
            class="flex items-center justify-between gap-3 py-3"
          >
            <a
              :href="r.url"
              target="_blank"
              rel="noopener"
              class="flex min-w-0 items-center gap-2 text-sm text-violet-700 hover:underline"
            >
              <FileText class="h-4 w-4 shrink-0" />
              <span class="truncate">{{ r.titre || r.name || 'Ressource' }}</span>
            </a>
            <button
              type="button"
              class="shrink-0 text-xs text-red-600 hover:underline"
              @click="removeResource(i)"
            >
              Retirer
            </button>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-slate-400">Aucune ressource jointe.</p>
      </div>
    </section>

    <!-- Modal création -->
    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showCreate = false"
    >
      <div class="glass-card w-full max-w-lg p-6">
        <h3 class="font-display text-lg font-semibold">Nouveau cours</h3>
        <div class="mt-4 space-y-3">
          <label class="block text-sm">
            <span class="mb-1 block text-slate-500">Classe</span>
            <select v-model="createForm.classeId" class="input-field">
              <option disabled value="">Choisir une classe</option>
              <option v-for="cl in classes" :key="cl.id" :value="cl.id">
                {{ cl.nom || cl.id }}{{ cl.niveau ? ` (${cl.niveau})` : '' }}
              </option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-slate-500">Titre</span>
            <input v-model="createForm.titre" class="input-field" placeholder="Ex. Fonctions et dérivées" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-slate-500">Matière</span>
            <input v-model="createForm.matiere" class="input-field" placeholder="Ex. Mathématiques" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-slate-500">Description (optionnel)</span>
            <input v-model="createForm.description" class="input-field" />
          </label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn-secondary text-sm" @click="showCreate = false">Annuler</button>
          <button type="button" class="btn-primary text-sm" :disabled="creating" @click="createCourse">
            {{ creating ? 'Création…' : 'Créer & publier' }}
          </button>
        </div>
        <p v-if="createError" class="mt-2 text-sm text-red-600">{{ createError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { ClassRecord, Course, ResourceItem } from '@/types/models'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { FileText, Plus, UploadCloud } from 'lucide-vue-next'
import { db, storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'

const auth = useAuthStore()
const courses = ref<Course[]>([])
const classes = ref<ClassRecord[]>([])
const loading = ref(true)
const selectedId = ref<string | null>(null)
const saving = ref(false)
const metaMsg = ref('')
const metaOk = ref(false)
const uploading = ref(false)
const uploadMsg = ref('')
const uploadOk = ref(false)
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

const edit = reactive({
  titre: '',
  matiere: '',
  description: '',
  contenuTexte: '',
})

const createForm = reactive({
  classeId: '',
  titre: '',
  matiere: '',
  description: '',
})

let unsub: Unsubscribe | null = null

const selected = computed(() => courses.value.find((c) => c.id === selectedId.value) || null)

const selectedResources = computed((): ResourceItem[] => {
  if (!selected.value) return []
  return selected.value.ressources || selected.value.resources || []
})

function resourceCount(c: Course) {
  const r = c.ressources || c.resources || []
  return Array.isArray(r) ? r.length : 0
}

function selectCourse(id: string) {
  selectedId.value = id
}

watch(selected, (c) => {
  if (!c) return
  edit.titre = c.titre || ''
  edit.matiere = c.matiere || ''
  edit.description = c.description || ''
  edit.contenuTexte = c.contenuTexte || ''
  metaMsg.value = ''
  uploadMsg.value = ''
})

async function loadClasses() {
  const uid = auth.user?.uid
  if (!uid) return
  const map = new Map<string, ClassRecord>()
  const profileIds =
    auth.profile?.classeIds || (auth.profile?.classeId ? [auth.profile.classeId] : [])
  for (const id of profileIds) {
    if (!id) continue
    map.set(id, { id, nom: id })
  }
  try {
    const snap = await getDocs(
      query(collection(db, 'classes'), where('enseignantIds', 'array-contains', uid)),
    )
    snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() } as ClassRecord))
  } catch {
    /* index / rules */
  }
  for (const id of [...map.keys()]) {
    if (map.get(id)?.nom && map.get(id)?.nom !== id) continue
    try {
      const s = await getDoc(doc(db, 'classes', id))
      if (s.exists()) map.set(id, { id, ...s.data() } as ClassRecord)
    } catch {
      /* ignore */
    }
  }
  classes.value = Array.from(map.values())
  if (classes.value.length && !createForm.classeId) {
    createForm.classeId = classes.value[0].id
  }
}

onMounted(async () => {
  await loadClasses()
  const uid = auth.user?.uid
  if (!uid) {
    loading.value = false
    return
  }
  unsub = onSnapshot(
    query(collection(db, 'courses'), where('enseignantId', '==', uid)),
    (snap) => {
      courses.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
      loading.value = false
      if (!selectedId.value && courses.value.length) {
        selectedId.value = courses.value[0].id
      }
    },
    () => {
      loading.value = false
    },
  )
})

onUnmounted(() => unsub?.())

function openCreate() {
  createError.value = ''
  createForm.titre = ''
  createForm.matiere = ''
  createForm.description = ''
  if (classes.value.length) createForm.classeId = classes.value[0].id
  showCreate.value = true
}

async function createCourse() {
  createError.value = ''
  if (!auth.user) return
  if (!createForm.classeId || !createForm.titre.trim() || !createForm.matiere.trim()) {
    createError.value = 'Classe, titre et matière sont requis.'
    return
  }
  creating.value = true
  try {
    const cl = classes.value.find((c) => c.id === createForm.classeId)
    const ref = await addDoc(collection(db, 'courses'), {
      titre: createForm.titre.trim(),
      matiere: createForm.matiere.trim(),
      description: createForm.description.trim() || null,
      contenuTexte: '',
      classeId: createForm.classeId,
      classeNom: cl?.nom || createForm.classeId,
      enseignantId: auth.user.uid,
      enseignantNom: auth.displayName || auth.profile?.displayName || 'Enseignant',
      chapitres: 0,
      ressources: [],
      status: 'publie',
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    })
    showCreate.value = false
    selectedId.value = ref.id
  } catch (e) {
    createError.value = e instanceof Error ? e.message : 'Création impossible.'
  } finally {
    creating.value = false
  }
}

async function saveMeta() {
  if (!selected.value) return
  saving.value = true
  metaMsg.value = ''
  try {
    await updateDoc(doc(db, 'courses', selected.value.id), {
      titre: edit.titre.trim(),
      matiere: edit.matiere.trim(),
      description: edit.description.trim() || null,
      contenuTexte: edit.contenuTexte,
      updatedAt: nowTimestamp(),
    })
    metaOk.value = true
    metaMsg.value = 'Cours enregistré — visible pour les élèves de la classe.'
  } catch {
    metaOk.value = false
    metaMsg.value = 'Échec de l’enregistrement.'
  } finally {
    saving.value = false
  }
}

async function togglePublish() {
  if (!selected.value) return
  const next = selected.value.status === 'publie' ? 'brouillon' : 'publie'
  await updateDoc(doc(db, 'courses', selected.value.id), {
    status: next,
    updatedAt: nowTimestamp(),
  })
}

async function removeCourse() {
  if (!selected.value) return
  if (!window.confirm(`Supprimer le cours « ${selected.value.titre} » ?`)) return
  const id = selected.value.id
  await deleteDoc(doc(db, 'courses', id))
  selectedId.value = null
}

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !auth.user || !selected.value) return

  uploading.value = true
  uploadMsg.value = ''
  try {
    const path = `courses/${selected.value.id}/${Date.now()}_${file.name}`
    const sRef = storageRef(storage, path)
    await uploadBytes(sRef, file)
    const url = await getDownloadURL(sRef)
    const item: ResourceItem = {
      id: `${Date.now()}`,
      titre: file.name,
      name: file.name,
      url,
      fileType: file.type || 'application/octet-stream',
      storagePath: path,
      uploadedAt: new Date().toISOString(),
    }
    await updateDoc(doc(db, 'courses', selected.value.id), {
      ressources: arrayUnion(item),
      updatedAt: nowTimestamp(),
    })
    await addDoc(collection(db, 'resources'), {
      titre: file.name,
      fileName: file.name,
      fileType: file.type,
      url,
      storagePath: path,
      enseignantId: auth.user.uid,
      courseId: selected.value.id,
      classeId: selected.value.classeId || null,
      createdAt: nowTimestamp(),
    })
    uploadOk.value = true
    uploadMsg.value = `« ${file.name} » ajouté au cours.`
  } catch {
    uploadOk.value = false
    uploadMsg.value =
      "Échec de l'upload (vérifiez les règles Storage Firebase ou réessayez)."
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeResource(index: number) {
  if (!selected.value) return
  const next = [...selectedResources.value]
  next.splice(index, 1)
  await updateDoc(doc(db, 'courses', selected.value.id), {
    ressources: next,
    updatedAt: nowTimestamp(),
  })
}
</script>
