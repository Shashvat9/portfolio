<script setup lang="ts">
/**
 * Tag pill editor, shared by projects and experience entries.
 *
 * `project_tags` and `experience_tags` have the same shape (parent id,
 * tag_text, order_index) and the site renders both with the same pill, so this
 * is one component rather than two that drift apart.
 *
 * The queries branch on `owner` instead of building the table and column names
 * dynamically: Supabase's generated types tie the table to its own columns, so
 * a computed table name only type-checks behind casts that would hide a real
 * mistake (pointing `experience_id` at `project_tags`, say). Two short typed
 * branches keep the checker doing its job; the UI below stays shared.
 */
import type { Database } from '~/types/database.types'
import { moveWithin, changedRows } from '~/utils/reorder'

type TagOwner = 'project' | 'experience'

const props = withDefaults(
  defineProps<{ parentId: string; owner?: TagOwner }>(),
  { owner: 'project' },
)

/** The columns both tables share — all this component reads or reorders. */
interface Tag {
  id: string
  tag_text: string
  order_index: number
}

const supabase = useSupabaseClient<Database>()
const tags = ref<Tag[]>([])
const newTag = ref('')
const errorMessage = ref('')

async function load() {
  const { data, error } =
    props.owner === 'experience'
      ? await supabase.from('experience_tags').select('id, tag_text, order_index')
          .eq('experience_id', props.parentId).order('order_index')
      : await supabase.from('project_tags').select('id, tag_text, order_index')
          .eq('project_id', props.parentId).order('order_index')

  if (error) errorMessage.value = error.message
  else tags.value = data ?? []
}

async function addTag() {
  const text = newTag.value.trim()
  if (!text) return
  const order_index = tags.value.length

  const { error } =
    props.owner === 'experience'
      ? await supabase.from('experience_tags').insert({ experience_id: props.parentId, tag_text: text, order_index })
      : await supabase.from('project_tags').insert({ project_id: props.parentId, tag_text: text, order_index })

  if (error) {
    errorMessage.value = error.message
    return
  }
  newTag.value = ''
  await load()
}

async function removeTag(id: string) {
  const { error } =
    props.owner === 'experience'
      ? await supabase.from('experience_tags').delete().eq('id', id)
      : await supabase.from('project_tags').delete().eq('id', id)

  if (error) errorMessage.value = error.message
  else await load()
}

async function move(index: number, direction: -1 | 1) {
  const next = moveWithin(tags.value, index, direction)
  if (!next) return
  const previous = tags.value
  const writes = changedRows(previous, next)
  // Optimistic, then persist a dense 0..n-1 renumbering — same as every other
  // ordered list in the dashboard.
  tags.value = next

  // The parent id travels with every upserted row. upsert can insert, not just
  // update, and both tables require their foreign key — sending only the three
  // shared columns would fail the moment a row was missing.
  const { error } =
    props.owner === 'experience'
      ? await supabase.from('experience_tags').upsert(
          writes.map((t) => ({ ...t, experience_id: props.parentId })),
        )
      : await supabase.from('project_tags').upsert(
          writes.map((t) => ({ ...t, project_id: props.parentId })),
        )

  if (error) {
    errorMessage.value = error.message
    tags.value = previous
  } else {
    await load()
  }
}

onMounted(load)
watch(() => props.parentId, load)
</script>

<template>
  <div class="tag-editor">
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <ul class="tag-list">
      <li v-for="(tag, i) in tags" :key="tag.id" class="tag-pill">
        <span>{{ tag.tag_text }}</span>
        <button type="button" title="Move left" :disabled="i === 0" @click="move(i, -1)">←</button>
        <button type="button" title="Move right" :disabled="i === tags.length - 1" @click="move(i, 1)">→</button>
        <button type="button" title="Remove" class="remove" @click="removeTag(tag.id)">×</button>
      </li>
    </ul>
    <form class="add-row" @submit.prevent="addTag">
      <input v-model="newTag" type="text" placeholder="Add tag…" />
      <button type="submit">Add</button>
    </form>
  </div>
</template>

<style scoped>
.tag-list {
  list-style: none;
  margin: 0 0 var(--space-12);
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.tag-pill {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border-soft);
  font-size: 11px;
  color: var(--text-secondary);
}

.tag-pill button {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-faint);
  padding: 0 2px;
  font-size: 11px;
}

.tag-pill button:disabled {
  opacity: 0.3;
  cursor: default;
}

.tag-pill .remove {
  color: var(--accent);
}

.add-row {
  display: flex;
  gap: var(--space-8);
}

.add-row input {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: var(--space-8);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  color: var(--text);
}

.add-row button {
  border: 1px solid var(--border-soft);
  background: transparent;
  padding: var(--space-8) var(--space-12);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
}

.error {
  color: var(--accent);
  font-size: 12px;
}
</style>
