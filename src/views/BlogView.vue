<template>
  <main class="social-feed-page">
    <TopBar />

    <div class="feed-container">
      <!-- Blog Filter & Search Section (Compressed & Dropdown) -->
      <section
        ref="filterSectionRef"
        class="blog-filter-section"
        :class="{ 'is-search-active': isSearchOpen || searchQuery.trim().length > 0 }"
      >
        <div class="filter-bar-row">
          <!-- Tag chips (horizontal scroll) -->
          <div class="tag-chips-scroll">
            <button
              type="button"
              class="tag-chip"
              :class="{ 'is-active': selectedTag === null }"
              @click="selectedTag = null"
            >
              All
            </button>
            <button
              v-for="tag in allTags"
              :key="tag"
              type="button"
              class="tag-chip"
              :class="{ 'is-active': selectedTag === tag }"
              @click="selectedTag = selectedTag === tag ? null : tag"
            >
              #{{ tag }}
            </button>
          </div>

          <!-- Search Trigger Button -->
          <button
            type="button"
            class="search-trigger-btn"
            :class="{ 'is-active': isSearchOpen, 'has-query': searchQuery.trim().length > 0 }"
            @click="toggleSearch"
            :aria-expanded="isSearchOpen"
            aria-label="Toggle search"
            :title="isSearchOpen ? 'Close search' : 'Search posts'"
          >
            <svg class="search-trigger-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span class="search-trigger-text">Search</span>
            <span v-if="searchQuery.trim()" class="search-indicator-dot" title="Filter active"></span>
          </button>
        </div>

        <!-- Search Dropdown Panel (Opens when search button is pressed) -->
        <transition name="search-dropdown">
          <div v-if="isSearchOpen" class="search-dropdown-container">
            <div class="search-input-wrapper">
              <div class="search-input-box">
                <svg class="search-dropdown-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref="searchInputRef"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search posts by keyword, title, tag..."
                  class="feed-search-input"
                  @keydown.enter.prevent
                  @keydown.esc="closeSearch"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  class="search-clear-btn"
                  @click="clearSearch"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ✕
                </button>
              </div>

              <button
                type="button"
                class="search-dismiss-btn"
                @click="closeSearch"
                aria-label="Close search"
                title="Close search"
              >
                Close
              </button>
            </div>

            <!-- Query feedback when searching -->
            <div v-if="searchQuery.trim()" class="search-results-info">
              <span>
                {{ filteredPosts.length }} {{ filteredPosts.length === 1 ? 'post' : 'posts' }} found
              </span>
              <button type="button" class="search-info-clear" @click="clearSearch">
                Clear
              </button>
            </div>
          </div>
        </transition>
      </section>

      <!-- Toast Feedback -->
      <transition name="fade">
        <div v-if="toastMessage" class="feed-toast" role="status">
          {{ toastMessage }}
        </div>
      </transition>

      <!-- Feed Posts Stream -->
      <div v-if="loading" class="feed-stream">
        <div v-for="n in 3" :key="n" class="skeleton-post-card">
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
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredPosts.length === 0" class="empty-feed-card">
        <div class="empty-emoji">💬</div>
        <h3>No posts found</h3>
        <p v-if="searchQuery || selectedTag">
          Try clearing your search or selecting another topic.
        </p>
        <p v-else>New posts are currently in the works. Check back soon!</p>
        <button
          v-if="searchQuery || selectedTag"
          type="button"
          class="reset-filters-btn"
          @click="resetFilters"
        >
          Reset filters
        </button>
      </div>

      <!-- Posts List -->
      <div v-else class="feed-stream">
        <article
          v-for="post in filteredPosts"
          :key="post.id"
          :id="`post-${post.id}`"
          class="social-post-card"
        >
          <!-- Post Author Header -->
          <header class="post-header">
            <div class="post-header-left">
              <div class="post-author-meta">
                <div class="author-name-line">
                  <span class="author-name">{{ post.author || 'Olimjon Makhmudov' }}</span>
                  <span class="verified-icon" title="Verified">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.41-1.41 2.09 2.09 5.69-5.69 1.41 1.41-7.1 7.1z"/>
                    </svg>
                  </span>
                  <span class="author-handle">@mkhdov</span>
                  <span class="meta-dot">·</span>
                  <time
                    :datetime="displayDate(post)"
                    class="post-time"
                    :title="formatFullDate(displayDate(post))"
                  >
                    {{ timeAgo(displayDate(post)) }}
                  </time>
                </div>
              </div>
            </div>

            <!-- Share / Direct Link dropdown -->
            <div class="post-header-actions">
              <button
                type="button"
                class="post-action-icon-btn"
                title="Copy post link"
                @click="copyPostLink(post)"
                aria-label="Copy link to post"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </button>
            </div>
          </header>

          <!-- Post Topic / Headline (if distinct from content) -->
          <h2
            v-if="shouldShowHeadline(post)"
            class="post-headline"
            @click="toggleExpand(post.id)"
          >
            {{ post.title }}
          </h2>

          <!-- Post Body Content -->
          <div class="post-body">
            <div
              class="post-text prose-content"
              v-html="getRenderedContent(post)"
            ></div>

            <button
              v-if="isLongPost(post)"
              type="button"
              class="see-more-btn"
              @click="toggleExpand(post.id)"
            >
              {{ expandedPosts[post.id] ? 'Show less' : '…see more' }}
            </button>
          </div>

          <!-- Media Attachment: Image Carousel / Single Photo -->
          <ImageCarousel
            v-if="post.image_urls && post.image_urls.length"
            :images="post.image_urls"
            :alt="post.title"
            @open-lightbox="(idx) => openCarouselLightbox(post.image_urls, idx, post.title)"
          />

          <!-- Media Attachment: Video Player -->
          <div v-if="post.video_url" class="post-video-attachment">
            <VideoPlayer :src="post.video_url" :title="post.title" />
          </div>

          <!-- Audio / Voice Note Attachment (Telegram-style) -->
          <div v-if="post.audio_url" class="post-audio-attachment">
            <AudioPlayer :src="post.audio_url" :title="post.title" />
          </div>

          <!-- Post Hashtags -->
          <div v-if="post.tags && post.tags.length" class="post-tags-row">
            <button
              v-for="tag in post.tags"
              :key="tag"
              type="button"
              class="post-tag-pill"
              @click="selectedTag = tag"
            >
              #{{ tag }}
            </button>
          </div>

          <!-- Post Action Bar (Social stats & toggles) -->
          <footer class="post-footer">
            <div class="footer-reactions-wrap">
              <PostReactions :postId="post.id" postType="blog" :compact="true" />
            </div>

            <div class="footer-actions-wrap">
              <!-- Comment Toggle Button -->
              <button
                type="button"
                class="feed-action-btn"
                :class="{ 'is-open': openCommentsPostId === post.id }"
                @click="toggleComments(post.id)"
                :title="openCommentsPostId === post.id ? 'Close comments' : 'View discussion'"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>
                  {{ commentCounts[post.id] ? `${commentCounts[post.id]} comments` : 'Comment' }}
                </span>
              </button>

              <!-- Share Button -->
              <button
                type="button"
                class="feed-action-btn"
                @click="sharePost(post)"
                title="Share this post"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                <span>Share</span>
              </button>

              <!-- Permalink Route -->
              <router-link
                :to="postUrl(post)"
                class="feed-action-btn permalink-btn"
                title="Open post in dedicated view"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </router-link>
            </div>
          </footer>

          <!-- Inline Discussion Section -->
          <transition name="expand">
            <div v-if="openCommentsPostId === post.id" class="inline-comments-section">
              <div class="inline-comments-header">
                <span class="inline-comments-title">Discussion &amp; Comments</span>
                <button
                  type="button"
                  class="close-inline-comments-btn"
                  @click="openCommentsPostId = null"
                >
                  ✕ Close
                </button>
              </div>
              <PostComments
                :postId="post.id"
                postType="blog"
                :postTitle="post.title"
              />
            </div>
          </transition>
        </article>
      </div>
    </div>

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
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import TopBar from '../components/TopBar.vue'
import AudioPlayer from '../components/AudioPlayer.vue'
import VideoPlayer from '../components/VideoPlayer.vue'
import ImageCarousel from '../components/ImageCarousel.vue'
import PostReactions from '../components/PostReactions.vue'
import PostComments from '../components/PostComments.vue'
import {
  type BlogPost,
  displayDate,
  fetchPublishedPosts,
  fetchCommentCounts,
  formatFullDate,
  timeAgo,
} from '../lib/blog'

