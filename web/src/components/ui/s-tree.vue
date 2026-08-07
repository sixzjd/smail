<template>
  <div class="s-tree">
    <s-tree-node
      v-for="node in data"
      :key="node[nodeKey]"
      :node="node"
      :props="props"
      :node-key="nodeKey"
      :checked-keys="internalChecked"
      :expanded-keys="internalExpanded"
      :show-checkbox="showCheckbox"
      :depth="0"
      @toggle="onToggle"
      @check="onCheck"
    >
      <template #default="{ node: n, data: d }">
        <slot :node="n" :data="d" />
      </template>
    </s-tree-node>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import STreeNode from './s-tree-node.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  props: { type: Object, default: () => ({ children: 'children', label: 'label' }) },
  nodeKey: { type: String, default: 'id' },
  showCheckbox: Boolean,
  defaultCheckedKeys: { type: Array, default: () => [] },
  defaultExpandAll: Boolean,
  expandOnClickNode: { type: Boolean, default: false },
  checkOnClickNode: { type: Boolean, default: false }
})
const emit = defineEmits(['check'])

const internalChecked = ref([...props.defaultCheckedKeys])
const internalExpanded = ref([])

// Collect all node keys for defaultExpandAll
const collectKeys = (nodes, key) => {
  const keys = []
  const walk = (list) => {
    for (const n of list) {
      keys.push(n[key])
      const children = n[props.props.children]
      if (children?.length) walk(children)
    }
  }
  walk(nodes)
  return keys
}

if (props.defaultExpandAll) {
  internalExpanded.value = collectKeys(props.data, props.nodeKey)
}

watch(() => props.defaultCheckedKeys, (v) => { internalChecked.value = [...v] })

const onToggle = (key) => {
  const idx = internalExpanded.value.indexOf(key)
  if (idx >= 0) internalExpanded.value.splice(idx, 1)
  else internalExpanded.value.push(key)
}

const onCheck = (key, checked) => {
  if (checked) {
    if (!internalChecked.value.includes(key)) internalChecked.value.push(key)
  } else {
    const idx = internalChecked.value.indexOf(key)
    if (idx >= 0) internalChecked.value.splice(idx, 1)
  }
  emit('check', { checkedKeys: [...internalChecked.value] })
}

defineExpose({
  getCheckedKeys: () => [...internalChecked.value],
  setCheckedKeys: (keys) => { internalChecked.value = [...keys] },
  getCheckedNodes: () => {
    const result = []
    const walk = (list) => {
      for (const n of list) {
        if (internalChecked.value.includes(n[props.nodeKey])) result.push(n)
        const children = n[props.props.children]
        if (children?.length) walk(children)
      }
    }
    walk(props.data)
    return result
  }
})
</script>

<style scoped>
.s-tree { font-size: 14px; }
</style>
