<template>
  <div class="reg-key">
    <div class="header-actions">
      <Icon class="icon" icon="ion:add-outline" width="23" height="23" @click="openAdd"/>
      <div class="search">
        <s-input
            v-model="params.code"
            class="search-input"
            :placeholder="$t('searchRegKeyDesc')"
        />
      </div>
      <Icon class="icon" icon="iconoir:search" @click="search" width="20" height="20"/>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh"/>
      <Icon class="icon" icon="fluent:broom-sparkle-16-regular" width="22" height="22" @click="clearNotUse"/>
    </div>

    <div class="scroll-area">
      <div class="loading" :class="regKeyLoading ? 'loading-show' : 'loading-hide'" :style="regKeyFirst ? 'background: transparent' : ''">
        <loading/>
      </div>
      <div class="code-box">
        <div class="code-item" v-for="item in regKeyData" :key="item.regKeyId">
          <div class="code-info">
            <div class="info-left">
              <div class="info-left-item">
                <span class="code" @click="copyCode(item.code)">{{ item.code }}</span>
              </div>
              <div class="info-left-item">
                <div class="info-label">{{ $t('remainingUses') }}:</div>
                <div v-if="item.count">{{ item.count }}</div>
                <s-tag v-else type="danger">{{ $t('exhausted') }}</s-tag>
              </div>
              <div class="info-left-item">
                <div class="info-label">{{ $t('roleDesc') }}:</div>
                <s-tag>{{ item.roleName }}</s-tag>
              </div>
              <div class="info-left-item">
                <div class="info-label">{{ $t('validUntil') }}:</div>
                <div v-if="item.expireTime">{{ formatExpireTime(item.expireTime) }}</div>
                <s-tag v-else type="danger">{{ $t('expired') }}</s-tag>
              </div>
            </div>
            <div class="info-right">
              <s-dropdown>
                <template #trigger>
                  <Icon class="setting" icon="fluent:settings-24-filled" width="21" height="21" color="var(--s-muted)"/>
                </template>
                <s-dropdown-item @click="copyCode(item.code)">{{ $t('copy') }}</s-dropdown-item>
                <s-dropdown-item @click="openHistory(item)">{{ $t('history') }}</s-dropdown-item>
                <s-dropdown-item @click="deleteRegKey(item)">{{ $t('delete') }}</s-dropdown-item>
              </s-dropdown>
            </div>
          </div>
        </div>
      </div>
      <div class="empty" v-if="regKeyData.length === 0">
        <s-empty v-if="!regKeyFirst" :description="$t('noCodeFound')"/>
      </div>
    </div>

    <s-modal v-model="showAdd" :title="$t('addRegKey')" size="sm">
      <div class="s-form">
        <div class="s-form-item">
          <label>{{ $t('regKey') }}</label>
          <s-input v-model="addForm.code" :placeholder="$t('regKey')">
            <template #suffix>
              <Icon @click.stop="genCode" class="gen-code" icon="bitcoin-icons:refresh-filled" width="24" height="24"/>
            </template>
          </s-input>
        </div>
        <div class="s-form-item">
          <label>{{ $t('roleDesc') }}</label>
          <s-select v-model="addForm.roleId" :options="roleOptions" :placeholder="$t('roleDesc')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('validUntil') }}</label>
          <input type="date" class="s-date-input" v-model="addForm.expireTime"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('count') }}</label>
          <s-input-number v-model="addForm.count" :min="1" :max="99999"/>
        </div>
        <s-button type="primary" block :loading="addLoading" @click="submit">
          {{ $t('add') }}
        </s-button>
      </div>
    </s-modal>

    <s-modal v-model="showRegKeyHistory" :title="$t('useHistory')" size="md">
      <div class="history-loading" v-if="historyLoading">
        <loading/>
      </div>
      <s-table
          v-if="!historyLoading"
          :columns="historyColumns"
          :data="historyList"
          rowKey="email"
      />
    </s-modal>
  </div>
</template>

