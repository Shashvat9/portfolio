<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const projectId = route.params.id as string

const supabase = useSupabaseClient<Database>()

const eyebrow = ref('')
const title = ref('')
const body = ref('')
const variant = ref<'work' | 'research'>('work')
const role = ref('')
const team = ref('')
const citation = ref('')

const loading = ref(true)
const saving = ref(false)
const savedAt = ref<number | null>(null)
const errorMessage = ref('')
const notFound = ref(false)

async function load() {
  loading.value = true
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle()
  if (error) {
    errorMessage.value = error.message
  } else if (!data) {
    notFound.value = true
  } else {
    eyebrow.value = data.eyebrow
    title.value = data.title
    body.value = data.body
    variant.value = data.variant as 'work' | 'research'
    role.value = data.role ?? ''
    team.value = data.team ?? ''
    citation.value = data.citation ?? ''
  }
  loading.value = false
}

async function save() {
  saving.value = true
  errorMessage.value = ''
  const { error } = await supabase
    .from('projects')
    .update({
      eyebrow: eyebrow.value.trim(),
      title: title.value.trim(),
      body: body.value.trim(),
      variant: variant.value,
      role: variant.value === 'work' ? role.value.trim() || null : null,
      team: variant.value === 'work' ? team.value.trim() || null : null,
      citation: variant.value === 'research' ? citation.value.trim() || null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
  saving.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  savedAt.value = Date.now()
}

async function removeProject() {
  if (!confirm(`Delete "${title.value}"? This also removes its tags, versions and images.`)) return
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) {
    errorMessage.value = error.message
    return
  }
  await navigateTo('/dashboard/projects')
}

onMounted(load)
</script>

<template>
  <div>
    <NuxtLink to="/dashboard/projects" class="back-link">← Back to projects</NuxtLink>

    <p v-if="loading" class="note">Loading…</p>
    <p v-else-if="notFound" class="error">Project not found.</p>

    <template v-else>
      <p class="eyebrow">EDIT PROJECT</p>
      <h1>{{ title }}</h1>

      <section class="panel">
        <form class="project-form" @submit.prevent="save">
          <label class="field">
            <span>Eyebrow</span>
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
          <p v-if="savedAt" class="saved">Saved.</p>

          <div class="form-actions">
            <button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
            <button type="button" class="delete-btn" @click="removeProject">Delete project</button>
          </div>
        </form>
      </section>

      <section class="panel">
        <h2>Tags</h2>
        <DashboardTagEditor :project-id="projectId" />
      </section>

      <section class="panel">
        <h2>Version tiles</h2>
        <p class="note">Optional — only projects with an iteration history (like the DP wayfinding device) need these.</p>
        <DashboardVersionEditor :project-id="projectId" />
      </section>

      <section class="panel">
        <h2>Images</h2>
        <DashboardImageEditor :project-id="projectId" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: var(--space-24);
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: 12px;
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-8);
}

h1 {
  font-size: 28px;
  margin-bottom: var(--space-24);
}

h2 {
  font-family: var(--font-display);
  font-size: 18px;
  margin: 0 0 var(--space-12);
}

.panel {
  padding: var(--space-24) 0;
  border-top: 1px solid var(--border-soft);
}

.panel:first-of-type {
  border-top: none;
  padding-top: 0;
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

.form-actions {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

button {
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

.delete-btn {
  background: transparent;
  border-color: var(--accent);
  color: var(--accent);
}

.error {
  color: var(--accent);
  font-size: 12px;
  margin: 0;
}

.saved {
  color: var(--text-secondary);
  font-size: 12px;
  margin: 0;
}

.note {
  color: var(--text-faint);
  font-size: 12px;
}
</style>
