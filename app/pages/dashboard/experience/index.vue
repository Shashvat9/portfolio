<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { moveWithin, changedRows } from '~/utils/reorder'
import { formatRange, formatDuration, isOngoing } from '~/utils/dates'

definePageMeta({ layout: 'dashboard' })

type Experience = Database['public']['Tables']['experience']['Row']

const supabase = useSupabaseClient<Database>()
const entries = ref<Experience[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')

const rows = computed(() =>
  entries.value.map((e) => ({
    ...e,
    ongoing: isOngoing(e.end_date),
    range: formatRange(e.start_date, e.end_date),
    duration: formatDuration(e.start_date, e.end_date),
  })),
)

async function load() {
  loading.value = true
  const { data, error } = await supabase.from('experience').select('*').order('order_index')
  if (error) errorMessage.value = error.message
  else entries.value = data ?? []
  loading.value = false
}

/**
 * Same optimistic reorder as projects: the list moves immediately, then a
 * dense 0..n-1 renumbering is persisted. Never a two-row index swap — the
 * timeline's rail and scrub windows are both derived from this ordering, so a
 * duplicate or gapped index would show up on the live site.
 */
async function move(index: number, direction: -1 | 1) {
  const next = moveWithin(entries.value, index, direction)
  if (!next) return

  const previous = entries.value
  const writes = changedRows(previous, next)
  entries.value = next

  saving.value = true
  errorMessage.value = ''
  const { error } = await supabase.from('experience').upsert(writes)
  saving.value = false

  if (error) {
    errorMessage.value = `Could not save the new order: ${error.message}`
    entries.value = previous
  }
}

async function remove(entry: Experience) {
  if (!confirm(`Delete "${entry.role} — ${entry.organization}"? This also removes its tags.`)) return
  const { error } = await supabase.from('experience').delete().eq('id', entry.id)
  if (error) {
    errorMessage.value = error.message
    return
  }
  // Close the gap so the timeline ordering stays dense.
  const remaining = entries.value.filter((e) => e.id !== entry.id).map((e, i) => ({ ...e, order_index: i }))
  const writes = changedRows(entries.value, remaining)
  if (writes.length) await supabase.from('experience').upsert(writes)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <p class="dash-kicker">Experience</p>
        <h1 class="dash-title">Roles on the timeline</h1>
      </div>
      <NuxtLink to="/dashboard/experience/new" class="dash-btn">+ New role</NuxtLink>
    </div>

    <p class="dash-note intro">
      Top to bottom here is top to bottom on the site. A role with no end date
      renders as still running — a dotted marker and an unterminated rail,
      the same treatment the in-progress version tile gets.
    </p>

    <p v-if="errorMessage" class="dash-error">{{ errorMessage }}</p>
    <p v-if="loading" class="dash-note">Loading…</p>
    <p v-else-if="!rows.length" class="dash-note">
      No roles yet. The Experience section is hidden on the site until one exists.
    </p>

    <ol v-else class="entry-list">
      <li v-for="(row, i) in rows" :key="row.id" class="entry-row" :class="{ ongoing: row.ongoing }">
        <span class="row-node" aria-hidden="true" />

        <div class="row-info">
          <p class="row-title">
            {{ row.role }}
            <span class="row-org">{{ row.organization }}</span>
          </p>
          <p class="row-meta">
            <span>{{ row.range }}</span>
            <span v-if="row.duration">{{ row.duration }}</span>
            <span v-if="row.location">{{ row.location }}</span>
            <span v-if="row.ongoing" class="row-running">running</span>
          </p>
        </div>

        <div class="row-actions">
          <button type="button" class="dash-btn-ghost" title="Move earlier" :disabled="i === 0 || saving" @click="move(i, -1)">↑</button>
          <button type="button" class="dash-btn-ghost" title="Move later" :disabled="i === rows.length - 1 || saving" @click="move(i, 1)">↓</button>
          <NuxtLink :to="`/dashboard/experience/${row.id}`" class="row-edit">Edit</NuxtLink>
          <button type="button" class="dash-btn-ghost row-remove" @click="remove(row)">Delete</button>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.intro {
  max-width: 560px;
  margin-bottom: var(--space-24);
  padding-left: var(--space-12);
  border-left: 1px solid var(--accent);
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.entry-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  flex-wrap: wrap;
  padding: var(--space-12) var(--space-16);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  transition: border-color 0.15s ease;
}

.entry-row:hover {
  border-color: var(--accent);
}

/* The marker mirrors the site exactly: filled for a finished role, dotted and
   hollow for one that is still running. */
.row-node {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid var(--node-active);
  background: var(--node-active);
  flex-shrink: 0;
}

.entry-row.ongoing .row-node {
  background: transparent;
  border: 1px dotted var(--accent);
}

.row-info {
  flex: 1 1 240px;
  min-width: 0;
}

.row-title {
  font-family: var(--font-display);
  font-size: 17px;
  margin: 0;
}

.row-org {
  color: var(--text-tertiary);
}

.row-org::before {
  content: '·';
  margin: 0 var(--space-8);
  color: var(--border-dash);
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-12);
  margin: 2px 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.row-running {
  color: var(--accent);
  border: 1px dotted var(--accent);
  padding: 0 var(--space-4);
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
</style>
