<template>
  <main class="article-detail-page">
    <TopBar />

    <div class="page-content">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="!article" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h2>Article not found</h2>
        <router-link to="/articles" class="back-link">← Back to Articles</router-link>
      </div>

      <!-- Article -->
      <template v-else>
        <!-- Back link -->
        <router-link to="/articles" class="back-link">← Back to Articles</router-link>

        <!-- Cover -->
        <div v-if="article.cover_image_url" class="article-cover">
          <img :src="article.cover_image_url" :alt="article.title" />
        </div>

        <!-- Header -->
        <div class="article-header">
          <span class="article-date">{{ formatDate(article.created_at) }}</span>
          <h1 class="article-title">{{ article.title }}</h1>
        </div>

        <!-- Content -->
        <div class="article-body prose" v-html="article.content"></div>

        <!-- Reactions & Comments -->
        <PostReactions :postId="article.id" postType="article" />
        <PostComments :postId="article.id" postType="article" :postTitle="article.title" />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from '../components/TopBar.vue'
import PostReactions from '../components/PostReactions.vue'
import PostComments from '../components/PostComments.vue'
import { supabase } from '../lib/supabase'

interface Article {
  id: string
  title: string
  content: string | null
  cover_image_url: string | null
  created_at: string
  published: boolean
}

const route = useRoute()
const article = ref<Article | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = route.params.id as string
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .eq('published', true)
    .single()
  if (!error && data) article.value = data
  loading.value = false
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

.article-detail-page {
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', sans-serif;
}

.page-content {
  max-width: 760px;
  margin: 0 auto;
  padding: 100px 40px 100px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #6c63ff;
  text-decoration: none;
  padding: 6px 14px 6px 10px;
  border: 1.5px solid rgba(108, 99, 255, 0.2);
  border-radius: 10px;
  background: rgba(108, 99, 255, 0.04);
  margin-bottom: 36px;
  transition: background 0.2s, border-color 0.2s;
}
.back-link:hover {
  background: rgba(108, 99, 255, 0.09);
  border-color: rgba(108, 99, 255, 0.4);
}

.article-cover {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 40px;
  aspect-ratio: 16 / 7;
}
.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-header {
  margin-bottom: 40px;
}

.article-date {
  font-size: 13px;
  font-weight: 600;
  color: #6c63ff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: block;
  margin-bottom: 14px;
}

.article-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(28px, 4.5vw, 46px);
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.15;
  letter-spacing: -1.2px;
  margin: 0;
}

/* Prose styles for rendered HTML content */
.prose :deep(h1) { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 700; color: #0f172a; margin: 2rem 0 1rem; letter-spacing: -0.5px; }
.prose :deep(h2) { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 1.75rem 0 0.75rem; letter-spacing: -0.3px; }
.prose :deep(h3) { font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; font-weight: 600; color: #0f172a; margin: 1.5rem 0 0.6rem; }
.prose :deep(p)  { font-size: 17px; line-height: 1.85; color: #374151; margin: 0 0 1.25rem; }
.prose :deep(ul), .prose :deep(ol) { padding-left: 1.6rem; margin: 0 0 1.25rem; }
.prose :deep(li) { font-size: 17px; line-height: 1.75; color: #374151; margin-bottom: 0.4rem; }
.prose :deep(blockquote) {
  border-left: 3px solid #6c63ff;
  padding: 0.5rem 0 0.5rem 1.25rem;
  color: #64748b;
  font-style: italic;
  margin: 1.5rem 0;
  background: rgba(108,99,255,0.03);
  border-radius: 0 8px 8px 0;
}
.prose :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 0.88em;
  color: #6c63ff;
}
.prose :deep(pre) {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-size: 0.9rem;
  line-height: 1.6;
}
.prose :deep(pre code) { background: none; color: inherit; padding: 0; font-size: inherit; }
.prose :deep(img) { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
.prose :deep(a) { color: #6c63ff; text-decoration: underline; text-underline-offset: 3px; }
.prose :deep(strong) { color: #0f172a; font-weight: 700; }
.prose :deep(hr) { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 100px 0;
  text-align: center;
}
.empty-icon { font-size: 3rem; }
.empty-state h2 { font-size: 1.3rem; color: #1a1a2e; margin: 0; }

@media (max-width: 640px) {
  .page-content { padding: 80px 20px 60px; }
}
</style>
