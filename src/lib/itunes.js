export const SHELVES = ['Top hits 2026', 'Chill lofi', 'Afrobeats', 'Rock classics', 'Hip hop', 'Jazz']

export async function searchItunes(term, limit = 24) {
  const response = await fetch(
    `https://itunes.apple.com/search?media=music&entity=song&limit=${limit}&term=${encodeURIComponent(term)}`,
  )
  if (!response.ok) throw new Error(`iTunes: ${response.status}`)
  const data = await response.json()
  return data.results.filter((item) => item.previewUrl).map((item) => ({
    id: item.trackId,
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    art: item.artworkUrl100.replace('100x100', '300x300'),
    src: item.previewUrl,
    duration: 30,
  }))
}

export function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
