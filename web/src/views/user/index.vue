<template>
  <div class="user-box">
    <div class="header-actions">
      <Icon class="icon" icon="ion:add-outline" width="23" height="23" @click="openAdd"/>
      <div class="search">
        <s-input
            v-model="params.email"
            class="search-input"
            :placeholder="$t('searchByEmail')"
        />
      </div>
      <s-select v-model="params.status" :options="statusOptions" class="status-select"
                 :style="`width: ${locale === 'en' ? 100 : 85 }px`"/>
      <Icon class="icon" icon="iconoir:search" @click="search" width="20" height="20"/>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-down-outline"
            v-if="params.timeSort === 1" width="28" height="28"/>
      <Icon class="icon" @click="changeTimeSort" icon="material-symbols-light:timer-arrow-up-outline" v-else width="28"
            height="28"/>
      <Icon class="icon" icon="ion:reload" width="18" height="18" @click="refresh"/>
      <Icon class="icon" icon="uiw:delete" width="16" height="16" @click="delUser"/>
    </div>
    <div class="scroll-area" ref="scrollbarRef">
      <div>
        <div class="loading" :class="tableLoading ? 'loading-show' : 'loading-hide'"
             :style="first ? 'background: transparent' : ''">
          <loading/>
        </div>
        <s-table
            :columns="tableColumns"
            :data="users"
            selection
            rowKey="userId"
            @selection-change="onSelectionChange"
        >
          <template #emailAddress="{row}">
            <div style="display: flex;gap: 5px;align-items:center">
              <div class="email-row">{{ row.email }}</div>
              <s-tag type="warning" v-if="row.username">L</s-tag>
            </div>
          </template>
          <template #receiveEmailCount="{row}">
            {{ formatterReceive(row) }}
          </template>
          <template #sendEmailCount="{row}">
            {{ formatterSend(row) }}
          </template>
          <template #accountCount="{row}">
            {{ formatterAccount(row) }}
          </template>
          <template #createTime="{row}">
            {{ tzDayjs(row.createTime).format('YYYY-MM-DD HH:mm') }}
          </template>
          <template #status="{row}">
            <s-tag v-if="row.isDel === 1" type="info">{{ $t('deleted') }}</s-tag>
            <s-tag v-else-if="row.status === 0" type="accent">{{ $t('active') }}</s-tag>
            <s-tag v-else-if="row.status === 1" type="danger">{{ $t('banned') }}</s-tag>
          </template>
          <template #type="{row}">
            <div class="type">{{ toRoleName(row.type) }}</div>
          </template>
          <template #actions="{row}">
            <s-button size="sm" type="primary" v-if="(row.type === 0 && userStore.user.type !== 0)">{{ $t('action') }}</s-button>
            <s-dropdown v-else>
              <template #trigger>
                <s-button size="sm" type="primary">{{ $t('action') }}</s-button>
              </template>
              <s-dropdown-item @click="openSetPwd(row)">{{ $t('chgPwd') }}</s-dropdown-item>
              <s-dropdown-item @click="openSetType(row)">{{ $t('perm') }}</s-dropdown-item>
              <template v-if="row.type !== 0">
                <s-dropdown-item v-if="row.isDel !== 1" @click="setStatus(row)">
                  {{ setStatusName(row) }}
                </s-dropdown-item>
                <s-dropdown-item v-else @click="restore(row)">{{ $t('restore') }}</s-dropdown-item>
              </template>
              <s-dropdown-item @click="openAccountList(row.userId)">{{ $t('account') }}</s-dropdown-item>
              <s-dropdown-item @click="openDetails(row)">{{ $t('details') }}</s-dropdown-item>
            </s-dropdown>
          </template>
        </s-table>
        <div class="pagination" v-if="total > 10">
          <s-pagination
              :current-page="params.num"
              :page-size="params.size"
              :total="total"
              @update:currentPage="numChange"
          />
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <s-modal v-model="setPwdShow" :title="$t('changePassword')" size="sm" @close="resetUserForm">
      <div class="s-form">
        <s-input v-model="userForm.password" type="password" :placeholder="$t('newPassword')"/>
        <s-button type="primary" block :loading="settingLoading" @click="updatePwd">{{ $t('save') }}</s-button>
      </div>
    </s-modal>

    <!-- Change Permission Modal -->
    <s-modal v-model="setTypeShow" :title="$t('changePerm')" size="sm" @close="resetUserForm">
      <div class="s-form">
        <s-input v-if="userForm.type === 0" :modelValue="$t('admin')" disabled/>
        <s-select v-else v-model="userForm.type" :options="roleOptions" placeholder="Select"/>
        <s-button :disabled="userForm.type === 0" type="primary" block :loading="settingLoading" @click="setType">{{ $t('save') }}</s-button>
      </div>
    </s-modal>

    <!-- Add User Modal -->
    <s-modal v-model="showAdd" :title="$t('addUser')" size="sm">
      <div class="s-form">
        <div class="s-form-item">
          <label>{{ $t('emailAccount') }}</label>
          <div class="email-input-group">
            <s-input v-model="addForm.email" type="text" :placeholder="$t('emailAccount')" style="flex:1"/>
            <s-select v-model="addForm.suffix" :options="domainOptions" :placeholder="$t('select')"/>
          </div>
        </div>
        <div class="s-form-item">
          <label>{{ $t('password') }}</label>
          <s-input type="password" v-model="addForm.password" :placeholder="$t('password')"/>
        </div>
        <div class="s-form-item">
          <label>{{ $t('perm') }}</label>
          <s-select v-model="addForm.type" :options="roleOptions" :placeholder="$t('perm')"/>
        </div>
        <s-button type="primary" block @click="submit" :loading="addLoading">{{ $t('add') }}</s-button>
      </div>
    </s-modal>

    <!-- Account List Modal -->
    <s-modal v-model="accountShow" :title="t('userAccount')" size="md" @close="resetAccountList">
      <div class="account-table-wrap">
        <div class="loading" v-if="accountLoading" style="position:absolute;inset:0;z-index:2">
          <loading/>
        </div>
        <s-table
            :columns="accountColumns"
            :data="accountList"
            rowKey="accountId"
        >
          <template #email="{row}">
            <div class="email-row">{{ row.email }}</div>
          </template>
          <template #isDel="{row}">
            <s-tag type="accent" v-if="row.isDel === 0">{{$t('active')}}</s-tag>
            <s-tag type="info" v-if="row.isDel === 1">{{$t('deleted')}}</s-tag>
          </template>
          <template #accountActions="{row}">
            <s-dropdown>
              <template #trigger>
                <s-button type="primary" size="sm">{{t('action')}}</s-button>
              </template>
              <s-dropdown-item @click="deleteAccount(row)">{{ $t('delete') }}</s-dropdown-item>
            </s-dropdown>
          </template>
        </s-table>
        <div class="account-pagination" v-if="accountParams.total > 0">
          <s-pagination
              :current-page="accountParams.num"
              :page-size="accountParams.size"
              :total="accountParams.total"
              @update:currentPage="accountCurChange"
          />
        </div>
      </div>
    </s-modal>

    <!-- User Details Modal -->
    <s-modal v-model="detailsShow" :title="t('userDetails')" size="md">
      <div class="details">
        <div v-if="userDetails.username" class="details-row">
          <span class="details-item-title">LinuxDo:</span>
          <img v-if="userDetails.avatar" :src="userDetails.avatar" class="linuxdo-avatar" width="30" height="30"/>
          <span style="margin: 0 10px">{{ $t('username') }}: {{userDetails.username}}</span>
          <span>{{ $t('level') }}: <s-tag type="success">{{userDetails.trustLevel}}</s-tag></span>
        </div>
        <div v-if="!sendNumShow" class="details-row"><span class="details-item-title">{{ $t('tabSent') }}:</span>{{ userDetails.sendEmailCount }}</div>
        <div v-if="!accountNumShow" class="details-row"><span class="details-item-title">{{ $t('tabMailboxes') }}:</span>{{ userDetails.accountCount }}</div>
        <div v-if="!createTimeShow" class="details-row"><span class="details-item-title">{{ $t('tabRegisteredAt') }}:</span>{{ tzDayjs(userDetails.createTime).format('YYYY-MM-DD HH:mm') }}</div>
        <div v-if="!typeShow" class="details-row"><span class="details-item-title">{{ $t('perm') }}:</span>{{ toRoleName(userDetails.type) }}</div>
        <div v-if="!statusShow" class="details-row">
          <span class="details-item-title">{{ $t('tabStatus') }}:</span>
          <s-tag v-if="userDetails.isDel === 1" type="info">{{ $t('deleted') }}</s-tag>
          <s-tag v-else-if="userDetails.status === 0" type="accent">{{ $t('active') }}</s-tag>
          <s-tag v-else-if="userDetails.status === 1" type="danger">{{ $t('banned') }}</s-tag>
        </div>
        <div class="details-row"><span class="details-item-title">{{ $t('registrationIp') }}:</span>{{ userDetails.createIp || $t('unknown') }}</div>
        <div class="details-row"><span class="details-item-title">{{ $t('recentIP') }}:</span>{{ userDetails.activeIp || $t('unknown') }}</div>
        <div class="details-row"><span class="details-item-title">{{ $t('recentActivity') }}:</span>{{ userDetails.activeTime ? tzDayjs(userDetails.activeTime).format('YYYY-MM-DD') : $t('unknown') }}</div>
        <div class="details-row"><span class="details-item-title">{{ $t('loginDevice') }}:</span>{{ userDetails.device || $t('unknown') }}</div>
        <div class="details-row"><span class="details-item-title">{{ $t('loginSystem') }}:</span>{{ userDetails.os || $t('unknown') }}</div>
        <div class="details-row"><span class="details-item-title">{{ $t('browserLogin') }}:</span>{{ userDetails.browser || $t('unknown') }}</div>
        <div class="details-row">
          <span class="details-item-title">{{ $t('sendEmail') }}:</span>
          <span>{{ formatSendCount(userDetails) }}</span>
          <s-tag style="margin-left: 10px" v-if="userDetails.sendAction.hasPerm">{{ formatSendType(userDetails) }}</s-tag>
          <s-button size="sm" style="margin-left: 10px"
                     v-if="userDetails.sendAction.hasPerm && userDetails.sendAction.sendCount"
                     @click="resetSendCount(userDetails)" type="primary">{{ $t('reset') }}
          </s-button>
        </div>
      </div>
    </s-modal>

  </div>
