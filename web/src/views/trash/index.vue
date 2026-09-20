<template>
  <div class="trash-view">
    <emailScroll type="trash"
                 :show-star="false"
                 :allow-star="false"
                 :show-unread="false"
                 :getEmailList="getTrashList"
                 :emailDelete="emailPermanentDelete"
                 :emailRestore="emailRestore"
                 :show-account-icon="false"
                 @jump="jumpContent"
    />
  </div>
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailList, emailPermanentDelete, emailRestore} from "@/request/email.js"
import {useEmailStore} from "@/store/email.js"
import {useAccountStore} from "@/store/account.js"
import {defineOptions} from "vue"
import router from "@/router/index.js"

defineOptions({
  name: 'trash'
})

const emailStore = useEmailStore()
const accountStore = useAccountStore()

function jumpContent(email) {
  emailStore.contentData.email = email
  emailStore.contentData.delType = 'permanent'
  emailStore.contentData.showStar = false
  emailStore.contentData.showReply = false
  emailStore.contentData.showRestore = true
  router.push('/message')
}

function getTrashList(emailId, size) {
  const accountId = accountStore.currentAccountId
  const allReceive = accountStore.currentAccount.allReceive
  return emailList(accountId, allReceive, emailId, 0, size, 'trash')
}
</script>

<style scoped>
.trash-view {
  height: 100%;
}
</style>
