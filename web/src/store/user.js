import { defineStore } from 'pinia'
import {loginUserInfo} from "@/request/my.js";

export const useUserStore = defineStore('user', {
    state: () => ({
        // 默认给一个带 permKeys 的空用户：init() 可能因网络超时被兜底跳过，
        // 此时 App 已挂载但 user 还没赋值，v-perm / hasPerm 会读 permKeys 而报错。
        user: {permKeys: []},
        refreshList: 0,
    }),
    actions: {
        refreshUserList() {
            loginUserInfo().then(user => {
                this.refreshList ++
            })
        },
        refreshUserInfo() {
            loginUserInfo().then(user => {
                this.user = user
            })
        }
    }
})