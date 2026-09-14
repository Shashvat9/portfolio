<script setup lang="ts">
import type { Database } from '~/types/database.types'
import { categoryFacets } from '~/utils/category'
import { visualKind } from '~/utils/visual'

type Project = Database['public']['Tables']['projects']['Row'] & {
  category?: string | null
  visual?: string | null
  project_tags: Database['public']['Tables']['project_tags']['Row'][]
  project_versions: Database['public']['Tables']['project_versions']['Row'][]
  project_images: Database['public']['Tables']['project_images']['Row'][]
}

const props = defineProps<{ project: Project; index: number }>()

const supabase = useSupabaseClient<Database>()
const { activeIndex } = useSystemState()
const { emit: emitPulse } = useSignalPulse()

const section = ref<HTMLElement | null>(null)
useSectionWatcher(section, props.index)

const isActive = computed(() => activeIndex.value === props.index)

const paragraphs = computed(() => props.project.body.split('\n\n').filter(Boolean))
const facets = computed(() => categoryFacets(props.project))
const tags = computed(() => [...props.project.project_tags].sort((a, b) => a.order_index - b.order_index))
const versions = computed(() => [...props.project.project_versions].sort((a, b) => a.order_index - b.order_index))

/** Which visual this project's section renders. Explicit column if set,
    otherwise derived from the project's own tags and category — never from
    its title, so renaming a project in the dashboard cannot change it. */
const kind = computed(() => visualKind(props.project))

/** Tag text feeds the generated visuals: detection classes, pipeline stages. */
const labels = computed(() => tags.value.map((t) => t.tag_text))

const images = computed(() =>
  [...props.project.project_images]
    .sort((a, b) => a.order_index - b.order_index)
    .map((img) => ({ id: img.id, url: supabase.storage.from('images').getPublicUrl(img.storage_path).data.publicUrl })),
)

/** Hovering the card sends a signal back to the pinned graph. Throttled to
    one pulse per entry so a mouse crossing the card doesn't flood the edge. */
function onEnter() {
  emitPulse(props.project.id)
}
</script>

<template>
  <article
    :id="`project-${project.id}`"
    ref="section"
    class="project"
    :class="{ 'is-active': isActive }"
    @mouseenter="onEnter"
    @focusin="onEnter"
  >
    <header class="head">
      <span class="node-glyph" aria-hidden="true" />

      <!-- Category travels as discrete facets tied to the node, not as an
           ALL-CAPS eyebrow or a middot-joined string. -->
      <ul v-if="facets.length" class="facets">
        <li v-for="facet in facets" :key="facet">{{ facet }}</li>
      </ul>

      <h2 class="title">{{ project.title }}</h2>
    </header>

    <div class="body">
      <p v-for="(para, i) in paragraphs" :key="i">{{ para }}</p>
    </div>

    <ul v-if="tags.length" class="tags">
      <li v-for="tag in tags" :key="tag.id">{{ tag.tag_text }}</li>
    </ul>

    <dl v-if="project.role || project.team" class="meta">
      <div v-if="project.role">
        <dt>Role</dt>
        <dd>{{ project.role }}</dd>
      </div>
      <div v-if="project.team">
        <dt>Team</dt>
        <dd>{{ project.team }}</dd>
      </div>
    </dl>

    <p v-if="project.citation" class="citation">{{ project.citation }}</p>

    <SiteProjectSequence
      :versions="versions"
      :images="images"
      :title="project.title"
      :kind="kind"
      :project-key="project.id"
      :labels="labels"
    />
  </article>
</template>

<style scoped>
.project {
  position: relative;
  padding: var(--space-48) 0;
  border-top: 1px solid var(--border-soft);
}

/* A hairline rail down the left edge that fills in while the section is being
   read — the page's own "signal is here" cue, matching the graph. */
.project::before {
  content: '';
  position: absolute;
  left: calc(var(--space-16) * -1);
  top: var(--space-48);
  bottom: var(--space-48);
  width: 1px;
  background: var(--accent);
  transform: scaleY(0);
  transform-origin: top;
  opacity: 0.5;
  transition: transform 0.5s ease;
}

.project.is-active::before {
  transform: scaleY(1);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-bottom: var(--space-16);
}

.node-glyph {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.5px solid var(--node);
  background: var(--bg);
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.project.is-active .node-glyph {
  background: var(--node-active);
  border-color: var(--node-active);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 14%, transparent);
}

/* Facets: sentence case, separate elements, no middots. */
.facets {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-12);
  margin: 0;
  padding: 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.facets li + li {
  position: relative;
  padding-left: var(--space-12);
}

.facets li + li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.28em;
  bottom: 0.28em;
  width: 1px;
  background: var(--border-soft);
}

.title {
  font-family: var(--font-display);
  font-size: clamp(30px, 4.6vw, 46px);
  line-height: 1.06;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  max-width: 62ch;
  margin-bottom: var(--space-24);
}

.body p {
  font-size: 16px;
  line-height: 1.62;
  color: var(--text-secondary);
  margin: 0;
}

/* Mono earns its place on tags: these are literal technical identifiers. */
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

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-24);
  margin: 0 0 var(--space-16);
}

.meta > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta dt {
  font-size: 12px;
  color: var(--text-faint);
}

.meta dd {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.citation {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-faint);
  border-left: 1px solid var(--border-soft);
  padding-left: var(--space-12);
  max-width: 60ch;
  margin: 0 0 var(--space-8);
}

@media (min-width: 768px) {
  .project {
    padding: var(--space-96) 0;
  }

  .project::before {
    left: calc(var(--space-32) * -1);
    top: var(--space-96);
    bottom: var(--space-96);
  }

  .head {
    margin-bottom: var(--space-24);
  }
}

@media (prefers-reduced-motion: reduce) {
  .project::before {
    transition: none;
  }
}
</style>
