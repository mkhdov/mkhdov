<template>
  <main class="social-feed-page">
    <TopBar />

    <div class="feed-container">
      <!-- Channel / Profile Card (Social Header) -->
      <section class="channel-card">

        <!-- Search & Filter Controls -->
        <div class="channel-filter-bar">
          <div class="search-input-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search posts or topics..."
              class="feed-search-input"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="search-clear-btn"
              @click="searchQuery = ''"
              aria-label="Clear search"
            >
              ✕
            </button>
          </div>

          <div v-if="allTags.length" class="tag-chips-scroll">
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
        </div>
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
              <img src="../assets/mkhdov.png" alt="Olimjon Makhmudov" class="post-author-avatar" />
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

          <!-- Media Attachment: Image -->
          <div
            v-if="post.cover_image_url"
            class="post-media-attachment"
            @click="openLightbox(post.cover_image_url, post.title)"
          >
            <img
              :src="post.cover_image_url"
              :alt="post.title"
              loading="lazy"
              class="attachment-img"
            />
            <span class="media-zoom-hint">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </span>
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

    <!-- Image Lightbox Modal -->
    <transition name="fade">
      <div v-if="lightboxImg" class="lightbox-overlay" @click="lightboxImg = null">
        <button type="button" class="lightbox-close" aria-label="Close image">✕</button>
        <img :src="lightboxImg" :alt="lightboxAlt" class="lightbox-image" @click.stop />
      </div>
    </transition>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TopBar from '../components/TopBar.vue'
import AudioPlayer from '../components/AudioPlayer.vue'
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
const expandedPosts = ref<Record<string, boolean>>({})
const openCommentsPostId = ref<string | null>(null)
const commentCounts = ref<Record<string, number>>({})
const toastMessage = ref('')
const lightboxImg = ref<string | null>(null)
const lightboxAlt = ref('')

onMounted(async () => {
  posts.value = await fetchPublishedPosts()
  loading.value = false

  if (posts.value.length) {
    const ids = posts.value.map((p) => p.id)
    commentCounts.value = await fetchCommentCounts(ids)
  }
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

function openLightbox(url: string, alt?: string) {
  lightboxImg.value = url
  lightboxAlt.value = alt || 'Attached media'
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

/* ── Channel Header Card ────────────────────────────────── */
.channel-card {
  background: #ffffff;
  border: 1px solid rgba(108, 99, 255, 0.15);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.05);
}

.channel-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.channel-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #6c63ff;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.2);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.channel-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.channel-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.channel-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.verified-badge {
  color: #6c63ff;
  display: inline-flex;
  align-items: center;
}

.channel-handle {
  font-size: 0.88rem;
  color: #64748b;
  margin: 0;
}

.channel-bio {
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.5;
  margin: 0 0 18px;
}

/* ── Filter Bar ─────────────────────────────────────────── */
.channel-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.feed-search-input {
  width: 100%;
  padding: 10px 36px 10px 40px;
  font-family: inherit;
  font-size: 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
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

.search-clear-btn {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  cursor: pointer;
}

.tag-chips-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.tag-chip {
  padding: 5px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
}

.tag-chip:hover {
  border-color: #6c63ff;
  color: #6c63ff;
}

.tag-chip.is-active {
  background: #6c63ff;
  border-color: #6c63ff;
  color: #ffffff;
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
  .channel-card {
    padding: 18px;
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