const posts = ref<BlogPost[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedTag = ref<string | null>(null)
const isSearchOpen = ref(false)
const filterSectionRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const expandedPosts = ref<Record<string, boolean>>({})
const openCommentsPostId = ref<string | null>(null)
const commentCounts = ref<Record<string, number>>({})
const toastMessage = ref('')
const lightboxImages = ref<string[]>([])
const lightboxIndex = ref(0)
const lightboxAlt = ref('')

const currentLightboxImage = computed(() => {
  return lightboxImages.value[lightboxIndex.value] || null
})

function toggleSearch() {
  isSearchOpen.value = !isSearchOpen.value
  if (isSearchOpen.value) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

function closeSearch() {
  isSearchOpen.value = false
}

function clearSearch() {
  searchQuery.value = ''
  nextTick(() => {
    searchInputRef.value?.focus()
  })
}

function handleClickOutside(event: MouseEvent) {
  if (
    isSearchOpen.value &&
    filterSectionRef.value &&
    !filterSectionRef.value.contains(event.target as Node)
  ) {
    isSearchOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleLightboxKeydown)
  posts.value = await fetchPublishedPosts()
  loading.value = false

  if (posts.value.length) {
    const ids = posts.value.map((p) => p.id)
    commentCounts.value = await fetchCommentCounts(ids)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleLightboxKeydown)
})

// Extract all unique tags
const allTags = computed(() => {
  const set = new Set<string>()
  for (const post of posts.value) {
    if (Array.isArray(post.tags)) {
      for (const t of post.tags) {
        if (t && typeof t === 'string' && t.trim()) set.add(t.trim())
      }
    }
  }
  return Array.from(set)
})

// Filter posts by search query and tag
const filteredPosts = computed(() => {
  let list = posts.value
  if (selectedTag.value) {
    list = list.filter((p) => p.tags?.includes(selectedTag.value!))
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((p) => {
      const matchTitle = p.title?.toLowerCase().includes(q)
      const matchContent = p.content?.toLowerCase().includes(q)
      const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q))
      return matchTitle || matchContent || matchTags
    })
  }
  return list
})

