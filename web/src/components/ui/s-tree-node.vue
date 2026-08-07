<template>
  <div class="s-tree-node" :style="{ paddingLeft: depth > 0 ? '20px' : '0' }">
    <div class="s-tree-node-row" @click="onRowClick">
      <button
        v-if="hasChildren"
        class="s-tree-expand"
        :class="{ expanded: isExpanded }"
        @click.stop="$emit('toggle', node[nodeKey])"
      >▸</button>
      <span v-else class="s-tree-expand-spacer"></span>

      <label v-if="showCheckbox" class="s-checkbox" :class="{ checked: isChecked }" @click.stop>
        <input type="checkbox" :checked="isChecked" @change="onCheckChange" />
        <span class="s-checkbox-box"><span v-if="isChecked">✓</span></span>
      </label>

      <div class="s-tree-node-content">
        <slot :node="node" :data="node">
          {{ node[props.props.label] }}
        </slot>
      </div>
    </div>

    <template v-if="hasChildren && isExpanded">
      <s-tree-node
        v-for="child in children"
        :key="child[nodeKey]"
        :node="child"
        :props="props"
        :node-key="nodeKey"
        :checked-keys="checkedKeys"
        :expanded-keys="expandedKeys"
        :show-checkbox="showCheckbox"
        :depth="depth + 1"
        @toggle="$emit('toggle', $event)"
        @check="$emit('check', $event, arguments[1])"
      >
        <template #default="{ node: n, data: d }">
          <slot :node="n" :data="d" />
        </template>
      </s-tree-node>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  props: { type: Object, default: () => ({ children: 'children', label: 'label' }) },
  nodeKey: { type: String, default: 'id' },
  checkedKeys: { type: Array, default: () => [] },
  expandedKeys: { type: Array, default: () => [] },
  showCheckbox: Boolean,
  depth: { type: Number, default: 0 }
})
const emit = defineEmits(['toggle', 'check'])

const children = computed(() => props.node[props.props.children] || [])
const hasChildren = computed(() => children.value.length > 0)
const isExpanded = computed(() => props.expandedKeys.includes(props.node[props.nodeKey]))
const isChecked = computed(() => props.checkedKeys.includes(props.node[props.nodeKey]))

const onRowClick = () => {
  // expand on click node if configured
}

const onCheckChange = (e) => {
  emit('check', props.node[props.nodeKey], e.target.checked)
}
</script>

<style scoped>
.s-tree-node-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: var(--s-radius-sm);
  cursor: default;
  transition: background var(--s-ease);
}
.s-tree-node-row:hover { background: var(--s-soft); }

.s-tree-expand {
  width: 18px; height: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; color: var(--s-muted);
  border: none; background: none; cursor: pointer;
  border-radius: 3px;
  transition: transform var(--s-ease);
  flex-shrink: 0;
}
.s-tree-expand.expanded { transform: rotate(90deg); }
.s-tree-expand:hover { background: var(--s-line-light); }
.s-tree-expand-spacer { width: 18px; flex-shrink: 0; }

.s-tree-node-content {
  flex: 1;
  font-size: 14px;
  color: var(--s-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
