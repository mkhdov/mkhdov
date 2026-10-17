<template>
  <main class="focused-post-page">
    <TopBar />

    <div class="focused-container">
      <!-- Back to Feed Nav -->
      <nav class="back-nav" aria-label="Breadcrumb">
        <router-link to="/blog" class="back-feed-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          <span>Back to Feed</span>
        </router-link>
      </nav>

      <!-- Loading State -->
      <div v-if="loading" class="skeleton-focused-card">
        <div class="skeleton-header">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-user-info">
            <div class="skeleton-line w40"></div>
            <div class="skeleton-line w25"></div>
          </div>
        </div>
        <div class="skeleton-content">
          <div class="skeleton-line w90"></div>
          <div class="skeleton-line w80"></div>
          <div class="skeleton-line w60"></div>
        </div>
        <div class="skeleton-media"></div>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!post" class="empty-focused-card">
        <div class="empty-icon">🔍</div>
        <h2>Post not found</h2>
        <p>This post may have been removed or the link might be incorrect.</p>
        <router-link to="/blog" class="return-feed-btn">Return to Feed</router-link>
      </div>

      <!-- Focused Post Card -->
      <template v-else>
        <article class="focused-post-card">
          <!-- Post Author Header -->
          <header class="post-header">
            <div class="post-header-left">
              <img src="/portrait.png" alt="Olimjon Makhmudov" class="post-author-avatar" />
              <div class="post-author-meta">
                <div class="author-name-line">
                  <span class="author-name">{{ post.author || 'Olimjon Makhmudov' }}</span>
                  <span class="verified-icon" title="Verified Creator">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.41-1.41 2.09 2.09 5.69-5.69 1.41 1.41-7.1 7.1z"/>
                    </svg>
                  </span>
                  <span class="author-handle">@mkhdov</span>
                </div>
                <time class="post-timestamp" :datetime="displayDate(post)">
                  {{ formatFullDate(displayDate(post)) }} ({{ timeAgo(displayDate(post)) }})
                </time>
              </div>
            </div>

            <!-- Share Button -->
            <button
              type="button"
              class="post-action-icon-btn"
              title="Copy post link"
              @click="copyPostLink"
              aria-label="Copy link to post"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
          </header>

          <!-- Headline / Topic if present -->
          <h1 v-if="shouldShowHeadline(post)" class="focused-headline">
            {{ post.title }}
          </h1>

          <!-- Post Content (Full, un-truncated) -->
          <div class="focused-body">
            <div class="post-text prose-content" v-html="renderedContent"></div>
          </div>

          <!-- Attached Image(s) (Instagram Carousel / Single Photo) -->
          <ImageCarousel
            v-if="post.image_urls && post.image_urls.length"
            :images="post.image_urls"
            :alt="post.title"
            @open-lightbox="(idx) => openCarouselLightbox(post.image_urls, idx, post.title)"
          />

          <!-- Attached Video Player -->
          <div v-if="post.video_url" class="post-video-attachment">
            <VideoPlayer :src="post.video_url" :title="post.title" />
          </div>

          <!-- Attached Audio / Voice Note -->
          <div v-if="post.audio_url" class="post-audio-attachment">
            <AudioPlayer :src="post.audio_url" :title="post.title" />
          </div>

          <!-- Tags / Hashtags -->
          <div v-if="post.tags && post.tags.length" class="post-tags-row">
            <router-link
              v-for="tag in post.tags"
              :key="tag"
              :to="{ path: '/blog', query: { tag } }"
              class="post-tag-pill"
            >
              #{{ tag }}
            </router-link>
          </div>

          <!-- Action bar -->
          <footer class="post-footer">
            <div class="footer-reactions-wrap">
              <PostReactions :postId="post.id" postType="blog" :compact="true" />
            </div>

            <div class="footer-actions-wrap">
              <button type="button" class="feed-action-btn" @click="sharePost">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span>Share</span>
              </button>
            </div>
          </footer>
        </article>

        <!-- Comments & Discussion (Always open in focused post view) -->
        <section class="focused-comments-wrap">
          <PostComments :postId="post.id" postType="blog" :postTitle="post.title" />
        </section>
      </template>
    </div>

    <!-- Toast Notification -->
    <transition name="fade">
      <div v-if="toastMessage" class="feed-toast" role="status">
        {{ toastMessage }}
      </div>
    </transition>

    <!-- Image Lightbox Modal (Supports Carousel Navigation) -->
    <transition name="fade">
      <div
        v-if="currentLightboxImage"
        class="lightbox-overlay"
        @click="closeLightbox"
      >
        <button type="button" class="lightbox-close" aria-label="Close image" @click="closeLightbox">✕</button>

        <div v-if="lightboxImages.length > 1" class="lightbox-counter-badge">
          {{ lightboxIndex + 1 }} / {{ lightboxImages.length }}
        </div>

        <button
          v-if="lightboxImages.length > 1 && lightboxIndex > 0"
          type="button"
          class="lightbox-nav-btn lightbox-prev"
          aria-label="Previous image"
          @click.stop="prevLightboxImage"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <img
          :key="currentLightboxImage"
          :src="currentLightboxImage"
          :alt="lightboxAlt"
          class="lightbox-image"
          @click.stop
        />

        <button
          v-if="lightboxImages.length > 1 && lightboxIndex < lightboxImages.length - 1"
          type="button"
          class="lightbox-nav-btn lightbox-next"
          aria-label="Next image"
          @click.stop="nextLightboxImage"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </transition>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import AudioPlayer from '../components/AudioPlayer.vue'
