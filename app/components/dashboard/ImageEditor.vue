<script setup lang="ts">
import type { Database } from '~/types/database.types'

const props = defineProps<{ projectId: string }>()

type ProjectImage = Database['public']['Tables']['project_images']['Row']

const supabase = useSupabaseClient<Database>()
const images = ref<ProjectImage[]>([])
const errorMessage = ref('')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function publicUrl(path: string) {
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}

async function load() {
  const { data, error } = await supabase
    .from('project_images')
    .select('*')
    .eq('project_id', props.projectId)
    .order('order_index')
  if (error) errorMessage.value = error.message
  else images.value = data ?? []
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  errorMessage.value = ''
  const path = `${props.projectId}/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('images').upload(path, file)
  if (uploadError) {
    errorMessage.value = uploadError.message
    uploading.value = false
    return
  }
  const { error: insertError } = await supabase
    .from('project_images')
    .insert({ project_id: props.projectId, storage_path: path, order_index: images.value.length })
  uploading.value = false
  if (insertError) {
    errorMessage.value = insertError.message
    return
  }
  if (fileInput.value) fileInput.value.value = ''
  await load()
}

async function removeImage(img: ProjectImage) {
  await supabase.storage.from('images').remove([img.storage_path])
  const { error } = await supabase.from('project_images').delete().eq('id', img.id)
  if (error) errorMessage.value = error.message
  else await load()
}

async function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= images.value.length) return
  const a = images.value[index]
  const b = images.value[target]
  const { error } = await supabase.from('project_images').upsert([
    { ...a, order_index: b.order_index },
    { ...b, order_index: a.order_index },
  ])
  if (error) errorMessage.value = error.message
  else await load()
}

onMounted(load)
</script>

<template>
  <div class="image-editor">
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <div class="image-grid">
      <div v-for="(img, i) in images" :key="img.id" class="image-tile">
        <img :src="publicUrl(img.storage_path)" :alt="`Project image ${i + 1}`" />
        <div class="image-actions">
          <button type="button" :disabled="i === 0" @click="move(i, -1)">←</button>
          <button type="button" :disabled="i === images.length - 1" @click="move(i, 1)">→</button>
          <button type="button" class="remove" @click="removeImage(img)">Remove</button>
        </div>
      </div>
    </div>
    <input ref="fileInput" type="file" accept="image/*" @change="onFileChange" />
    <span v-if="uploading" class="note">Uploading…</span>
  </div>
</template>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-12);
}

.image-tile {
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.image-tile img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border: 1px solid var(--border-soft);
  display: block;
}

.image-actions {
  display: flex;
  gap: var(--space-4);
}

.image-actions button {
  flex: 1;
  border: 1px solid var(--border-soft);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  padding: var(--space-4);
  color: var(--text-secondary);
}

.image-actions button:disabled {
  opacity: 0.3;
  cursor: default;
}

.remove {
  color: var(--accent);
}

.note {
  color: var(--text-faint);
  font-size: 12px;
}

.error {
  color: var(--accent);
  font-size: 12px;
}
</style>
