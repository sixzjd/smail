<template>
  <div class="send-view">
    <emailScroll ref="sendScroll"
                 :cancel-success="cancelStar"
                 :star-success="addStar"
                 :getEmailList="getEmailList"
                 :emailDelete="emailDelete"
                 :star-add="starAdd"
                 show-status
                 actionLeft="4px"
                 :star-cancel="starCancel"
                 @jump="jumpContent"
                 :time-sort="params.timeSort"
                 :type="'send'"
    >
      <template #first>
        <button class="sort-btn" @click="changeTimeSort" :title="params.timeSort === 0 ? 'Newest first' : 'Oldest first'">
          <Icon v-if="params.timeSort === 0" icon="material-symbols-light:timer-arrow-down-outline" width="20" height="20" />
          <Icon v-else icon="material-symbols-light:timer-arrow-up-outline" width="20" height="20" />
        </button>
      </template>
    </emailScroll>
  </div>
</template>

<script setup>
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import emailScroll from "@/components/email-scroll/index.vue"
import {emailList, emailDelete} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, onMounted, reactive, ref, watch} from "vue";
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";

defineOptions({
  name: 'send'
})

const emailStore = useEmailStore();
const accountStore = useAccountStore();
const sendScroll = ref({})
const params = reactive({
  timeSort: 0,
})

onMounted(() => {
  emailStore.sendScroll = sendScroll;
})

watch(() => accountStore.currentAccountId, () => {
  sendScroll.value.refreshList();
})

function changeTimeSort() {
  params.timeSort = params.timeSort ? 0 : 1
  sendScroll.value.refreshList();
}

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'logic'
  emailStore.contentData.showStar = true
  emailStore.contentData.showReply = true
  router.push('/message')
}

function addStar(email) {
  emailStore.starScroll?.addItem(email)
}

function cancelStar(email) {
  emailStore.starScroll?.deleteEmail([email.emailId])
}

function getEmailList(emailId, size) {
  const accountId =  accountStore.currentAccountId;
  const allReceive = accountStore.currentAccount.allReceive;
  return emailList(accountId, allReceive, emailId, params.timeSort, size, 1).then(data => {
    data.latestEmail.reqAccountId = accountId;
    data.latestEmail.allReceive = allReceive;
    return data;
  })
}

</script>

<style scoped>
.send-view {
  height: 100%;
}

.sort-btn {
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
}

.sort-btn:hover {
  background: var(--s-soft);
  color: var(--s-accent);
}
</style>