import VideoPlayer from '../components/VideoPlayer.vue'
import ImageCarousel from '../components/ImageCarousel.vue'
import PostReactions from '../components/PostReactions.vue'
import PostComments from '../components/PostComments.vue'
import {
  type BlogPost,
  displayDate,
  fetchPublishedPost,
  formatFullDate,
  timeAgo,
} from '../lib/blog'

const route = useRoute()
const post = ref<BlogPost | null>(null)
const loading = ref(true)
const toastMessage = ref('')
const lightboxImages = ref<string[]>([])
const lightboxIndex = ref(0)
const lightboxAlt = ref('')

const currentLightboxImage = computed(() => {
  return lightboxImages.value[lightboxIndex.value] || null
})

const slugOrId = computed(() => {
  const param = route.params.slug
  return Array.isArray(param) ? param[0] : param
})

onMounted(() => {
  window.addEventListener('keydown', handleLightboxKeydown)
  loadPost()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleLightboxKeydown)
})

watch(slugOrId, loadPost)

async function loadPost() {
  if (!slugOrId.value) return
  loading.value = true
  post.value = await fetchPublishedPost(slugOrId.value)
  loading.value = false
}

function openCarouselLightbox(images: string[], index = 0, alt?: string) {
  lightboxImages.value = images
  lightboxIndex.value = index
  lightboxAlt.value = alt || 'Attached media'
}

function closeLightbox() {
  lightboxImages.value = []
  lightboxIndex.value = 0
}

function prevLightboxImage() {
  if (lightboxIndex.value > 0) {
    lightboxIndex.value--
  }
}

function nextLightboxImage() {
  if (lightboxIndex.value < lightboxImages.value.length - 1) {
    lightboxIndex.value++
  }
}

function handleLightboxKeydown(e: KeyboardEvent) {
  if (!lightboxImages.value.length) return
  if (e.key === 'Escape') {
    closeLightbox()
  } else if (e.key === 'ArrowLeft') {
    prevLightboxImage()
  } else if (e.key === 'ArrowRight') {
    nextLightboxImage()
  }
}

function shouldShowHeadline(item: BlogPost): boolean {
  if (!item.title) return false
  const t = item.title.trim().toLowerCase()
  if (t === 'untitled' || t.startsWith('post update') || t === 'blog post') return false
  const raw = (item.content || '').replace(/<[^>]+>/g, '').trim().toLowerCase()
  if (raw.startsWith(t.slice(0, 30))) return false
  return true
}

const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  const html = post.value.content
  if (html.includes('<p>') || html.includes('<div>') || html.includes('<br>')) {
    return highlightHashtags(html)
  }
  return html
    .split(/\n\s*\n/)
    .map((p) => `<p>${highlightHashtags(escapeHtml(p.trim()))}</p>`)
    .join('')
})

function highlightHashtags(str: string): string {
  return str.replace(/(^|\s)(#[a-zA-Z0-9_\u0080-\uffff]+)/g, '$1<span class="inline-hashtag">$2</span>')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function showToast(msg: string) {
  toastMessage.value = msg
  setTimeout(() => {
    toastMessage.value = ''
  }, 2600)
}

async function copyPostLink() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    showToast('Post link copied to clipboard!')
  } catch {
    showToast(`Link: ${url}`)
  }
}

async function sharePost() {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({
        title: post.value?.title || 'Post by Olimjon Makhmudov',
        text: post.value?.content?.slice(0, 100) || '',
        url,
      })
      return
    } catch {
      // fallback
    }
  }
  await copyPostLink()
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.focused-post-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #1e293b;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding-bottom: 80px;
}

