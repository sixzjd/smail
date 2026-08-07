<template>
  <div class="s-input-tag-wrap">
    <div class="s-input-tag-tags">
      <span v-for="(tag, i) in modelValue" :key="i" class="s-input-tag-pill" :class="`s-tag--${tagType}`">
        {{ tag }}
        <button type="button" @click="removeTag(i)" class="s-input-tag-remove">×</button>
      </span>
      <input
        ref="inputRef"
        class="s-input-tag-input"
        :placeholder="modelValue.length ? '' : placeholder"
        v-model="inputValue"
        @keydown.enter.prevent="addTag"
        @keydown.backspace="onBackspace"
        @blur="addTag"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  tagType: { type: String, default: 'accent' }
})
const emit = defineEmits(['update:modelValue', 'add-tag'])

const inputValue = ref('')
const inputRef = ref(null)

const addTag = () => {
  const val = inputValue.value.trim()
  if (val && !props.modelValue.includes(val)) {
    const arr = [...props.modelValue, val]
    emit('update:modelValue', arr)
    emit('add-tag', val)
  }
  inputValue.value = ''
}

const removeTag = (i) => {
  const arr = [...props.modelValue]
  arr.splice(i, 1)
  emit('update:modelValue', arr)
}

const onBackspace = () => {
  if (!inputValue.value && props.modelValue.length) {
    removeTag(props.modelValue.length - 1)
  }
}
</script>

<style scoped>
.s-input-tag-wrap {
  background: var(--s-soft);
  border: 1.5px solid transparent;
  border-radius: var(--s-radius);
  padding: 6px 8px;
  transition: all var(--s-ease);
  min-height: 40px;
}
.s-input-tag-wrap:focus-within {
  border-color: var(--s-accent);
  background: var(--s-paper);
}
.s-input-tag-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.s-input-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: var(--s-accent-soft);
  color: var(--s-accent);
}
.s-tag--warning { background: var(--s-warning-soft); color: var(--s-warning); }
.s-tag--success { background: var(--s-success-soft); color: var(--s-success); }
.s-tag--danger { background: var(--s-danger-soft); color: var(--s-danger); }
.s-tag--info { background: var(--s-info-soft); color: var(--s-info); }
.s-input-tag-remove {
  font-size: 14px;
  line-height: 1;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 0;
  border: none;
  background: none;
}
.s-input-tag-remove:hover { opacity: 1; }
.s-input-tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--s-ink);
  font-size: 14px;
  padding: 4px 0;
}
.s-input-tag-input::placeholder { color: var(--s-muted); }
</style>
