<template>
  <div class="reactions-container">
    <div class="reactions-header">
      <span class="reactions-title">Reactions</span>
      <span class="reactions-total" v-if="totalReactions > 0">{{ totalReactions }} total</span>
    </div>

    <div class="reactions-list">
      <button
        v-for="item in REACTION_TYPES"
        :key="item.type"
        type="button"
        class="reaction-btn"
        :class="{
          'is-active': userReactions.has(item.type),
          'is-animating': animatingType === item.type
        }"
        :title="item.label"
        @click="toggleReaction(item.type)"
      >
        <span class="reaction-emoji">{{ item.emoji }}</span>
        <span class="reaction-count" v-if="counts[item.type] > 0">{{ counts[item.type] }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'

export type ReactionType = 'like' | 'love' | 'clap' | 'fire' | 'insightful'

const props = defineProps<{
  postId: string
  postType: 'blog' | 'article'
}>()

const REACTION_TYPES: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: 'Thumbs Up' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
]

const counts = ref<Record<ReactionType, number>>({
  like: 0,
  love: 0,
  clap: 0,
  fire: 0,
  insightful: 0,
})

const userReactions = ref<Set<ReactionType>>(new Set())
const animatingType = ref<ReactionType | null>(null)
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

const totalReactions = computed(() => {
  return Object.values(counts.value).reduce((sum, n) => sum + n, 0)
})

const VISITOR_KEY = 'mkhdov_visitor_id'

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

async function loadReactions() {
  if (!props.postId) return

  const visitorId = getVisitorId()

  const { data, error } = await supabase
    .from('post_reactions')
    .select('reaction_type, visitor_id')
    .eq('post_type', props.postType)
    .eq('post_id', props.postId)

  if (error) {
    console.error('Error loading reactions:', error)
    return
  }

  const nextCounts: Record<ReactionType, number> = {
    like: 0,
    love: 0,
    clap: 0,
    fire: 0,
    insightful: 0,
  }
  const nextUserReactions = new Set<ReactionType>()

  for (const row of data || []) {
    const type = row.reaction_type as ReactionType
    if (nextCounts[type] !== undefined) {
      nextCounts[type]++
    }
    if (row.visitor_id === visitorId) {
      nextUserReactions.add(type)
    }
  }

  counts.value = nextCounts
  userReactions.value = nextUserReactions
}

async function toggleReaction(type: ReactionType) {
  if (!props.postId) return

  const visitorId = getVisitorId()
  const isActive = userReactions.value.has(type)

  // Trigger pop animation
  animatingType.value = type
  setTimeout(() => {
    if (animatingType.value === type) animatingType.value = null
  }, 400)

  // Optimistic update
  if (isActive) {
    userReactions.value.delete(type)
    counts.value[type] = Math.max(0, counts.value[type] - 1)
  } else {
    userReactions.value.add(type)
    counts.value[type] = (counts.value[type] || 0) + 1
  }

  if (isActive) {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_type', props.postType)
      .eq('post_id', props.postId)
      .eq('visitor_id', visitorId)
      .eq('reaction_type', type)

    if (error) {
      console.error('Error removing reaction:', error)
      // Rollback
      userReactions.value.add(type)
      counts.value[type]++
    }
  } else {
    const { error } = await supabase.from('post_reactions').insert([
      {
        post_type: props.postType,
        post_id: props.postId,
        visitor_id: visitorId,
        reaction_type: type,
      },
    ])

    if (error) {
      console.error('Error adding reaction:', error)
      // Rollback
      userReactions.value.delete(type)
      counts.value[type] = Math.max(0, counts.value[type] - 1)
    }
  }
}

function subscribeToRealtime() {
  if (!props.postId) return

  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
  }

  realtimeChannel = supabase
    .channel(`reactions_${props.postType}_${props.postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'post_reactions',
        filter: `post_id=eq.${props.postId}`,
      },
      () => {
        void loadReactions()
      }
    )
    .subscribe()
}

onMounted(() => {
  void loadReactions()
  subscribeToRealtime()
})

watch(
  () => props.postId,
  () => {
    void loadReactions()
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
.reactions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.03) 0%, rgba(248, 250, 252, 0.9) 100%);
  border: 1px solid rgba(108, 99, 255, 0.14);
  border-radius: 16px;
  margin: 48px 0 32px;
}

.reactions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reactions-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.reactions-total {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.reactions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.reaction-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #ffffff;
  border: 1.5px solid rgba(226, 232, 240, 0.9);
  border-radius: 999px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.18s ease,
              background-color 0.18s ease,
              box-shadow 0.18s ease;
  user-select: none;
}

.reaction-btn:hover {
  transform: translateY(-2px);
  border-color: rgba(108, 99, 255, 0.35);
  box-shadow: 0 6px 14px rgba(108, 99, 255, 0.1);
}

.reaction-btn.is-active {
  background: rgba(108, 99, 255, 0.1);
  border-color: #6c63ff;
  color: #5548eb;
}

.reaction-btn.is-animating .reaction-emoji {
  animation: reactionBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes reactionBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.4) rotate(-10deg); }
  100% { transform: scale(1); }
}

.reaction-emoji {
  font-size: 18px;
  line-height: 1;
  display: inline-block;
  transition: transform 0.2s ease;
}

.reaction-count {
  font-size: 13px;
  font-weight: 700;
  color: inherit;
}
</style>
