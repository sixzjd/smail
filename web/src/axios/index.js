import axios from "axios";
import router from "@/router";
import i18n from "@/i18n/index.js";
import {useSettingStore} from "@/store/setting.js";
import { toast } from "@/components/ui/toast.js";

let http = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL
});

http.interceptors.request.use(config => {
    const { lang } = useSettingStore();
    config.headers.Authorization = `${localStorage.getItem('token')}`
    config.headers['accept-language'] = lang
    return config
})

http.interceptors.response.use((res) => {

        return new Promise((resolve, reject) => {

            const noMsg = res.config.noMsg;
            const data = res.data

            if (noMsg) {

                data.code === 200 ? resolve(data.data) : reject(data)

            } else if (data.code === 401) {
                toast(data.message, 'error')
                localStorage.removeItem('token')
                router.replace('/login')
                reject(data)
            } else if (data.code === 403) {
                toast(data.message, 'warning')
                reject(data)

            } else if (data.code === 502) {
                toast(data.message, 'error')
                reject(data)
            } else if (data.code !== 200) {
                toast(data.message, 'error')
                reject(data)
            }
            resolve(data.data)
        })
    },
    (error) => {

        if (error.status === 403) {
            location.reload();
            return;
        }

        const noMsg = error.config.noMsg;

        if (noMsg) {
            return Promise.reject(error)
        } else if (error.message.includes('Network Error')) {
            toast(i18n.global.t('networkErrorMsg'), 'error')
        } else if (error.code === 'ECONNABORTED') {
            toast(i18n.global.t('timeoutErrorMsg'), 'error')
        } else if (error.response) {
            toast(i18n.global.t('serverBusyErrorMsg'), 'error')
        } else {
            toast(i18n.global.t('reqFailErrorMsg'), 'error')
        }
        return Promise.reject(error)
    })

export default http
