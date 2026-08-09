<template>
  <div class="compose-overlay" v-show="show">
    <div class="compose-box">
      <!-- Header -->
      <div class="compose-header">
        <div class="compose-header-left">
          <Icon icon="hugeicons:quill-write-01" width="24" height="24" class="compose-logo" />
          <span class="compose-sender-label">{{ $t('sender') }}:</span>
          <span class="compose-sender-name">{{ form.name }}</span>
          <span class="compose-sender-email">&lt;{{ form.sendEmail }}&gt;</span>
        </div>
        <button class="compose-close" @click="close" aria-label="Close">
          <Icon icon="material-symbols-light:close-rounded" width="20" height="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="compose-body">
        <!-- Recipients -->
        <div class="compose-field compose-field--recipients">
          <label class="compose-label">{{ $t('recipient') }}</label>
          <div class="compose-tag-input">
            <div class="tag-input-area">
              <span class="recipient-tag" v-for="(email, idx) in form.receiveEmail" :key="idx">
                {{ email }}
                <button class="recipient-tag-rm" @click="form.receiveEmail.splice(idx, 1)" type="button">&times;</button>
              </span>
              <input
                class="tag-text-input"
                :value="recipientQuery"
                @input="recipientQuery = $event.target.value; onRecipientInput()"
                @keydown="handleRecipientKeydown"
                @focus="onRecipientFocus"
                @blur="onRecipientBlur"
                :placeholder="form.receiveEmail.length === 0 ? $t('recipient') : ''"
                ref="recipientInputRef"
              />
            </div>
            <button class="add-contact-btn" @click.stop="openContacts" type="button" :title="$t('recentContacts')">
              <Icon icon="fa7-solid:user-plus" width="16" height="16" />
            </button>
            <!-- Autocomplete dropdown -->
            <div class="ac-dropdown" v-if="showAcDropdown">
              <div
                class="ac-item"
                v-for="item in selectRecipientList"
                :key="item"
                @mousedown.prevent="selectRecipient(item)"
              >{{ item }}</div>
            </div>
          </div>
        </div>

        <!-- Subject -->
        <div class="compose-field">
          <input
            class="compose-subject"
            v-model="form.subject"
            :placeholder="$t('subject')"
          />
        </div>

        <!-- Editor -->
        <div class="compose-editor">
          <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
        </div>

        <!-- Bottom bar -->
        <div class="compose-actions">
          <div class="compose-actions-left">
            <button class="icon-btn" @click="chooseFile" type="button" :title="$t('attachments')">
              <Icon icon="iconamoon:attachment-fill" width="20" height="20" />
            </button>
            <button class="icon-btn" @click="clearContent" type="button" :title="$t('clear')">
              <Icon icon="icon-park-outline:clear-format" width="20" height="20" />
            </button>
            <div class="compose-att-list" v-if="form.attachments.length > 0">
              <div class="compose-att-item" v-for="(item, index) in form.attachments" :key="index">
                <Icon v-bind="getIconByName(item.filename)" />
                <span class="compose-att-name">{{ item.filename }}</span>
                <span class="compose-att-size">{{ formatBytes(item.size) }}</span>
                <button class="compose-att-rm" @click="delAtt(index)" type="button">
                  <Icon icon="material-symbols-light:close-rounded" width="16" height="16" />
                </button>
              </div>
            </div>
          </div>
          <div class="compose-actions-right">
            <s-button type="primary" @click="sendEmail" v-if="form.sendType === 'reply'">{{ $t('reply') }}</s-button>
            <s-button type="primary" @click="sendEmail" v-else-if="form.sendType === 'forward'">{{ $t('forward') }}</s-button>
            <s-button type="primary" @click="sendEmail" v-else>{{ $t('send') }}</s-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contacts dialog -->
    <s-modal v-model="showContacts" :title="t('recentContacts')" size="md" @close="clearSelectContact">
      <s-table
        ref="contactsTabRef"
        :columns="contactColumns"
        :data="contacts"
        selection
        rowKey="email"
        @selection-change="onContactSelection"
      />
      <template #footer>
        <div class="contacts-footer">
          <s-button type="secondary" @click="deleteContact">{{ t('clear') }}</s-button>
          <s-button type="primary" @click="chooseContact">{{ t('selectContacts') }}</s-button>
        </div>
      </template>
    </s-modal>
  </div>
