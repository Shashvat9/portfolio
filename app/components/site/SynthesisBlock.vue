<script setup lang="ts">
defineProps<{ line: string }>()
</script>

<template>
  <section class="synthesis">
    <blockquote>{{ line }}</blockquote>
  </section>
</template>

<style scoped>
.synthesis {
  /* §03 mobile/tablet/desktop section-padding progression: 24 → 48 → 96 */
  padding: var(--space-24);
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
}

blockquote {
  font-family: var(--font-display);
  font-size: clamp(22px, 4vw, 32px);
  line-height: 1.35;
  color: var(--text);
  margin: 0;
}

@media (min-width: 768px) {
  .synthesis {
    padding: var(--space-48);
  }
}

@media (min-width: 1024px) {
  .synthesis {
    padding: var(--space-96);
  }
}
</style>
