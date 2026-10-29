<script setup>
import { onMounted, ref } from 'vue'
import { Play } from 'lucide-vue-next'
import { searchItunes, SHELVES } from '../lib/itunes'

const emit = defineEmits(['play-list'])
const data = ref({})
const hour = new Date().getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

onMounted(() => {
  for (const shelf of SHELVES) {
    searchItunes(shelf, 12).then((tracks) => { data.value[shelf] = tracks }).catch(() => { data.value[shelf] = [] })
  }
})
</script>

<template>
  <div class="space-y-8 p-6">
    <h1 class="text-3xl font-extrabold">{{ greeting }}</h1>
    <section v-for="shelf in SHELVES" :key="shelf">
      <h2 class="mb-3 text-xl font-bold">{{ shelf }}</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <button
          v-for="(track, index) in (data[shelf] || []).slice(0, 6)"
          :key="track.id"
          class="group rounded-md bg-card/40 p-3 text-left transition hover:bg-card"
          @click="emit('play-list', data[shelf], index)"
        >
          <div class="relative">
            <img :src="track.art" alt="" class="aspect-square w-full rounded object-cover shadow-lg" />
            <span class="absolute bottom-2 right-2 grid size-10 translate-y-2 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
              <Play class="ml-0.5 size-4 fill-current" />
            </span>
          </div>
          <div class="mt-2 truncate text-sm font-medium">{{ track.title }}</div>
          <div class="truncate text-xs text-muted-foreground">{{ track.artist }}</div>
        </button>
      </div>
    </section>
  </div>
</template>
