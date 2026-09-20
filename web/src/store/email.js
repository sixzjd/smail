import { defineStore } from 'pinia'

export const useEmailStore = defineStore('email', {
    state: () => ({
        deleteIds: 0,
        starScroll: null,
        emailScroll: null,
        cancelStarEmailId: 0,
        addStarEmailId: 0,
        contentData: {
            email: null,
            delType: null,
            showStar: true,
            showReply: true,
            showUnread: false,
            // 仅回收站来源的详情页为 true（trash/index.vue 置位，content 卸载时复位）
            showRestore: false
        },
        sendScroll: null,
    }),
    persist: {
        pick: ['contentData'],
    },
})
