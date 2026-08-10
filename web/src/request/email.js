import http from '@/axios/index.js';

export function emailList(accountId, allReceive, emailId, timeSort, size, type) {
    return http.get('/email/list', {params: {accountId, allReceive, emailId, timeSort, size, type}})
}

export function emailDelete(emailIds) {
    return http.delete('/email/delete?emailIds=' + emailIds)
}

export function emailLatest(emailId, accountId, allReceive) {
    return http.get('/email/latest', {params: {emailId, accountId, allReceive}, noMsg: true, timeout: 10 * 1000})
}

export function emailRead(emailIds, targetUnread) {
    const body = { emailIds };
    if (targetUnread !== undefined) body.targetUnread = targetUnread;
    return http.put('/email/read', body)
}

export function emailDetail(emailId) {
    return http.get('/email/detail', {params: {emailId}})
}

export function emailSend(form,progress) {
    return http.post('/email/send', form,{
        onUploadProgress: (e) => {
            progress(e)
        },
        noMsg: true
    })
}

export function emailRestore(emailIds) {
    return http.post('/email/restore', { emailIds: emailIds.join(',') })
}

export function emailPermanentDelete(emailIds) {
    return http.post('/email/permanent-delete', { emailIds: emailIds.join(',') })
}