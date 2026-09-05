<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">Paramètres</h1>
      <p class="mt-1 text-sm text-emerald-900/55">Préférences locales et profil connecté</p>
    </header>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-4 font-display text-lg font-semibold text-emerald-950">
          Année scolaire
        </h2>
        <label class="block text-sm">
          <span class="mb-1 block text-xs text-emerald-900/50">Libellé affiché</span>
          <input
            v-model="anneeScolaire"
            type="text"
            class="w-full rounded-xl border border-emerald-900/10 bg-[#f4f7f5] px-3 py-2.5 text-sm outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/15"
            placeholder="Année scolaire 2025 - 2026"
          />
        </label>
        <button
          type="button"
          class="mt-4 inline-flex rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          @click="save"
        >
          Enregistrer
        </button>
        <p v-if="saved" class="mt-2 text-sm text-[#166534]">Paramètres enregistrés (localStorage).</p>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-4 font-display text-lg font-semibold text-emerald-950">Profil</h2>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between gap-4 border-b border-emerald-900/5 pb-2">
            <dt class="text-emerald-900/50">Nom</dt>
            <dd class="font-medium text-emerald-950">{{ auth.displayName }}</dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-emerald-900/5 pb-2">
            <dt class="text-emerald-900/50">E-mail</dt>
            <dd class="font-medium text-emerald-950">
              {{ auth.profile?.email || auth.user?.email || '—' }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 border-b border-emerald-900/5 pb-2">
            <dt class="text-emerald-900/50">Rôle</dt>
            <dd class="font-medium capitalize text-emerald-950">{{ auth.role || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-emerald-900/50">UID</dt>
            <dd class="truncate font-mono text-xs text-emerald-900/70">
              {{ auth.user?.uid || '—' }}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const STORAGE_KEY = 'edusphere_annee_scolaire'
const auth = useAuthStore()
const anneeScolaire = ref(
  localStorage.getItem(STORAGE_KEY) || 'Année scolaire 2025 - 2026',
)
const saved = ref(false)

function save() {
  localStorage.setItem(STORAGE_KEY, anneeScolaire.value.trim() || 'Année scolaire 2025 - 2026')
  saved.value = true
  window.setTimeout(() => {
    saved.value = false
  }, 2500)
}
</script>
