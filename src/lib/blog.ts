import { supabase } from './supabase'

export interface BlogPost {
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
  image_urls: string[]
  audio_url: string | null
  video_url: string | null
  author: string | null
  tags: string[] | null
  published: boolean
  published_at: string | null
  updated_at: string | null
  created_at: string
  read_minutes: number | null
}

const extendedColumns = [
  'id',
  'slug',
  'title',
  'excerpt',
  'content',
  'cover_image_url',
  'image_urls',
  'audio_url',
  'video_url',
  'author',
  'tags',
  'published',
  'published_at',
  'updated_at',
  'created_at',
  'read_minutes',
].join(', ')

const baseColumns = [
  'id',
  'slug',
  'title',
  'excerpt',
  'content',
  'cover_image_url',
  'audio_url',
  'author',
  'tags',
  'published',
  'published_at',
  'updated_at',
  'created_at',
  'read_minutes',
].join(', ')

type RawPost = Record<string, unknown>

function normalizePost(post: RawPost): BlogPost {
  const rawImages: string[] = Array.isArray(post.image_urls)
    ? (post.image_urls as unknown[]).filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    : []

  const coverImage = typeof post.cover_image_url === 'string' && post.cover_image_url.trim().length > 0
    ? post.cover_image_url.trim()
    : null

  if (rawImages.length === 0 && coverImage) {
    rawImages.push(coverImage)
  }

  return {
    id: String(post.id),
    slug: typeof post.slug === 'string' ? post.slug : null,
    title: typeof post.title === 'string' ? post.title : 'Untitled',
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : null,
    content: typeof post.content === 'string' ? post.content : null,
    cover_image_url: rawImages[0] || coverImage || null,
    image_urls: rawImages,
    audio_url: typeof post.audio_url === 'string' && post.audio_url.trim().length > 0 ? post.audio_url.trim() : null,
    video_url: typeof post.video_url === 'string' && post.video_url.trim().length > 0 ? post.video_url.trim() : null,
    author: typeof post.author === 'string' ? post.author : 'Olimjon Makhmudov',
    tags: Array.isArray(post.tags) ? post.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    published: Boolean(post.published),
    published_at: typeof post.published_at === 'string' ? post.published_at : null,
    updated_at: typeof post.updated_at === 'string' ? post.updated_at : null,
    created_at: typeof post.created_at === 'string' ? post.created_at : new Date().toISOString(),
    read_minutes: typeof post.read_minutes === 'number' ? post.read_minutes : null,
  }
}

function sortPosts(posts: BlogPost[]) {
  return posts.sort((a, b) => {
    return new Date(displayDate(b)).getTime() - new Date(displayDate(a)).getTime()
  })
}

export function displayDate(post: Pick<BlogPost, 'published_at' | 'created_at'>) {
  return post.published_at || post.created_at
}

export function updatedDate(post: Pick<BlogPost, 'updated_at' | 'published_at' | 'created_at'>) {
  return post.updated_at || post.published_at || post.created_at
}

export function plainTextFromHtml(html: string | null) {
  if (!html) return ''
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function postExcerpt(post: Pick<BlogPost, 'excerpt' | 'content'>, maxLen = 150) {
  const source = post.excerpt?.trim() || plainTextFromHtml(post.content)
  return source.length > maxLen ? `${source.slice(0, maxLen).trim()}...` : source
}

export function readingMinutes(post: Pick<BlogPost, 'read_minutes' | 'content'>) {
  if (post.read_minutes && post.read_minutes > 0) return post.read_minutes
  const words = plainTextFromHtml(post.content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

export async function fetchPublishedPosts() {
  let { data, error } = await supabase
    .from('blog_posts')
    .select(extendedColumns)
    .eq('published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    // If the new columns aren't created yet in DB, fallback to base columns
    const msg = error.message || ''
    if (msg.includes('video_url') || msg.includes('image_urls')) {
      console.warn('Postgres columns video_url or image_urls missing. Falling back to base columns until migration is executed.')
      const fallback = await supabase
        .from('blog_posts')
        .select(baseColumns)
        .eq('published', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (!fallback.error) {
        data = fallback.data
        error = null
      }
    }
  }

  if (error) {
    console.error('Error loading blog posts:', error)
    return []
  }

  return sortPosts(((data ?? []) as unknown as RawPost[]).map((post) => normalizePost(post)))
}

export async function fetchPublishedPost(slugOrId: string) {
  const posts = await fetchPublishedPosts()
  return posts.find((post) => post.slug === slugOrId || post.id === slugOrId) ?? null
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function formatFullDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export async function fetchCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!postIds.length) return {}
  const { data, error } = await supabase
    .from('post_comments')
    .select('post_id')
    .eq('post_type', 'blog')
    .eq('status', 'approved')
    .in('post_id', postIds)

  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data as { post_id: string }[]) {
    counts[row.post_id] = (counts[row.post_id] || 0) + 1
  }
  return counts
}

