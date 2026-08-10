<template>
  <div class="perm-box">
    <div class="header-actions">
      <Icon class="icon" icon="ion:add-outline" width="23" height="23" @click="openAddRole"/>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh"/>
    </div>
    <div class="perm-scroll">
      <div class="loading" :class="tableLoading ? 'loading-show' : 'loading-hide'"
           :style="first ? 'background: transparent' : ''">
        <loading/>
      </div>
      <s-table
          :columns="roleColumns"
          :data="roles"
          rowKey="roleId"
      >
        <template #name="{row}">
          <div class="role-name">
            <span>{{ translateRoleName(row.name) }}</span>
            <span v-if="row.isDefault"><s-tag class="def-tag">{{ $t('default') }}</s-tag></span>
          </div>
        </template>
        <template #description="{row}">
          <div class="description"><span>{{ translateRoleDesc(row.description) }}</span></div>
        </template>
        <template #settingActions="{row}">
          <s-dropdown>
            <template #trigger>
              <s-button size="sm" type="primary">{{ $t('action') }}</s-button>
            </template>
            <s-dropdown-item @click="openRoleSet(row)">{{ $t('change') }}</s-dropdown-item>
            <s-dropdown-item @click="setDef(row)">{{ $t('default') }}</s-dropdown-item>
            <s-dropdown-item @click="delRole(row)">{{ $t('delete') }}</s-dropdown-item>
          </s-dropdown>
        </template>
      </s-table>
    </div>

    <s-modal v-model="roleFormShow" size="md" @close="resetForm">
      <template #title>
        <span style="font-size: 16px; font-weight: 700; font-family: var(--s-font-display)">{{ dialogType.title }}</span>
        <s-tooltip :content="tooltipContent">
          <Icon class="warning" icon="fe:warning" width="18" height="18"/>
        </s-tooltip>
      </template>
      <div class="s-form">
        <div class="s-form-item">
          <label>{{ $t('roleName') }}</label>
          <s-input v-model="form.name" type="text" :placeholder="$t('roleName')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('description') }}</label>
          <s-input v-model="form.description" type="text" :placeholder="$t('description')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('emailInterception') }}</label>
          <s-input-tag tag-type="warning" v-model="form.banEmail" @add-tag="banEmailAddTag" type="text" :placeholder="$t('emailInterception')" autocomplete="off"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('availableDomains') }}</label>
          <s-select
              v-model="form.availDomain"
              multiple
              :options="domainOptions"
              :placeholder="$t('availableDomains')"
          />
        </div>
        <div class="s-form-item">
          <label>{{ $t('order') }}</label>
          <s-input-number :min="0" :max="9999" v-model="form.sort"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('permissions') }}</label>
          <s-radio-group v-model="expand" :options="[{label: $t('expand'), value: true},{label: $t('collapse'), value: false}]" buttonStyle @change="expandChange"/>
        </div>
        <s-tree
            ref="tree"
            :data="treeList"
            show-checkbox
            node-key="permId"
            :default-expand-all="expand"
            :props="{ label: 'name', children: 'children' }"
            class="perm-tree"
        >
          <template #default="{ node, data }">
            <div>
              <span>{{ node.label }}</span>
              <span class="send-num" v-if="data.permKey === 'email:send'" @click.stop>
                <s-input-number v-if="form.sendType === 'day' || form.sendType === 'count'" v-model="form.sendCount" :min="0" :max="99999" />
                  <s-select v-model="form.sendType" :options="sendTypeOptions"
                             :style="`width: ${ locale === 'zh' ? 70 : 90 }px;margin-left: 5px;`"/>
              </span>
              <span class="send-num" v-if="data.permKey === 'account:add'" @click.stop>
                <s-input-number v-model="form.accountCount" :min="0" :max="99999"/>
              </span>
            </div>
          </template>
        </s-tree>
        <s-button type="primary" block :loading="permLoading" @click="roleFormClick">{{ $t('save') }}</s-button>
      </div>
    </s-modal>
  </div>
