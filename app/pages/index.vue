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

/** Roles for the timeline, in the dashboard's manual order. Tags come along
    so the timeline can render the same pills the project sections use. */
const { data: experience } = await useAsyncData('experience', async () => {
  const { data } = await supabase
    .from('experience')
    .select('*, experience_tags(*)')
    .order('order_index')
  return data ?? []
})

/** The graph is driven by whatever the dashboard currently holds — node count,
    order and labels all come straight from this list. */
const graphItems = computed(() =>
  (projects.value ?? []).map((p) => ({ id: p.id, title: p.title })),
)

const resumeUrl = computed(() => {
  const path = siteContent.value?.resume_file_path
  if (!path) return null
  return supabase.storage.from('resume').getPublicUrl(path).data.publicUrl
})

useHead({
  title: 'Shashvat Rajyaguru',
  meta: [
    {
      name: 'description',
      content: siteContent.value?.hero_hook || 'Shashvat Rajyaguru — engineer.',
    },
  ],
})
</script>

<template>
  <div class="page">
    <SiteNav />

    <main>
      <SiteHero v-if="siteContent" :hook="siteContent.hero_hook" :items="graphItems" />

      <section id="work" class="work-section">
        <SiteProjectCard
          v-for="(project, i) in projects"
          :key="project.id"
          :project="project"
          :index="i"
        />
      </section>

      <!-- Experience sits inside the evidence block, between the systems and
           the conclusion drawn from them: the projects argue what was built,
           the timeline argues where, and the synthesis line then closes over
           both. Placing it before the projects would reframe the page as a
           résumé — which the footer's PDF already is — and placing it after
           the synthesis would leave a closing statement stranded mid-page. -->
      <SiteExperienceTimeline v-if="experience?.length" :entries="experience" />

      <SiteSynthesisBlock v-if="siteContent" :line="siteContent.synthesis_line" />
    </main>

    <SiteFooter
      :email="siteContent?.footer_email ?? ''"
      :linkedin="siteContent?.footer_linkedin ?? ''"
      :resume-url="resumeUrl"
    />

    <SiteMiniGraph :items="graphItems" />
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

@media (min-width: 1024px) {
  .work-section {
    padding: 0 var(--space-96);
  }
}
</style>
