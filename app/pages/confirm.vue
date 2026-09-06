<script setup lang="ts">
// Landing spot for Supabase auth email links (password reset, magic link).
// The Supabase client auto-exchanges the URL code for a session before this
// runs (detectSessionInUrl is on by default) — just route on from here.
const user = useSupabaseUser()

watchEffect(() => {
  navigateTo(user.value ? '/dashboard' : '/login')
})
</script>

<template>
  <div class="confirm-page">
    <p>Signing you in…</p>
  </div>
</template>

<style scoped>
.confirm-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