.focused-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 100px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Back Navigation ────────────────────────────────────── */
.back-nav {
  margin-bottom: 4px;
}

.back-feed-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6c63ff;
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(108, 99, 255, 0.08);
  transition: all 0.15s ease;
}

.back-feed-link:hover {
  background: rgba(108, 99, 255, 0.15);
  transform: translateX(-2px);
}

/* ── Focused Post Card ──────────────────────────────────── */
.focused-post-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.05);
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.post-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #6c63ff;
}

.post-author-meta {
  display: flex;
  flex-direction: column;
}

.author-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.author-name {
  font-size: 1.02rem;
  font-weight: 700;
  color: #0f172a;
}

.verified-icon {
  color: #6c63ff;
  display: inline-flex;
}

.author-handle {
  font-size: 0.88rem;
  color: #64748b;
}

.post-timestamp {
  font-size: 0.82rem;
  color: #64748b;
  margin-top: 2px;
}

.post-action-icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}

.post-action-icon-btn:hover {
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.08);
}

/* ── Post Headline ──────────────────────────────────────── */
.focused-headline {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  margin: 0 0 14px;
}

/* ── Body ───────────────────────────────────────────────── */
.focused-body {
  margin-bottom: 16px;
}

.post-text {
  font-size: 1.02rem;
  line-height: 1.68;
  color: #1e293b;
  word-break: break-word;
}

.post-text :deep(p) {
  margin: 0 0 12px;
}

.post-text :deep(p:last-child) {
  margin-bottom: 0;
}

.post-text :deep(a) {
  color: #6c63ff;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.post-text :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 0.88em;
  color: #6c63ff;
}

.post-text :deep(.inline-hashtag) {
  color: #6c63ff;
  font-weight: 600;
}

/* ── Media ──────────────────────────────────────────────── */
.post-media-attachment {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  background: #0f172a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attachment-img {
  width: 100%;
  height: auto;
  max-height: 520px;
  object-fit: cover;
  display: block;
}

.media-zoom-hint {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.6);
  color: #ffffff;
  display: grid;
  place-items: center;
  backdrop-filter: blur(4px);
}

.post-audio-attachment {
  margin-bottom: 16px;
}

.post-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.post-tag-pill {
  background: rgba(108, 99, 255, 0.06);
  border: 1px solid rgba(108, 99, 255, 0.15);
  color: #6c63ff;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}

.post-tag-pill:hover {
  background: #6c63ff;
  color: #ffffff;
}

/* ── Footer ─────────────────────────────────────────────── */
.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
  margin-top: 8px;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-reactions-wrap {
  display: flex;
  align-items: center;
}

.footer-actions-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feed-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.feed-action-btn:hover {
  background: #f8fafc;
  color: #6c63ff;
  border-color: rgba(108, 99, 255, 0.25);
}

/* ── Focused Comments ───────────────────────────────────── */
.focused-comments-wrap {
  margin-top: 8px;
}

/* ── Skeleton ───────────────────────────────────────────── */
.skeleton-focused-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

.skeleton-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  animation: pulse 1.5s infinite;
}

.skeleton-line.w25 { width: 25%; }
.skeleton-line.w40 { width: 40%; }
.skeleton-line.w60 { width: 60%; }
.skeleton-line.w80 { width: 80%; }
.skeleton-line.w90 { width: 90%; }

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-media {
  height: 220px;
  border-radius: 12px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* ── Empty ──────────────────────────────────────────────── */
.empty-focused-card {
  text-align: center;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 20px;
  padding: 56px 24px;
}

.empty-icon {
  font-size: 2.6rem;
  margin-bottom: 12px;
}

.empty-focused-card h2 {
  font-size: 1.3rem;
  color: #0f172a;
  margin-bottom: 6px;
}

.empty-focused-card p {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 20px;
}

.return-feed-btn {
  display: inline-block;
  background: #6c63ff;
  color: #ffffff;
  text-decoration: none;
  border-radius: 999px;
  padding: 9px 22px;
  font-weight: 600;
  font-size: 0.9rem;
}

/* ── Toast ──────────────────────────────────────────────── */
.feed-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

/* ── Lightbox Overlay ───────────────────────────────────── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  z-index: 1050;
  display: grid;
  place-items: center;
  padding: 20px;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 24px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #ffffff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .focused-container {
    padding: 80px 12px 30px;
  }
  .focused-post-card {
    padding: 18px;
  }
  .post-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .footer-actions-wrap {
    justify-content: flex-end;
  }
}
</style>
