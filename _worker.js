/*!
 * v2ray Subscription Worker - Optimized v2.0 (VIP Path)
 * 支持 /vip/ 路径
 */

const MAX_CONFIGS = 1000;
const INCLUDE_ORIGINAL = true;

const configProviders = [
  { name: "vpei", type: "b64", urls: ["https://raw.githubusercontent.com/free18/v2ray/refs/heads/main/v.txt"] },
  { name: "mfuu", type: "b64", urls: ["https://raw.githubusercontent.com/mfuu/v2ray/master/v2ray"] },
  { name: "peasoft", type: "raw", urls: ["https://raw.githubusercontent.com/peasoft/NoMoreWalls/master/list_raw.txt"] },
  { name: "ermaozi", type: "b64", urls: ["https://raw.githubusercontent.com/ermaozi/get_subscribe/main/subscribe/v2ray.txt"] },
  { name: "aiboboxx", type: "b64", urls: ["https://raw.githubusercontent.com/chengaopan/AutoMergePublicNodes/master/list.txt"] },
  { name: "mahdibland", type: "raw", urls: [
    "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/splitted/vmess.txt",
    "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/splitted/trojan.txt"
  ]},
  { name: "bardiafa", type: "raw", urls: ["https://raw.githubusercontent.com/Bardiafa/Free-V2ray-Config/main/All_Configs_Sub.txt"] },
  { name: "autoproxy", type: "b64", urls: [
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription1",
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription2",
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription3",
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription4",
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription5",
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription6",
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription7",
    "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription8"
  ]},
  { name: "freefq", type: "b64", urls: ["https://raw.githubusercontent.com/freefq/free/master/v2"] },
  { name: "pawdroid", type: "b64", urls: ["https://raw.githubusercontent.com/Pawdroid/Free-servers/main/sub"] },
  { name: "free18", type: "b64", urls: ["https://raw.githubusercontent.com/free18/v2ray/refs/heads/main/v.txt"] },
  { name: "chengaopan", type: "b64", urls: ["https://raw.githubusercontent.com/chengaopan/AutoMergePublicNodes/master/list.txt"] },
  { name: "shadowmere", type: "b64", urls: ["https://shadowmere.xyz/api/b64sub/"] }
];

const ipProviderLink = "https://raw.githubusercontent.com/vfarid/cf-clean-ips/main/list.json";

const addressList = [
  "discord.com", "cloudflare.com", "nginx.com", "www.speedtest.com",
  "laravel.com", "chat.openai.com", "codepen.io", "api.jquery.com"
];

const fpList = ["chrome", "chrome", "firefox", "safari", "edge", "ios", "android", "random"];
const alpnList = ["http/1.1", "h2,http/1.1"];

// Base64 辅助函数（使用 Workers 原生 API）
const base64Encode = (str) => btoa(unescape(encodeURIComponent(str)));
const base64Decode = (str) => decodeURIComponent(escape(atob(str.trim())));

function getMultipleRandomElements(arr, num) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, num);
}

function isIp(str) {
  return /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}$/.test(str);
}

