<template>
  <section class="comments-section" id="reviews-and-comments">
    <div class="comments-header">
      <div class="header-left">
        <span class="section-kicker">💬 Community</span>
        <h2>Reviews &amp; Comments</h2>
        <p class="section-sub">
          Share your feedback, ask questions, or join the discussion.
        </p>
      </div>

      <div v-if="ratingSummary.count > 0" class="rating-badge">
        <div class="rating-stars-summary">
          <span class="stars-val">★ {{ ratingSummary.average.toFixed(1) }}</span>
          <span class="stars-max">/ 5</span>
        </div>
        <span class="rating-count">Based on {{ ratingSummary.count }} review{{ ratingSummary.count > 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Main Comment / Review Form -->
    <div class="comment-form-card">
      <h3 class="form-title">Leave a Review or Comment</h3>

      <form @submit.prevent="submitMainComment" class="comment-form">
        <!-- Optional Star Rating -->
        <div class="rating-selector-wrap">
          <span class="rating-label">Your Rating (Optional):</span>
          <div class="star-rating" role="radiogroup" aria-label="Rate from 1 to 5 stars">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="star-btn"
              :class="{ 'is-active': (hoverRating || selectedRating) >= star }"
              @mouseenter="hoverRating = star"
              @mouseleave="hoverRating = 0"
              @click="toggleRating(star)"
              :title="`${star} star${star > 1 ? 's' : ''}`"
            >
              ★
            </button>
            <span v-if="selectedRating > 0" class="rating-desc">
              {{ ratingLabels[selectedRating] }}
              <button type="button" class="clear-rating" @click="selectedRating = 0">Clear</button>
            </span>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label for="comment-author">Your Name *</label>
            <input
              id="comment-author"
              v-model="authorName"
              type="text"
              placeholder="e.g. Alex Chen"
              required
              maxlength="60"
            />
          </div>

          <div class="form-field">
            <label for="comment-email">Email (Optional, not published)</label>
            <input
              id="comment-email"
              v-model="authorEmail"
              type="email"
              placeholder="you@example.com"
              maxlength="100"
            />
          </div>
        </div>

        <div class="form-field">
          <label for="comment-content">Your Comment or Review *</label>
          <textarea
            id="comment-content"
            v-model="commentContent"
            rows="4"
            placeholder="What are your thoughts on this? Any questions or feedback?"
            required
            maxlength="2000"
          ></textarea>
        </div>

        <div class="form-actions">
          <span v-if="submitError" class="error-msg">{{ submitError }}</span>
          <span v-if="submitSuccess" class="success-msg">{{ submitSuccess }}</span>

          <button type="submit" class="submit-btn" :disabled="submitting">
            <span v-if="submitting" class="mini-spinner"></span>
            <span v-else>Post Comment</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="comments-loading">
      <div class="mini-spinner purple"></div>
      <p>Loading discussion...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="rootComments.length === 0" class="comments-empty">
      <div class="empty-icon">💭</div>
      <h4>No reviews or comments yet</h4>
      <p>Be the first to share your thoughts!</p>
    </div>

    <!-- Comments List -->
    <div v-else class="comments-thread">
      <h3 class="thread-title">
        {{ totalCommentCount }} {{ totalCommentCount === 1 ? 'Comment' : 'Comments' }}
      </h3>

      <div
        v-for="comment in rootComments"
        :key="comment.id"
        class="comment-node"
      >
        <!-- Root Comment Card -->
        <div class="comment-card" :class="{ 'is-admin-card': comment.is_admin }">
          <div class="comment-card-header">
            <div class="author-meta">
              <div class="avatar" :class="{ 'admin-avatar': comment.is_admin }">
                {{ getInitials(comment.author_name) }}
              </div>
              <div>
                <div class="author-row">
                  <strong class="author-name">{{ comment.author_name }}</strong>
                  <span v-if="comment.is_admin" class="admin-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Author
                  </span>
                </div>
                <span class="comment-date">{{ formatRelativeDate(comment.created_at) }}</span>
              </div>
            </div>

            <!-- Star Rating in comment -->
            <div v-if="comment.rating" class="comment-stars" :title="`${comment.rating} / 5 stars`">
              <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= comment.rating }">★</span>
            </div>
          </div>

          <p class="comment-body">{{ comment.content }}</p>

          <div class="comment-footer">
            <button
              type="button"
              class="reply-trigger-btn"
              @click="toggleReplyForm(comment.id, comment.author_name)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m3 10 7-7m0 0 7 7M10 3v13a4 4 0 0 0 4 4h7"/>
              </svg>
              Reply
            </button>
          </div>

          <!-- Inline Reply Form for Root Comment -->
          <div v-if="replyingToId === comment.id" class="inline-reply-box">
            <div class="reply-target-kicker">
              Replying to <strong>@{{ replyingToName }}</strong>
            </div>
            <form @submit.prevent="submitReply(comment.id)" class="inline-reply-form">
              <div class="reply-inputs-row">
                <input
                  v-model="replyAuthor"
                  type="text"
                  placeholder="Your Name *"
                  required
                  maxlength="60"
                  class="reply-name-input"
                />
              </div>
              <textarea
                v-model="replyContent"
                rows="3"
                placeholder="Write your reply..."
                required
                maxlength="1500"
                class="reply-textarea"
                ref="replyTextareaRef"
              ></textarea>
              <div class="inline-reply-actions">
                <button type="button" class="cancel-reply-btn" @click="cancelReply">Cancel</button>
                <button type="submit" class="submit-reply-btn" :disabled="submittingReply">
                  <span v-if="submittingReply" class="mini-spinner"></span>
                  <span v-else>Post Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Nested Replies -->
        <div v-if="repliesByParent[comment.id]?.length" class="replies-branch">
          <div
            v-for="reply in repliesByParent[comment.id]"
            :key="reply.id"
            class="reply-card"
            :class="{ 'is-admin-card': reply.is_admin }"
          >
            <div class="comment-card-header">
              <div class="author-meta">
                <div class="avatar small" :class="{ 'admin-avatar': reply.is_admin }">
                  {{ getInitials(reply.author_name) }}
                </div>
                <div>
                  <div class="author-row">
                    <strong class="author-name">{{ reply.author_name }}</strong>
                    <span v-if="reply.is_admin" class="admin-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Author
                    </span>
                  </div>
                  <span class="comment-date">{{ formatRelativeDate(reply.created_at) }}</span>
                </div>
              </div>
            </div>

            <p class="comment-body">{{ reply.content }}</p>

            <div class="comment-footer">
              <button
                type="button"
                class="reply-trigger-btn"
                @click="toggleReplyForm(reply.id, reply.author_name, comment.id)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m3 10 7-7m0 0 7 7M10 3v13a4 4 0 0 0 4 4h7"/>
                </svg>
                Reply
              </button>
            </div>

            <!-- Inline Reply Form for Reply -->
            <div v-if="replyingToId === reply.id" class="inline-reply-box">
              <div class="reply-target-kicker">
                Replying to <strong>@{{ replyingToName }}</strong>
              </div>
              <form @submit.prevent="submitReply(comment.id)" class="inline-reply-form">
                <div class="reply-inputs-row">
                  <input
                    v-model="replyAuthor"
                    type="text"
                    placeholder="Your Name *"
                    required
                    maxlength="60"
                    class="reply-name-input"
                  />
                </div>
                <textarea
                  v-model="replyContent"
                  rows="3"
                  placeholder="Write your reply..."
                  required
                  maxlength="1500"
                  class="reply-textarea"
                ></textarea>
                <div class="inline-reply-actions">
                  <button type="button" class="cancel-reply-btn" @click="cancelReply">Cancel</button>
                  <button type="submit" class="submit-reply-btn" :disabled="submittingReply">
                    <span v-if="submittingReply" class="mini-spinner"></span>
                    <span v-else>Post Reply</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'

export interface CommentItem {
  id: string
  post_type: 'blog' | 'article'
  post_id: string
  parent_id: string | null
  author_name: string
  author_email: string | null
  content: string
  rating: number | null
  is_admin: boolean
  status: 'approved' | 'pending' | 'spam'
  created_at: string
}

const props = defineProps<{
  postId: string
  postType: 'blog' | 'article'
  postTitle?: string
}>()

const comments = ref<CommentItem[]>([])
const loading = ref(true)

// Main form state
const authorName = ref(localStorage.getItem('mkhdov_guest_name') || '')
const authorEmail = ref(localStorage.getItem('mkhdov_guest_email') || '')
const commentContent = ref('')
const selectedRating = ref(0)
const hoverRating = ref(0)
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

// Inline reply state
const replyingToId = ref<string | null>(null)
const replyingToName = ref('')
const parentRootId = ref<string | null>(null)
const replyAuthor = ref(localStorage.getItem('mkhdov_guest_name') || '')
const replyContent = ref('')
const submittingReply = ref(false)
const replyTextareaRef = ref<HTMLTextAreaElement | null>(null)

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

const ratingLabels: Record<number, string> = {
  1: '1 Star — Poor',
  2: '2 Stars — Fair',
  3: '3 Stars — Good',
  4: '4 Stars — Very Good',
  5: '5 Stars — Excellent!',
}

const rootComments = computed(() => {
  return comments.value
    .filter((c) => !c.parent_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

const repliesByParent = computed(() => {
  const map: Record<string, CommentItem[]> = {}
  for (const c of comments.value) {
    if (c.parent_id) {
      if (!map[c.parent_id]) map[c.parent_id] = []
      map[c.parent_id].push(c)
    }
  }
  // Sort replies chronologically
  for (const parentId of Object.keys(map)) {
    map[parentId].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
  return map
})

const totalCommentCount = computed(() => comments.value.length)

const ratingSummary = computed(() => {
  const rated = comments.value.filter((c) => typeof c.rating === 'number' && c.rating > 0)
  if (rated.length === 0) return { average: 0, count: 0 }
  const total = rated.reduce((sum, c) => sum + (c.rating || 0), 0)
  return {
    average: total / rated.length,
    count: rated.length,
  }
})

function toggleRating(star: number) {
  selectedRating.value = selectedRating.value === star ? 0 : star
}

function getInitials(name: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function formatRelativeDate(isoDate: string) {
  const diffSec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function loadComments() {
  if (!props.postId) return

  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_type', props.postType)
    .eq('post_id', props.postId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error loading comments:', error)
  } else {
    comments.value = (data ?? []) as CommentItem[]
  }
  loading.value = false
}

async function submitMainComment() {
  const name = authorName.value.trim()
  const content = commentContent.value.trim()
  if (!name || !content || !props.postId) return

  submitting.value = true
  submitError.value = ''
  submitSuccess.value = ''

  localStorage.setItem('mkhdov_guest_name', name)
  if (authorEmail.value.trim()) {
    localStorage.setItem('mkhdov_guest_email', authorEmail.value.trim())
  }

  const payload = {
    post_type: props.postType,
    post_id: props.postId,
    parent_id: null,
    author_name: name,
    author_email: authorEmail.value.trim() || null,
    content,
    rating: selectedRating.value > 0 ? selectedRating.value : null,
    is_admin: false,
    status: 'approved',
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert([payload])
    .select('*')
    .single()

  if (error) {
    console.error('Error submitting comment:', error)
    submitError.value = 'Failed to submit comment. Please try again.'
  } else {
    submitSuccess.value = 'Thank you! Your comment has been posted.'
    commentContent.value = ''
    selectedRating.value = 0
    if (data && !comments.value.some((c) => c.id === data.id)) {
      comments.value.push(data as CommentItem)
    }
    setTimeout(() => {
      submitSuccess.value = ''
    }, 4000)
  }

  submitting.value = false
}

function toggleReplyForm(commentId: string, author: string, rootId?: string) {
  if (replyingToId.value === commentId) {
    cancelReply()
  } else {
    replyingToId.value = commentId
    replyingToName.value = author
    parentRootId.value = rootId || commentId
    replyAuthor.value = localStorage.getItem('mkhdov_guest_name') || ''
    replyContent.value = ''
    nextTick(() => {
      replyTextareaRef.value?.focus()
    })
  }
}

function cancelReply() {
  replyingToId.value = null
  replyingToName.value = ''
  parentRootId.value = null
  replyContent.value = ''
}

async function submitReply(rootCommentId: string) {
  const name = replyAuthor.value.trim()
  const content = replyContent.value.trim()
  if (!name || !content || !props.postId) return

  submittingReply.value = true

  localStorage.setItem('mkhdov_guest_name', name)

  const payload = {
    post_type: props.postType,
    post_id: props.postId,
    parent_id: rootCommentId, // attach directly to root so replies thread cleanly
    author_name: name,
    author_email: localStorage.getItem('mkhdov_guest_email') || null,
    content: replyingToName.value ? `@${replyingToName.value} ${content}` : content,
    rating: null,
    is_admin: false,
    status: 'approved',
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert([payload])
    .select('*')
    .single()

  if (error) {
    console.error('Error submitting reply:', error)
    alert('Failed to post reply. Please try again.')
  } else {
    if (data && !comments.value.some((c) => c.id === data.id)) {
      comments.value.push(data as CommentItem)
    }
    cancelReply()
  }

  submittingReply.value = false
}

function subscribeToRealtime() {
  if (!props.postId) return

  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }

  realtimeChannel = supabase
    .channel(`comments_${props.postType}_${props.postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'post_comments',
        filter: `post_id=eq.${props.postId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newComment = payload.new as CommentItem
          if (!comments.value.some((c) => c.id === newComment.id)) {
            comments.value.push(newComment)
          }
        } else if (payload.eventType === 'DELETE') {
          comments.value = comments.value.filter((c) => c.id !== payload.old.id)
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as CommentItem
          const idx = comments.value.findIndex((c) => c.id === updated.id)
          if (idx !== -1) {
            comments.value[idx] = updated
          }
        }
      }
    )
    .subscribe()
}

onMounted(() => {
  void loadComments()
  subscribeToRealtime()
})

watch(
  () => props.postId,
  () => {
    void loadComments()
    subscribeToRealtime()
  }
)

onUnmounted(() => {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }
})
</script>

<style scoped>
.comments-section {
  margin-top: 54px;
  padding-top: 40px;
  border-top: 1px solid rgba(108, 99, 255, 0.16);
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

.comments-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.section-kicker {
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  color: #6c63ff;
  background: rgba(108, 99, 255, 0.08);
  border: 1px solid rgba(108, 99, 255, 0.2);
  padding: 4px 12px;
  border-radius: 999px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.comments-header h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.section-sub {
  margin: 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.6;
}

/* Rating badge in header */
.rating-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 12px 18px;
  background: #ffffff;
  border: 1px solid rgba(108, 99, 255, 0.18);
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(108, 99, 255, 0.06);
}

.rating-stars-summary {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stars-val {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #f59e0b;
}

.stars-max {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.rating-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
}

/* Form Card */
.comment-form-card {
  background: #ffffff;
  border: 1px solid rgba(108, 99, 255, 0.16);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  margin-bottom: 40px;
}

.form-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 20px;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rating-selector-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.rating-label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.star-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: #cbd5e1;
  cursor: pointer;
  padding: 2px 3px;
  transition: transform 0.15s ease, color 0.15s ease;
}

.star-btn:hover {
  transform: scale(1.2);
}

.star-btn.is-active {
  color: #f59e0b;
}

.rating-desc {
  font-size: 13px;
  font-weight: 600;
  color: #d97706;
  margin-left: 8px;
}

.clear-rating {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-field label {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}

.form-field input,
.form-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-family: inherit;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

.form-field input:focus,
.form-field textarea:focus {
  background: #ffffff;
  border-color: #6c63ff;
  box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.12);
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
}

.error-msg {
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
}

.success-msg {
  color: #059669;
  font-size: 13px;
  font-weight: 600;
}

.submit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 24px;
  background: #6c63ff;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(108, 99, 255, 0.25);
  transition: transform 0.18s, background-color 0.18s, box-shadow 0.18s;
}

.submit-btn:hover:not(:disabled) {
  background: #5548eb;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(108, 99, 255, 0.35);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Thread List */
.comments-thread {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.thread-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px;
}

.comment-node {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card,
.reply-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
  transition: border-color 0.2s;
}

.comment-card.is-admin-card,
.reply-card.is-admin-card {
  border-color: rgba(108, 99, 255, 0.3);
  background: linear-gradient(180deg, rgba(108, 99, 255, 0.04) 0%, #ffffff 50%);
}

.comment-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
}

.avatar.small {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

.avatar.admin-avatar {
  background: linear-gradient(135deg, #6c63ff, #818cf8);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(108, 99, 255, 0.28);
}

.author-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(108, 99, 255, 0.1);
  color: #6c63ff;
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.comment-date {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.comment-stars {
  display: flex;
  gap: 2px;
  font-size: 16px;
  line-height: 1;
}

.comment-stars .star {
  color: #e2e8f0;
}

.comment-stars .star.filled {
  color: #f59e0b;
}

.comment-body {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.75;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reply-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 8px;
  padding: 5px 12px;
  color: #6c63ff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}

.reply-trigger-btn:hover {
  background: rgba(108, 99, 255, 0.08);
  border-color: #6c63ff;
}

/* Replies branch */
.replies-branch {
  margin-left: 36px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.replies-branch::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 16px;
  width: 2px;
  background: rgba(108, 99, 255, 0.16);
  border-radius: 2px;
}

.reply-card {
  padding: 16px 18px;
  background: #f8fafc;
}

/* Inline Reply Form */
.inline-reply-box {
  margin-top: 14px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid rgba(108, 99, 255, 0.18);
  border-radius: 14px;
}

.reply-target-kicker {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 10px;
}

.reply-target-kicker strong {
  color: #6c63ff;
}

.inline-reply-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-inputs-row input,
.reply-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  font-family: inherit;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.2s;
}

.reply-inputs-row input:focus,
.reply-textarea:focus {
  border-color: #6c63ff;
  box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
}

.inline-reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-reply-btn {
  background: none;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 6px 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-reply-btn:hover {
  background: #f1f5f9;
}

.submit-reply-btn {
  background: #6c63ff;
  border: none;
  color: #ffffff;
  padding: 6px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.18s;
}

.submit-reply-btn:hover:not(:disabled) {
  background: #5548eb;
}

/* Loading & Empty States */
.comments-loading,
.comments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: #64748b;
  text-align: center;
  gap: 10px;
}

.empty-icon {
  font-size: 36px;
}

.comments-empty h4 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}

.comments-empty p {
  margin: 0;
  font-size: 14px;
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.mini-spinner.purple {
  width: 24px;
  height: 24px;
  border-color: rgba(108, 99, 255, 0.2);
  border-top-color: #6c63ff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .comments-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .rating-badge {
    align-items: flex-start;
    width: 100%;
    box-sizing: border-box;
  }

  .comment-form-card {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .replies-branch {
    margin-left: 18px;
  }

  .replies-branch::before {
    left: -10px;
  }
}
</style>
