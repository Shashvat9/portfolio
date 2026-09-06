<script setup lang="ts">
import type { Database } from '~/types/database.types'

defineProps<{ versions: Database['public']['Tables']['project_versions']['Row'][] }>()
</script>

<template>
  <div class="version-tiles">
    <div v-for="v in versions" :key="v.id" class="tile" :class="{ 'in-progress': v.status === 'in_progress' }">
      <span class="dot" />
      <p class="label">{{ v.label }}</p>
      <p class="sublabel">{{ v.sublabel }}</p>
      <p class="description">{{ v.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.version-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-16);
  margin-top: var(--space-24);
  padding-top: var(--space-24);
  border-top: 1px dashed var(--border-dash);
}

.tile {
  flex: 1 1 160px;
  min-width: 140px;
  padding: var(--space-16);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  position: relative;
}

.tile.in-progress {
  border-style: dashed;
  border-color: var(--border-dash);
  background: var(--bg);
}

.dot {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  margin-bottom: var(--space-12);
}

.tile.in-progress .dot {
  background: transparent;
  border: 1px dotted var(--accent);
}

.label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--accent);
  margin: 0 0 var(--space-4);
}

.sublabel {
  font-size: 12px;
  color: var(--text);
  margin: 0 0 var(--space-8);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.description {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}
</style>
