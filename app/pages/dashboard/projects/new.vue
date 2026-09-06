<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient<Database>()

const eyebrow = ref('')
const title = ref('')
const body = ref('')
const variant = ref<'work' | 'research'>('work')
const role = ref('')
const team = ref('')
const citation = ref('')
const saving = ref(false)
const errorMessage = ref('')

async function create() {
  if (!eyebrow.value.trim() || !title.value.trim() || !body.value.trim()) {
    errorMessage.value = 'Eyebrow, title and body are required.'
    return
  }
  saving.value = true
  errorMessage.value = ''

  const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('projects')
    .insert({
      order_index: count ?? 0,
      eyebrow: eyebrow.value.trim(),
      title: title.value.trim(),
      body: body.value.trim(),
      variant: variant.value,
      role: variant.value === 'work' ? role.value.trim() || null : null,
      team: variant.value === 'work' ? team.value.trim() || null : null,
      citation: variant.value === 'research' ? citation.value.trim() || null : null,
    })
    .select()
    .single()

  saving.value = false
  if (error || !data) {
    errorMessage.value = error?.message ?? 'Could not create project.'
    return
  }
  await navigateTo(`/dashboard/projects/${data.id}`)
}
</script>

<template>
  <div>
    <p class="eyebrow">PROJECTS</p>
    <h1>New project</h1>
    <p class="note">Tags, version tiles and images are added after the project is created.</p>

    <form class="project-form" @submit.prevent="create">
      <label class="field">
        <span>Eyebrow (e.g. "05 · CATEGORY")</span>
        <input v-model="eyebrow" type="text" />
      </label>

      <label class="field">
        <span>Title</span>
        <input v-model="title" type="text" />
      </label>

      <label class="field">
        <span>Body copy</span>
        <textarea v-model="body" rows="4" />
      </label>

      <label class="field">
        <span>Variant</span>
        <select v-model="variant">
          <option value="work">Work entry (role / team)</option>
          <option value="research">Research entry (citation)</option>
        </select>
      </label>

      <template v-if="variant === 'work'">
        <label class="field">
          <span>Role</span>
          <input v-model="role" type="text" placeholder="Backend" />
        </label>
        <label class="field">
          <span>Team</span>
          <input v-model="team" type="text" placeholder="6 eng." />
        </label>
      </template>

      <label v-else class="field">
        <span>Citation</span>
        <textarea v-model="citation" rows="2" />
      </label>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <button type="submit" :disabled="saving">{{ saving ? 'Creating…' : 'Create project' }}</button>
    </form>
  </div>
</template>

<style scoped>
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-8);
}

h1 {
  font-size: 28px;
  margin-bottom: var(--space-8);
}

.note {
  color: var(--text-faint);
  font-size: 12px;
  margin-bottom: var(--space-24);
}

.project-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  max-width: 560px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  font-size: 12px;
  color: var(--text-secondary);
}

input,
textarea,
select {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: var(--space-12);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  color: var(--text);
  resize: vertical;
}

input:focus,
textarea:focus,
select:focus {
  outline: 1px solid var(--accent);
}

.error {
  color: var(--accent);
  font-size: 12px;
  margin: 0;
}

button {
  align-self: flex-start;
  padding: var(--space-12) var(--space-24);
  border: 1px solid var(--text);
  background: var(--text);
  color: var(--surface);
  cursor: pointer;
  font-size: 13px;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