</template>
<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import {nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailSend} from "@/request/email.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {fileToBase64, formatBytes} from "@/utils/file-utils.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {toOssDomain} from "@/utils/convert.js";
import {formatDetailDate} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {userDraftStore} from "@/store/draft.js";
import {useWriterStore} from "@/store/writer.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import { toast } from '@/components/ui/toast.js'
import { confirm } from '@/components/ui/confirm.js'
import SButton from '@/components/ui/s-button.vue'
import SModal from '@/components/ui/s-modal.vue'
import STable from '@/components/ui/s-table.vue'

defineExpose({
  open,
  openReply,
  openForward,
  openDraft
})

const {t} = useI18n()
const writerStore = useWriterStore();
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref({})
const userStore = useUserStore();
const show = ref(false);
const percent = ref(0)
let sending = false
const defValue = ref('')
const contactsTabRef = ref(null)
const showContacts = ref(false)
const recipientInputRef = ref(null)
const recipientQuery = ref('')
const showAcDropdown = ref(false)
let selectStatus = false
const backReply = reactive({
  receiveEmail: [],
  subject: '',
  content: '',
  sendType: ''
})
const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

const selectRecipientList = ref([])

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({email: item})))

const contactColumns = [
  { prop: 'email', label: '' }
]

let contactSelection = []

function onContactSelection(rows) {
  contactSelection = rows
}

function openContacts() {
  showContacts.value = true
  nextTick(() => {
    if (contactsTabRef.value) {
      contactsTabRef.value.clearSelection()
    }
    contactSelection = []
  })
}

function deleteContact() {
  confirm(t('confirmDeletionOfContacts'), t('confirm')).then(ok => {
    if (!ok) return
    const contactList = contactSelection.map(item => item.email);
    form.receiveEmail = form.receiveEmail.filter(item => !contactList.includes(item));
    writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(item => !contactList.includes(item));
  })
}

function chooseContact() {
  const contactList = contactSelection.map(item => item.email);
  contactList.forEach(item => {
    if (!form.receiveEmail.includes(item)) {
      form.receiveEmail.push(item);
    }
  })

  form.receiveEmail = form.receiveEmail.filter(item => {
    return contactList.includes(item) || !writerStore.sendRecipientRecord.includes(item);
  });

  showContacts.value = false
}

function clearSelectContact() {
  if (contactsTabRef.value) {
    contactsTabRef.value.clearSelection();
  }
  contactSelection = []
}

/* ── Recipient tag input ── */

function onRecipientInput() {
  const val = recipientQuery.value.trim()
  selectRecipientList.value = val
    ? writerStore.sendRecipientRecord.filter(item => !form.receiveEmail.includes(item) && item.startsWith(val)).slice(0, 10)
    : []
  showAcDropdown.value = selectRecipientList.value.length > 0
}

function onRecipientFocus() {
  onRecipientInput()
}

function onRecipientBlur() {
  setTimeout(() => { showAcDropdown.value = false }, 150)
}

function selectRecipient(email) {
  if (!form.receiveEmail.includes(email)) {
    form.receiveEmail.push(email)
  }
  recipientQuery.value = ''
  selectRecipientList.value = []
  showAcDropdown.value = false
  recipientInputRef.value?.focus()
}

function handleRecipientKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    const val = recipientQuery.value.trim()
    if (!val) return
    const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
    ))
    emails.forEach(email => {
      if (isEmail(email) && !form.receiveEmail.includes(email)) {
        form.receiveEmail.push(email)
      }
    })
    recipientQuery.value = ''
    selectRecipientList.value = []
    showAcDropdown.value = false
  }
}

/* ── Content / attachments ── */

function clearContent() {
  confirm(t('clearContentConfirm'), t('confirm')).then(ok => {
    if (ok) resetForm()
  })
}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = async (e) => {

    const fileList = e.target.files;

    for (const file of fileList) {

      const size = file.size
      const filename = file.name
      const contentType = file.type

      const content = await fileToBase64(file)
      form.attachments.push({content, filename, size, contentType})

    }

  }
}

