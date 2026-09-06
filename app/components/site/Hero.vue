<script setup lang="ts">
defineProps<{ hook: string }>()
</script>

<template>
  <section id="top" class="hero">
    <p class="hero-name">Shashvat Rajyaguru</p>
    <h1 class="hero-hook">{{ hook }}</h1>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-24);
  padding: var(--space-24);
  max-width: 900px;
  margin: 0 auto;
}

.hero-name {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
  margin: 0;
}

.hero-hook {
  font-family: var(--font-display);
  font-size: clamp(40px, 8vw, 72px);
  line-height: 1.1;
  color: var(--text);
  margin: 0;
}

@media (min-width: 768px) {
  .hero {
    padding: var(--space-48);
  }
}

@media (min-width: 1024px) {
  .hero {
    padding: var(--space-96);
  }
}
</style>