function resetFilters() {
  searchQuery.value = ''
  selectedTag.value = null
  isSearchOpen.value = false
}

function postUrl(post: BlogPost) {
  return `/blog/${post.slug || post.id}`
}

function isLongPost(post: BlogPost) {
  const raw = (post.content || '').replace(/<[^>]+>/g, ' ').trim()
  return raw.length > 360
}

function toggleExpand(id: string) {
  expandedPosts.value[id] = !expandedPosts.value[id]
}

function toggleComments(id: string) {
  openCommentsPostId.value = openCommentsPostId.value === id ? null : id
}

function shouldShowHeadline(post: BlogPost): boolean {
  if (!post.title) return false
  const t = post.title.trim().toLowerCase()
  if (t === 'untitled' || t.startsWith('post update') || t === 'blog post') return false
  // Check if content begins with this title to avoid duplication
  const raw = (post.content || '').replace(/<[^>]+>/g, '').trim().toLowerCase()
  if (raw.startsWith(t.slice(0, 30))) return false
  return true
}

function getRenderedContent(post: BlogPost) {
  const isExpanded = Boolean(expandedPosts.value[post.id])
  const html = post.content || ''

  if (!isLongPost(post) || isExpanded) {
    return formatContentHtml(html)
  }

  // Truncate cleanly for collapsed preview
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const truncated = plain.slice(0, 320).trim()
  return `<p>${escapeHtml(truncated)}</p>`
}

function formatContentHtml(html: string): string {
  if (!html) return ''
  // If it's already rich HTML with paragraph tags, return with hashtag highlights
  if (html.includes('<p>') || html.includes('<div>') || html.includes('<br>')) {
    return highlightHashtags(html)
  }
  // Otherwise wrap plain text lines in paragraphs
  const paragraphs = html
    .split(/\n\s*\n/)
    .map((p) => `<p>${highlightHashtags(escapeHtml(p.trim()))}</p>`)
    .join('')
  return paragraphs
}