</template>
<script setup>
import {Icon} from "@iconify/vue";
import {defineOptions, nextTick, reactive, ref, computed} from "vue";
import {roleAdd, roleDelete, rolePermTree, roleRoleList, roleSet, roleSetDef} from "@/request/role.js";
import loading from '@/components/loading/index.vue';
import {useRoleStore} from "@/store/role.js";
import {useUserStore} from "@/store/user.js";
import {useSettingStore} from "@/store/setting.js";
import {isEmail, isDomain} from "@/utils/verify-utils.js";
import {useI18n} from "vue-i18n";
import {toast} from '@/components/ui/toast.js';
import {confirm} from '@/components/ui/confirm.js';

defineOptions({
  name: 'role'
})

const {domainList} = useSettingStore();
const {t, locale} = useI18n();
const userStore = useUserStore();
const roleStore = useRoleStore();
const roleFormShow = ref(false)
const treeList = reactive([])
const roles = ref([])
const tree = ref({})
const permLoading = ref(false)
const tableLoading = ref(false)
const desShow = ref(true)
const settingWidth = ref(null)
const sortWidth = ref(null)
const roleWidth = ref(200)
const first = ref(true)

const dialogType = reactive({
  title: '',
  type: ''
})

// Translate known role names
function translateRoleName(name) {
  if (name === '普通用户') return t('normalUser')
  return name
}

// Translate known role descriptions
function translateRoleDesc(desc) {
  if (desc === '默认用户角色') return t('defaultUserRole')
  return desc
}

const form = reactive({
  name: null,
  description: null,
  banEmail: [],
  sendType: 'count',
  sendCount: 0,
  accountCount: 0,
  sort: 0,
  isDefault: 0,
  availDomain: []
})

let domainOptions = []

const expand = ref(false)

let chooseRole = {}

const tooltipContent = computed(() => {
  return `${t('emailInterception')}: ${t('emailInterceptionDesc')}\n${t('availableDomains')}: ${t('availableDomainsDesc')}`
})

const sendTypeOptions = computed(() => [
  {label: t('total'), value: 'count'},
  {label: t('daily'), value: 'day'},
  {label: t('internal'), value: 'internal'},
  {label: t('btnBan'), value: 'ban'}
])

const roleColumns = computed(() => {
  const cols = []
  cols.push({prop: 'name', label: t('role'), width: roleWidth.value + 'px'})
  cols.push({prop: 'sort', label: t('order'), width: sortWidth.value ? sortWidth.value + 'px' : undefined})
  if (desShow.value) cols.push({prop: 'description', label: t('description'), width: '200px'})
  cols.push({prop: 'settingActions', label: t('tabSetting'), width: settingWidth.value ? settingWidth.value + 'px' : undefined})
  return cols
})

refresh()

rolePermTree().then(tree => {
  treeList.push(...tree)
})

domainOptions = domainList.map(domain => {
  const cleanDomain = domain.replace(/^@/, '');
  return {label: cleanDomain, value: cleanDomain};
});


function availDomainChange() {
  const index = form.availDomain.findIndex(domain => {
    return !domainOptions.map(option => option.value).includes(domain)
  })
  if (index > -1) {
    form.availDomain.splice(index, 1)
  }
}

function banEmailAddTag(val) {
  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  form.banEmail.pop()

  emails.forEach(email => {
    if ((isEmail(email) || isDomain(email) || email === '*') && !form.banEmail.includes(email)) {
      form.banEmail.push(email)
    }
  })
}


function roleFormClick() {
  if (dialogType.type === 'add') {
    addRole()
  } else {
    setRole()
  }
}

function setDef(role) {
  roleSetDef(role.roleId).then(() => {
    toast(t('saveSuccessMsg'), 'success')
    getRoleList()
  })
}

async function delRole(role) {
  const ok = await confirm(t('delConfirm', {msg: role.name}))
  if (ok) {
    roleDelete(role.roleId).then(() => {
      toast(t('copySuccessMsg'), 'success')
      getRoleList()
      userStore.refreshUserList()
      roleStore.refreshSelect()
    })
  }
}

