<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title">Utilisateurs</h1>
      <p class="page-sub">Gérer les rôles et comptes.</p>
    </header>

    <div class="glass-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-white/10 text-white/45">
          <tr>
            <th class="px-4 py-3">Nom</th>
            <th class="px-4 py-3">E-mail</th>
            <th class="px-4 py-3">Rôle</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.uid" class="border-b border-white/5">
            <td class="px-4 py-3">{{ u.displayName || u.nom || '—' }}</td>
            <td class="px-4 py-3 text-white/50">{{ u.email || '—' }}</td>
            <td class="px-4 py-3">
              <select
                :value="u.role ?? ''"
                class="rounded-lg border border-white/10 bg-[#0d1424] px-2 py-1 text-xs"
                @change="onRoleChange(u, $event)"
              >
                <option value="eleve">Élève</option>
                <option value="enseignant">Enseignant</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
                <option value="ministere">Ministère</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <button type="button" class="text-xs text-red-400 hover:underline" @click="removeUser(u)">
                Supprimer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import type { UserProfile, UserRole } from '@/types/models'

const users = ref<UserProfile[]>([])

onMounted(() => {
  onSnapshot(collection(db, 'users'), (snap) => {
    users.value = snap.docs.map((d) => {
      const data = d.data()
      return {
        uid: d.id,
        id: d.id,
        role: (data.role as UserRole) ?? null,
        email: data.email as string | undefined,
        displayName: data.displayName as string | undefined,
        nom: data.nom as string | undefined,
        ...data,
      } as UserProfile
    })
  })
})

function onRoleChange(u: UserProfile, event: Event) {
  const target = event.target as HTMLSelectElement
  void changeRole(u, target.value as UserRole)
}

async function changeRole(u: UserProfile, role: UserRole) {
  await updateDoc(doc(db, 'users', u.uid), { role })
}

async function removeUser(u: UserProfile) {
  if (!confirm(`Supprimer le profil de ${u.displayName || u.email || u.uid} ?`)) return
  await deleteDoc(doc(db, 'users', u.uid))
}
</script>
