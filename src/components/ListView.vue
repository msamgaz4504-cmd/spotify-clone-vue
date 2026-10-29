<script setup>
import { ListMusic, Play } from 'lucide-vue-next'
import TrackTable from './TrackTable.vue'

defineProps({
  title: { type: String, required: true },
  tracks: { type: Array, required: true },
  current: { type: Object, default: null },
  playing: { type: Boolean, default: false },
  liked: { type: Array, required: true },
  playlists: { type: Array, required: true },
  removable: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  deletable: { type: Boolean, default: false },
})

const emit = defineEmits(['play-list', 'like', 'add-queue', 'add-playlist', 'remove', 'rename', 'delete'])
</script>

<template>
  <div class="p-6">
    <div class="flex items-end gap-6 pb-6">
      <div class="grid size-40 shrink-0 place-items-center rounded bg-secondary shadow-2xl">
        <img v-if="tracks[0]" :src="tracks[0].art" alt="" class="size-full rounded object-cover" />
        <ListMusic v-else class="size-12 text-muted-foreground" />
      </div>
      <div>
        <p class="text-sm">Playlist</p>
        <input v-if="editable" :value="title" class="w-full bg-transparent text-4xl font-extrabold outline-none md:text-6xl" @input="emit('rename', $event.target.value)" />
        <h1 v-else class="text-4xl font-extrabold md:text-6xl">{{ title }}</h1>
        <p class="mt-2 text-sm text-muted-foreground">{{ tracks.length }} songs</p>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <button v-if="tracks.length" aria-label="Play all" class="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground transition hover:scale-105" @click="emit('play-list', tracks, 0)">
        <Play class="ml-1 size-6 fill-current" />
      </button>
      <button v-if="deletable" class="text-sm text-muted-foreground hover:text-destructive" @click="emit('delete')">Delete playlist</button>
    </div>
    <p v-if="!tracks.length" class="mt-6 text-muted-foreground">Nothing here yet — find songs in Search.</p>
    <TrackTable
      :tracks="tracks"
      :current="current"
      :playing="playing"
      :liked="liked"
      :playlists="playlists"
      :removable="removable"
      @play="emit('play-list', tracks, $event)"
      @like="emit('like', $event)"
      @add-queue="emit('add-queue', $event)"
      @add-playlist="(id, track) => emit('add-playlist', id, track)"
      @remove="emit('remove', $event)"
    />
  </div>
</template>
