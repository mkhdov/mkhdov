<template>
  <main class="blog-post-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!post" class="empty-state">
      <h1>Post not found</h1>
      <router-link to="/blog" class="back-link">Back to blog</router-link>
    </div>

    <template v-else>
      <section class="post-hero">
        <router-link to="/blog" class="back-link">Back to blog</router-link>
        <div class="hero-meta">
          <span>{{ post.author || 'Olimjon Makhmudov' }}</span>
          <span>Published {{ formatDate(displayDate(post)) }}</span>
          <span>Updated {{ formatDate(updatedDate(post)) }}</span>
          <span>{{ readingMinutes(post) }} min read</span>
        </div>
        <h1>{{ post.title }}</h1>
        <p v-if="postExcerpt(post)" class="post-excerpt">{{ postExcerpt(post, 220) }}</p>
        <div v-if="post.tags?.length" class="tag-row">
          <span v-for="tag in post.tags" :key="tag">{{ tag }}</span>
        </div>
      </section>

      <div v-if="post.cover_image_url" class="cover-wrap">
        <img :src="post.cover_image_url" :alt="post.title" />
      </div>

      <div class="reader-shell">
        <div class="audio-container" v-if="post.audio_url">
          <AudioPlayer :src="post.audio_url" :title="post.title" />
        </div>
        <aside class="toc" aria-label="Table of contents">
          <p>Contents</p>
          <a v-for="item in toc" :key="item.id" :href="`#${item.id}`" :class="`toc-level-${item.level}`">
            {{ item.text }}
          </a>
        </aside>

        <article class="prose" v-html="processedHtml" @click="handleContentClick"></article>
      </div>

      <section v-if="relatedPosts.length" class="related-section">
        <div class="section-head">
          <span>Keep reading</span>
          <h2>Related posts</h2>
        </div>
        <div class="related-grid">
          <router-link v-for="item in relatedPosts" :key="item.id" :to="postUrl(item)" class="related-card">
            <span>{{ item.tags?.[0] || 'Blog' }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ postExcerpt(item, 110) }}</p>
          </router-link>
        </div>
      </section>

      <nav class="post-nav" aria-label="Article navigation">
        <router-link v-if="nextPost" :to="postUrl(nextPost)" class="nav-card">
          <span>Previous</span>
          <strong>{{ nextPost.title }}</strong>
        </router-link>
        <span v-else></span>

        <router-link v-if="previousPost" :to="postUrl(previousPost)" class="nav-card align-right">
          <span>Next</span>
          <strong>{{ previousPost.title }}</strong>
        </router-link>
      </nav>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AudioPlayer from '../components/AudioPlayer.vue'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github-dark.css'
import {
  type BlogPost,
  displayDate,
  fetchPublishedPost,
  fetchPublishedPosts,
  postExcerpt,
  readingMinutes,
  updatedDate,
} from '../lib/blog'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)

interface TocItem {
  id: string
  text: string
  level: number
}

const route = useRoute()
const post = ref<BlogPost | null>(null)
const posts = ref<BlogPost[]>([])
const loading = ref(true)
const toc = ref<TocItem[]>([])

const currentIndex = computed(() => posts.value.findIndex((item) => item.id === post.value?.id))
const previousPost = computed(() => currentIndex.value > 0 ? posts.value[currentIndex.value - 1] : null)
const nextPost = computed(() => {
  const index = currentIndex.value
  return index >= 0 && index < posts.value.length - 1 ? posts.value[index + 1] : null
})

