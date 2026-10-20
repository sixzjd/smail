import http from '@/axios/index.js';

// 第三方邮件客户端（IMAP / SMTP）配置
export function clientConfig() {
    return http.get('/client/config')
}
