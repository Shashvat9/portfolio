<script setup lang="ts">
// design-system.md §04 — hidden-until-scroll: translateY(-100%) at top,
// slides in past 80px scroll. 1px bottom border only, no shadow.
const visible = ref(false)
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

function onScroll() {
  visible.value = window.scrollY > 80
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <nav class="site-nav" :class="{ visible }">
    <button type="button" class="brand" @click="scrollToId('top')">Shashvat Rajyaguru</button>
    <div class="nav-links">
      <button type="button" @click="scrollToId('work')">WORK</button>
      <button type="button" @click="scrollToId('contact')">CONTACT</button>
      <button type="button" class="theme-toggle" :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleColorMode">
        {{ colorMode.value === 'dark' ? '☀' : '☾' }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-16) var(--space-24);
  background: var(--surface);
  border-bottom: 1px solid var(--border-soft);
  box-shadow: none;
  transform: translateY(-100%);
  transition: transform 0.25s ease;
}

.site-nav.visible {
  transform: translateY(0);
}

.brand {
  font-family: var(--font-display);
  font-size: 16px;
  background: none;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-24);
  flex-shrink: 0;
}

.nav-links button {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  padding: 0;
}

.nav-links button:hover {
  color: var(--accent);
}

.theme-toggle {
  font-size: 14px;
}

@media (max-width: 400px) {
  .nav-links {
    gap: var(--space-16);
  }

  .brand {
    font-size: 14px;
  }
}

@media (min-width: 768px) {
  .site-nav {
    padding: var(--space-16) var(--space-48);
  }
}
</style>
