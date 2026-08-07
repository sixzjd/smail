<template>
  <div class="s-pagination">
    <button class="s-page-btn" :disabled="currentPage <= 1" @click="go(1)">«</button>
    <button class="s-page-btn" :disabled="currentPage <= 1" @click="go(currentPage - 1)">‹</button>
    <span v-for="p in pages" :key="p" class="s-page-btn" :class="{ active: p === currentPage }" @click="go(p)">
      {{ p }}
    </span>
    <button class="s-page-btn" :disabled="currentPage >= totalPages" @click="go(currentPage + 1)">›</button>
    <button class="s-page-btn" :disabled="currentPage >= totalPages" @click="go(totalPages)">»</button>
    <span class="s-page-info">共 {{ total }} 条</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  pageSize: { type: Number, default: 20 },
  currentPage: { type: Number, default: 1 }
})
const emit = defineEmits(['update:currentPage', 'change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const pages = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  const range = []
  const delta = 2
  const left = Math.max(1, current - delta)
  const right = Math.min(total, current + delta)

  if (left > 1) range.push(1)
  if (left > 2) range.push('...')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push('...')
  if (right < total) range.push(total)

  return range.filter(p => typeof p === 'number')
})

const go = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('update:currentPage', page)
    emit('change', page)
  }
}
</script>
