<template>
  <div class="glass-card flex h-[min(70vh,640px)] flex-col overflow-hidden">
    <div class="flex-1 space-y-4 overflow-y-auto p-5">
      <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center text-center">
        <div
          class="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-500/20 shadow-glow"
        >
          <Sparkles class="h-9 w-9 text-blue-600" />
        </div>
        <p class="font-display text-xl font-semibold text-slate-900">
          Expose-moi tes incompréhensions !
        </p>
        <p class="mt-2 max-w-sm text-sm text-slate-500">
          Je t'aide à comprendre en te guidant pas à pas.
        </p>
      </div>
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="flex"
        :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm"
          :class="
            m.role === 'user'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-slate-50 text-slate-700'
          "
        >
          {{ m.text }}
        </div>
      </div>
      <p v-if="pending" class="text-xs text-slate-400">Le tuteur réfléchit…</p>
    </div>
    <form
      class="flex items-center gap-2 border-t border-slate-200 p-4"
      @submit.prevent="send"
    >
      <button
        type="button"
        class="rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
        aria-label="Pièce jointe"
      >
        <Paperclip class="h-5 w-5" />
      </button>
      <input
        v-model="draft"
        type="text"
        class="input-field !pl-4"
        placeholder="Écris ta réponse..."
        :disabled="pending"
      />
      <button
        type="submit"
        class="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-3 text-sm font-semibold shadow-glow-purple transition hover:brightness-110 disabled:opacity-50"
        :disabled="pending || !draft.trim()"
      >
        <Send class="h-4 w-4" />
        Envoyer
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Send, Paperclip } from 'lucide-vue-next'
import { askTutor, isGeminiConfigured } from '@/composables/useGeminiTutor'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const messages = ref<ChatMessage[]>([])
const draft = ref('')
const pending = ref(false)

async function send() {
  const text = draft.value.trim()
  if (!text) return
  const prior = messages.value.slice()
  messages.value.push({ role: 'user', text })
  draft.value = ''
  pending.value = true
  try {
    const reply = await askTutor(prior, text)
    messages.value.push({ role: 'assistant', text: reply })
  } catch (err) {
    console.error('[TutorChat]', err)
    const code = err instanceof Error ? err.message : ''
    let fallback =
      "Désolé, le tuteur IA est indisponible pour le moment."
    if (code === 'NO_GEMINI_KEY' || !isGeminiConfigured()) {
      fallback =
        "Configure VITE_GEMINI_API_KEY dans FRONTEND/.env (clé Google AI Studio), puis relancez npm run serve dans FRONTEND."
    } else if (code && code !== 'EMPTY_RESPONSE' && code !== 'EMPTY_MESSAGE') {
      fallback = code
    }
    messages.value.push({ role: 'assistant', text: fallback })
  } finally {
    pending.value = false
  }
}
</script>
