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

    <p v-if="loading" class="dash-note">Loading…</p>
    <p v-else-if="notFound" class="dash-error">Project not found.</p>

    <template v-else>
      <div class="dash-head">
        <div>
          <p class="dash-kicker">Editing node</p>
          <h1 class="dash-title">{{ title }}</h1>
        </div>
      </div>

      <section class="dash-panel">
        <form class="dash-form" @submit.prevent="save">
          <label class="dash-field">
            <span>Category (e.g. "Accessibility / IoT")</span>
            <input v-model="eyebrow" type="text" />
        <small class="field-hint">
          Separate facets with <code>/</code> or <code>·</code> — they render as
          individual labels. Any leading "01 ·" counter is dropped and ALL-CAPS
          is softened automatically, so write it however you like.
        </small>
          </label>

          <label class="dash-field">
            <span>Title</span>
            <input v-model="title" type="text" />
          </label>

          <label class="dash-field">
            <span>Body copy</span>
            <textarea v-model="body" rows="4" />
          </label>

          <label class="dash-field">
            <span>Variant</span>
            <select v-model="variant">
              <option value="work">Work entry (role / team)</option>
              <option value="research">Research entry (citation)</option>
            </select>
          </label>

          <template v-if="variant === 'work'">
            <label class="dash-field">
              <span>Role</span>
              <input v-model="role" type="text" placeholder="Backend" />
            </label>
            <label class="dash-field">
              <span>Team</span>
              <input v-model="team" type="text" placeholder="6 eng." />
            </label>
          </template>

          <label v-else class="dash-field">
            <span>Citation</span>
            <textarea v-model="citation" rows="2" />
          </label>

          <p v-if="errorMessage" class="dash-error">{{ errorMessage }}</p>
          <p v-if="savedAt" class="dash-ok">Saved.</p>

          <div class="form-actions">
            <button type="submit" class="dash-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
            <button type="button" class="dash-btn dash-btn-danger" @click="removeProject">Delete project</button>
          </div>
        </form>
      </section>

      <section class="dash-panel">
        <h2>Tags</h2>
        <DashboardTagEditor :project-id="projectId" />
      </section>

      <section class="dash-panel">
        <h2>Version tiles</h2>
        <p class="dash-note">
          Optional. Tiles drive the scroll-scrubbed build sequence on the site —
          their order is the order the sequence assembles in, and the scroll
          timing redistributes itself across however many tiles exist.
        </p>
        <DashboardVersionEditor :project-id="projectId" />
      </section>

      <section class="dash-panel">
        <h2>Images</h2>
        <p class="dash-note">
          Images become the frames of the build sequence, replacing the generated
          schematic. With none uploaded the schematic is used instead.
        </p>
        <DashboardImageEditor :project-id="projectId" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.field-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-faint);
}

.field-hint code {
  font-family: var(--font-mono);
  font-size: 11px;
}

.back-link {
  display: inline-block;
  margin-bottom: var(--space-24);
  color: var(--text-tertiary);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 12px;
}

.back-link:hover {
  color: var(--text);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

</style>