const relatedPosts = computed(() => {
  if (!post.value) return []
  const ownTags = new Set(post.value.tags ?? [])
  return posts.value
    .filter((item) => item.id !== post.value?.id)
    .map((item) => ({
      item,
      score: (item.tags ?? []).filter((tag) => ownTags.has(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item)
})

const processedHtml = computed(() => enhancePostHtml(post.value?.content ?? ''))

onMounted(loadPost)

watch(
  () => route.params.slug,
  () => {
    void loadPost()
  }
)

async function loadPost() {
  loading.value = true
  const slug = route.params.slug as string
  const [foundPost, allPosts] = await Promise.all([
    fetchPublishedPost(slug),
    fetchPublishedPosts(),
  ])
  post.value = foundPost
  posts.value = allPosts
  loading.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function enhancePostHtml(html: string) {
  if (!html) {
    toc.value = []
    return ''
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const headings = Array.from(doc.body.querySelectorAll('h2, h3'))
  const usedIds = new Map<string, number>()

  toc.value = headings.map((heading) => {
    const baseId = slugify(heading.textContent || 'section')
    const count = usedIds.get(baseId) ?? 0
    usedIds.set(baseId, count + 1)
    const id = count > 0 ? `${baseId}-${count + 1}` : baseId
    heading.id = id
    return {
      id,
      text: heading.textContent || 'Section',
      level: Number(heading.tagName.slice(1)),
    }
  })

  Array.from(doc.body.querySelectorAll('pre')).forEach((pre, index) => {
    const code = pre.querySelector('code')
    const rawCode = code?.textContent ?? pre.textContent ?? ''
    const className = code?.className ?? ''
    const language = className.match(/language-([a-z0-9-]+)/i)?.[1] || 'text'
    const highlighted = language !== 'text' && hljs.getLanguage(language)
      ? hljs.highlight(rawCode, { language }).value
      : hljs.highlightAuto(rawCode).value

    const wrapper = doc.createElement('div')
    wrapper.className = 'code-shell'
    wrapper.innerHTML = `
      <div class="code-topline">
        <span>${escapeHtml(language)}</span>
        <button type="button" data-copy-code="${index}" data-code="${encodeURIComponent(rawCode)}">Copy</button>
      </div>
      <pre><code class="hljs language-${escapeHtml(language)}">${highlighted}</code></pre>
    `
    pre.replaceWith(wrapper)
  })

  Array.from(doc.body.querySelectorAll('a')).forEach((link) => {
    const href = link.getAttribute('href') ?? ''
    if (href.startsWith('http')) {
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
    }
  })

  return doc.body.innerHTML
}

async function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const button = target.closest<HTMLButtonElement>('button[data-copy-code]')
  if (!button) return
  const code = decodeURIComponent(button.dataset.code ?? '')
  await navigator.clipboard.writeText(code)
  const originalText = button.textContent
  button.textContent = 'Copied'
  window.setTimeout(() => {
    button.textContent = originalText
  }, 1400)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'section'
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function postUrl(item: BlogPost) {
  return `/blog/${item.slug || item.id}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

.blog-post-page {
  min-height: 100vh;
  background: #ffffff;
  color: #111827;
  font-family: 'Inter', sans-serif;
  padding: 108px 24px 90px;
}

.post-hero,
.cover-wrap,
.reader-shell,
.related-section,
.post-nav {
  max-width: 1120px;
  margin: 0 auto;
}

.post-hero {
  display: grid;
  gap: 18px;
}

.back-link {
  justify-self: start;
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.06);
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.post-hero h1 {
  max-width: 880px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(36px, 7vw, 72px);
  line-height: 1.02;
  letter-spacing: 0;
  margin: 0;
}

.post-excerpt {
  max-width: 760px;
  color: #64748b;
  font-size: 19px;
  line-height: 1.8;
  margin: 0;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-row span {
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.08);
  border: 1px solid rgba(108, 99, 255, 0.16);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
}

.cover-wrap {
  margin-top: 38px;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 7;
  background: #f8fafc;
}

.cover-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.audio-container {
  grid-column: 1 / -1;
  max-width: 760px;
  width: 100%;
  margin: 0;
  justify-self: end;
}

.reader-shell {
  display: grid;
  grid-template-columns: 230px minmax(0, 760px);
  gap: 56px;
  align-items: start;
  padding-top: 54px;
}

.toc {
  position: sticky;
  top: 92px;
  display: grid;
  gap: 8px;
  border-left: 2px solid rgba(108, 99, 255, 0.16);
  padding-left: 18px;
}

.toc p {
  margin: 0 0 8px;
  color: #111827;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toc a {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  text-decoration: none;
}

.toc a:hover {
  color: #6c63ff;
}

.toc-level-3 {
  padding-left: 14px;
}

.prose {
  min-width: 0;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  font-family: 'Space Grotesk', sans-serif;
  color: #111827;
  letter-spacing: 0;
}

.prose :deep(h2) {
  font-size: 32px;
  margin: 44px 0 16px;
}

.prose :deep(h3) {
  font-size: 23px;
  margin: 34px 0 12px;
}

.prose :deep(p),
.prose :deep(li) {
  color: #374151;
  font-size: 18px;
  line-height: 1.9;
}

.prose :deep(p) {
  margin: 0 0 22px;
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 1.5rem;
  margin: 0 0 24px;
}

.prose :deep(blockquote) {
  margin: 28px 0;
  padding: 18px 22px;
  color: #475569;
  border-left: 4px solid #6c63ff;
  background: rgba(108, 99, 255, 0.06);
  border-radius: 0 8px 8px 0;
}

.prose :deep(a) {
  color: #6c63ff;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.prose :deep(img) {
  width: 100%;
  border-radius: 8px;
  margin: 32px 0;
}

.prose :deep(code:not(pre code)) {
  color: #6c63ff;
  background: #f1f5f9;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 0.9em;
}

.prose :deep(.code-shell) {
  overflow: hidden;
  border-radius: 8px;
  background: #0f172a;
  margin: 30px 0;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16);
}

.prose :deep(.code-topline) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 800;
}

.prose :deep(.code-topline button) {
  color: #ffffff;
  background: rgba(108, 99, 255, 0.85);
  border: 0;
  border-radius: 6px;
  padding: 6px 10px;
  font: inherit;
  cursor: pointer;
}

.prose :deep(pre) {
  margin: 0;
  padding: 20px;
  overflow-x: auto;
}

.prose :deep(pre code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.7;
}

.related-section {
  margin-top: 74px;
}

.section-head span {
  color: #6c63ff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-head h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 34px;
  margin: 6px 0 22px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.related-card,
.nav-card {
  display: grid;
  gap: 10px;
  color: inherit;
  text-decoration: none;
  border: 1px solid rgba(108, 99, 255, 0.14);
  border-radius: 8px;
  padding: 20px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.related-card:hover,
.nav-card:hover {
  transform: translateY(-3px);
  border-color: rgba(108, 99, 255, 0.36);
}

.related-card span,
.nav-card span {
  color: #6c63ff;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.related-card h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  margin: 0;
}

.related-card p {
  color: #64748b;
  line-height: 1.7;
  margin: 0;
}

.post-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-top: 36px;
}

.align-right {
  text-align: right;
}

.loading-state,
.empty-state {
  display: grid;
  min-height: 55vh;
  place-items: center;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 980px) {
  .reader-shell {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .toc {
    position: static;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .blog-post-page {
    padding: 86px 20px 60px;
  }

  .cover-wrap {
    aspect-ratio: 16 / 10;
  }

  .post-nav {
    grid-template-columns: 1fr;
  }
}
</style>
