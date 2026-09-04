<template>
  <div
    class="flex min-h-screen items-center justify-center bg-edu-bg bg-edu-radial px-4 py-10"
  >
    <div class="w-full max-w-md text-center">
      <div
        class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 shadow-glow"
      >
        <Loader2 class="h-8 w-8 animate-spin text-blue-400" />
      </div>
      <h1 class="font-display text-xl font-semibold">Connexion EDU OS…</h1>
      <p class="mt-2 text-sm text-white/50">
        Authentification automatique en cours. Veuillez patienter.
      </p>
      <p v-if="errorMsg" class="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {{ errorMsg }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const errorMsg = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token || typeof token !== 'string') {
    router.replace('/login')
    return
  }

  try {
    await auth.loginWithToken(token)
    const path = auth.dashboardPath()
    if (!auth.role) {
      errorMsg.value = 'Rôle utilisateur introuvable.'
      setTimeout(() => router.replace('/login'), 1500)
      return
    }
    router.replace(path)
  } catch (e) {
    errorMsg.value = auth.error || 'Échec de la connexion automatique.'
    setTimeout(() => router.replace('/login'), 2000)
  }
})
</script>
