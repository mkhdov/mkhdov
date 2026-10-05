<template>
  <div class="audio-player-wrapper">
    <audio ref="audioRef" :src="src" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" @ended="isPlaying = false"></audio>
    <div class="audio-player">
      <button class="play-btn" @click="togglePlay" aria-label="Play/Pause">
        <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      </button>

      <div class="progress-container">
        <div class="track-info">
          <span class="title">Listen to this article</span>
          <span class="time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>
        <input 
          type="range" 
          class="progress-slider" 
          :min="0" 
          :max="duration || 100" 
          :value="currentTime"
          @input="onSeek"
        />
      </div>
      
      <button class="share-btn" @click="shareAudio" aria-label="Share Audio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  src: string
  title?: string
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

function togglePlay() {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play().catch(e => console.error(e))
  }
  isPlaying.value = !isPlaying.value
}

function onTimeUpdate() {
  if (!audioRef.value) return
  currentTime.value = audioRef.value.currentTime
}

function onLoadedMetadata() {
  if (!audioRef.value) return
  duration.value = audioRef.value.duration
}

function onSeek(event: Event) {
  const input = event.target as HTMLInputElement
  if (!audioRef.value) return
  audioRef.value.currentTime = Number(input.value)
  currentTime.value = Number(input.value)
}

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function shareAudio() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.title || 'Audio track',
        text: 'Listen to this awesome track!',
        url: window.location.href, // Sharing the current page containing the audio
      })
    } catch (err) {
      console.error('Error sharing', err)
    }
  } else {
    // Fallback
    await navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard to share!')
  }
}
</script>

<style scoped>
.audio-player-wrapper {
  margin: 32px 0;
  width: 100%;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.9));
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(12px);
}

.play-btn {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #6c63ff;
  color: white;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s, background 0.2s;
}

.play-btn:hover {
  transform: scale(1.05);
  background: #5a52d5;
}

.progress-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.track-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.time {
  color: #64748b;
  font-size: 13px;
}

.progress-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #6c63ff;
  cursor: pointer;
  transition: transform 0.1s;
}

.progress-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.share-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(108, 99, 255, 0.2);
  background: transparent;
  color: #6c63ff;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  background: rgba(108, 99, 255, 0.1);
}
</style>
