<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { searchItunes, SHELVES } from '../lib/itunes'
import TrackTable from './TrackTable.vue'

defineProps({
  current: { type: Object, default: null },
  playing: { type: Boolean, default: false },
  liked: { type: Array, required: true },
  playlists: { type: Array, required: true },
})

const emit = defineEmits(['play-list', 'like', 'add-queue', 'add-playlist'])
const query = ref('')
const results = ref([])
const loading = ref(false)
let timer
let requestId = 0

watch(query, (value) => {
  clearTimeout(timer)
  const id = ++requestId
  if (!value.trim()) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  timer = setTimeout(async () => {
    try {
      const tracks = await searchItunes(value, 40)
      if (id === requestId) results.value = tracks
    } catch {
      if (id === requestId) results.value = []
    } finally {
      if (id === requestId) loading.value = false
    }
  }, 350)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  requestId++
})
</script>

<template>
  <div class="p-6">
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input v-model="query" autofocus placeholder="What do you want to play?" class="w-full rounded-full bg-secondary py-3 pl-11 pr-4 outline-none ring-ring focus:ring-2" />
    </div>
    <p v-if="loading" class="mt-6 text-muted-foreground">Searching…</p>
    <div v-if="!query" class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <button v-for="shelf in SHELVES" :key="shelf" class="h-24 rounded-lg bg-secondary p-4 text-left text-lg font-bold hover:bg-accent" @click="query = shelf">{{ shelf }}</button>
    </div>
    <TrackTable
      :tracks="results"
      :current="current"
      :playing="playing"
      :liked="liked"
      :playlists="playlists"
      @play="emit('play-list', results, $event)"
      @like="emit('like', $event)"
      @add-queue="emit('add-queue', $event)"
      @add-playlist="(id, track) => emit('add-playlist', id, track)"
    />
  </div>
</template>
