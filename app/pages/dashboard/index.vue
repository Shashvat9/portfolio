<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const user = useSupabaseUser()
</script>

<template>
  <div>
    <p class="eyebrow">SITE CONTENT</p>
    <h1>Signed in{{ user ? ` as ${user.email}` : '' }}</h1>
    <p class="note">Site-content editing (hero hook, synthesis line, footer links, resume) ships in the next stage.</p>
  </div>
</template>

<style scoped>
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-8);
}

h1 {
  font-size: 28px;
  margin-bottom: var(--space-16);
}

.note {
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