function highlightHashtags(str: string): string {
  // Turn #hashtag into styled spans
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

async function copyPostLink(post: BlogPost) {
  const url = `${window.location.origin}/blog/${post.slug || post.id}`
  try {
    await navigator.clipboard.writeText(url)
    showToast('Link copied to clipboard!')
  } catch {
    showToast(`Link: ${url}`)
  }
}

async function sharePost(post: BlogPost) {
  const url = `${window.location.origin}/blog/${post.slug || post.id}`
  if (navigator.share) {
    try {
      await navigator.share({
        title: post.title || 'Post by Olimjon Makhmudov',
        text: post.content?.slice(0, 100) || '',
        url,
      })
      return
    } catch {
      // fallback to copy
    }
  }
  await copyPostLink(post)
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
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.social-feed-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #1e293b;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding-bottom: 80px;
}

.feed-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 100px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Compressed Blog Filter & Search Section ───────────── */
.blog-filter-section {
  background: #ffffff;
  border: 1px solid rgba(108, 99, 255, 0.15);
  border-radius: 16px;
  padding: 8px 12px;
  box-shadow: 0 2px 10px rgba(108, 99, 255, 0.04);
  transition: all 0.2s ease;
  position: relative;
}

.blog-filter-section:hover,
.blog-filter-section.is-search-active {
  border-color: rgba(108, 99, 255, 0.28);
  box-shadow: 0 4px 18px rgba(108, 99, 255, 0.08);
}

.filter-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

/* Tag Chips Horizontal Scroll */
.tag-chips-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 2px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
  min-width: 0;
}

.tag-chips-scroll::-webkit-scrollbar {
  display: none;
}

.tag-chip {
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.tag-chip:hover {
  border-color: #6c63ff;
  color: #6c63ff;
  background: #ffffff;
}

.tag-chip.is-active {
  background: #6c63ff;
  border-color: #6c63ff;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.25);
}

/* Search Trigger Button */
.search-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  position: relative;
}

.search-trigger-btn:hover {
  background: #ffffff;
  border-color: #6c63ff;
  color: #6c63ff;
}

.search-trigger-btn.is-active {
  background: rgba(108, 99, 255, 0.1);
  border-color: #6c63ff;
  color: #6c63ff;
}

.search-trigger-btn.has-query {
  border-color: #6c63ff;
  color: #6c63ff;
  font-weight: 700;
}

.search-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6c63ff;
  box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.25);
  display: inline-block;
}

/* Search Dropdown Panel (Opens on button press) */
.search-dropdown-container {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.search-dropdown-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.18s ease;
}

.search-input-box:focus-within .search-dropdown-icon {
  color: #6c63ff;
}

.feed-search-input {
  width: 100%;
  height: 38px;
  padding: 0 34px 0 36px;
  font-family: inherit;
  font-size: 0.88rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

.feed-search-input:focus {
  background: #ffffff;
  border-color: #6c63ff;
  box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.12);
}

.feed-search-input::placeholder {
  color: #94a3b8;
  font-size: 0.85rem;
}

.search-clear-btn {
  position: absolute;
  right: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #64748b;
  font-size: 11px;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.search-clear-btn:hover {
  background: #cbd5e1;
  color: #0f172a;
}

.search-dismiss-btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-dismiss-btn:hover {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}

.search-results-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #64748b;
  padding: 2px 4px 0;
}

.search-info-clear {
  background: transparent;
  border: none;
  color: #6c63ff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.search-info-clear:hover {
  color: #5548e0;
}

/* Dropdown Animation */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 120px;
  opacity: 1;
  overflow: hidden;
}

.search-dropdown-enter-from,
.search-dropdown-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  transform: translateY(-4px);
}

/* ── Feed Stream ────────────────────────────────────────── */
.feed-stream {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Social Post Card ───────────────────────────────────── */
.social-post-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.social-post-card:hover {
  border-color: rgba(108, 99, 255, 0.25);
  box-shadow: 0 4px 18px rgba(108, 99, 255, 0.06);
}

/* ── Post Header ────────────────────────────────────────── */
.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.post-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #e2e8f0;
}

.post-author-meta {
  display: flex;
  flex-direction: column;
}

.author-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.author-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.verified-icon {
  color: #6c63ff;
  display: inline-flex;
}

.author-handle {
  font-size: 0.85rem;
  color: #64748b;
}

.meta-dot {
  color: #94a3b8;
  font-size: 0.8rem;
}

.post-time {
  font-size: 0.82rem;
  color: #64748b;
  cursor: default;
}

.post-action-icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: color 0.15s, background 0.15s;
}

