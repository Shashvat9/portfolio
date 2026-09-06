<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const passkeyLoading = ref(false)
const showPasswordForm = ref(false)

// Passkeys need a real secure-context browser API — feature-detect rather
// than assuming, so the password fallback is always reachable.
const passkeySupported = ref(false)
onMounted(() => {
  passkeySupported.value = typeof window !== 'undefined' && 'PublicKeyCredential' in window
  if (!passkeySupported.value) showPasswordForm.value = true
})

// Already signed in — no reason to see the login form.
watchEffect(() => {
  if (user.value) navigateTo('/dashboard')
})

async function signInWithPasskey() {
  errorMessage.value = ''
  passkeyLoading.value = true
  const { error } = await supabase.auth.signInWithPasskey()
  passkeyLoading.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  await navigateTo('/dashboard')
}

async function onSubmit() {
  errorMessage.value = ''
  loading.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  loading.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  await navigateTo('/dashboard')
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <p class="eyebrow">DASHBOARD</p>
      <h1>Sign in</h1>

      <button
        v-if="passkeySupported"
        type="button"
        class="passkey-btn"
        :disabled="passkeyLoading"
        @click="signInWithPasskey"
      >
        {{ passkeyLoading ? 'Waiting for Face ID / Touch ID…' : 'Sign in with passkey' }}
      </button>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <button
        v-if="passkeySupported && !showPasswordForm"
        type="button"
        class="link-btn"
        @click="showPasswordForm = true"
      >
        Use email and password instead
      </button>

      <form v-if="showPasswordForm" class="password-form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="username" required />
        </label>

        <label class="field">
          <span>Password</span>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-24);
  background: var(--bg);
}

.login-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-32);
  background: var(--surface);
  border: 1px solid var(--border-soft);
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--text-tertiary);
  margin: 0;
}

h1 {
  font-size: 28px;
  color: var(--text);
  margin-bottom: var(--space-8);
}

.passkey-btn {
  padding: var(--space-12);
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--surface);
  cursor: pointer;
  font-size: 13px;
  letter-spacing: 0.02em;
}

.passkey-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.link-btn {
  align-self: center;
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding-top: var(--space-16);
  border-top: 1px solid var(--border-soft);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  font-size: 12px;
  color: var(--text-secondary);
}

input {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: var(--space-12);
  border: 1px solid var(--border-soft);
  background: var(--bg);
  color: var(--text);
}

input:focus {
  outline: 1px solid var(--accent);
}

.error {
  font-size: 12px;
  color: var(--accent);
  margin: 0;
}

.password-form button {
  padding: var(--space-12);
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--surface);
  cursor: pointer;
  font-size: 13px;
  letter-spacing: 0.05em;
}

.password-form button:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
