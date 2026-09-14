<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient<Database>()

const role = ref('')
const organization = ref('')
const startDate = ref('')
const endDate = ref('')
const current = ref(true)
const location = ref('')
const description = ref('')
const saving = ref(false)
const errorMessage = ref('')

async function create() {
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

  const { count } = await supabase.from('experience').select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('experience')
    .insert({
      order_index: count ?? 0,
      role: role.value.trim(),
      organization: organization.value.trim(),
      start_date: startDate.value,
      // A current role stores null rather than today's date — null is the
      // single source of truth for "still running" everywhere on the site.
      end_date: current.value ? null : endDate.value || null,
      location: location.value.trim() || null,
      description: description.value.trim(),
    })
    .select()
    .single()

  saving.value = false
  if (error || !data) {
    errorMessage.value = error?.message ?? 'Could not create the role.'
    return
  }
  await navigateTo(`/dashboard/experience/${data.id}`)
}
</script>

<template>
  <div>
    <NuxtLink to="/dashboard/experience" class="back-link">← Back to experience</NuxtLink>

    <div class="dash-head">
      <div>
        <p class="dash-kicker">Experience</p>
        <h1 class="dash-title">New role</h1>
      </div>
    </div>

    <p class="dash-note intro">
      This adds a node to the timeline between the projects and the synthesis
      line. The timeline re-times itself around however many roles exist — tags
      are added once the role exists.
    </p>

    <form class="dash-form" @submit.prevent="create">
      <label class="dash-field">
        <span>Role / title</span>
        <input v-model="role" type="text" placeholder="Backend Engineer" />
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

      <label class="dash-field">
        <span>Location (optional)</span>
        <input v-model="location" type="text" placeholder="Ahmedabad, IN" />
      </label>

      <label class="dash-field">
        <span>Description</span>
        <textarea v-model="description" rows="4" />
        <small class="field-hint">A few lines. Blank line between paragraphs.</small>
      </label>

      <p v-if="errorMessage" class="dash-error">{{ errorMessage }}</p>

      <button type="submit" class="dash-btn" :disabled="saving">{{ saving ? 'Creating…' : 'Create role' }}</button>
    </form>
  </div>
</template>

<style scoped>
.intro {
  max-width: 560px;
  margin-bottom: var(--space-24);
  padding-left: var(--space-12);
  border-left: 1px solid var(--accent);
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

.field-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-faint);
}

.dash-btn {
  align-self: flex-start;
}
</style>