</template>

<script setup>
import {defineOptions, reactive, ref, watch, computed} from 'vue'
import {
  userList,
  userDelete,
  userSetPwd,
  userSetStatus,
  userSetType,
  userAdd,
  userRestSendCount,
  userRestore,
  userDeleteAccount,
  userAllAccount
} from '@/request/user.js'
import {roleSelectUse} from "@/request/role.js";
import {Icon} from "@iconify/vue";
import loading from "@/components/loading/index.vue";
import {tzDayjs} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useRoleStore} from "@/store/role.js";
import {useUserStore} from "@/store/user.js";
import {useI18n} from 'vue-i18n';
import {toast} from '@/components/ui/toast.js';
import {confirm} from '@/components/ui/confirm.js';

defineOptions({
  name: 'user'
})

const {t, locale} = useI18n();
const roleStore = useRoleStore()
const userStore = useUserStore()
const settingStore = useSettingStore()
const filteredValue = ['normal', 'del']
const filters = [{text: t('active'), value: 'normal'}, {text: t('deleted'), value: 'del'}]
const preserveExpanded = ref(false)
const emailWidth = ref(230)
const expandWidth = ref(40)
const settingWidth = ref(null)
const sendNumShow = ref(true)
const accountNumShow = ref(true)
const createTimeShow = ref(true)
const statusShow = ref(true)
const typeShow = ref(true)
const receiveWidth = ref(null)
const phonePageShow = ref(false)
const detailsShow = ref(false);
const layout = ref('prev, pager, next,  sizes, total')
const pageSize = ref('')
const users = ref([])
const selectedUsers = ref([])
const tableRef = ref({})
const userDetails = ref({})
const total = ref(0)
const first = ref(true)
const scrollbarRef = ref(null)
const accountLoading = ref(false)
const rightClickUser = ref({});