/* ── Send ── */

async function sendEmail() {

  if (form.receiveEmail.length === 0) {
    toast(t('emptyRecipientMsg'), 'error')
    return
  }

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (!form.content) {
    toast(t('emptyContentMsg'), 'error')
    return
  }

  if (form.manyType === 'divide' && form.attachments.length > 0) {
    toast(t('noSeparateSendMsg'), 'error')
    return
  }

  if (sending) {
    toast(t('sendingErrorMsg'), 'error')
    return
  }

  toast(t('sending'), 'info')

  sending = true

  show.value = false

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(emailList => {
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })

    toast(t('sendSuccessMsg'), 'success')

    userStore.refreshUserInfo();

    addRecipientRecord();

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      draftStore.setDraft = {...toRaw(form)}
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    toast(e.message, e.code === 403 ? 'warning' : 'error')
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percent.value = 0
    sending = false
  })
}

function addRecipientRecord() {
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(
      email => !form.receiveEmail.includes(email)
  );

  writerStore.sendRecipientRecord.unshift(...form.receiveEmail);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}

function resetForm() {
  form.receiveEmail = []
  form.subject = ''
  form.content = ''
  form.manyType = null
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
  recipientQuery.value = ''
  editor.value.clearEditor()
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {
  showAcDropdown.value = false
}

/* ── Open modes ── */

function openForward(email) {
  resetForm();

  email.subject = email.subject || ''

  form.subject = email.subject
  form.sendType = 'forward'

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
      ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
    `
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })

  });
}

function openReply(email) {

  resetForm();

  email.subject = email.subject || ''

  form.receiveEmail.push(email.sendEmail)
  form.subject = (
      email.subject.startsWith('Re:') ||
      email.subject.startsWith('Re：') ||
      email.subject.startsWith('回复：') ||
      email.subject.startsWith('回复:')) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
    <div></div>
    <div>
    <br>
        ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
      <articl>
          ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
      </article>
    </blockquote>`
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  })

}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function open() {
  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  editor.value.focus()
}

function openDraft(draft) {
  Object.assign(form, {...draft})
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  editor.value.focus()
}

/* ── Close / save draft ── */

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    close()
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function close() {

  if (showAcDropdown.value) showAcDropdown.value = false;

  if (!form.content) {
    try { form.content = editor.value.getContent(); } catch(e) { /* editor not ready */ }
  }

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
    show.value = false
    resetForm()
    return;
  }

  if (!(form.content || form.subject || form.receiveEmail.length > 0)) {
    show.value = false
    resetForm()
    return;
  }

  if (backReply.sendType === 'reply' || backReply.sendType === 'forward') {
    let subjectFlag = form.subject === backReply.subject
    let contentFlag = true; try { contentFlag = editor.value.getContent() === backReply.content } catch(e) { /* editor not ready */ }
    let receiveFlag = form.receiveEmail.length === 1 && form.receiveEmail[0] === backReply.receiveEmail[0]
    if (backReply.sendType === 'forward' && form.receiveEmail.length === 0) {
      receiveFlag = true;
    }
    if (subjectFlag && contentFlag && receiveFlag) {
      resetForm();
      close()
      return;
    }
  }

  confirm(t('saveDraftConfirm'), t('confirm')).then(async (ok) => {
    if (!ok) {
      show.value = false
      resetForm()
      return
    }
    const formData = {...toRaw(form)};
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const draftId = await db.value.draft.add({...formData})
    db.value.att.add({draftId, attachments: toRaw(form.attachments)})
    draftStore.refreshList++
    show.value = false
    await nextTick(() => {
      resetForm()
    })
  })

}

</script>
<style scoped lang="scss">
/* ── Overlay ── */
.compose-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
}

/* ── Compose box ── */
.compose-box {
  background: var(--s-paper);
  width: min(1200px, calc(100% - 48px));
  border-radius: var(--s-radius-xl);
  box-shadow: var(--s-shadow);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;

  @media (max-width: 1024px) {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  @media (min-width: 1025px) {
    height: min(780px, calc(100vh - 60px));
  }
}

/* ── Header ── */
.compose-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--s-line);
}

