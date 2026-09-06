<script setup lang="ts">
import type { Database } from '~/types/database.types'

type Project = Database['public']['Tables']['projects']['Row'] & {
  project_tags: Database['public']['Tables']['project_tags']['Row'][]
  project_versions: Database['public']['Tables']['project_versions']['Row'][]
  project_images: Database['public']['Tables']['project_images']['Row'][]
}

const props = defineProps<{ project: Project }>()

const supabase = useSupabaseClient<Database>()

const paragraphs = computed(() => props.project.body.split('\n\n'))
const tags = computed(() => [...props.project.project_tags].sort((a, b) => a.order_index - b.order_index))
const versions = computed(() => [...props.project.project_versions].sort((a, b) => a.order_index - b.order_index))
const images = computed(() => [...props.project.project_images].sort((a, b) => a.order_index - b.order_index))
const hasMeta = computed(() => Boolean(props.project.role || props.project.team))

function imageUrl(path: string) {
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}
</script>

<template>
  <article class="project-card">
    <p class="eyebrow">{{ project.eyebrow }}</p>
    <h2 class="title">{{ project.title }}</h2>

    <div class="body">
      <p v-for="(para, i) in paragraphs" :key="i">{{ para }}</p>
    </div>

    <ul v-if="tags.length" class="tags">
      <li v-for="tag in tags" :key="tag.id">{{ tag.tag_text }}</li>
    </ul>

    <div v-if="hasMeta" class="meta-row">
      <span v-if="project.role"><b>ROLE</b> {{ project.role }}</span>
      <span v-if="project.team"><b>TEAM</b> {{ project.team }}</span>
    </div>

    <p v-if="project.citation" class="citation">{{ project.citation }}</p>

    <SiteVersionTiles v-if="versions.length" :versions="versions" />

    <div v-if="images.length" class="image-grid">
      <img v-for="img in images" :key="img.id" :src="imageUrl(img.storage_path)" :alt="project.title" />
    </div>
  </article>
</template>

<style scoped>
.project-card {
  padding: var(--space-24) 0;
  border-top: 1px solid var(--border-soft);
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-8);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(28px, 4vw, 44px);
  color: var(--text);
  margin: 0 0 var(--space-16);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  max-width: 640px;
  margin-bottom: var(--space-16);
}

.body p {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

.tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin: 0 0 var(--space-16);
  padding: 0;
}

.tags li {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border-soft);
  color: var(--text-secondary);
  transition: border-color 0.15s ease, color 0.15s ease;
}

.tags li:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.meta-row {
  display: flex;
  gap: var(--space-16);
  font-size: 11px;
  color: var(--text-faint);
  margin-bottom: var(--space-8);
}

.meta-row b {
  color: var(--text-tertiary);
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-right: var(--space-4);
}

.citation {
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-faint);
  border-left: 2px solid var(--border-soft);
  padding-left: var(--space-12);
  max-width: 560px;
  margin: 0 0 var(--space-8);
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-16);
  margin-top: var(--space-24);
}

.image-grid img {
  width: 100%;
  max-width: 280px;
  height: auto;
  border: 1px solid var(--border-soft);
  display: block;
}

@media (min-width: 768px) {
  .project-card {
    padding: var(--space-48) 0;
  }
}
</style>
