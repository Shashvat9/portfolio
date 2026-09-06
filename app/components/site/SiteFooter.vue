<script setup lang="ts">
defineProps<{
  email: string
  linkedin: string
  resumeUrl: string | null
}>()
</script>

<template>
  <footer id="contact" class="site-footer">
    <p class="name">Shashvat Rajyaguru</p>
    <p class="copyright">© 2026</p>
    <div class="links">
      <a v-if="email" :href="`mailto:${email}`">EMAIL</a>
      <span v-else class="disabled">EMAIL</span>
      <span class="sep">·</span>
      <a v-if="linkedin" :href="linkedin" target="_blank" rel="noopener">LINKEDIN</a>
      <span v-else class="disabled">LINKEDIN</span>
      <span class="sep">·</span>
      <a v-if="resumeUrl" :href="resumeUrl" target="_blank" rel="noopener">RESUME ↓</a>
      <span v-else class="disabled">RESUME ↓</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  /* §03 gives footer padding its own fixed token (32), distinct from the
     24/48/96 section-padding progression — not scaled by breakpoint. */
  padding: var(--space-32) var(--space-24);
  border-top: 1px solid var(--border-soft);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.name {
  font-family: var(--font-display);
  font-size: 16px;
  margin: 0;
  color: var(--text);
}

.copyright {
  font-size: 11px;
  color: var(--text-faint);
  margin: 0;
}

.links {
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-top: var(--space-8);
}

.links a {
  color: var(--text-secondary);
  text-decoration: none;
}

.links a:hover {
  color: var(--accent);
}

.disabled {
  color: var(--text-faint);
  opacity: 0.5;
}

.sep {
  margin: 0 var(--space-8);
  color: var(--text-faint);
}
</style>