const domainList = settingStore.domainList

const addForm = reactive({
  email: '',
  suffix: settingStore.domainList[0],
  password: '',
  type: null,
})

const params = reactive({
  email: '',
  num: 1,
  size: 15,
  timeSort: 0,
  status: -1
})
let chooseUser = {}
const userForm = reactive({
  password: null,
  type: -1,
  userId: 0,
})

const showAdd = ref(false)
const accountShow = ref(false)
const addLoading = ref(false);
const setTypeShow = ref(false)
const setPwdShow = ref(false)
const pagerCount = ref(10)
const settingLoading = ref(false)
const tableLoading = ref(true)
const roleList = reactive([])
const mySelect = ref({})
const accountList = reactive([])
const accountParams = reactive({
  size: 10,
  num: 0,
  total: 0,
  userId: 0,
})

const statusOptions = computed(() => [
  {label: t('all'), value: -1},
  {label: t('active'), value: 0},
  {label: t('banned'), value: 1},
  {label: t('deleted'), value: -2}
])

const roleOptions = computed(() => roleList.map(item => ({label: item.name, value: item.roleId})))
const domainOptions = computed(() => domainList.map(d => ({label: d, value: d})))

const tableColumns = computed(() => {
  const cols = []
  cols.push({prop: 'emailAddress', label: t('tabEmailAddress'), width: emailWidth.value ? emailWidth.value + 'px' : undefined})
  cols.push({prop: 'receiveEmailCount', label: t('tabReceived'), width: receiveWidth.value ? receiveWidth.value + 'px' : undefined})
  if (sendNumShow.value) cols.push({prop: 'sendEmailCount', label: t('tabSent')})
  if (accountNumShow.value) cols.push({prop: 'accountCount', label: t('tabMailboxes')})
  if (createTimeShow.value) cols.push({prop: 'createTime', label: t('tabRegisteredAt'), width: '160px'})
  if (statusShow.value) cols.push({prop: 'status', label: t('tabStatus'), width: '80px'})
  if (typeShow.value) cols.push({prop: 'type', label: t('tabRole'), width: '140px'})
  cols.push({prop: 'actions', label: t('tabSetting'), width: settingWidth.value ? settingWidth.value + 'px' : undefined})
  return cols
})

