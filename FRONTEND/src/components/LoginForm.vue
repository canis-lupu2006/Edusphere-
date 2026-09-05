<template>
  <form class="glass-card p-8 shadow-sm" @submit.prevent="submit">
    <div class="mb-6 text-center">
      <div
        class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-blue-50 shadow-glow"
      >
        <Lock class="h-6 w-6 text-blue-600" />
      </div>
      <h2 class="font-display text-xl font-semibold text-slate-900">Connexion sécurisée</h2>
      <p class="mt-1 text-sm text-slate-500">
        Accès réservé aux utilisateurs EduSphere et EDU OS.
      </p>
    </div>

    <label class="mb-1.5 block text-sm text-slate-600">Adresse e-mail</label>
    <div class="relative mb-4">
      <Mail class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        v-model="email"
        type="email"
        required
        autocomplete="username"
        placeholder="prenom.nom@ecole.edu"
        class="input-field"
      />
    </div>

    <div class="mb-1.5 flex items-center justify-between">
      <label class="text-sm text-slate-600">Mot de passe</label>
      <button type="button" class="text-xs text-blue-600 hover:underline" @click="forgotHint = true">
        Mot de passe oublié ?
      </button>
    </div>
    <div class="relative mb-2">
      <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        required
        autocomplete="current-password"
        placeholder="••••••••"
        class="input-field pr-11"
      />
      <button
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        @click="showPassword = !showPassword"
      >
        <EyeOff v-if="showPassword" class="h-4 w-4" />
        <Eye v-else class="h-4 w-4" />
      </button>
    </div>
    <p v-if="forgotHint" class="mb-4 text-xs text-slate-400">
      Contactez l'administration de votre établissement pour réinitialiser votre accès.
    </p>

    <p v-if="error" class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
      {{ error }}
    </p>

    <button type="submit" class="btn-primary w-full" :disabled="loading">
      <span>{{ loading ? 'Connexion…' : 'Se connecter' }}</span>
      <ArrowRight class="h-4 w-4" />
    </button>

    <div class="my-5 flex items-center gap-3 text-xs text-slate-400">
      <div class="h-px flex-1 bg-slate-200" />
      ou
      <div class="h-px flex-1 bg-slate-200" />
    </div>

    <button type="button" class="btn-secondary w-full" disabled title="Bientôt disponible">
      <Shield class="h-4 w-4" />
      Se connecter avec SSO
    </button>

    <div class="mt-6 flex flex-wrap justify-center gap-4 text-[10px] text-slate-400">
      <span class="inline-flex items-center gap-1"><Shield class="h-3 w-3" /> AES-256</span>
      <span class="inline-flex items-center gap-1"><Lock class="h-3 w-3" /> TLS 1.3</span>
      <span class="inline-flex items-center gap-1"><FileText class="h-3 w-3" /> Accès journalisé</span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, FileText } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(
  route.query.error === 'no-role'
    ? 'Aucun rôle associé à ce compte. Vérifie le document users/{uid} dans Firestore.'
    : '',
)
const forgotHint = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.loginWithEmail(email.value.trim(), password.value)
    if (!auth.role) {
      error.value = 'Aucun rôle associé à ce compte.'
      await auth.logout()
      return
    }
    const redirect = route.query.redirect
    router.replace(typeof redirect === 'string' ? redirect : auth.dashboardPath())
  } catch {
    error.value = auth.error || 'Échec de la connexion.'
  } finally {
    loading.value = false
  }
}
</script>
