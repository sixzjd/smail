<template>
  <div class="email-list-box">
    <emailScroll ref="sysEmailScroll"
                 :get-emailList="getEmailList"
                 :email-delete="allEmailDelete"
                 :star-add="starAdd"
                 :star-cancel="starCancel"
                 :show-star="false"
                 show-user-info
                 show-status
                 actionLeft="4px"
                 :show-account-icon="false"
                 :time-sort="params.timeSort"
                 @jump="jumpContent"
                 @refresh-before="refreshBefore"
                 @right-search="rightSearch"
                 :type="'all-email'"

    >
      <template #first>
        <s-input
            v-model="searchValue"
            :placeholder="$t('searchByContent')"
            class="search-input"
        >
          <template #prefix>
            <div @click.stop="openSelect" class="search-type-trigger">
              <div class="search-type">
                <span>{{ selectTitle }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
              <s-select
                  ref="mySelect"
                  v-model="params.searchType"
                  :options="searchTypeOptions"
                  class="select-overlay"
              />
            </div>
          </template>
        </s-input>
        <s-select v-model="params.type" :options="typeOptions" class="status-select" @change="typeSelectChange"/>
        <button class="toolbar-icon-btn" @click="search" :title="$t('search')">
          <Icon icon="iconoir:search" width="18" height="18"/>
        </button>
        <button class="toolbar-icon-btn" @click="changeTimeSort" :title="params.timeSort === 0 ? 'Newest first' : 'Oldest first'">
          <Icon v-if="params.timeSort === 0" icon="material-symbols-light:timer-arrow-down-outline" width="18" height="18"/>
          <Icon v-else icon="material-symbols-light:timer-arrow-up-outline" width="18" height="18"/>
        </button>
        <button class="toolbar-icon-btn" @click="openBathDelete" :title="$t('clearEmail')">
          <Icon icon="fluent:broom-sparkle-16-regular" width="18" height="18"/>
        </button>
      </template>
    </emailScroll>

    <s-modal v-model="showBathDelete" :title="$t('clearEmail')" size="sm" @close="closedClear">
      <div class="clear-email">
        <div class="s-form-item">
          <label>{{ $t('sender') }}</label>
          <s-input v-model="clearParams.sendName" :placeholder="$t('sender')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('subject') }}</label>
          <s-input v-model="clearParams.subject" :placeholder="$t('subject')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('sendEmailAddress') }}</label>
          <s-input v-model="clearParams.sendEmail" :placeholder="$t('sendEmailAddress')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('toEmail') }}</label>
          <s-input v-model="clearParams.toEmail" :placeholder="$t('toEmail')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('dateRange') }}</label>
          <div class="date-range">
            <input type="date" class="s-date-input" v-model="clearTimeStart"/>
            <span class="date-sep">{{ t('to') }}</span>
            <input type="date" class="s-date-input" v-model="clearTimeEnd"/>
          </div>
        </div>
        <div class="clear-button">
          <s-select v-model="clearParams.type" :options="clearTypeOptions" style="width: 200px"/>
          <s-button type="primary" block :loading="clearLoading" @click="batchDelete">{{ t('clear') }}</s-button>
        </div>
      </div>
    </s-modal>
  </div>
</template>

<script setup>
import {starAdd, starCancel} from "@/request/star.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {computed, defineOptions, reactive, ref, watch, onMounted, onUnmounted} from "vue";
import {useEmailStore} from "@/store/email.js";
import {
  allEmailList,
  allEmailDelete,
  allEmailBatchDelete,
  allEmailLatest
} from "@/request/all-email.js";
import {Icon} from "@iconify/vue";
import router from "@/router/index.js";
import {useI18n} from 'vue-i18n';
import {toUtc} from "@/utils/day.js";
import {sleep} from "@/utils/time-utils.js";
import {useSettingStore} from "@/store/setting.js";
import { useRoute } from 'vue-router'
import {toast} from '@/components/ui/toast.js';
import {confirm} from '@/components/ui/confirm.js';

defineOptions({
  name: 'all-email'
})

const route = useRoute()
const {t} = useI18n();
const emailStore = useEmailStore();
const settingStore = useSettingStore();
const clearTimeStart = ref('')
const clearTimeEnd = ref('')
const sysEmailScroll = ref({})
const searchValue = ref('')
const mySelect = ref()
const showBathDelete = ref(false)
const clearLoading = ref(false)

let polling = true

onMounted(() => {
  latest();
})

onUnmounted(() => {
  polling = false
})

const openSelect = () => {
  mySelect.value.toggleMenu()
}

const params = reactive({
  timeSort: 0,
  type: 'receive',
  userEmail: null,
  accountEmail: null,
  name: null,
  subject: null,
  searchType: 'name'
})

const clearParams = reactive({
  subject: '',
  sendEmail: '',
  sendName: '',
  startTime: '',
  toEmail: '',
  endTime: '',
  type: 'eq',
})

const searchTypeOptions = computed(() => [
  {label: t('sender'), value: 'name'},
  {label: t('subject'), value: 'subject'},
  {label: t('user'), value: 'user'},
  {label: t('selectEmail'), value: 'account'}
])

const typeOptions = computed(() => [
  {label: t('all'), value: 'all'},
  {label: t('received'), value: 'receive'},
  {label: t('sent'), value: 'send'},
  {label: t('selectDeleted'), value: 'delete'},
  {label: t('noRecipientTitle'), value: 'noone'}
])

const clearTypeOptions = computed(() => [
  {label: t('equal'), value: 'eq'},
  {label: t('leading'), value: 'left'},
  {label: t('include'), value: 'include'}
])

function resetClearParams() {
  clearParams.subject = ''
  clearParams.sendEmail = ''
  clearParams.sendName = ''
  clearParams.startTime = ''
  clearParams.toEmail = ''
  clearParams.endTime = ''
}

function closedClear() {
  resetClearParams()
  clearParams.type = 'eq'
  clearParams.endTime = ''
  clearTimeStart.value = ''
  clearTimeEnd.value = ''
}

const selectTitle = computed(() => {
  if (params.searchType === 'user') return t('user')
  if (params.searchType === 'account') return t('selectEmail')
  if (params.searchType === 'name') return t('sender')
  if (params.searchType === 'subject') return t('subject')
})

const paramsStar = localStorage.getItem('all-email-params')
if (paramsStar) {
  const locaParams = JSON.parse(paramsStar)
  params.type = locaParams.type
  params.timeSort = locaParams.timeSort
  params.status = locaParams.status
  params.searchType = locaParams.searchType
}

watch(() => params, () => {
  localStorage.setItem('all-email-params', JSON.stringify(params))
}, {
  deep: true
})

function openBathDelete() {
  showBathDelete.value = true
}

async function batchDelete() {

  if (clearTimeStart.value && clearTimeEnd.value) {
    clearParams.startTime = toUtc(clearTimeStart.value).format("YYYY-MM-DD HH:mm:ss")
    clearParams.endTime = toUtc(clearTimeEnd.value).add(1, 'day').format("YYYY-MM-DD HH:mm:ss")
  }

  if (!clearParams.sendEmail && !clearParams.sendName && !clearParams.subject && !clearParams.toEmail && !clearTimeStart.value) {
    showBathDelete.value = false
    return
  }

  const ok = await confirm(t('delAllConfirm'))
  if (ok) {
    clearLoading.value = true

    allEmailBatchDelete(clearParams).then(() => {
      toast(t('clearSuccess'), 'success')
      resetClearParams()
      sysEmailScroll.value.refreshList();
    }).finally(() => {
      clearLoading.value = false
    })
  }
}

function rightSearch(type, value) {
  params.searchType = type;
  searchValue.value = value;
  search();
}

function refreshBefore() {
  searchValue.value = null
  Object.assign(params, { timeSort: 0, type: 'receive', userEmail: null, accountEmail: null, name: null, subject: null, searchType: 'name' })
}

function search() {
  Object.assign(params, { userEmail: null, accountEmail: null, name: null, subject: null })

  if (params.searchType === 'user') {
    params.userEmail = searchValue.value
  }

  if (params.searchType === 'account') {
    params.accountEmail = searchValue.value
  }

  if (params.searchType === 'name') {
    params.name = searchValue.value
  }

  if (params.searchType === 'subject') {
    params.subject = searchValue.value
  }

  sysEmailScroll.value.refreshList();
}

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  search()
}

