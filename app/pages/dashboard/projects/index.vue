<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

type Project = Database['public']['Tables']['projects']['Row']

const supabase = useSupabaseClient<Database>()
const projects = ref<Project[]>([])
const loading = ref(true)
const errorMessage = ref('')

async function load() {
  loading.value = true
  const { data, error } = await supabase.from('projects').select('*').order('order_index')
  if (error) errorMessage.value = error.message
  else projects.value = data ?? []
  loading.value = false
}

async function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= projects.value.length) return
  const a = projects.value[index]
  const b = projects.value[target]
  const { error } = await supabase.from('projects').upsert([
    { ...a, order_index: b.order_index },
    { ...b, order_index: a.order_index },
  ])
  if (error) errorMessage.value = error.message
  else await load()
}

async function remove(project: Project) {
  if (!confirm(`Delete "${project.title}"? This also removes its tags, versions and images.`)) return
  const { error } = await supabase.from('projects').delete().eq('id', project.id)
  if (error) errorMessage.value = error.message
  else await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="header-row">
      <div>
        <p class="eyebrow">PROJECTS</p>
        <h1>Manage projects</h1>
      </div>
      <NuxtLink to="/dashboard/projects/new" class="new-btn">+ New project</NuxtLink>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="loading" class="note">Loading…</p>

    <ul v-else class="project-list">
      <li v-for="(p, i) in projects" :key="p.id" class="project-row">
        <div class="project-info">
          <p class="project-eyebrow">{{ p.eyebrow }}</p>
          <p class="project-title">{{ p.title }}</p>
          <p class="project-variant">{{ p.variant }}</p>
        </div>
        <div class="project-actions">
          <button type="button" :disabled="i === 0" @click="move(i, -1)">↑</button>
          <button type="button" :disabled="i === projects.length - 1" @click="move(i, 1)">↓</button>
          <NuxtLink :to="`/dashboard/projects/${p.id}`">Edit</NuxtLink>
          <button type="button" class="remove" @click="remove(p)">Delete</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-16);
  margin-bottom: var(--space-24);
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-8);
}

h1 {
  font-size: 28px;
}

.new-btn {
  align-self: center;
  text-decoration: none;
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--surface);
  padding: var(--space-12) var(--space-16);
  font-size: 12px;
}

.project-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.project-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-12);
  padding: var(--space-16);
  border: 1px solid var(--border-soft);
  background: var(--surface);
}

.project-eyebrow {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
  margin: 0;
}

.project-title {
  font-family: var(--font-display);
  font-size: 16px;
  margin: 0;
}

.project-variant {
  font-size: 11px;
  color: var(--text-faint);
  margin: 0;
}

.project-actions {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 12px;
}

.project-actions a {
  text-decoration: none;
  color: var(--accent);
}

.project-actions button {
  border: 1px solid var(--border-soft);
  background: transparent;
  padding: var(--space-8);
  cursor: pointer;
  color: var(--text-secondary);
}

.project-actions button:disabled {
  opacity: 0.3;
  cursor: default;
}

.remove {
  color: var(--accent);
}

.error {
  color: var(--accent);
  font-size: 12px;
}

.note {
  color: var(--text-faint);
  font-size: 12px;
}
</style>