<script setup>
import {defineOptions, nextTick, reactive, ref, watch, computed} from "vue"
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {useSettingStore} from "@/store/setting.js";
import {roleSelectUse} from "@/request/role.js";
import {useRoleStore} from "@/store/role.js";
import {regKeyAdd, regKeyList, regKeyClearNotUse, regKeyDelete, regKeyHistory} from "@/request/reg-key.js";
import {getTextWidth} from "@/utils/text.js";
import dayjs from "dayjs";
import {tzDayjs} from "@/utils/day.js";
import {useI18n} from "vue-i18n";
import {toast} from '@/components/ui/toast.js';
import {confirm} from '@/components/ui/confirm.js';

defineOptions({
  name: 'reg-key'
})

const roleStore = useRoleStore();
const settingStore = useSettingStore();
const params = reactive({
  code: '',
})

const {t} = useI18n()
const roleList = reactive([])
const addLoading = ref(false)
const showAdd = ref(false)
const regKeyLoading = ref(true)
const regKeyFirst = ref(true)
const showRegKeyHistory = ref(false)
const historyList = reactive([])
const emailColumnWidth = ref(0)
const createTimeColumnWidth = ref(0)
const historyLoading = ref(false)
const isMobile = window.innerWidth < 1025

const addForm = reactive({
  code: '',
  count: 1,
  roleId: null,
  expireTime: null
})

const regKeyData = reactive([])

const roleOptions = computed(() => roleList.map(item => ({label: item.name, value: item.roleId})))

const historyColumns = computed(() => [
  {prop: 'email', label: t('user'), width: emailColumnWidth.value ? emailColumnWidth.value + 'px' : undefined},
  {prop: 'createTime', label: t('date'), width: createTimeColumnWidth.value ? createTimeColumnWidth.value + 'px' : undefined}
])

getList(true)

roleSelectUse().then(list => {
  roleList.length = 0
  roleList.push(...list)
})

watch(() => roleStore.refresh, () => {
  roleSelectUse().then(list => {
    roleList.length = 0
    roleList.push(...list)
  })
})

function openHistory(regKey) {

  historyList.length = 0
  historyLoading.value = true
  regKeyHistory(regKey.regKeyId).then(list => {

    historyList.push(...list)
    if (list.length > 0) {

      const email = list.reduce((a, b) =>
          compareByLengthAndUpperCase(a, b, 'email')
      ).email;

      emailColumnWidth.value = getTextWidth(email) + 30
      emailColumnWidth.value = emailColumnWidth.value < 300 ? emailColumnWidth.value : 300
      const createTime = list.reduce((a, b) =>
          compareByLengthAndUpperCase(a, b, 'createTime')
      ).createTime;
      createTimeColumnWidth.value = getTextWidth(createTime)
    }

  }).finally(() => {
    historyLoading.value = false
  })

  showRegKeyHistory.value = true
}

const compareByLengthAndUpperCase = (a, b, key) => {
  const getUpperCaseCount = (str) => (str.match(/[A-Z]/g) || []).length;
  if (a[key].length === b[key].length) {
    return getUpperCaseCount(a[key]) > getUpperCaseCount(b[key]) ? a : b;
  }
  return a[key].length > b[key].length ? a : b;
};

function formatUserCreateTime(regKey) {
  const createTime = tzDayjs(regKey.createTime);
  const currentYear = dayjs().year();
  const expireYear = createTime.year();

  if (settingStore.lang === 'en') {

    if (expireYear === currentYear) {
      return createTime.format('MMM D, HH:mm');
    } else {
      return createTime.format('MMM D, YYYY HH:mm');
    }

  } else {

    if (expireYear === currentYear) {
      return createTime.format('M月D日 HH:mm');
    } else {
      return createTime.format('YYYY年M月D日 HH:mm');
    }

  }

}

function formatExpireTime(expireTime) {
  const expireDate = tzDayjs(expireTime);
  const currentYear = dayjs().year();
  const expireYear = expireDate.year();

  if (settingStore.lang === 'en') {

    return expireYear === currentYear
        ? expireDate.format('MMM D')
        : expireDate.format('MMM D, YYYY');

  } else {

    return expireYear === currentYear
        ? expireDate.format('M月D日')
        : expireDate.format('YYYY年M月D日');

  }
}