// 解码配置
function decodeConfig(configStr) {
  if (configStr.startsWith("vmess://")) {
    try {
      const json = JSON.parse(base64Decode(configStr.slice(8)));
      json.protocol = "vmess";
      return json;
    } catch (e) {}
  } else if (/^(vless|trojan):\/\//.test(configStr)) {
    try {
      const match = configStr.match(/^(?<protocol>vless|trojan):\/\/(?<id>[^@]+)@(?<add>[^:]+):(?<port>\d+)(?:\?(?<options>[^#]+))?(?:#(?<ps>.+))?$/);
      if (!match?.groups) return null;

      const opts = {};
      if (match.groups.options) {
        match.groups.options.split('&').forEach(p => {
          const [k, v] = p.split('=');
          if (k && v) opts[k] = decodeURIComponent(v);
        });
      }

      return {
        protocol: match.groups.protocol,
        id: match.groups.id,
        add: match.groups.add,
        port: match.groups.port || "443",
        ps: match.groups.ps,
        type: opts.type || "tcp",
        host: opts.host,
        path: opts.path,
        tls: opts.security || "none",
        sni: opts.sni,
        alpn: opts.alpn
      };
    } catch (e) {}
  }
  return null;
}

// 编码配置
function encodeConfig(conf) {
  if (!conf?.id) return null;
  try {
    if (conf.protocol === "vmess") {
      const { protocol, ...rest } = conf;
      return "vmess://" + base64Encode(JSON.stringify(rest));
    } else if (["vless", "trojan"].includes(conf.protocol)) {
      const params = new URLSearchParams({
        security: conf.tls,
        type: conf.type || "tcp",
        path: conf.path || "/",
        host: conf.host || "",
        sni: conf.sni || "",
        alpn: conf.alpn || ""
      });
      return `\( {conf.protocol}:// \){conf.id}@\( {conf.add}: \){conf.port}?\( {params.toString()}# \){encodeURIComponent(conf.ps)}`;
    }
  } catch (e) {}
  return null;
}

// 混合配置（核心）
function mixConfig(conf, hostname, ip, operator, provider) {
  try {
    if (conf.tls !== "tls") return null;

    let addr = conf.sni || conf.host || conf.add;
    if (!addr || isIp(addr)) return null;

    conf.ps = `\( {provider}- \){(conf.ps || conf.name || "node")}-vip-${operator.toLowerCase()}`;
    conf.name = conf.ps;
    conf.host = hostname;
    conf.sni = hostname;
    conf.add = ip || addressList[Math.floor(Math.random() * addressList.length)];
    conf.port = 443;
    conf.fp = fpList[Math.floor(Math.random() * fpList.length)];
    conf.alpn = alpnList[Math.floor(Math.random() * alpnList.length)];

    conf.path = `/\( {addr}: \){conf.port || 443}${conf.path ? "/" + conf.path.replace(/^\//, "") : ""}`;
    return conf;
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/|\/$/g, "");
    const parts = path.split("/");

    // ==================== VIP 订阅路径 ====================
    if (parts[0] === "vip") {
      let cleanIPs = [];
      let operators = ["General"];

      if (parts[1]) {
        if (parts[1].includes(".")) {
          cleanIPs = parts[1].split(",").map(ip => ({ ip: ip.trim(), operator: "IP" }));
          operators = ["IP"];
        } else {
          operators = parts[1].toUpperCase().split(",");
          try {
            const ipData = await fetch(ipProviderLink).then(r => r.json());
            cleanIPs = ipData.ipv4?.filter(el => operators.includes(el.operator)) || [];
          } catch (e) {}
        }
      }

      let maxConfigs = url.searchParams.get("max") ? parseInt(url.searchParams.get("max")) : MAX_CONFIGS;
      let includeOriginal = INCLUDE_ORIGINAL;
      if (url.searchParams.has("original")) {
        const val = url.searchParams.get("original").toLowerCase();
        includeOriginal = ["1", "true", "yes", "y"].includes(val);
      }

      if (includeOriginal) maxConfigs = Math.floor(maxConfigs / 2);

      // 并行获取所有订阅源
      const configsByProvider = await Promise.all(
        configProviders.map(async (sub) => {
          try {
            const texts = await Promise.all(sub.urls.map(u => fetch(u).then(r => r.text().catch(() => ""))));
            let allText = texts.join("\n");
            if (sub.type === "b64") {
              allText = base64Decode(allText);
            }
            const lines = allText.split("\n").filter(Boolean);
            return {
              name: sub.name,
              configs: lines.filter(c => /^(vmess|vless|trojan):\/\//i.test(c))
            };
          } catch {
            return { name: sub.name, configs: [] };
          }
        })
      );

      const finalList = [];

      const perProvider = Math.ceil(maxConfigs / configProviders.length);

      for (const op of operators) {
        const ips = cleanIPs.length 
          ? cleanIPs.filter(el => el.operator === op).slice(0, 5) 
          : [{ ip: "", operator: "General" }];

        const selectedIP = ips[Math.floor(Math.random() * ips.length)].ip;

        for (const provider of configsByProvider) {
          const mixed = provider.configs
            .map(decodeConfig)
            .map(c => mixConfig(c, url.hostname, selectedIP, op, provider.name))
            .filter(Boolean)
            .map(encodeConfig)
            .filter(Boolean);

          finalList.push(...getMultipleRandomElements(mixed, perProvider));
        }
      }

      // 原始配置
      if (includeOriginal) {
        for (const provider of configsByProvider) {
          const original = provider.configs
            .map(decodeConfig)
            .map(c => {
              if (c) c.ps = `\( {provider.name}- \){c.ps || c.name}`;
              return c;
            })
            .filter(Boolean)
            .map(encodeConfig)
            .filter(Boolean);

          finalList.push(...getMultipleRandomElements(original, perProvider));
        }
      }

      const output = finalList.join("\n");
      return new Response(base64Encode(output), {
        headers: { 
          "content-type": "text/plain; charset=utf-8",
          "subscription-userinfo": "upload=0; download=0; total=0; expire=0"
        }
      });
    }

    // 其他路径直接转发
    if (path) {
      return fetch(`https://${path}`, request);
    }

    // 默认首页
    return new Response(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>VIP Subscription Worker</title></head>
<body dir="rtl" style="font-family: Arial; text-align: center; padding: 40px;">
  <h2><font color="green">✅ VIP 订阅 Worker 已就绪</font></h2>
  <p>使用示例：</p>
  <p><strong>https://${url.hostname}/vip/mci</strong></p>
  <p><strong>https://${url.hostname}/vip/1.1.1.1</strong></p>
  <p><strong>https://${url.hostname}/vip/1.1.1.1,8.8.8.8?max=300&original=yes</strong></p>
</body>
</html>`, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
};
