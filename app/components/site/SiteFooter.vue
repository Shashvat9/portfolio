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
    <nav class="links" aria-label="Contact">
      <a v-if="email" :href="`mailto:${email}`">Email</a>
      <span v-else class="disabled">Email</span>
      <a v-if="linkedin" :href="linkedin" target="_blank" rel="noopener">LinkedIn</a>
      <span v-else class="disabled">LinkedIn</span>
      <a v-if="resumeUrl" :href="resumeUrl" target="_blank" rel="noopener">Resume ↓</a>
      <span v-else class="disabled">Resume ↓</span>
    </nav>
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
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  margin: 0;
}

.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-24);
  font-size: 15px;
  color: var(--text-secondary);
  margin-top: var(--space-12);
}

.links a {
  color: var(--text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--border-soft);
  padding-bottom: 2px;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.links a:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.disabled {
  color: var(--text-faint);
  opacity: 0.5;
}


</style>
