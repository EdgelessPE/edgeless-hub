import axios from "axios";

const regex = /attachment;filename="([^"]+)"/
const regex2 = /attachment; filename\*=UTF\-8''([^"]+)/
async function fetchURL(url) {
    console.log('fetchURL', url)
    return new Promise((resolve, reject) => {
        axios.get(url, { maxRedirects: 0, headers: { "x-get-redirect": "true" } }).then((res) => {
            // 从 header 里面拿出真实文件名
            const location = res.headers['location']
            if (location) {
                return resolve(decodeURI(location));
            }

            const text = res.headers['content-disposition']
            console.log('text', text)
            if (text) {
                const m = text.match(regex)
                if (m?.length && m.length > 1) {
                    resolve(m[1])
                    return
                }
                const m2 = text.match(regex2)
                if (m2?.length && m2.length > 1) {
                    resolve(m2[1])
                    return
                }
                // 如果没有匹配到文件名，就直接返回 URL 的最后一部分
                const sp = url.split('/')
                resolve(sp[sp.length - 1]);
            } else {
                reject()
            }
        }).catch((e) => {
            if (
                e.response &&
                (e.response.status === 301 ||
                    e.response.status === 302 ||
                    e.response.status === 303)
            ) {
                resolve(decodeURI(e.response.headers.location));
            } else {
                reject();
            }
        });
    });
}

export async function fileNameFetcher(url) {
    const sp = url.split('/')
    const out = sp[sp.length - 1]
    if (out.includes('.')) {
        return out
    } else {
        const real = await fetchURL(url)
        const sp = real.split('/')
        return sp[sp.length - 1]
    }
}