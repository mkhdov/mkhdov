<template>
  <main class="blog-page">
    <section class="blog-hero">
      <div class="hero-copy">
        <span class="section-kicker">Blog</span>
        <h1>Notes from the build floor.</h1>
        <p>
          Practical engineering writeups, architecture notes, implementation details,
          and lessons from building real products.
        </p>
      </div>

      <div class="hero-illustration" aria-hidden="true">
        <div class="paper paper-large">
          <span></span>
          <span></span>
          <span></span>
          <code>const idea = ship()</code>
        </div>
        <div class="paper paper-small">
          <span></span>
          <span></span>
        </div>
      </div>
    </section>

    <section class="blog-content">
      <div v-if="loading" class="state-grid">
        <article v-for="n in 6" :key="n" class="skeleton-card">
          <div class="skeleton-cover"></div>
          <div class="skeleton-body">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </article>
      </div>

      <div v-else-if="posts.length === 0" class="empty-state">
        <div class="empty-mark">B</div>
        <h2>No blog posts yet</h2>
        <p>Drafts are warming up in the admin panel.</p>
      </div>

      <div v-else class="post-layout">
        <router-link :to="postUrl(featuredPost)" class="featured-card">
          <div class="featured-cover">
            <img v-if="featuredPost.cover_image_url" :src="featuredPost.cover_image_url" :alt="featuredPost.title" />
            <div v-else class="cover-art">
              <span>{{ featuredPost.title.slice(0, 1) }}</span>
            </div>
          </div>
          <div class="featured-body">
            <div class="post-meta">
              <span>{{ featuredPost.author || 'Olimjon Makhmudov' }}</span>
              <span>{{ formatDate(displayDate(featuredPost)) }}</span>
              <span>{{ readingMinutes(featuredPost) }} min read</span>
            </div>
            <h2>{{ featuredPost.title }}</h2>
            <p>{{ postExcerpt(featuredPost, 190) }}</p>
            <div class="tag-row">
              <span v-for="tag in featuredPost.tags?.slice(0, 4)" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </router-link>

        <div class="post-grid">
          <router-link v-for="post in secondaryPosts" :key="post.id" :to="postUrl(post)" class="post-card">
            <div class="post-cover">
              <img v-if="post.cover_image_url" :src="post.cover_image_url" :alt="post.title" loading="lazy" />
              <div v-else class="cover-art compact">
                <span>{{ post.title.slice(0, 1) }}</span>
              </div>
            </div>
            <div class="post-body">
              <div class="post-meta compact-meta">
                <span>{{ formatDate(displayDate(post)) }}</span>
                <span>{{ readingMinutes(post) }} min</span>
              </div>
              <h2>{{ post.title }}</h2>
              <p>{{ postExcerpt(post) }}</p>
              <div class="tag-row">
                <span v-for="tag in post.tags?.slice(0, 3)" :key="tag">{{ tag }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  type BlogPost,
  displayDate,
  fetchPublishedPosts,
  postExcerpt,
  readingMinutes,
} from '../lib/blog'

const posts = ref<BlogPost[]>([])
const loading = ref(true)

const featuredPost = computed(() => posts.value[0])
const secondaryPosts = computed(() => posts.value.slice(1))

onMounted(async () => {
  posts.value = await fetchPublishedPosts()
  loading.value = false
})

