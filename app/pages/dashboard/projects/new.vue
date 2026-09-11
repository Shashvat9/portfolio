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
    errorMessage.value = 'Category, title and body are required.'
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
    <div class="dash-head">
      <div>
        <p class="dash-kicker">Projects</p>
        <h1 class="dash-title">New project</h1>
      </div>
    </div>
    <p class="dash-note intro">
      Creating this adds a node to the graph on the site — the layout
      recalculates itself, no code change needed. Tags, version tiles and
      images are added after the project exists.
    </p>

    <form class="dash-form" @submit.prevent="create">
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

      <button type="submit" class="dash-btn" :disabled="saving">{{ saving ? 'Creating…' : 'Create project' }}</button>
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

.field-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-faint);
}

.field-hint code {
  font-family: var(--font-mono);
  font-size: 11px;
}

.dash-btn {
  align-self: flex-start;
}
</style>
