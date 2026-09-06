<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <div class="dashboard-shell">
    <header class="dashboard-nav">
      <div class="nav-left">
        <NuxtLink to="/dashboard" class="brand">Dashboard</NuxtLink>
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
  font-size: 12px;
}

.brand {
  font-family: var(--font-display);
  font-size: 16px;
  margin-right: var(--space-16);
}

a {
  text-decoration: none;
  color: var(--text-secondary);
}

a.active {
  color: var(--text);
  border-bottom: 1px solid var(--accent);
}

.view-site {
  color: var(--text-tertiary);
}

.user-email {
  color: var(--text-faint);
}

button {
  border: 1px solid var(--border-soft);
  background: transparent;
  color: var(--text-secondary);
  padding: var(--space-8) var(--space-12);
  cursor: pointer;
  font-size: 12px;
}

button:hover {
  border-color: var(--text);
  color: var(--text);
}

.dashboard-content {
  padding: var(--space-24);
  max-width: 900px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .dashboard-content {
    padding: var(--space-48);
  }
}
</style>
