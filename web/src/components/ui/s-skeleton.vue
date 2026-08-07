<template>
  <div class="s-skeleton">
    <div v-for="i in rows" :key="i" class="s-skeleton-line" :class="lineClass(i)"></div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: { type: Number, default: 3 }
})

const lineClass = (i) => {
  if (i === props.rows) return 's-skeleton-line--short'
  if (i === props.rows - 1) return 's-skeleton-line--medium'
  return ''
}
</script>
