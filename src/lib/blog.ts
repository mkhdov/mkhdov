import { supabase } from './supabase'

export interface BlogPost {
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
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
  return {
    id: String(post.id),
    slug: typeof post.slug === 'string' ? post.slug : null,
    title: typeof post.title === 'string' ? post.title : 'Untitled',
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : null,
    content: typeof post.content === 'string' ? post.content : null,
    cover_image_url: typeof post.cover_image_url === 'string' ? post.cover_image_url : null,
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
  const { data, error } = await supabase
    .from('blog_posts')
    .select(extendedColumns)
    .eq('published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

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
