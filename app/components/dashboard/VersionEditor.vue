<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ projectId: string }>()

type ProjectVersion = Database['public']['Tables']['project_versions']['Row']

const supabase = useSupabaseClient<Database>()
const versions = ref<ProjectVersion[]>([])
const errorMessage = ref('')

const draft = reactive({
  label: '',
  sublabel: '',
  description: '',
  status: 'complete' as 'complete' | 'in_progress',
})

async function load() {
  const { data, error } = await supabase
    .from('project_versions')
    .select('*')
    .eq('project_id', props.projectId)
    .order('order_index')
  if (error) errorMessage.value = error.message
  else versions.value = data ?? []
}

async function addVersion() {
  if (!draft.label.trim() || !draft.sublabel.trim() || !draft.description.trim()) return
  const { error } = await supabase.from('project_versions').insert({
    project_id: props.projectId,
    label: draft.label.trim(),
    sublabel: draft.sublabel.trim(),
    description: draft.description.trim(),
    status: draft.status,
    order_index: versions.value.length,
  })
  if (error) {
    errorMessage.value = error.message
    return
  }
  draft.label = ''
  draft.sublabel = ''
  draft.description = ''
  draft.status = 'complete'
  await load()
}

async function updateVersion(v: ProjectVersion) {
  const { error } = await supabase
    .from('project_versions')
    .update({ label: v.label, sublabel: v.sublabel, description: v.description, status: v.status })
    .eq('id', v.id)
  if (error) errorMessage.value = error.message
}

async function removeVersion(id: string) {
  const { error } = await supabase.from('project_versions').delete().eq('id', id)
  if (error) errorMessage.value = error.message
  else await load()
}

async function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= versions.value.length) return
  const a = versions.value[index]
  const b = versions.value[target]
  const { error } = await supabase.from('project_versions').upsert([
    { ...a, order_index: b.order_index },
    { ...b, order_index: a.order_index },
  ])
  if (error) errorMessage.value = error.message
  else await load()
}

onMounted(load)
</script>

<template>
  <div class="version-editor">
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-for="(v, i) in versions" :key="v.id" class="version-row">
      <div class="version-fields">
        <input v-model="v.label" placeholder="V1 · 2019" @blur="updateVersion(v)" />
        <input v-model="v.sublabel" placeholder="breadboard prototype" @blur="updateVersion(v)" />
        <textarea v-model="v.description" rows="1" placeholder="Proof of concept." @blur="updateVersion(v)" />
        <select v-model="v.status" @change="updateVersion(v)">
          <option value="complete">complete</option>
          <option value="in_progress">in_progress</option>
        </select>
      </div>
      <div class="version-actions">
        <button type="button" title="Move up" :disabled="i === 0" @click="move(i, -1)">↑</button>
        <button type="button" title="Move down" :disabled="i === versions.length - 1" @click="move(i, 1)">↓</button>
        <button type="button" class="remove" @click="removeVersion(v.id)">Remove</button>
      </div>
    </div>

    <div class="version-row new-row">
      <div class="version-fields">
        <input v-model="draft.label" placeholder="V1 · 2019" />
        <input v-model="draft.sublabel" placeholder="breadboard prototype" />
        <textarea v-model="draft.description" rows="1" placeholder="Proof of concept." />
        <select v-model="draft.status">
          <option value="complete">complete</option>
          <option value="in_progress">in_progress</option>
        </select>
      </div>
      <button type="button" @click="addVersion">+ Add tile</button>
    </div>
  </div>
</template>

<style scoped>
.version-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.version-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-12);
  padding: var(--space-12);
  border: 1px solid var(--border-soft);
}

.new-row {
  border-style: dashed;
  border-color: var(--border-dash);
}

.version-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr auto;
  gap: var(--space-8);
  flex: 1;
}

input,
textarea,
select {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: var(--space-8);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  color: var(--text);
  resize: vertical;
}

.version-actions {
  display: flex;
  gap: var(--space-4);
  flex-shrink: 0;
}

.version-actions button,
.new-row > button {
  border: 1px solid var(--border-soft);
  background: transparent;
  padding: var(--space-8);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
}

.version-actions button:disabled {
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

@media (max-width: 640px) {
  .version-fields {
    grid-template-columns: 1fr;
  }
  .version-row {
    flex-direction: column;
  }
}
</style>
