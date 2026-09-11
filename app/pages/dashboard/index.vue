<script setup lang="ts">
import type { Database } from '~/types/database.types'

definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient<Database>()

const heroHook = ref('')
const synthesisLine = ref('')
const footerEmail = ref('')
const footerLinkedin = ref('')
const resumeFilePath = ref<string | null>(null)

const loading = ref(true)
const saving = ref(false)
const savedAt = ref<number | null>(null)
const errorMessage = ref('')

const resumeInput = ref<HTMLInputElement | null>(null)
const uploadingResume = ref(false)

const resumeUrl = computed(() => {
  if (!resumeFilePath.value) return null
  return supabase.storage.from('resume').getPublicUrl(resumeFilePath.value).data.publicUrl
})

async function load() {
  loading.value = true
  const { data, error } = await supabase.from('site_content').select('*').eq('id', 1).maybeSingle()
  if (error) {
    errorMessage.value = error.message
  } else if (data) {
    heroHook.value = data.hero_hook
    synthesisLine.value = data.synthesis_line
    footerEmail.value = data.footer_email
    footerLinkedin.value = data.footer_linkedin
    resumeFilePath.value = data.resume_file_path
  }
  loading.value = false
}

async function save() {
  saving.value = true
  errorMessage.value = ''
  const { error } = await supabase
    .from('site_content')
    .update({
      hero_hook: heroHook.value,
      synthesis_line: synthesisLine.value,
      footer_email: footerEmail.value,
      footer_linkedin: footerLinkedin.value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
  saving.value = false
  if (error) {
    errorMessage.value = error.message
    return
  }
  savedAt.value = Date.now()
}

async function onResumeChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingResume.value = true
  errorMessage.value = ''
  const path = 'resume.pdf'
  const { error: uploadError } = await supabase.storage
    .from('resume')
    .upload(path, file, { upsert: true, contentType: file.type || 'application/pdf' })
  if (uploadError) {
    errorMessage.value = uploadError.message
    uploadingResume.value = false
    return
  }
  const { error: updateError } = await supabase
    .from('site_content')
    .update({ resume_file_path: path, updated_at: new Date().toISOString() })
    .eq('id', 1)
  uploadingResume.value = false
  if (updateError) {
    errorMessage.value = updateError.message
    return
  }
  resumeFilePath.value = path
  if (resumeInput.value) resumeInput.value.value = ''
}

onMounted(load)
</script>

<template>
  <div>
    <div class="dash-head">
      <div>
        <p class="dash-kicker">Site content</p>
        <h1 class="dash-title">Hero, synthesis &amp; footer</h1>
      </div>
    </div>

    <p class="dash-note live-hint">
      The hero hook is rendered at the centre of the node graph on the site —
      keep it short enough to sit inside the core.
    </p>

    <div v-if="loading" class="dash-note">Loading…</div>

    <form v-else class="dash-form" @submit.prevent="save">
      <label class="dash-field">
        <span>Hero hook</span>
        <textarea v-model="heroHook" rows="2" />
      </label>

      <label class="dash-field">
        <span>Synthesis line</span>
        <textarea v-model="synthesisLine" rows="2" />
      </label>

      <label class="dash-field">
        <span>Footer email</span>
        <input v-model="footerEmail" type="email" placeholder="you@example.com" />
      </label>

      <label class="dash-field">
        <span>Footer LinkedIn URL</span>
        <input v-model="footerLinkedin" type="url" placeholder="https://linkedin.com/in/…" />
      </label>

      <div class="dash-field">
        <span>Resume (PDF)</span>
        <div class="resume-row">
          <a v-if="resumeUrl" :href="resumeUrl" target="_blank" class="resume-link">Current resume ↓</a>
          <span v-else class="dash-note">No resume uploaded yet.</span>
          <input ref="resumeInput" type="file" accept="application/pdf" @change="onResumeChange" />
          <span v-if="uploadingResume" class="dash-note">Uploading…</span>
        </div>
      </div>

      <p v-if="errorMessage" class="dash-error">{{ errorMessage }}</p>
      <p v-if="savedAt" class="dash-ok">Saved.</p>

      <button type="submit" class="dash-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
    </form>

    <section class="dash-panel security-section">
      <h2>Security</h2>
      <p class="dash-note">Register a passkey to sign in with Face ID / Touch ID instead of a password.</p>
      <DashboardPasskeyManager />
    </section>
  </div>
</template>

<style scoped>
.security-section {
  margin-top: var(--space-48);
  padding-top: var(--space-24);
  border-top: 1px solid var(--border-soft);
  max-width: 560px;
}

.live-hint {
  max-width: 560px;
  margin-bottom: var(--space-24);
  padding-left: var(--space-12);
  border-left: 1px solid var(--accent);
}

.dash-btn {
  align-self: flex-start;
}

.resume-row {
  display: flex;
  align-items: center;
  gap: var(--space-16);
  flex-wrap: wrap;
}

.resume-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 12px;
}

</style>