const accountColumns = computed(() => [
  {prop: 'email', label: t('emailAccount')},
  {prop: 'isDel', label: t('tabStatus'), width: (locale.value === 'en' ? 75 : 65) + 'px'},
  {prop: 'accountActions', label: t('action'), width: (locale.value === 'en' ? 75 : 65) + 'px'}
])

roleSelectUse().then(list => {
  roleList.length = 0
  roleList.push(...list)
})

const paramsStar = localStorage.getItem('user-params')
if (paramsStar) {
  const localParams = JSON.parse(paramsStar)
  params.num = localParams.num
  params.size = localParams.size
  params.timeSort = localParams.timeSort
  params.status = localParams.status
}

watch(() => params, () => {
  localStorage.setItem('user-params', JSON.stringify(params))
}, {
  deep: true
})

watch(() => roleStore.refresh, () => {
  roleSelectUse().then(list => {
    roleList.length = 0
    roleList.push(...list)
  })
})

watch(() => userStore.refreshList, () => {
  getUserList(false)
})

getUserList()

const filterItem = reactive({
  send: ['normal', 'del'],
  account: ['normal', 'del'],
  receive: ['normal', 'del']
})

function onSelectionChange(rows) {
  selectedUsers.value = rows
}

function deleteAccount(account) {
  confirm(t('delConfirm', {msg: account.email})).then(ok => {
    if (ok) {
      userDeleteAccount(account.accountId).then(() => {
        getAccountList()
        toast(t('delSuccessMsg'), 'success')
      })
    }
  });
}
function accountCurChange(e) {
  accountParams.num = e
  getAccountList()
}

function resetAccountList() {
  accountList.length = 0
  accountParams.num = 0
  accountParams.size = 10
  accountParams.total = 0
}

function openAccountList(userId) {
  accountParams.userId = userId
  getAccountList(true)
  accountShow.value = true
}

function openDetails(user) {
  userDetails.value = user;
  detailsShow.value = true;
}

function getAccountList(loading = false) {
  accountLoading.value = loading
  userAllAccount(accountParams.userId,accountParams.num, accountParams.size).then(({list,total}) => {
    accountList.length = 0
    accountList.push(...list)
    accountParams.total = total
    accountLoading.value = false
  })
}

function tableFilter(e) {

  if (e.send) filterItem.send = e.send
  if (e.account) filterItem.account = e.account
  if (e.receive) filterItem.receive = e.receive

}

function formatterSend(e) {

  if (filterItem.send.length === 2) {
    return e.sendEmailCount + e.delSendEmailCount
  }

  if (filterItem.send.includes('normal')) {
    return e.sendEmailCount
  }

  if (filterItem.send.includes('del')) {
    return e.delSendEmailCount
  }

  return 0
}

function formatterAccount(e) {

  if (filterItem.account.length === 2) {
    return e.accountCount + e.delAccountCount
  }

  if (filterItem.account.includes('normal')) {
    return e.accountCount
  }

  if (filterItem.account.includes('del')) {
    return e.delAccountCount
  }

  return 0
}

