<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import {
  Heart, Home, Library, ListMusic, Pause, Play, Plus, Repeat,
  Search, Shuffle, SkipBack, SkipForward, Volume2, VolumeX,
} from 'lucide-vue-next'
import HomeView from './components/HomeView.vue'
import SearchView from './components/SearchView.vue'
import ListView from './components/ListView.vue'
import { formatTime } from './lib/itunes'

function loadSaved(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

const audio = ref(null)
const view = ref({ kind: 'home' })
const queue = ref([])
const index = ref(-1)
const playing = ref(false)
const time = ref(0)
const duration = ref(30)
const volume = ref(0.8)
const muted = ref(false)
const shuffle = ref(false)
const repeat = ref('off')
const liked = ref(loadSaved('sw-liked'))
const playlists = ref(loadSaved('sw-playlists'))

const current = computed(() => queue.value[index.value] || null)
const selectedPlaylist = computed(() => playlists.value.find((item) => item.id === view.value.id) || null)

watch(liked, (value) => localStorage.setItem('sw-liked', JSON.stringify(value)), { deep: true })
watch(playlists, (value) => localStorage.setItem('sw-playlists', JSON.stringify(value)), { deep: true })
watch([volume, muted], () => {
  if (audio.value) audio.value.volume = muted.value ? 0 : volume.value
})
watch(audio, (element) => {
  if (element) element.volume = muted.value ? 0 : volume.value
})
watch(current, async (track) => {
  if (!track) return
  await nextTick()
  if (!audio.value) return
  audio.value.src = track.src
  time.value = 0
  try {
    await audio.value.play()
    playing.value = true
  } catch {
    playing.value = false
  }
})

function playList(tracks, position) {
  queue.value = [...tracks]
  index.value = position
}

function togglePlayback() {
  if (!audio.value || !current.value) return
  if (audio.value.paused) audio.value.play().catch(() => { playing.value = false })
  else audio.value.pause()
}

function nextTrack() {
  if (!queue.value.length) return
  if (shuffle.value) {
    index.value = Math.floor(Math.random() * queue.value.length)
  } else if (index.value + 1 < queue.value.length) {
    index.value++
  } else if (repeat.value === 'all') {
    index.value = 0
  } else {
    audio.value?.pause()
  }
}

function previousTrack() {
  if (audio.value && audio.value.currentTime > 3) audio.value.currentTime = 0
  else if (index.value > 0) index.value--
}

function onEnded() {
  if (repeat.value === 'one' && audio.value) {
    audio.value.currentTime = 0
    audio.value.play().catch(() => { playing.value = false })
  } else nextTrack()
}

function isLiked(track) {
  return liked.value.some((item) => item.id === track.id)
}

function toggleLike(track) {
  liked.value = isLiked(track)
    ? liked.value.filter((item) => item.id !== track.id)
    : [track, ...liked.value]
}

function addToQueue(track) {
  if (!queue.value.length) playList([track], 0)
  else queue.value = [...queue.value, track]
}

function addToPlaylist(id, track) {
  playlists.value = playlists.value.map((playlist) =>
    playlist.id === id && !playlist.tracks.some((item) => item.id === track.id)
      ? { ...playlist, tracks: [...playlist.tracks, track] }
      : playlist,
  )
}

function newPlaylist() {
  const playlist = { id: crypto.randomUUID(), name: `My Playlist #${playlists.value.length + 1}`, tracks: [] }
  playlists.value = [...playlists.value, playlist]
  view.value = { kind: 'playlist', id: playlist.id }
}

function renamePlaylist(name) {
  playlists.value = playlists.value.map((playlist) =>
    playlist.id === view.value.id ? { ...playlist, name } : playlist,
  )
}

function deletePlaylist() {
  playlists.value = playlists.value.filter((playlist) => playlist.id !== view.value.id)
  view.value = { kind: 'home' }
}

function removeFromPlaylist(position) {
  playlists.value = playlists.value.map((playlist) =>
    playlist.id === view.value.id
      ? { ...playlist, tracks: playlist.tracks.filter((_, index) => index !== position) }
      : playlist,
  )
}

function removeFromQueue(position) {
  queue.value = queue.value.filter((_, index) => index !== position)
  if (position < index.value) index.value--
}

function cycleRepeat() {
  repeat.value = repeat.value === 'off' ? 'all' : repeat.value === 'all' ? 'one' : 'off'
}

function seek(event) {
  if (audio.value) audio.value.currentTime = Number(event.target.value)
}
</script>

<template>
  <div class="flex h-screen flex-col gap-2 bg-sidebar p-2 text-foreground">
    <audio
      ref="audio"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="time = $event.target.currentTime"
      @loadedmetadata="duration = $event.target.duration || 30"
      @ended="onEnded"
    />

    <div class="flex min-h-0 flex-1 gap-2">
      <aside class="hidden w-64 shrink-0 flex-col gap-2 md:flex">
        <nav class="rounded-lg bg-background p-3">
          <button :class="['flex w-full items-center gap-4 rounded px-3 py-2 font-bold transition [&_svg]:size-6', view.kind === 'home' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground']" @click="view = { kind: 'home' }">
            <Home />Home
          </button>
          <button :class="['flex w-full items-center gap-4 rounded px-3 py-2 font-bold transition [&_svg]:size-6', view.kind === 'search' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground']" @click="view = { kind: 'search' }">
            <Search />Search
          </button>
          <button :class="['flex w-full items-center gap-4 rounded px-3 py-2 font-bold transition [&_svg]:size-6', view.kind === 'queue' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground']" @click="view = { kind: 'queue' }">
            <ListMusic />Queue
          </button>
        </nav>

        <div class="flex min-h-0 flex-1 flex-col rounded-lg bg-background p-3">
          <div class="mb-2 flex items-center justify-between px-2 text-muted-foreground">
            <span class="flex items-center gap-2 font-bold"><Library class="size-5" />Your Library</span>
            <button class="rounded-full p-1 hover:bg-accent" aria-label="New playlist" @click="newPlaylist"><Plus class="size-5" /></button>
          </div>
          <div class="overflow-y-auto">
            <button :class="['flex w-full items-center gap-3 rounded p-2 text-left hover:bg-accent', view.kind === 'liked' ? 'bg-secondary' : '']" @click="view = { kind: 'liked' }">
              <div class="grid size-12 place-items-center rounded bg-primary"><Heart class="size-5 fill-primary-foreground text-primary-foreground" /></div>
              <div class="min-w-0"><div class="truncate font-medium">Liked Songs</div><div class="text-xs text-muted-foreground">{{ liked.length }} songs</div></div>
            </button>
            <button v-for="playlist in playlists" :key="playlist.id" :class="['flex w-full items-center gap-3 rounded p-2 text-left hover:bg-accent', view.kind === 'playlist' && view.id === playlist.id ? 'bg-secondary' : '']" @click="view = { kind: 'playlist', id: playlist.id }">
              <img v-if="playlist.tracks[0]" :src="playlist.tracks[0].art" class="size-12 rounded object-cover" alt="" />
              <div v-else class="grid size-12 place-items-center rounded bg-muted"><ListMusic class="size-5 text-muted-foreground" /></div>
              <div class="min-w-0"><div class="truncate font-medium">{{ playlist.name }}</div><div class="text-xs text-muted-foreground">Playlist · {{ playlist.tracks.length }}</div></div>
            </button>
          </div>
        </div>
      </aside>

      <main class="min-h-0 flex-1 overflow-y-auto rounded-lg bg-background bg-hero">
        <div class="flex gap-2 p-4 md:hidden">
          <button v-for="kind in ['home', 'search', 'liked', 'queue']" :key="kind" :class="['rounded-full px-3 py-1 text-sm capitalize', view.kind === kind ? 'bg-foreground text-background' : 'bg-secondary']" @click="view = { kind }">{{ kind }}</button>
        </div>

        <HomeView v-if="view.kind === 'home'" @play-list="playList" />
        <SearchView
          v-else-if="view.kind === 'search'"
          :current="current"
          :playing="playing"
          :liked="liked"
          :playlists="playlists"
          @play-list="playList"
          @like="toggleLike"
          @add-queue="addToQueue"
          @add-playlist="addToPlaylist"
        />
        <ListView
          v-else-if="view.kind === 'liked'"
          title="Liked Songs"
          :tracks="liked"
          :current="current"
          :playing="playing"
          :liked="liked"
          :playlists="playlists"
          @play-list="playList"
          @like="toggleLike"
          @add-queue="addToQueue"
          @add-playlist="addToPlaylist"
        />
        <ListView
          v-else-if="view.kind === 'queue'"
          title="Queue"
          :tracks="queue"
          :current="current"
          :playing="playing"
          :liked="liked"
          :playlists="playlists"
          removable
          @play-list="playList"
          @like="toggleLike"
          @add-queue="addToQueue"
          @add-playlist="addToPlaylist"
          @remove="removeFromQueue"
        />
        <ListView
          v-else-if="view.kind === 'playlist' && selectedPlaylist"
          :title="selectedPlaylist.name"
          :tracks="selectedPlaylist.tracks"
          :current="current"
          :playing="playing"
          :liked="liked"
          :playlists="playlists"
          removable
          editable
          deletable
          @play-list="playList"
          @like="toggleLike"
          @add-queue="addToQueue"
          @add-playlist="addToPlaylist"
          @remove="removeFromPlaylist"
          @rename="renamePlaylist"
          @delete="deletePlaylist"
        />
      </main>
    </div>

    <footer class="grid h-20 grid-cols-[1fr_2fr_1fr] items-center gap-4 px-2">
      <div class="flex min-w-0 items-center gap-3">
        <template v-if="current">
          <img :src="current.art" alt="" class="size-14 rounded" />
          <div class="min-w-0"><div class="truncate text-sm font-medium">{{ current.title }}</div><div class="truncate text-xs text-muted-foreground">{{ current.artist }}</div></div>
          <button aria-label="Like" @click="toggleLike(current)"><Heart :class="['size-4', isLiked(current) ? 'fill-primary text-primary' : 'text-muted-foreground']" /></button>
        </template>
      </div>
      <div class="flex flex-col items-center gap-1">
        <div class="flex items-center gap-5">
          <button aria-label="Shuffle" @click="shuffle = !shuffle"><Shuffle :class="['size-4', shuffle ? 'text-primary' : 'text-muted-foreground']" /></button>
          <button aria-label="Previous" @click="previousTrack"><SkipBack class="size-5 fill-current" /></button>
          <button :aria-label="playing ? 'Pause' : 'Play'" class="grid size-9 place-items-center rounded-full bg-foreground text-background transition hover:scale-105" @click="togglePlayback">
            <Pause v-if="playing" class="size-4 fill-current" />
            <Play v-else class="ml-0.5 size-4 fill-current" />
          </button>
          <button aria-label="Next" @click="nextTrack"><SkipForward class="size-5 fill-current" /></button>
          <button aria-label="Repeat" class="relative" @click="cycleRepeat">
            <Repeat :class="['size-4', repeat !== 'off' ? 'text-primary' : 'text-muted-foreground']" />
            <span v-if="repeat === 'one'" class="absolute -right-2 -top-2 text-[9px] text-primary">1</span>
          </button>
        </div>
        <div class="flex w-full max-w-xl items-center gap-2 text-xs text-muted-foreground">
          <span>{{ formatTime(time) }}</span>
          <input type="range" min="0" :max="duration" step="0.1" :value="time" class="flex-1 accent-primary" @input="seek" />
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
      <div class="flex items-center justify-end gap-2">
        <button aria-label="Queue" @click="view = { kind: 'queue' }"><ListMusic class="size-4 text-muted-foreground" /></button>
        <button aria-label="Mute" @click="muted = !muted"><VolumeX v-if="muted || volume === 0" class="size-4" /><Volume2 v-else class="size-4" /></button>
        <input v-model.number="volume" type="range" min="0" max="1" step="0.01" class="w-24 accent-primary" @input="muted = false" />
      </div>
    </footer>
  </div>
</template>
