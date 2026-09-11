<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { moveWithin, changedRows } from '~/utils/reorder'
import { categoryFacets } from '~/utils/category'

definePageMeta({ layout: 'dashboard' })

type Project = Database['public']['Tables']['projects']['Row']

const supabase = useSupabaseClient<Database>()
const projects = ref<Project[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')

/** Which node the editor is pointing at — hovering a row lights its node. */
const focused = ref<number | null>(null)

const graphItems = computed(() => projects.value.map((p) => ({ id: p.id, title: p.title })))

async function load() {
  loading.value = true
  const { data, error } = await supabase.from('projects').select('*').order('order_index')
  if (error) errorMessage.value = error.message
  else projects.value = data ?? []
  loading.value = false
}

/**
 * Reorder is optimistic: the graph above re-lays out on the spot so the change
 * to node position is visible before the write lands, then persists a dense
 * 0..n-1 renumbering (never a two-row swap, which breaks on duplicate indices).
 */
async function move(index: number, direction: -1 | 1) {
  const next = moveWithin(projects.value, index, direction)
  if (!next) return

  const previous = projects.value
  const writes = changedRows(previous, next)
  projects.value = next
  focused.value = index + direction

  saving.value = true
  errorMessage.value = ''
  const { error } = await supabase.from('projects').upsert(writes)
  saving.value = false

  if (error) {
    errorMessage.value = `Could not save the new order: ${error.message}`
    projects.value = previous
    focused.value = null
  }
}

async function remove(project: Project) {
  if (!confirm(`Delete "${project.title}"? This also removes its tags, versions and images, and its node disappears from the graph on the site.`)) return
  const { error } = await supabase.from('projects').delete().eq('id', project.id)
  if (error) {
    errorMessage.value = error.message
    return
  }
  // Close the gap the deletion left so node ordering stays dense.
  const remaining = projects.value.filter((p) => p.id !== project.id).map((p, i) => ({ ...p, order_index: i }))
  const writes = changedRows(projects.value, remaining)
  if (writes.length) await supabase.from('projects').upsert(writes)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <p class="dash-kicker">Projects</p>
        <h1 class="dash-title">Manage the system</h1>
      </div>
      <NuxtLink to="/dashboard/projects/new" class="dash-btn">+ New project</NuxtLink>
    </div>

    <p v-if="errorMessage" class="dash-error">{{ errorMessage }}</p>
    <p v-if="loading" class="dash-note">Loading…</p>

    <div v-else class="layout">
      <!-- The same graph the site renders, driven by the same ordering. Moving
           a row below moves its node here, so reordering is a visual act
           rather than an invisible integer change. -->
      <aside class="graph-panel">
        <!-- Deliberately unlabelled: at this size SVG labels are unreadable.
             The link between row and node is the hover highlight instead. -->
        <SiteSystemGraph
          class="preview-graph"
          :items="graphItems"
          mode="radial"
          preset="mini"
          :active="focused"
        />
        <p class="graph-caption">
          Live node graph. The first project sits at the top and the rest run
          clockwise — hover a row to find its node.
        </p>
      </aside>

      <ol class="project-list">
        <li
          v-for="(p, i) in projects"
          :key="p.id"
          class="project-row"
          :class="{ focused: focused === i }"
          @mouseenter="focused = i"
          @mouseleave="focused = null"
        >
          <span class="row-node" aria-hidden="true" />

          <div class="row-info">
            <p class="row-title">{{ p.title }}</p>
            <p class="row-facets">
              <span v-for="facet in categoryFacets(p)" :key="facet">{{ facet }}</span>
              <span class="row-variant">{{ p.variant }}</span>
            </p>
          </div>

          <div class="row-actions">
            <button type="button" class="dash-btn-ghost" title="Move earlier" :disabled="i === 0 || saving" @click="move(i, -1)">↑</button>
            <button type="button" class="dash-btn-ghost" title="Move later" :disabled="i === projects.length - 1 || saving" @click="move(i, 1)">↓</button>
            <NuxtLink :to="`/dashboard/projects/${p.id}`" class="row-edit">Edit</NuxtLink>
            <button type="button" class="dash-btn-ghost row-remove" @click="remove(p)">Delete</button>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

.graph-panel {
  border: 1px solid var(--border-soft);
  background: var(--surface);
  padding: var(--space-24) var(--space-16) var(--space-16);
}

.preview-graph {
  max-width: 230px;
  margin: 0 auto;
}

.graph-caption {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-faint);
  margin: var(--space-16) 0 0;
}

.project-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  counter-reset: node;
}

.project-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  flex-wrap: wrap;
  padding: var(--space-12) var(--space-16);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  transition: border-color 0.15s ease;
}

.project-row.focused {
  border-color: var(--accent);
}

.row-node {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid var(--node);
  background: var(--surface);
  flex-shrink: 0;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.project-row.focused .row-node {
  background: var(--node-active);
  border-color: var(--node-active);
}

.row-info {
  flex: 1 1 200px;
  min-width: 0;
}

.row-title {
  font-family: var(--font-display);
  font-size: 17px;
  margin: 0;
}

.row-facets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-faint);
}

.row-variant {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px var(--space-4);
  border: 1px solid var(--border-soft);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13px;
}

.row-edit {
  text-decoration: none;
  color: var(--accent);
  padding: var(--space-8) var(--space-12);
}

.row-remove {
  color: var(--accent);
}

@media (min-width: 900px) {
  .layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--space-32);
    align-items: start;
  }

  .graph-panel {
    position: sticky;
    top: var(--space-24);
  }
}
</style>
