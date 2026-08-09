<template>
  <div class="rt-editor" :class="{ 'rt-editor--dark': uiStore.dark, 'rt-editor--fullscreen': isFullscreen }">
    <!-- Toolbar -->
    <div class="rt-toolbar" ref="toolbarRef">
      <div class="rt-toolbar-group">
        <button class="rt-btn" @mousedown.prevent="exec('bold')" :class="{ active: activeFormats.bold }" title="Bold">
          <Icon icon="ri:bold" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('italic')" :class="{ active: activeFormats.italic }" title="Italic">
          <Icon icon="ri:italic" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('underline')" :class="{ active: activeFormats.underline }" title="Underline">
          <Icon icon="ri:underline" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('strikeThrough')" :class="{ active: activeFormats.strikeThrough }" title="Strikethrough">
          <Icon icon="ri:strikethrough" width="16" height="16" />
        </button>
      </div>

      <div class="rt-toolbar-sep"></div>

      <div class="rt-toolbar-group">
        <select class="rt-select" @change="onFontSize($event)" title="Font size" value="">
          <option value="" disabled selected>Size</option>
          <option value="1">10px</option>
          <option value="2">13px</option>
          <option value="3">16px</option>
          <option value="4">18px</option>
          <option value="5">24px</option>
          <option value="6">32px</option>
          <option value="7">48px</option>
        </select>
      </div>

      <div class="rt-toolbar-sep"></div>

      <div class="rt-toolbar-group">
        <button class="rt-btn" @mousedown.prevent="exec('foreColor', colorVal)" title="Text color">
          <span class="rt-color-icon" :style="{ color: colorVal }">A</span>
        </button>
        <input type="color" class="rt-color-input" ref="colorInputRef" @input="onColorPick" value="#d9543e" />
      </div>

      <div class="rt-toolbar-sep"></div>

      <div class="rt-toolbar-group">
        <button class="rt-btn" @mousedown.prevent="exec('justifyLeft')" :class="{ active: activeFormats.justifyLeft }" title="Align left">
          <Icon icon="ri:align-left" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('justifyCenter')" :class="{ active: activeFormats.justifyCenter }" title="Align center">
          <Icon icon="ri:align-center" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('justifyRight')" :class="{ active: activeFormats.justifyRight }" title="Align right">
          <Icon icon="ri:align-right" width="16" height="16" />
        </button>
      </div>

      <div class="rt-toolbar-sep"></div>

      <div class="rt-toolbar-group">
        <button class="rt-btn" @mousedown.prevent="exec('insertUnorderedList')" :class="{ active: activeFormats.insertUnorderedList }" title="Bullet list">
          <Icon icon="ri:list-unordered" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('insertOrderedList')" :class="{ active: activeFormats.insertOrderedList }" title="Numbered list">
          <Icon icon="ri:list-ordered" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('outdent')" title="Outdent">
          <Icon icon="ri:indent-decrease" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="exec('indent')" title="Indent">
          <Icon icon="ri:indent-increase" width="16" height="16" />
        </button>
      </div>

      <div class="rt-toolbar-sep"></div>

      <div class="rt-toolbar-group">
        <button class="rt-btn" @mousedown.prevent="insertLink" title="Insert link">
          <Icon icon="ri:link" width="16" height="16" />
        </button>
        <button class="rt-btn" @mousedown.prevent="triggerImageUpload" title="Insert image">
          <Icon icon="ri:image-line" width="16" height="16" />
        </button>
      </div>

      <div class="rt-toolbar-spacer"></div>

      <div class="rt-toolbar-group">
        <button class="rt-btn" @mousedown.prevent="toggleFullscreen" :class="{ active: isFullscreen }" title="Fullscreen">
          <Icon :icon="isFullscreen ? 'ri:fullscreen-exit' : 'ri:fullscreen-line'" width="16" height="16" />
        </button>
      </div>
    </div>

    <!-- Editable area -->
    <div
      class="rt-content"
      ref="contentRef"
      contenteditable="true"
      @input="onInput"
      @focus="onFocus"
      @mouseup="updateActiveFormats"
      @keyup="updateActiveFormats"
      @paste="onPaste"
      @keydown="onKeydown"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import { useUiStore } from '@/store/ui.js'