function expandChange(e) {
  if (e) {
    const nodes = tree.value?.store.nodesMap;
    for (const key in nodes) {
      nodes[key].expanded = true;
    }
  } else {
    const nodes = tree.value?.store.nodesMap;
    for (const key in nodes) {
      nodes[key].expanded = false;
    }
  }

}

function setRole() {

  if (!form.name) {
    toast(t('emptyRoleNameMsg'), 'error')
    return
  }

  const params = {...form, roleId: chooseRole.roleId}
  const checkedId = tree.value.getCheckedKeys()
  const halfId = tree.value.getHalfCheckedKeys()
  params.permIds = [...checkedId, ...halfId]

  permLoading.value = true
  roleSet(params).then(() => {
    toast(t('saveSuccessMsg'), 'success')

    const names = roles.value.map(role => role.name)

    if (!names.includes(params.name)) {
      roleStore.refreshSelect()
    }

    roleFormShow.value = false
    getRoleList()
  }).finally(() => {
    permLoading.value = false
  })
}

function resetForm() {
  form.name = null
  form.description = null
  form.sort = 0
  form.sendType = 'count'
  form.sendCount = 0
  form.accountCount = 0
  form.banEmail = []
  form.availDomain = []
  tree.value.setCheckedKeys([])
}

function openRoleSet(role) {
  chooseRole = role
  dialogType.title = t('changeRoleTitle')
  dialogType.type = 'set'
  roleFormShow.value = true
  form.sort = role.sort
  form.name = role.name
  form.description = role.description
  form.sendType = role.sendType
  form.sendCount = role.sendCount
  form.accountCount = role.accountCount
  form.banEmail = role.banEmail
  form.availDomain = role.availDomain
  nextTick(() => {
    tree.value.setCheckedKeys(role.permIds)
  })
}


function openAddRole() {
  dialogType.title = t('addRoleTitle')
  dialogType.type = 'add'
  roleFormShow.value = true
}

function addRole() {
  const params = {...form}
  const checkedId = tree.value.getCheckedKeys()
  const halfId = tree.value.getHalfCheckedKeys()
  params.permIds = [...checkedId, ...halfId]

  permLoading.value = true
  roleAdd(params).then(() => {
    toast(t('addSuccessMsg'), 'success')
    roleFormShow.value = false
    getRoleList()
    roleStore.refreshSelect()
  }).finally(() => {
    permLoading.value = false
  })
}


function refresh() {
  tableLoading.value = true
  roles.length = 0
  getRoleList()
}

function getRoleList() {
  roleRoleList().then(list => {
    roles.value = list
  }).finally(() => {
    tableLoading.value = false
    setTimeout(() => {
      first.value = false
    }, 200)
  })
}

function adjustWidth() {
  desShow.value = window.innerWidth > 767
  settingWidth.value = window.innerWidth < 480 ? (locale.value === 'en' ? 85 : 75) : null
  sortWidth.value = window.innerWidth < 480 ? 75 : null
  roleWidth.value = window.innerWidth < 480 ? 180 : 200
}

adjustWidth()

window.onresize = () => {
  adjustWidth()
};


</script>
<style scoped>
.perm-box {
  height: 100%;
  overflow: hidden;
  width: 100%;
  font-family: var(--s-font-body);
  color: var(--s-ink);

  .perm-scroll {
    height: calc(100% - 48px);
    overflow-y: auto;
    position: relative;
  }
}

.send-num {
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.def-tag {
  margin-left: 8px;
}

.header-actions {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid var(--s-line);
  font-size: 18px;
  background: var(--s-paper);

  .icon {
    cursor: pointer;
    color: var(--s-muted);
    transition: color var(--s-ease);
    &:hover {
      color: var(--s-ink);
    }
  }
}

.warning {
  position: relative;
  left: 6px;
  top: 2px;
  color: var(--s-muted);
  cursor: pointer;
}

.description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading {
  height: calc(100% - 41px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  background: var(--s-paper);
  z-index: 2;
}

.loading-show {
  transition: all 200ms ease 200ms;
  opacity: 1;
}

.loading-hide {
  pointer-events: none;
  transition: opacity 200ms ease;
  opacity: 0;
}

.s-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.s-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.s-form-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--s-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.perm-tree {
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
