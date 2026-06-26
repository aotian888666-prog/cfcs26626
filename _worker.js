let 快速订阅访问入口 = ['auto'];
let addresses = [];
let addressesapi = [];
let addressesnotls = [];
let addressesnotlsapi = [];
let addressescsv = [];
let DLS = 7;
let remarkIndex = 1;

let subConverter = 'SUBAPI.cmliussss.net';
let subConfig = atob('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2NtbGl1L0FDTDRTU1IvbWFpbi9DbGFzaC9jb25maWcvQUNMNFNTUl9PbmxpbmVfRnVsbF9NdWx0aU1vZGUuaW5p');
let subProtocol = 'https';
let FileName = 'VIP VLESS 优选订阅';
let 网络备案 = `<a href='https://t.me/CMLiussss'>VIP订阅优化版</a>`;

let proxyIPs = [atob('cHJveHlpcC5meHhrLmRlZHluLmlv')];
let httpsPorts = ["2053", "2083", "2087", "2096", "8443"];

async function 整理(内容) {
    var 替换后的内容 = 内容.replace(/[	|"'\r\n]+/g, ',').replace(/,+/g, ',');
    if (替换后的内容.charAt(0) == ',') 替换后的内容 = 替换后的内容.slice(1);
    if (替换后的内容.charAt(替换后的内容.length - 1) == ',') 替换后的内容 = 替换后的内容.slice(0, -1);
    return 替换后的内容.split(',').filter(Boolean);
}

async function 整理优选列表(api) {
    if (!api || api.length === 0) return [];
    let newapi = "";
    try {
        const responses = await Promise.allSettled(api.map(apiUrl => fetch(apiUrl, {
            method: 'get',
            headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;' },
            signal: AbortSignal.timeout(2000)
        }).then(r => r.ok ? r.text() : Promise.reject())));
        
        for (const [index, response] of responses.entries()) {
            if (response.status === 'fulfilled') {
                const content = await response.value;
                newapi += content + '\n';
            }
        }
    } catch (e) { console.error(e); }
    return await 整理(newapi);
}

async function 整理测速结果() {
    if (!addressescsv.length) return [];
    // 简化CSV处理逻辑...
    const results = [];
    for (const csvUrl of addressescsv) {
        try {
            const resp = await fetch(csvUrl);
            if (!resp.ok) continue;
            const text = await resp.text();
            // 简单按行处理（可进一步优化）
            results.push(...text.split('\n').filter(Boolean));
        } catch (e) {}
    }
    return results;
}

function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

async function subHtml() {
    const HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\( {FileName}</title><style>body{font-family:Arial;background:#f0f0f0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;} .container{background:white;padding:2rem;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:600px;width:90%;} input,button{width:100%;padding:12px;margin:10px 0;border-radius:8px;} button{background:#0066ff;color:white;border:none;cursor:pointer;}</style></head><body><div class="container"><h1> \){FileName}</h1><input type="text" id="link" placeholder="粘贴 VLESS 链接"><button onclick="generateLink()">生成 VIP 优选订阅</button><input type="text" id="result" readonly><div style="text-align:center;margin-top:15px;">${网络备案}</div></div><script>function generateLink(){const link=document.getElementById('link').value;if(!link){alert('请输入VLESS链接');return;}try{const domain=window.location.hostname;const uuid=link.split('//')[1].split('@')[0];const search=link.split('?')[1]||'';const subLink=\`https://\${domain}/vip?uuid=\${uuid}&\${search}\`;document.getElementById('result').value=subLink;}catch(e){alert('链接格式错误');}}</script></body></html>`;
    return new Response(HTML, {headers: {"content-type": "text/html;charset=UTF-8"}});
}

export default {
    async fetch(request, env) {
        // 加载环境变量
        if (env.TOKEN) 快速订阅访问入口 = await 整理(env.TOKEN);
        if (env.SUBAPI) subConverter = env.SUBAPI.replace(/^https?:\/\//, '');
        if (env.SUBNAME) FileName = env.SUBNAME;
        if (env.ADD) addresses = await 整理(env.ADD);
        if (env.ADDAPI) addressesapi = await 整理(env.ADDAPI);
        if (env.ADDNOTLS) addressesnotls = await 整理(env.ADDNOTLS);
        if (env.ADDCSV) addressescsv = await 整理(env.ADDCSV);
        DLS = Number(env.DLS) || DLS;

        const url = new URL(request.url);
        const format = url.searchParams.get('format')?.toLowerCase() || '';

        // VIP 快速订阅
        if (快速订阅访问入口.some(token => url.pathname === `/${token}`)) {
            // 返回内置 VLESS 优选订阅...
            return new Response("快速订阅功能已简化", {status: 200});
        }

        // 主要 /vip 路径（仅VLESS）
        if (url.pathname === '/vip') {
            let host = url.searchParams.get('host') || env.HOST || "example.com";
            let uuid = url.searchParams.get('uuid') || env.UUID;
            let path = url.searchParams.get('path') || env.PATH || '/';
            // ... 其他参数处理

            // 生成优选 VLESS 订阅逻辑（简化版）
            const links = await 整理优选列表(addressesapi);
            let proxyList = links.map(ip => `vless://\( {uuid}@ \){ip}?type=ws&path=\( {encodeURIComponent(path)}&host= \){host}&security=tls#VIP-${ip}`).join('\n');
            
            if (format === 'clash' || format === 'singbox') {
                // 调用转换后端
                const subUrl = `\( {subProtocol}:// \){subConverter}/sub?target=\( {format}&url= \){encodeURIComponent(utf8ToBase64(proxyList))}`;
                return fetch(subUrl);
            }
            
            return new Response(utf8ToBase64(proxyList), {
                headers: { "content-type": "text/plain; charset=utf-8", "subscription-userinfo": "upload=0;download=0;total=1000000000000" }
            });
        }

        // 默认返回 HTML 页面
        return await subHtml();
    }
};