function formatterReceive(e) {


  if (filterItem.receive.length === 2) {
    return e.receiveEmailCount + e.delReceiveEmailCount
  }

  if (filterItem.receive.includes('normal')) {
    return e.receiveEmailCount
  }

  if (filterItem.receive.includes('del')) {
    return e.delReceiveEmailCount
  }

  return 0
}

function setStatusName(user) {
  if (user.isDel === 1) return t('restore')
  if (user.status === 0) return t('btnBan')
  if (user.status === 1) return t('enable')
}

function setRightStatusName(user) {
  if (user.isDel === 1) return t('adminDeleteUser')
  if (user.status === 0) return t('banUser')
  if (user.status === 1) return t('enableUser')
}

const tableRowFormatter = (data) => {
  return data.row.email
}

const openSelect = () => {
  mySelect.value.toggleMenu()
}

function resetAddForm() {
  addForm.email = ''
  addForm.suffix = settingStore.domainList[0]
  addForm.type = null
  addForm.password = ''
}

function openAdd() {
  showAdd.value = true
}

function submit() {

  if (!addForm.email) {
    toast(t('emptyEmailMsg'), 'error')
    return
  }

  if (!isEmail(addForm.email + addForm.suffix)) {
    toast(t('notEmailMsg'), 'error')
    return
  }

  if (!addForm.password) {
    toast(t('emptyPwdMsg'), 'error')
    return
  }

  if (addForm.password.length < 6) {
    toast(t('pwdLengthMsg'), 'error')
    return
  }

  if (!addForm.type) {
    toast(t('emptyRole'), 'error')
    return
  }

  addLoading.value = true
  const form = {...addForm}
  form.email = form.email + form.suffix
  userAdd(form).then(() => {
    addLoading.value = false
    showAdd.value = false
    toast(t('addSuccessMsg'), 'success')
    resetAddForm()
    getUserList(false)
  }).finally(res => {
    addLoading.value = false
  })
}


function formatSendType(user) {
  if (user.sendAction.sendType === 'day') return t('daily')
  if (user.sendAction.sendType === 'count') return t('total')
  if (user.sendAction.sendType === 'ban') return t('sendBanned')
  if (user.sendAction.sendType === 'internal') return t('sendInternal')
}

function formatSendCount(user) {

  if (!user.sendAction.hasPerm) {
    return t('unauthorized')
  }

  if (!user.sendAction.sendCount) {
    return t('unlimited');
  }

  let count = user.sendCount + '/' + user.sendAction.sendCount

  return count
}

function toRoleName(type) {

  if (type === 0) {
    return t('admin')
  }

  const index = roleList.findIndex(role => role.roleId === type)
  if (index > -1) {
    const name = roleList[index].name
    // Translate known role names
    if (name === '普通用户') {
      return t('normalUser')
    }
    return name
  }
  return ""
}

function resetSendCount(user) {

  confirm(t('reSendConfirm', {msg: user.email})).then(ok => {
    if (ok) {
      userRestSendCount(user.userId).then(() => {
        toast(t('reSuccessMsg'), 'success')
        user.sendCount = 0
      })
    }
  });
}

function delUser(user) {
  const userIds = selectedUsers.value.map(row => row.userId);
  if (userIds.length === 0) {
    return;
  }
  confirm(t('delUsersConfirm')).then(ok => {
    if (ok) {
      userDelete(userIds).then(() => {
        toast(t('delSuccessMsg'), 'success')
        getUserList(true)
      })
    }
  });
}

function delOneUser(user) {
  confirm(t('delConfirm', {msg: user.email})).then(ok => {
    if (ok) {
      userDelete([user.userId]).then(() => {
        toast(t('delSuccessMsg'), 'success')
        getUserList(true)
      })
    }
  });
}

function restore(user) {

  const type = ref(0)

  confirm(t('restoreConfirm', {msg: user.email})).then(ok => {
    if (ok) {
      userRestore(user.userId, type.value).then(() => {
        user.isDel = 0
        toast(t('restoreSuccessMsg'), 'success')
      })
    }
  });
}

function setStatus(user) {
  httpSetStatus(user);
}

function httpSetStatus(user) {
  let status = user.status ? 0 : 1
  userSetStatus({status: status, userId: user.userId}).then(() => {
    user.status = status
    toast(t('saveSuccessMsg'), 'success')
  })
}

