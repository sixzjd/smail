<template>
  <div class="s-select" :class="{ open }" ref="selectRef">
    <div class="s-select-trigger" @click="toggle" :tabindex="disabled ? -1 : 0" @keydown="handleKeydown">
      <div v-if="multiple" class="s-select-tags">
        <span v-for="val in selectedValues" :key="val" class="s-select-tag">
          {{ getLabel(val) }}
          <button @click.stop="removeTag(val)" type="button">×</button>
        </span>
        <span v-if="!selectedValues.length" class="s-select-value s-select-placeholder">{{ placeholder }}</span>
      </div>
      <span v-else class="s-select-value" :class="{ 's-select-placeholder': !modelValue }">
        {{ selectedLabel || placeholder }}
      </span>
      <span class="s-select-arrow">▼</span>
    </div>
    <div v-if="open" class="s-select-dropdown">
      <div
        v-for="opt in options"
        :key="opt.value"
        class="s-select-option"
        :class="{ selected: isSelected(opt.value) }"
        @click="selectOption(opt.value)"
      >
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Array], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  disabled: Boolean,
  multiple: Boolean
})
const emit = defineEmits(['update:modelValue', 'change'])

const open = ref(false)
const selectRef = ref(null)

const selectedValues = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) return props.modelValue
  return []
})

const selectedLabel = computed(() => {
  if (props.multiple) return ''
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : ''
})

const getLabel = (val) => {
  const opt = props.options.find(o => o.value === val)
  return opt ? opt.label : val
}

const isSelected = (val) => {
  if (props.multiple) return selectedValues.value.includes(val)
  return props.modelValue === val
}

const toggle = () => {
  if (!props.disabled) open.value = !open.value
}

const selectOption = (val) => {
  if (props.multiple) {
    const arr = [...selectedValues.value]
    const idx = arr.indexOf(val)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(val)
    emit('update:modelValue', arr)
    emit('change', arr)
  } else {
    emit('update:modelValue', val)
    emit('change', val)
    open.value = false
  }
}

const removeTag = (val) => {
  const arr = selectedValues.value.filter(v => v !== val)
  emit('update:modelValue', arr)
  emit('change', arr)
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggle()
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

const handleClickOutside = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
