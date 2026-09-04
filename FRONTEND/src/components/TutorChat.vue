<template>
  <div class="glass-card flex h-[min(70vh,640px)] flex-col overflow-hidden">
    <div class="flex-1 space-y-4 overflow-y-auto p-5">
      <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center text-center">
        <div
          class="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/15 ring-4 ring-blue-500/20 shadow-glow"
        >
          <Sparkles class="h-9 w-9 text-blue-300" />
        </div>
        <p class="font-display text-xl font-semibold text-white">
          Expose-moi tes incompréhensions !
        </p>
        <p class="mt-2 max-w-sm text-sm text-white/50">
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
              : 'border border-white/10 bg-white/5 text-white/80'
          "
        >
          {{ m.text }}
        </div>
      </div>
      <p v-if="pending" class="text-xs text-white/35">Le tuteur réfléchit…</p>
    </div>
    <form
      class="flex items-center gap-2 border-t border-white/10 p-4"
      @submit.prevent="send"
    >
      <button
        type="button"
        class="rounded-xl p-2.5 text-white/40 transition hover:bg-white/5 hover:text-white/70"
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
import { useCloudFunctions } from '@/composables/useCloudFunctions'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const { tutorAI } = useCloudFunctions()
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const pending = ref(false)

async function send() {
  const text = draft.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', text })
  draft.value = ''
  pending.value = true
  try {
    const data = await tutorAI(text)
    let reply: string
    if (typeof data === 'string') {
      reply = data
    } else {
      const obj = data as { reply?: string; message?: string; response?: string }
      reply = obj?.reply || obj?.message || obj?.response || JSON.stringify(data)
    }
    messages.value.push({ role: 'assistant', text: reply })
  } catch {
    messages.value.push({
      role: 'assistant',
      text: "Désolé, le tuteur IA est indisponible pour le moment.",
    })
  } finally {
    pending.value = false
  }
}
</script>