function setType() {
  settingLoading.value = true
  userSetType({type: userForm.type, userId: userForm.userId}).then(() => {
    chooseUser.type = userForm.type
    setTypeShow.value = false
    toast(t('saveSuccessMsg'), 'success')

  }).finally(() => {
    settingLoading.value = false
  })
}


function resetUserForm() {
  userForm.password = null
  userForm.userId = 0
}

function search() {
  params.num = 1
  getUserList()
}

function updatePwd() {

  if (!userForm.password) {
    toast(t('emptyPwdMsg'), 'error')
    return
  }

  if (userForm.password.length < 6) {
    toast(t('pwdLengthMsg'), 'error')
    return
  }

  settingLoading.value = true
  userSetPwd({password: userForm.password, userId: userForm.userId}).then(() => {
    setPwdShow.value = false
    toast(t('saveSuccessMsg'), 'success')
  }).finally(() => {
    settingLoading.value = false
  })
}

function openSetType(user) {
  chooseUser = user
  userForm.userId = user.userId
  userForm.type = user.type
  setTypeShow.value = true
}

function openSetPwd(user) {
  userForm.userId = user.userId
  setPwdShow.value = true
}

function refresh() {
  params.email = ''
  params.num = 1
  params.status = -1
  params.timeSort = 0
  getUserList();
  roleSelectUse().then(list => {
    roleList.length = 0
    roleList.push(...list)
  })
}

function changeTimeSort() {
  params.num = 1
  params.timeSort = params.timeSort ? 0 : 1
  getUserList()
}

function numChange(num) {
  params.num = num
  getUserList()
}

function sizeChange(size) {
  params.size = size
  getUserList()
}

function getUserList(loading = true) {

  tableLoading.value = loading
  const newParams = {...params}

  if (newParams.status === -2) {
    delete newParams.status
    newParams.isDel = 1
  }
  userList(newParams).then(data => {
    users.value = data.list.map(item => ({...item, checkedClass: ''}))
    total.value = data.total
    if (scrollbarRef.value) scrollbarRef.value.scrollTop = 0
  }).finally(() => {
    tableLoading.value = false
    setTimeout(() => {
      first.value = false
    }, 200)
  })
}

window.onresize = () => {
  adjustWidth()
};

adjustWidth()

function adjustWidth() {
  const width = window.innerWidth
  statusShow.value = width > 1090
  createTimeShow.value = width > 1367
  accountNumShow.value = width > 650
  sendNumShow.value = width > 685
  typeShow.value = width > 767
  emailWidth.value = width > 480 ? 230 : null
  settingWidth.value = width < 480 ? (locale.value === 'en' ? 85 : 75) : null
  expandWidth.value = width < 480 ? 30 : 35
  pagerCount.value = width < 768 ? 7 : 11
  receiveWidth.value = width < 480 ? 90 : null
  layout.value = width < 768 ? 'pager' : 'prev, pager, next,sizes, total'
  phonePageShow.value = width < 768
  pageSize.value = width < 380 ? 'small' : ''
}

</script>

<style scoped>
.user-box {
  overflow: hidden;
  height: 100%;
  font-family: var(--s-font-body);
  color: var(--s-ink);
}

.header-actions {
  padding: 10px 16px;
  display: flex;
  gap: 12px;
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

.status-select {
  min-width: 80px;
}

.scroll-area {
  width: 100%;
  overflow: auto;
  height: calc(100% - 50px);
  position: relative;
  @media (max-width: 464px) {
    height: calc(100% - 90px);
  }
}

.type {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination {
  margin-top: 16px;
  margin-bottom: 20px;
  padding-right: 24px;
  width: 100%;
  display: flex;
  justify-content: end;
  @media (max-width: 767px) {
    padding-right: 10px;
  }
}

.account-table-wrap {
  position: relative;
  min-height: 300px;
}

.account-pagination {
  display: flex;
  justify-content: end;
  width: 100%;
  padding-top: 12px;
}

.details {
  padding: 0 4px 10px;
  display: grid;
  gap: 10px;
}

.details-row {
  font-size: 14px;
  line-height: 1.6;
}

.details-item-title {
  white-space: pre;
  color: var(--s-muted);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding-right: 10px;
}

.linuxdo-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  vertical-align: middle;
  border: 1px solid var(--s-line);
}

.loading {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--s-paper);
  left: 0;
  z-index: 2;
  top: 0;
  width: 100%;
  height: 100%;
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

</style>
