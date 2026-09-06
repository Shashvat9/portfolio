<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ projectId: string }>()

type Tag = Database['public']['Tables']['project_tags']['Row']

const supabase = useSupabaseClient<Database>()
const tags = ref<Tag[]>([])
const newTag = ref('')
const errorMessage = ref('')

async function load() {
  const { data, error } = await supabase
    .from('project_tags')
    .select('*')
    .eq('project_id', props.projectId)
    .order('order_index')
  if (error) errorMessage.value = error.message
  else tags.value = data ?? []
}

async function addTag() {
  const text = newTag.value.trim()
  if (!text) return
  const { error } = await supabase
    .from('project_tags')
    .insert({ project_id: props.projectId, tag_text: text, order_index: tags.value.length })
  if (error) {
    errorMessage.value = error.message
    return
  }
  newTag.value = ''
  await load()
}

async function removeTag(id: string) {
  const { error } = await supabase.from('project_tags').delete().eq('id', id)
  if (error) errorMessage.value = error.message
  else await load()
}

async function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= tags.value.length) return
  const a = tags.value[index]
  const b = tags.value[target]
  const { error } = await supabase.from('project_tags').upsert([
    { id: a.id, project_id: a.project_id, tag_text: a.tag_text, order_index: b.order_index },
    { id: b.id, project_id: b.project_id, tag_text: b.tag_text, order_index: a.order_index },
  ])
  if (error) errorMessage.value = error.message
  else await load()
}

onMounted(load)
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
