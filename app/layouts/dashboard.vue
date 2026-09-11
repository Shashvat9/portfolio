<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}

// Auto-logout after 15 minutes of no activity — any mouse/keyboard/touch/
// scroll input resets the timer.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const
let idleTimer: ReturnType<typeof setTimeout> | undefined

function resetIdleTimer() {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(signOut, IDLE_TIMEOUT_MS)
}

onMounted(() => {
  ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }))
  resetIdleTimer()
})

onUnmounted(() => {
  ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetIdleTimer))
  clearTimeout(idleTimer)
})
</script>

<template>
  <div class="dashboard-shell">
    <header class="dashboard-nav">
      <div class="nav-left">
        <NuxtLink to="/dashboard" class="brand">
          <span class="brand-node" aria-hidden="true" />
          Control
        </NuxtLink>
        <NuxtLink to="/dashboard" exact-active-class="active">Site content</NuxtLink>
        <NuxtLink to="/dashboard/projects" active-class="active">Projects</NuxtLink>
      </div>
      <div class="nav-right">
        <NuxtLink to="/" target="_blank" class="view-site">View site ↗</NuxtLink>
        <span v-if="user" class="user-email">{{ user.email }}</span>
        <button type="button" @click="signOut">Sign out</button>
      </div>
    </header>
    <main class="dashboard-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.dashboard-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.dashboard-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-16);
  padding: var(--space-16) var(--space-24);
  border-bottom: 1px solid var(--border-soft);
  background: var(--surface);
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  gap: var(--space-24);
  font-size: 14px;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--text);
  margin-right: var(--space-16);
}

/* The live core node, same marker as the site's graph — the dashboard is the
   same system seen from the inside. */
.brand-node {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: core-pulse 3s ease-in-out infinite;
}

@keyframes core-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .brand-node {
    animation: none;
  }
}

a {
  text-decoration: none;
  color: var(--text-secondary);
  transition: color 0.15s ease;
}

a:hover {
  color: var(--text);
}

a.active {
  color: var(--text);
  border-bottom: 1px solid var(--accent);
}

.view-site {
  color: var(--text-tertiary);
}

.user-email {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
}

button {
  border: 1px solid var(--border-soft);
  background: transparent;
  color: var(--text-secondary);
  padding: var(--space-8) var(--space-12);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 12px;
}

button:hover {
  border-color: var(--text);
  color: var(--text);
}

.dashboard-content {
  padding: var(--space-24);
  max-width: 1100px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .dashboard-content {
    padding: var(--space-48);
  }
}
</style>