const props = defineProps({
  defValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['change', 'focus'])

const uiStore = useUiStore()
const contentRef = ref(null)
const toolbarRef = ref(null)
const colorInputRef = ref(null)
const isFullscreen = ref(false)
const colorVal = ref('#d9543e')

const activeFormats = reactive({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  insertUnorderedList: false,
  insertOrderedList: false
})

defineExpose({
  clearEditor,
  focus,
  getContent
})

onMounted(() => {
  if (props.defValue) {
    contentRef.value.innerHTML = props.defValue
  }
})

watch(() => props.defValue, (val) => {
  if (contentRef.value && contentRef.value.innerHTML !== val) {
    contentRef.value.innerHTML = val || ''
  }
})

function exec(cmd, value = null) {
  contentRef.value?.focus()
  document.execCommand(cmd, false, value)
  updateActiveFormats()
}

function onFontSize(e) {
  const size = e.target.value
  if (size) {
    exec('fontSize', size)
  }
  e.target.value = ''
}

function onColorPick(e) {
  colorVal.value = e.target.value
  exec('foreColor', e.target.value)
}

function insertLink() {
  const sel = window.getSelection()
  const text = sel?.toString() || ''
  const url = prompt('Enter URL:', 'https://')
  if (url) {
    contentRef.value?.focus()
    if (text) {
      document.execCommand('createLink', false, url)
    } else {
      document.execCommand('insertHTML', false, `<a href="${url}">${url}</a>`)
    }
  }
}

function triggerImageUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      contentRef.value?.focus()
      document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;height:auto" />`)
      emitChange()
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function onInput() {
  emitChange()
}

function onFocus() {
  emit('focus')
}

function onPaste(e) {
  // Allow rich paste (images, formatted text)
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      const reader = new FileReader()
      reader.onload = () => {
        document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;height:auto" />`)
        emitChange()
      }
      reader.readAsDataURL(file)
      return
    }
  }
}

function onKeydown(e) {
  // Tab for indent
  if (e.key === 'Tab') {
    e.preventDefault()
    if (e.shiftKey) {
      document.execCommand('outdent')
    } else {
      document.execCommand('indent')
    }
  }
}

function updateActiveFormats() {
  activeFormats.bold = document.queryCommandState('bold')
  activeFormats.italic = document.queryCommandState('italic')
  activeFormats.underline = document.queryCommandState('underline')
  activeFormats.strikeThrough = document.queryCommandState('strikeThrough')
  activeFormats.justifyLeft = document.queryCommandState('justifyLeft')
  activeFormats.justifyCenter = document.queryCommandState('justifyCenter')
  activeFormats.justifyRight = document.queryCommandState('justifyRight')
  activeFormats.insertUnorderedList = document.queryCommandState('insertUnorderedList')
  activeFormats.insertOrderedList = document.queryCommandState('insertOrderedList')
}

function emitChange() {
  const html = contentRef.value?.innerHTML || ''
  const text = contentRef.value?.innerText || ''
  emit('change', html, text)
}

function getContent() {
  return contentRef.value?.innerHTML || ''
}

function clearEditor() {
  if (contentRef.value) {
    contentRef.value.innerHTML = ''
  }
  emitChange()
}

function focus() {
  nextTick(() => {
    contentRef.value?.focus()
  })
}
</script>

<style scoped lang="scss">
.rt-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  overflow: hidden;
  background: var(--s-paper);

  &--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    border-radius: 0;
    border: none;
  }
}

/* ── Toolbar ── */
.rt-toolbar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 6px 8px;
  border-bottom: 1px solid var(--s-line-light);
  background: var(--s-soft);
  flex-shrink: 0;
  flex-wrap: wrap;
  min-height: 38px;
}

.rt-toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.rt-toolbar-sep {
  width: 1px;
  height: 20px;
  background: var(--s-line);
  margin: 0 6px;
  flex-shrink: 0;
}

.rt-toolbar-spacer {
  flex: 1;
}

.rt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--s-muted);
  cursor: pointer;
  border-radius: var(--s-radius-sm);
  transition: all var(--s-ease);
  flex-shrink: 0;

  &:hover {
    background: var(--s-line-light);
    color: var(--s-ink);
  }

  &.active {
    background: var(--s-accent-soft);
    color: var(--s-accent);
  }
}

.rt-color-icon {
  font-weight: 800;
  font-size: 15px;
  line-height: 1;
}

.rt-color-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.rt-select {
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-paper);
  color: var(--s-ink);
  font-size: 12px;
  cursor: pointer;
  outline: none;
  font-family: var(--s-font-body);

  &:hover {
    border-color: var(--s-accent);
  }
}

/* ── Content area ── */
.rt-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  outline: none;
  font-family: var(--s-font-body);
  font-size: 14px;
  line-height: 1.65;
  color: var(--s-ink);
  min-height: 120px;
  word-break: break-word;

  &:empty::before {
    content: attr(data-placeholder);
    color: var(--s-muted);
    pointer-events: none;
  }

  :deep(a) {
    color: var(--s-accent);
    text-decoration: underline;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: var(--s-radius-sm);
    margin: 4px 0;
  }

  :deep(blockquote) {
    margin: 8px 0;
    padding: 8px 16px;
    border-left: 3px solid var(--s-accent);
    background: var(--s-soft);
    border-radius: 0 var(--s-radius-sm) var(--s-radius-sm) 0;
  }

  :deep(pre) {
    background: var(--s-soft);
    padding: 12px 16px;
    border-radius: var(--s-radius);
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    overflow-x: auto;
  }

  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin: 4px 0;
  }

  :deep(ul) { list-style: disc; }
  :deep(ol) { list-style: decimal; }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
  }

  :deep(td), :deep(th) {
    border: 1px solid var(--s-line);
    padding: 8px 12px;
  }

  :deep(th) {
    background: var(--s-soft);
    font-weight: 600;
  }
}
</style>
