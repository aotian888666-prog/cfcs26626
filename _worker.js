// ==================== VIP VLESS 订阅 Worker ====================

let userID = '你的UUID';  // 必须修改
let proxyIP = 'proxyip.fxxk.dedyn.io';  // 可选反代IP

let subConverter = 'SUBAPI.cmliussss.net';
let subConfig = 'https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini';
let FileName = 'VIP-VLESS-优选订阅';
let BotToken = '';  // Telegram 通知可选
let ChatID = ''; 

const addresses = []; // 内置IP，可留空用API
const addressesapi = [
    'https://raw.githubusercontent.com/cmliu/WorkerVless2sub/main/addressesapi.csv',
    'https://raw.githubusercontent.com/cmliu/WorkerVless2sub/main/addressesapi2.csv'
];
const DLS = 7;

async function 整理优选列表(api) {
    let newapi = "";
    try {
        const responses = await Promise.allSettled(api.map(url => 
            fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) })
                .then(r => r.ok ? r.text() : '')
        ));
        
        for (const res of responses) {
            if (res.status === 'fulfilled') newapi += res.value + '\n';
        }
    } catch (e) {}
    return newapi.replace(/[ \t\r\n]+/g, ',').split(',').filter(Boolean);
}

function base64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

export default {
    async fetch(request, env) {
        // 加载环境变量（推荐在Worker设置中配置）
        userID = env.UUID || userID;
        if (env.PROXYIP) proxyIP = env.PROXYIP;
        if (env.SUBAPI) subConverter = env.SUBAPI;
        if (env.SUBNAME) FileName = env.SUBNAME;

        const url = new URL(request.url);
        
        // ======================== /vip 订阅 ========================
        if (url.pathname === '/vip') {
            const uuid = url.searchParams.get('uuid') || userID;
            const host = url.searchParams.get('host') || url.hostname;
            const path = url.searchParams.get('path') || '/?ed=2560';
            const format = url.searchParams.get('format') || '';

            // 获取优选IP
            const ips = await 整理优选列表(addressesapi);
            if (ips.length === 0) ips.push('www.visa.com.tw'); // 兜底

            let vlessLinks = ips.map(ip => {
                return `vless://\( {uuid}@ \){ip}:443?type=ws&path=\( {encodeURIComponent(path)}&host= \){host}&security=tls&sni=\( {host}#VIP- \){ip}`;
            }).join('\n');

            if (format === 'clash' || format === 'singbox') {
                const subUrl = `https://\( {subConverter}/sub?target= \){format}&url=\( {encodeURIComponent(base64Encode(vlessLinks))}&insert=false&config= \){encodeURIComponent(subConfig)}&emoji=true&list=false&rename=${encodeURIComponent(FileName)}`;
                return fetch(subUrl);
            }

            // 默认返回 Base64 订阅
            return new Response(base64Encode(vlessLinks), {
                headers: {
                    'content-type': 'text/plain; charset=utf-8',
                    'subscription-userinfo': 'upload=0;download=0;total=1000000000000',
                    'profile-update-interval': '24'
                }
            });
        }

        // ======================== 默认页面 ========================
        const html = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>${FileName}</title>
        <style>body{font-family:Arial;background:#111;color:#0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;} .box{background:#222;padding:30px;border-radius:12px;width:90%;max-width:500px;}</style>
        </head><body>
        <div class="box">
            <h1>${FileName}</h1>
            <p>订阅地址示例：</p>
            <input type="text" value="https://\( {url.hostname}/vip?uuid= \){userID}&host=${url.hostname}" style="width:100%;padding:10px;margin:10px 0;" readonly>
            <p>添加 ?format=clash 或 singbox 即可转换</p>
        </div>
        </body></html>`;

        return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' }});
    }
};
