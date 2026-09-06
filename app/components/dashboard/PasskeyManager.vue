<script setup lang="ts">
const supabase = useSupabaseClient()

type Passkey = { id: string; friendly_name?: string; created_at: string; last_used_at?: string }

const passkeys = ref<Passkey[]>([])
const loading = ref(true)
const registering = ref(false)
const errorMessage = ref('')

const supported = ref(false)
onMounted(() => {
  supported.value = typeof window !== 'undefined' && 'PublicKeyCredential' in window
  load()
})

async function load() {
  loading.value = true
  // @ts-expect-error — experimental passkey API, not yet in the published types
  const { data, error } = await supabase.auth.passkey.list()
  if (error) errorMessage.value = error.message
  else passkeys.value = data ?? []
  loading.value = false
}

async function register() {
  registering.value = true
  errorMessage.value = ''
  // @ts-expect-error — experimental passkey API
  const { error } = await supabase.auth.registerPasskey()
  registering.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  await load()
}

async function remove(id: string) {
  if (!confirm('Remove this passkey? You will need another passkey or your password to sign in afterward.')) return
  // @ts-expect-error — experimental passkey API
  const { error } = await supabase.auth.passkey.delete({ passkeyId: id })
  if (error) errorMessage.value = error.message
  else await load()
}
</script>

<template>
  <div class="passkey-manager">
    <p v-if="!supported" class="note">This browser doesn't support passkeys — register one from your iPhone instead.</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <p v-if="loading" class="note">Loading…</p>

    <ul v-else-if="passkeys.length" class="passkey-list">
      <li v-for="pk in passkeys" :key="pk.id">
        <span>{{ pk.friendly_name || 'Passkey' }}</span>
        <span class="meta">added {{ new Date(pk.created_at).toLocaleDateString() }}</span>
        <button type="button" class="remove" @click="remove(pk.id)">Remove</button>
      </li>
    </ul>
    <p v-else class="note">No passkeys registered yet.</p>

    <button type="button" :disabled="registering || !supported" @click="register">
      {{ registering ? 'Follow the prompt on your device…' : '+ Register a passkey on this device' }}
    </button>
  </div>
</template>

<style scoped>
.passkey-manager {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  max-width: 480px;
}

.passkey-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.passkey-list li {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12);
  border: 1px solid var(--border-soft);
  font-size: 12px;
}

.meta {
  color: var(--text-faint);
  font-size: 11px;
  margin-right: auto;
}

.remove {
  border: 1px solid var(--border-soft);
  background: transparent;
  color: var(--accent);
  padding: var(--space-4) var(--space-8);
  cursor: pointer;
  font-size: 11px;
}

.passkey-manager > button {
  align-self: flex-start;
  padding: var(--space-12) var(--space-16);
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--surface);
  cursor: pointer;
  font-size: 12px;
}

.passkey-manager > button:disabled {
  opacity: 0.6;
  cursor: default;
}

.note {
  color: var(--text-faint);
  font-size: 12px;
  margin: 0;
}

.error {
  color: var(--accent);
  font-size: 12px;
  margin: 0;
}
</style>