.compose-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.compose-logo {
  color: var(--s-accent);
  flex-shrink: 0;
}

.compose-sender-label {
  font-size: 13px;
  color: var(--s-muted);
  flex-shrink: 0;
}

.compose-sender-name {
  font-family: var(--s-font-display);
  font-weight: 600;
  font-size: 14px;
  color: var(--s-ink);
}

.compose-sender-email {
  font-size: 13px;
  color: var(--s-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compose-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--s-radius);
  color: var(--s-muted);
  cursor: pointer;
  transition: all var(--s-ease);
  flex-shrink: 0;

  &:hover {
    background: var(--s-soft);
    color: var(--s-ink);
  }
}

/* ── Body ── */
.compose-body {
  display: flex;
  flex-direction: column;
  padding: 16px 20px 20px;
  gap: 12px;
  height: 100%;
  overflow: hidden;
}

/* ── Recipients ── */
.compose-field--recipients {
  position: relative;
}

.compose-label {
  font-family: var(--s-font-display);
  font-size: 12px;
  font-weight: 600;
  color: var(--s-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 10px;
}

.compose-tag-input {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  padding: 6px 8px;
  background: var(--s-paper);
  position: relative;
  transition: border-color var(--s-ease);

  &:focus-within {
    border-color: var(--s-accent);
  }
}

.tag-input-area {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1;
  min-width: 0;
  align-items: center;
}

.recipient-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  background: var(--s-soft);
  border: 1px solid var(--s-line);
  border-radius: 100px;
  font-size: 12px;
  font-family: var(--s-font-body);
  color: var(--s-ink);
  white-space: nowrap;
  line-height: 1.6;
}

.recipient-tag-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--s-muted);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  border-radius: 50%;
  padding: 0;

  &:hover {
    background: var(--s-line);
    color: var(--s-danger);
  }
}

.tag-text-input {
  border: none;
  outline: none;
  font-size: 14px;
  font-family: var(--s-font-body);
  color: var(--s-ink);
  background: transparent;
  min-width: 100px;
  flex: 1;
  padding: 2px 0;

  &::placeholder {
    color: var(--s-muted);
  }
}

.add-contact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--s-muted);
  cursor: pointer;
  border-radius: var(--s-radius);
  flex-shrink: 0;
  transition: all var(--s-ease);

  &:hover {
    background: var(--s-soft);
    color: var(--s-accent);
  }
}

/* ── Autocomplete dropdown ── */
.ac-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--s-paper);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  box-shadow: var(--s-shadow);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.ac-item {
  padding: 8px 12px;
  font-size: 13px;
  font-family: var(--s-font-body);
  color: var(--s-ink);
  cursor: pointer;
  transition: background var(--s-ease);

  &:hover {
    background: var(--s-soft);
  }
}

/* ── Subject ── */
.compose-subject {
  width: 100%;
  border: none;
  outline: none;
  font-family: var(--s-font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--s-ink);
  background: transparent;
  padding: 8px 0;
  border-bottom: 1px solid var(--s-line);

  &::placeholder {
    color: var(--s-muted);
    font-weight: 400;
  }
}

/* ── Editor ── */
.compose-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Bottom bar ── */
.compose-actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid var(--s-line);
}

.compose-actions-left {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.compose-actions-right {
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  color: var(--s-muted);
  cursor: pointer;
  border-radius: var(--s-radius);
  transition: all var(--s-ease);

  &:hover {
    background: var(--s-soft);
    color: var(--s-ink);
  }
}

/* ── Attachment list ── */
.compose-att-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 4px;
  max-height: 80px;
  overflow-y: auto;
}

.compose-att-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: var(--s-soft);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  font-size: 12px;
  color: var(--s-ink);
}

.compose-att-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.compose-att-size {
  color: var(--s-muted);
  white-space: nowrap;
}

.compose-att-rm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--s-muted);
  cursor: pointer;
  border-radius: 50%;
  padding: 0;

  &:hover {
    color: var(--s-danger);
    background: var(--s-soft);
  }
}

/* ── Contacts dialog ── */
.contacts-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}
</style>