function refresh() {
  params.code = null
  getList(true)
}

function search() {
  getList(true)
}

function getList(showLoading = false) {
  if (showLoading) {
    regKeyLoading.value = true
  }
  regKeyList(params).then(list => {
    regKeyData.length = 0
    regKeyData.push(...list)
    regKeyLoading.value = false
    setTimeout(() => {
      regKeyFirst.value = false
    },200)
  })
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    toast(t('copySuccessMsg'), 'success')
  } catch (err) {
    console.error('复制失败:', err);
    toast('复制失败', 'error')
  }
}

function genCode() {
  addForm.code = generateRandomCode()
}

function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function clearNotUse() {
  const ok = await confirm(t('clearRegKey'))
  if (ok) {
    regKeyClearNotUse().then(() => {
      toast(t('clearSuccess'), 'success')
      getList()
    })
  }
}

function submit() {

  if (!addForm.code) {
    toast(t('emptyRegKeyMsg'), 'error')
    return
  }

  if (!addForm.roleId) {
    toast(t('emptyRole'), 'error')
    return
  }

  if (!addForm.expireTime) {
    toast(t('emptyTimeMsg'), 'error')
    return
  }

  if (!addForm.count) {
    toast(t('emptyCountMsg'), 'error')
    return
  }

  addLoading.value = true
  regKeyAdd(addForm).then(() => {
    showAdd.value = false
    resetForm()
    toast(t('addSuccessMsg'), 'success')
    getList()
  }).finally(() => {
    addLoading.value = false
  })
}

async function deleteRegKey(regKey) {
  const ok = await confirm(t('delConfirm', {msg: regKey.code}))
  if (ok) {
    regKeyDelete([regKey.regKeyId]).then(() => {
      getList()
      toast(t('delSuccessMsg'), 'success')
    })
  }
}

function resetForm() {
  addForm.code = ''
}

function openAdd() {
  genCode()
  showAdd.value = true
}

</script>

<style scoped>
.reg-key {
  height: 100%;
  overflow: hidden;
  font-family: var(--s-font-body);
  color: var(--s-ink);
}

.scroll-area {
  height: calc(100% - 48px);
  position: relative;
  overflow-y: auto;
  background: var(--s-body);
  @media (max-width: 372px) {
    height: calc(100% - 85px);
  }
}

.code-box {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.code-item {
  background: var(--s-paper);
  border-radius: var(--s-radius);
  border: 1px solid var(--s-line);
  transition: box-shadow var(--s-ease);
  padding: 16px;

  &:hover {
    box-shadow: var(--s-shadow-sm);
  }

  .code-info {
    display: flex;

    .info-left {
      flex: 1;
      min-width: 0;

      .info-left-item {
        display: flex;
        padding-top: 6px;
        align-items: center;
        gap: 6px;
        font-size: 13px;

        .code {
          font-weight: 700;
          font-size: 15px;
          font-family: var(--s-font-display);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          color: var(--s-accent);

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .info-label {
        color: var(--s-muted);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        white-space: nowrap;
        margin-right: 4px;
      }

      .info-left-item:first-child {
        padding-top: 0;
      }
    }

    .info-right {
      display: flex;
      flex-direction: column;
      padding-top: 2px;
      gap: 5px;
    }
  }
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60%;
}

.history-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.loading {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
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

.setting {
  cursor: pointer;
}

.gen-code {
  color: var(--s-muted);
  cursor: pointer;
}

.header-actions {
  padding: 10px 16px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
  border-bottom: 1px solid var(--s-line);
  font-size: 18px;
  background: var(--s-paper);

  .search-input {
    width: min(200px, calc(100vw - 140px));
  }

  .icon {
    cursor: pointer;
    color: var(--s-muted);
    transition: color var(--s-ease);
    &:hover {
      color: var(--s-ink);
    }
  }
}

.s-date-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  background: var(--s-paper);
  color: var(--s-ink);
  font-family: var(--s-font-body);
  font-size: 14px;
  outline: none;
  transition: border-color var(--s-ease);
  &:focus {
    border-color: var(--s-accent);
  }
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
</style>
