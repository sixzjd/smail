import {useSettingStore} from "@/store/setting.js";

export function formatImage(content) {
    const { settings } = useSettingStore();
    return (content || '').replace(/{{domain}}/g, toOssDomain(settings.r2Domain) + '/');
}
export function cvtR2Url(key) {

    if (!key) {
        return 'https://' + (key || '')
    }

    if (key.startsWith('https://')) {
        return key
    }

    const { settings } = useSettingStore();

    let domain = settings.r2Domain

    if (!domain) {
        return key;
    }

    if (!domain.startsWith('http')) {
        return 'https://' + domain + '/' + key
    }

    if (domain.endsWith("/")) {
        domain = domain.slice(0, -1);
    }
    return domain + '/' + key
}

export function toOssDomain(domain) {

    if (!domain) {
        return ''
    }

    if (!domain.startsWith('http')) {
        return 'https://' + domain
    }

    if (domain.endsWith("/")) {
        domain = domain.slice(0, -1);
    }

    return domain
}
