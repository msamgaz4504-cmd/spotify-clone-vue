<script setup>
import { Heart, ListMusic, Play, Trash2 } from 'lucide-vue-next'

defineProps({
  tracks: { type: Array, required: true },
  current: { type: Object, default: null },
  playing: { type: Boolean, default: false },
  liked: { type: Array, required: true },
  playlists: { type: Array, required: true },
  removable: { type: Boolean, default: false },
})

const emit = defineEmits(['play', 'like', 'add-queue', 'add-playlist', 'remove'])

function selectPlaylist(event, track) {
  if (event.target.value) emit('add-playlist', event.target.value, track)
  event.target.value = ''
}
</script>

<template>
  <div class="mt-6">
    <div
      v-for="(track, index) in tracks"
      :key="`${track.id}-${index}`"
      class="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 rounded px-3 py-2 hover:bg-accent md:grid-cols-[2rem_2fr_1fr_auto]"
      @dblclick="emit('play', index)"
    >
      <button class="text-muted-foreground" aria-label="Play" @click="emit('play', index)">
        <span class="group-hover:hidden">
          <span v-if="current?.id === track.id && playing" class="text-primary">♪</span>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <Play class="hidden size-4 fill-current text-foreground group-hover:block" />
      </button>
      <div class="flex min-w-0 items-center gap-3">
        <img :src="track.art" alt="" class="size-10 rounded" />
        <div class="min-w-0">
          <div :class="['truncate', current?.id === track.id ? 'text-primary' : '']">{{ track.title }}</div>
          <div class="truncate text-sm text-muted-foreground">{{ track.artist }}</div>
        </div>
      </div>
      <div class="hidden truncate text-sm text-muted-foreground md:block">{{ track.album }}</div>
      <div class="flex items-center gap-3">
        <button aria-label="Like" @click="emit('like', track)">
          <Heart :class="['size-4', liked.some((item) => item.id === track.id) ? 'fill-primary text-primary' : 'text-muted-foreground opacity-0 group-hover:opacity-100']" />
        </button>
        <button title="Add to queue" class="text-muted-foreground opacity-0 group-hover:opacity-100" @click="emit('add-queue', track)">
          <ListMusic class="size-4" />
        </button>
        <select
          v-if="playlists.length"
          value=""
          title="Add to playlist"
          class="w-6 bg-transparent text-muted-foreground opacity-0 group-hover:opacity-100"
          @change="selectPlaylist($event, track)"
        >
          <option value="">+</option>
          <option v-for="playlist in playlists" :key="playlist.id" :value="playlist.id" class="bg-popover">{{ playlist.name }}</option>
        </select>
        <button v-if="removable" aria-label="Remove" class="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100" @click="emit('remove', index)">
          <Trash2 class="size-4" />
        </button>
        <span class="w-10 text-right text-sm text-muted-foreground">0:30</span>
      </div>
    </div>
  </div>
</template>
