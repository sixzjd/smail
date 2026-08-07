<template>
  <div class="s-table-wrap">
    <table class="s-table">
      <thead>
        <tr>
          <th v-if="selection" class="s-table-checkbox">
            <s-checkbox :modelValue="allSelected" :indeterminate.prop="indeterminate" @update:modelValue="toggleAll" />
          </th>
          <th
            v-for="col in columns"
            :key="col.prop"
            :class="{ sortable: col.sortable }"
            :style="col.width ? { width: col.width } : {}"
            @click="col.sortable && sort(col.prop)"
          >
            {{ col.label }}
            <span v-if="col.sortable && sortProp === col.prop" class="s-sort-icon">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!data.length">
          <td :colspan="totalCols" class="s-table-empty">
            <slot name="empty">暂无数据</slot>
          </td>
        </tr>
        <tr v-for="(row, idx) in sortedData" :key="idx">
          <td v-if="selection" class="s-table-checkbox">
            <s-checkbox :modelValue="isSelected(row)" @update:modelValue="toggleRow(row)" />
          </td>
          <td v-for="col in columns" :key="col.prop">
            <slot :name="col.prop" :row="row" :value="row[col.prop]" :index="idx">
              {{ row[col.prop] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SCheckbox from './s-checkbox.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  selection: Boolean,
  rowKey: { type: String, default: 'id' }
})
const emit = defineEmits(['selection-change', 'sort-change'])

const selectedRows = ref([])
const sortProp = ref('')
const sortOrder = ref('') // asc, desc, ''

const totalCols = computed(() => props.columns.length + (props.selection ? 1 : 0))

const allSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length
})

const indeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < props.data.length
})

const sortedData = computed(() => {
  if (!sortProp.value || !sortOrder.value) return props.data
  return [...props.data].sort((a, b) => {
    const va = a[sortProp.value]
    const vb = b[sortProp.value]
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
})

const isSelected = (row) => selectedRows.value.includes(row)

const toggleRow = (row) => {
  const idx = selectedRows.value.indexOf(row)
  if (idx >= 0) selectedRows.value.splice(idx, 1)
  else selectedRows.value.push(row)
  emit('selection-change', [...selectedRows.value])
}

const toggleAll = (val) => {
  selectedRows.value = val ? [...props.data] : []
  emit('selection-change', [...selectedRows.value])
}

const sort = (prop) => {
  if (sortProp.value !== prop) {
    sortProp.value = prop
    sortOrder.value = 'asc'
  } else if (sortOrder.value === 'asc') {
    sortOrder.value = 'desc'
  } else {
    sortProp.value = ''
    sortOrder.value = ''
  }
  emit('sort-change', { prop: sortProp.value, order: sortOrder.value })
}

defineExpose({
  clearSelection: () => { selectedRows.value = [] }
})
</script>

<style scoped>
.s-sort-icon { font-size: 12px; margin-left: 4px; }
</style>