function postUrl(post: BlogPost) {
  return `/blog/${post.slug || post.id}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

.blog-page {
  min-height: 100vh;
  background: #ffffff;
  color: #1a1a2e;
  font-family: 'Inter', sans-serif;
}

.blog-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
  align-items: center;
  gap: 56px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 132px 40px 72px;
}

.hero-copy {
  max-width: 620px;
}

.section-kicker {
  display: inline-flex;
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.08);
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.blog-hero h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(38px, 7vw, 76px);
  line-height: 0.98;
  letter-spacing: 0;
  margin: 0 0 22px;
  color: #111827;
}

.blog-hero p {
  max-width: 560px;
  color: #64748b;
  font-size: clamp(16px, 1.8vw, 19px);
  line-height: 1.8;
  margin: 0;
}

.hero-illustration {
  position: relative;
  min-height: 360px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(14, 165, 233, 0.08)),
    repeating-linear-gradient(90deg, transparent 0 26px, rgba(108, 99, 255, 0.08) 26px 27px);
  border: 1px solid rgba(108, 99, 255, 0.12);
  overflow: hidden;
}

.paper {
  position: absolute;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  padding: 28px;
}

.paper span {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: #e2e8f0;
  margin-bottom: 14px;
}

.paper span:nth-child(1) { width: 72%; background: #6c63ff; }
.paper span:nth-child(2) { width: 92%; }
.paper span:nth-child(3) { width: 64%; }

.paper code {
  display: block;
  margin-top: 26px;
  background: #0f172a;
  color: #c4b5fd;
  border-radius: 8px;
  padding: 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.paper-large {
  width: 72%;
  left: 12%;
  top: 16%;
}

.paper-small {
  width: 42%;
  right: 8%;
  bottom: 12%;
  transform: rotate(4deg);
}

.blog-content {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 40px 100px;
}

.post-layout {
  display: grid;
  gap: 28px;
}

.featured-card,
.post-card {
  display: grid;
  color: inherit;
  text-decoration: none;
  background: #ffffff;
  border: 1px solid rgba(108, 99, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.05);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.featured-card:hover,
.post-card:hover {
  transform: translateY(-4px);
  border-color: rgba(108, 99, 255, 0.34);
  box-shadow: 0 18px 44px rgba(108, 99, 255, 0.12);
}

.featured-card {
  grid-template-columns: minmax(320px, 0.95fr) minmax(0, 1.05fr);
}

.featured-cover,
.post-cover {
  min-height: 100%;
  background: #f8fafc;
}

.featured-cover img,
.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.featured-cover {
  aspect-ratio: 16 / 11;
}

.cover-art {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-height: 280px;
  background:
    linear-gradient(135deg, rgba(108, 99, 255, 0.14), rgba(14, 165, 233, 0.1)),
    radial-gradient(circle at 80% 20%, rgba(167, 139, 250, 0.28), transparent 36%);
}

.cover-art.compact {
  min-height: 180px;
}

.cover-art span {
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  border-radius: 8px;
  color: #ffffff;
  background: #6c63ff;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 42px;
  font-weight: 800;
}

.featured-body,
.post-body {
  padding: 30px;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 16px;
}

.post-meta span:not(:last-child)::after {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  margin-left: 16px;
  vertical-align: middle;
  border-radius: 50%;
  background: rgba(108, 99, 255, 0.42);
}

.featured-body h2,
.post-body h2 {
  font-family: 'Space Grotesk', sans-serif;
  color: #111827;
  margin: 0 0 14px;
  letter-spacing: 0;
  line-height: 1.14;
}

.featured-body h2 {
  font-size: clamp(28px, 4vw, 44px);
}

.post-body h2 {
  font-size: 22px;
}

.featured-body p,
.post-body p {
  color: #64748b;
  line-height: 1.75;
  margin: 0 0 20px;
}

.post-grid,
.state-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.post-card {
  grid-template-rows: auto 1fr;
}

.post-cover {
  aspect-ratio: 16 / 10;
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

.compact-meta {
  font-size: 12px;
}

.empty-state {
  min-height: 340px;
  display: grid;
  place-items: center;
  align-content: center;
  text-align: center;
  gap: 12px;
  color: #64748b;
}

.empty-mark {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  color: #ffffff;
  background: #6c63ff;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 30px;
  font-weight: 800;
}

.empty-state h2 {
  color: #111827;
  margin: 0;
}

.empty-state p {
  margin: 0;
}

.skeleton-card {
  border: 1px solid #eef2ff;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-cover,
.skeleton-body span {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s ease infinite;
}

.skeleton-cover {
  aspect-ratio: 16 / 10;
}

.skeleton-body {
  padding: 24px;
}

.skeleton-body span {
  display: block;
  height: 14px;
  border-radius: 999px;
  margin-bottom: 14px;
}

.skeleton-body span:nth-child(1) { width: 42%; }
.skeleton-body span:nth-child(2) { width: 88%; height: 20px; }
.skeleton-body span:nth-child(3) { width: 70%; }

@keyframes shimmer {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}

@media (max-width: 900px) {
  .blog-hero {
    grid-template-columns: 1fr;
    padding: 108px 32px 54px;
  }

  .hero-illustration {
    min-height: 280px;
  }

  .featured-card {
    grid-template-columns: 1fr;
  }

  .post-grid,
  .state-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .blog-content {
    padding: 0 32px 80px;
  }
}

@media (max-width: 640px) {
  .blog-hero {
    padding: 92px 20px 40px;
    gap: 34px;
  }

  .blog-content {
    padding: 0 20px 64px;
  }

  .post-grid,
  .state-grid {
    grid-template-columns: 1fr;
  }

  .featured-body,
  .post-body {
    padding: 22px;
  }

  .post-meta {
    gap: 8px 12px;
  }

  .post-meta span:not(:last-child)::after {
    margin-left: 12px;
  }
}
</style>
