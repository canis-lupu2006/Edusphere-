<template>
  <div class="glass-card flex h-[min(70vh,640px)] flex-col overflow-hidden">
    <div class="flex-1 space-y-4 overflow-y-auto p-5">
      <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center text-center">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 shadow-glow-purple">
          <Sparkles class="h-8 w-8 text-violet-300" />
        </div>
        <p class="max-w-sm text-sm text-white/55">
          Expose-moi tes incompréhensions ! Je t'aide à comprendre en te guidant pas à pas.
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
    <form class="flex gap-2 border-t border-white/10 p-4" @submit.prevent="send">
      <input
        v-model="draft"
        type="text"
        class="input-field !pl-4"
        placeholder="Écris ta question…"
        :disabled="pending"
      />
      <button type="submit" class="btn-primary shrink-0 !px-4" :disabled="pending || !draft.trim()">
        <Send class="h-4 w-4" />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Send } from 'lucide-vue-next'
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
