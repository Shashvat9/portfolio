<script setup lang="ts">
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()

const { data: siteContent } = await useAsyncData('site_content', async () => {
  const { data } = await supabase.from('site_content').select('*').eq('id', 1).maybeSingle()
  return data
})

const { data: projects } = await useAsyncData('projects', async () => {
  const { data } = await supabase
    .from('projects')
    .select('*, project_tags(*), project_versions(*), project_images(*)')
    .order('order_index')
  return data ?? []
})

const resumeUrl = computed(() => {
  const path = siteContent.value?.resume_file_path
  if (!path) return null
  return supabase.storage.from('resume').getPublicUrl(path).data.publicUrl
})

useHead({
  title: 'Shashvat Rajyaguru',
})
</script>

<template>
  <div class="page">
    <SiteNav />
    <SiteHero v-if="siteContent" :hook="siteContent.hero_hook" />

    <section id="work" class="work-section">
      <SiteProjectCard v-for="project in projects" :key="project.id" :project="project" />
    </section>

    <SiteSynthesisBlock v-if="siteContent" :line="siteContent.synthesis_line" />

    <SiteFooter
      :email="siteContent?.footer_email ?? ''"
      :linkedin="siteContent?.footer_linkedin ?? ''"
      :resume-url="resumeUrl"
    />
  </div>
</template>

<style scoped>
.page {
  background: var(--bg);
  color: var(--text);
}

.work-section {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--space-24);
}

@media (min-width: 768px) {
  .work-section {
    padding: 0 var(--space-48);
  }
}
</style>