.post-action-icon-btn:hover {
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.08);
}

/* ── Post Headline / Topic ──────────────────────────────── */
.post-headline {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.12rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  margin: 0 0 10px;
}

/* ── Post Text Body ─────────────────────────────────────── */
.post-body {
  margin-bottom: 14px;
}

.post-text {
  font-size: 0.98rem;
  line-height: 1.62;
  color: #1e293b;
  word-break: break-word;
}

.post-text :deep(p) {
  margin: 0 0 10px;
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

.see-more-btn {
  background: transparent;
  border: none;
  color: #6c63ff;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0 0;
}

.see-more-btn:hover {
  text-decoration: underline;
}

/* ── Media Attachment ───────────────────────────────────── */
.post-media-attachment {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  margin-bottom: 14px;
  background: #0f172a;
  cursor: pointer;
  max-height: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attachment-img {
  width: 100%;
  height: auto;
  max-height: 440px;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}

.post-media-attachment:hover .attachment-img {
  transform: scale(1.01);
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

/* ── Video Attachment ───────────────────────────────────── */
.post-video-attachment {
  margin-bottom: 14px;
}

/* ── Audio Attachment ───────────────────────────────────── */
.post-audio-attachment {
  margin-bottom: 14px;
}

/* ── Hashtags Row ───────────────────────────────────────── */
.post-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.post-tag-pill {
  background: rgba(108, 99, 255, 0.06);
  border: 1px solid rgba(108, 99, 255, 0.15);
  color: #6c63ff;
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.post-tag-pill:hover {
  background: #6c63ff;
  color: #ffffff;
}

/* ── Footer & Social Action Bar ─────────────────────────── */
.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
  margin-top: 6px;
  gap: 10px;
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
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.feed-action-btn:hover {
  background: #f8fafc;
  color: #6c63ff;
  border-color: rgba(108, 99, 255, 0.25);
}

.feed-action-btn.is-open {
  background: rgba(108, 99, 255, 0.08);
  border-color: #6c63ff;
  color: #6c63ff;
}

.permalink-btn {
  padding: 6px 9px;
}

/* ── Inline Comments Section ────────────────────────────── */
.inline-comments-section {
  border-top: 1px solid #e2e8f0;
  margin-top: 16px;
  padding-top: 18px;
}

.inline-comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.inline-comments-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.close-inline-comments-btn {
  background: transparent;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-inline-comments-btn:hover {
  background: #f1f5f9;
  color: #ef4444;
}

/* ── Skeleton Loading ───────────────────────────────────── */
.skeleton-post-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 20px;
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
  width: 44px;
  height: 44px;
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
  height: 160px;
  border-radius: 12px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* ── Empty State ────────────────────────────────────────── */
.empty-feed-card {
  text-align: center;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  padding: 48px 24px;
}

.empty-emoji {
  font-size: 2.4rem;
  margin-bottom: 12px;
}

.empty-feed-card h3 {
  font-size: 1.2rem;
  color: #0f172a;
  margin-bottom: 6px;
}

.empty-feed-card p {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 18px;
}

.reset-filters-btn {
  background: #6c63ff;
  color: #ffffff;
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}

/* ── Toast Feedback ─────────────────────────────────────── */
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
  z-index: 1060;
  transition: background 0.18s ease;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-counter-badge {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.75);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1060;
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.7);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 1060;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.lightbox-nav-btn:hover {
  background: #6c63ff;
  border-color: #6c63ff;
  transform: translateY(-50%) scale(1.1);
}

.lightbox-prev {
  left: 20px;
}

.lightbox-next {
  right: 20px;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

/* ── Transitions ────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .feed-container {
    padding: 80px 12px 30px;
  }
  .blog-filter-section {
    padding: 6px 10px;
    border-radius: 14px;
  }
  .search-trigger-btn {
    padding: 0 10px;
    height: 30px;
    font-size: 0.78rem;
  }
  .tag-chip {
    padding: 4px 10px;
    font-size: 0.76rem;
  }
  .feed-search-input {
    height: 36px;
    font-size: 0.84rem;
  }
  .search-dismiss-btn {
    height: 36px;
    padding: 0 10px;
    font-size: 0.78rem;
  }
  .social-post-card {
    padding: 16px;
  }
  .post-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .footer-actions-wrap {
    justify-content: space-between;
  }
}
</style>
