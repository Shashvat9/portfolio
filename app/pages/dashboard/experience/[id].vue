<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { formatRange, formatDuration } from '~/utils/dates'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const experienceId = route.params.id as string

const supabase = useSupabaseClient<Database>()

const role = ref('')
const organization = ref('')
const startDate = ref('')
const endDate = ref('')
const current = ref(false)
const location = ref('')
const description = ref('')

const loading = ref(true)
const saving = ref(false)
const savedAt = ref<number | null>(null)
const errorMessage = ref('')
const notFound = ref(false)

/** Live preview of exactly what the timeline will print for these dates. */
const preview = computed(() => {
  if (!startDate.value) return ''
  const end = current.value ? null : endDate.value || null
  const duration = formatDuration(startDate.value, end)
  return [formatRange(startDate.value, end), duration].filter(Boolean).join('  ·  ')
})

async function load() {
  loading.value = true
  const { data, error } = await supabase.from('experience').select('*').eq('id', experienceId).maybeSingle()
  if (error) {
    errorMessage.value = error.message
  } else if (!data) {
    notFound.value = true
  } else {
    role.value = data.role
    organization.value = data.organization
    startDate.value = data.start_date
    endDate.value = data.end_date ?? ''
    current.value = data.end_date === null
    location.value = data.location ?? ''
    description.value = data.description
  }
  loading.value = false
}

async function save() {
  if (!role.value.trim() || !organization.value.trim() || !startDate.value) {
    errorMessage.value = 'Role, organization and start date are required.'
    return
  }
  if (!current.value && endDate.value && endDate.value < startDate.value) {
    errorMessage.value = 'End date cannot be before the start date.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  const { error } = await supabase
    .from('experience')
    .update({
      role: role.value.trim(),
      organization: organization.value.trim(),
      start_date: startDate.value,
      end_date: current.value ? null : endDate.value || null,
      location: location.value.trim() || null,
      description: description.value.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', experienceId)
  saving.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  savedAt.value = Date.now()
}

async function removeEntry() {
  if (!confirm(`Delete "${role.value} — ${organization.value}"? This also removes its tags.`)) return
  const { error } = await supabase.from('experience').delete().eq('id', experienceId)
  if (error) {
    errorMessage.value = error.message
    return
  }
  await navigateTo('/dashboard/experience')
}

onMounted(load)
</script>

<template>
  <div>
    <NuxtLink to="/dashboard/experience" class="back-link">← Back to experience</NuxtLink>

    <p v-if="loading" class="dash-note">Loading…</p>
    <p v-else-if="notFound" class="dash-error">Role not found.</p>

    <template v-else>
      <div class="dash-head">
        <div>
          <p class="dash-kicker">Editing role</p>
          <h1 class="dash-title">{{ role }}</h1>
        </div>
      </div>

      <section class="dash-panel">
        <form class="dash-form" @submit.prevent="save">
          <label class="dash-field">
            <span>Role / title</span>
            <input v-model="role" type="text" />
          </label>

          <label class="dash-field">
            <span>Organization</span>
            <input v-model="organization" type="text" />
          </label>

          <label class="dash-field">
            <span>Start date</span>
            <input v-model="startDate" type="date" />
          </label>

          <label class="dash-checkbox">
            <input v-model="current" type="checkbox" />
            <span>This is my current role (still running)</span>
          </label>

          <label v-if="!current" class="dash-field">
            <span>End date</span>
            <input v-model="endDate" type="date" />
          </label>

          <p v-if="preview" class="dash-note preview">
            Timeline will read: <b>{{ preview }}</b>
          </p>

          <label class="dash-field">
            <span>Location (optional)</span>
            <input v-model="location" type="text" />
          </label>

          <label class="dash-field">
            <span>Description</span>
            <textarea v-model="description" rows="4" />
            <small class="field-hint">A few lines. Blank line between paragraphs.</small>
          </label>

          <p v-if="errorMessage" class="dash-error">{{ errorMessage }}</p>
          <p v-if="savedAt" class="dash-ok">Saved.</p>

          <div class="form-actions">
            <button type="submit" class="dash-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
            <button type="button" class="dash-btn dash-btn-danger" @click="removeEntry">Delete role</button>
          </div>
        </form>
      </section>

      <section class="dash-panel">
        <h2>Tags</h2>
        <p class="dash-note">
          The same pills the project sections use.
        </p>
        <DashboardTagEditor :parent-id="experienceId" owner="experience" />
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
  font-family: var(--font-mono);
  font-size: 12px;
}

.back-link:hover {
  color: var(--text);
}

.dash-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 560px;
}

.dash-checkbox input {
  accent-color: var(--accent);
}

.preview {
  font-family: var(--font-mono);
  font-size: 12px;
  max-width: 560px;
}

.preview b {
  color: var(--accent);
  font-weight: 400;
}

.field-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-faint);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}
</style>