function typeSelectChange() {
  search()
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'physics'
  emailStore.contentData.showStar = false
  emailStore.contentData.showReply = false
  router.push({name: 'content'})
}


function getEmailList(emailId, size) {
  return allEmailList({emailId, size, ...params})
}

async function latest() {

  while (polling) {

    let autoRefresh = settingStore.settings.autoRefresh;

    await sleep(autoRefresh > 1 ? autoRefresh * 1000 : 3000);

    const latestId = sysEmailScroll.value.latestEmail?.emailId

    if (autoRefresh < 2) {
      continue
    }

    if (!latestId && latestId !== 0) {
      continue
    }

    if (route.name !== 'all-email') {
      continue
    }


    if (params.type !== 'receive') {
      continue
    }

    try {

      const curTimeSort = params.timeSort
      let list = await allEmailLatest(latestId)

      if (list.length === 0) {
        continue
      }

      if (params.type !== 'receive') {
        continue
      }

      // 确保回来之后条件没变
      if (params.timeSort !== curTimeSort) {
        continue
      }

      for (let email of list) {

        sysEmailScroll.value.addItem(email)

      }

    } catch (e) {
      if (e.code === 401 || e.code === 403) {
        settingStore.settings.autoRefresh = 0;
      }
      console.error(e)
    }

  }
}

</script>
<style scoped>
.email-list-box {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: var(--s-font-body);
  color: var(--s-ink);
}

.search-type-trigger {
  position: relative;
  cursor: pointer;
}

.search-type {
  display: flex;
  align-items: center;
  color: var(--s-muted);
  font-size: 13px;
  white-space: nowrap;
  gap: 2px;
}

.select-overlay {
  position: absolute;
  width: 40px;
  opacity: 0;
  pointer-events: none;
  top: 0;
  left: 0;
}

.search-input {
  width: 100%;
  max-width: 280px;
  height: 32px;

  .setting-icon {
    position: relative;
    top: 2px;
  }
}

.clear-email {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-sep {
  color: var(--s-muted);
  font-size: 13px;
  white-space: nowrap;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.status-select {
  width: 110px;
}

.toolbar-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--s-muted);
  border-radius: var(--s-radius-sm);
  cursor: pointer;
  transition: all var(--s-ease);
  flex-shrink: 0;

  &:hover {
    background: var(--s-soft);
    color: var(--s-accent);
  }
}

.s-date-input {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  background: var(--s-paper);
  color: var(--s-ink);
  font-family: var(--s-font-body);
  font-size: 13px;
  outline: none;
  transition: border-color var(--s-ease);
  &:focus {
    border-color: var(--s-accent);
  }
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
