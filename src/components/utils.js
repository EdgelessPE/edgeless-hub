import axios from "axios";

const regex=/attachment;filename="([^"]+)"/
async function fetchURL(url) {
    console.log('fetchURL',url)
    return new Promise((resolve,reject) => {
        axios.get(url, { maxRedirects: 0 }).then((res)=>{
            // 从 header 里面拿出真实文件名
            const text=res.headers['content-disposition']
            console.log('text',text)
            if(text){
                const m=text.match(regex)
                if(m?.length&&m.length>1){
                     resolve(m[1])
                    return
                }
            }else{
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

export async function fileNameFetcher(url){
    const sp=url.split('/')
    const out=sp[sp.length-1]
    if(out.includes('.')){
        return out
    }else{
        const real=await fetchURL(url)
        const sp=real.split('/')
        return sp[sp.length-1]
    }
}