<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          ADMINISTRATION
        </p>
        <h1 class="page-title">Élèves & Enseignants</h1>
        <p class="page-sub">Gérer les comptes, rôles et statuts.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary text-sm" @click="onImport">
          <Upload class="h-4 w-4" />
          Importer
        </button>
        <button type="button" class="btn-primary text-sm !from-emerald-600 !to-emerald-500" @click="onAdd">
          <Plus class="h-4 w-4" />
          Ajouter
        </button>
      </div>
    </header>

    <div class="mb-4 flex gap-6 border-b border-slate-200">
      <button
        type="button"
        class="border-b-2 pb-2 text-sm font-medium transition"
        :class="tab === 'eleve' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-600'"
        @click="tab = 'eleve'"
      >
        Élèves
      </button>
      <button
        type="button"
        class="border-b-2 pb-2 text-sm font-medium transition"
        :class="tab === 'enseignant' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-600'"
        @click="tab = 'enseignant'"
      >
        Enseignants
      </button>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Users class="h-4 w-4" />
        </div>
        <div>
          <p class="font-display text-xl font-bold">{{ elevesCount }}</p>
          <p class="text-xs text-slate-500">élèves</p>
        </div>
      </div>
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <GraduationCap class="h-4 w-4" />
        </div>
        <div>
          <p class="font-display text-xl font-bold">{{ enseignantsCount }}</p>
          <p class="text-xs text-slate-500">enseignants</p>
        </div>
      </div>
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <UserX class="h-4 w-4" />
        </div>
        <div>
          <p class="font-display text-xl font-bold">{{ inactifsCount }}</p>
          <p class="text-xs text-slate-500">comptes inactifs</p>
        </div>
      </div>
    </div>

    <div class="glass-card mb-4 flex flex-wrap gap-3 p-4">
      <div class="relative min-w-[14rem] flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          class="input-field"
          :placeholder="tab === 'eleve' ? 'Rechercher un élève…' : 'Rechercher un enseignant…'"
        />
      </div>
      <select v-model="filtreClasse" class="input-field !w-auto !pl-4">
        <option value="">Classe (Toutes)</option>
        <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filtreStatut" class="input-field !w-auto !pl-4">
        <option value="">Statut (Tous)</option>
        <option value="actif">Actif</option>
        <option value="inactif">Inactif</option>
      </select>
    </div>

    <div class="glass-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Nom</th>
            <th class="px-4 py-3">Classe</th>
            <th class="px-4 py-3">Rôle</th>
            <th class="px-4 py-3">Moyenne</th>
            <th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.uid" class="border-b border-slate-100">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-200"
                >
                  {{ initials(u) }}
                </div>
                <div>
                  <p class="font-medium">{{ displayName(u) }}</p>
                  <p class="text-xs text-slate-400">{{ u.email || '—' }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ u.classeNom || '—' }}</td>
            <td class="px-4 py-3">
              <select
                :value="u.role ?? ''"
                class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                @change="onRoleChange(u, $event)"
              >
                <option value="eleve">Élève</option>
                <option value="enseignant">Enseignant</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td class="px-4 py-3 font-medium text-emerald-700">
              {{ u.moyenne != null ? `${u.moyenne} / 20` : '—' }}
            </td>
            <td class="px-4 py-3">
              <select
                :value="u.status || 'actif'"
                class="rounded-full border px-2 py-1 text-xs"
                :class="
                  (u.status || 'actif') === 'actif'
                    ? 'border-emerald-500/30 bg-emerald-100 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                "
                @change="onStatusChange(u, $event)"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                title="Modifier le profil"
                @click="editNote(u)"
              >
                <MoreVertical class="h-4 w-4" />
              </button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="6" class="px-4 py-10 text-center text-slate-400">Aucun utilisateur trouvé.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import {
  Users,
  GraduationCap,
  UserX,
  Search,
  Upload,
  Plus,
  MoreVertical,
} from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import type { UserProfile, UserRole } from '@/types/models'

const auth = useAuthStore()
const users = ref<UserProfile[]>([])
const tab = ref<'eleve' | 'enseignant'>('eleve')
const search = ref('')
const filtreClasse = ref('')
const filtreStatut = ref('')
let unsub: Unsubscribe | null = null

const elevesCount = computed(() => users.value.filter((u) => u.role === 'eleve').length)
const enseignantsCount = computed(() => users.value.filter((u) => u.role === 'enseignant').length)
const inactifsCount = computed(
  () => users.value.filter((u) => (u.status || 'actif') === 'inactif').length,
)

const classes = computed(() => {
  const set = new Set<string>()
  users.value.forEach((u) => {
    if (u.classeNom) set.add(u.classeNom)
  })
  return [...set].sort()
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (u.role !== tab.value) return false
    if (filtreClasse.value && u.classeNom !== filtreClasse.value) return false
    if (filtreStatut.value && (u.status || 'actif') !== filtreStatut.value) return false
    if (!q) return true
    const hay = `${displayName(u)} ${u.email || ''} ${u.classeNom || ''}`.toLowerCase()
    return hay.includes(q)
  })
})

function displayName(u: UserProfile) {
  return u.displayName || u.nom || u.email || u.uid
}

function initials(u: UserProfile) {
  return displayName(u)
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

onMounted(() => {
  unsub = onSnapshot(collection(db, 'users'), (snap) => {
    const ecoleId = auth.profile?.ecoleId
    users.value = snap.docs
      .map((d) => {
        const data = d.data()
        return {
          uid: d.id,
          id: d.id,
          role: (data.role as UserRole) ?? null,
          ...data,
        } as UserProfile
      })
      .filter((u) => !ecoleId || !u.ecoleId || u.ecoleId === ecoleId)
  })
})

onUnmounted(() => unsub?.())

function onRoleChange(u: UserProfile, event: Event) {
  const target = event.target as HTMLSelectElement
  void updateDoc(doc(db, 'users', u.uid), { role: target.value as UserRole })
}

function onStatusChange(u: UserProfile, event: Event) {
  const target = event.target as HTMLSelectElement
  void updateDoc(doc(db, 'users', u.uid), { status: target.value })
}

function onAdd() {
  window.alert(
    'La création Auth (email/mot de passe) se fait via la console Firebase. Vous pouvez ensuite mettre à jour le profil utilisateur ici (rôle / statut).',
  )
}

function onImport() {
  window.alert('Import CSV non disponible dans cette version.')
}

function editNote(u: UserProfile) {
  const nom = window.prompt('Nom affiché', displayName(u))
  if (nom == null) return
  void updateDoc(doc(db, 'users', u.uid), { displayName: nom.trim() || displayName(u) })
}
</script>
