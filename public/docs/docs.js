document.addEventListener("DOMContentLoaded", init);

let globalConfig = null;
let toastTimeout;
let routesById = {};
let exampleSnippets = {};

const revealObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.08 }
);

function observeReveals(root) {
    (root || document).querySelectorAll(".reveal").forEach(el => {
        if (!el.dataset.observed) {
            el.dataset.observed = "1";
            revealObserver.observe(el);
        }
    });
}

async function init() {
    observeReveals();
    setupSidebarEvents();

    if (!document.getElementById("term-logs")) return;

    try {
        const response = await fetch("/config");
        globalConfig = await response.json();

        setUi(globalConfig);
        buildSidebarTree(globalConfig.tags);
        renderIntro(globalConfig);
        startWIBClock();
        initBattery();
        initDevice();
        await kuroneko(globalConfig);
        setSearch();
    } catch (e) {
        document.getElementById("term-logs").innerHTML = `
            <span class="text-red-400 font-bold">SYSTEM FAILURE</span><br>
            ${e.message}
        `;
    }
}

function messeg(msg) {
    const toast = document.getElementById("custom-toast");
    const msgBox = document.getElementById("toast-message");

    if (!toast || !msgBox) return;

    msgBox.innerText = msg;
    toast.classList.remove("translate-y-32", "opacity-0");

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.add("translate-y-32", "opacity-0");
    }, 3000);
}

function startWIBClock() {
    const timeEl = document.getElementById("server-time");
    const dateEl = document.getElementById("server-date");

    updateTime();
    setInterval(updateTime, 1000);

    function updateTime() {
        const now = new Date();

        if (timeEl) {
            timeEl.innerText = now.toLocaleTimeString("id-ID", {
                timeZone: "Asia/Jakarta",
                hour12: false
            });
        }

        if (dateEl) {
            dateEl.innerText = now.toLocaleDateString("id-ID", {
                timeZone: "Asia/Jakarta",
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        }
    }
}

async function initBattery() {
    const batEl = document.getElementById("stat-battery");

    if (!batEl) return;

    if ("getBattery" in navigator) {
        try {
            const battery = await navigator.getBattery();

            const updateBat = () => {
                batEl.innerText = `${Math.round(battery.level * 100)}% ${battery.charging ? "⚡" : ""}`;
            };

            updateBat();
            battery.addEventListener("levelchange", updateBat);
            battery.addEventListener("chargingchange", updateBat);
        } catch (e) {
            batEl.innerText = "--%";
        }
    } else {
        batEl.innerText = "N/A";
    }
}

function initDevice() {
    const devEl = document.getElementById("stat-device");

    if (!devEl) return;

    const ua = navigator.userAgent.toLowerCase();
    let device = "Unknown";

    if (ua.includes("windows phone")) {
        device = "Windows Phone";
    } else if (ua.includes("windows")) {
        device = "Windows";
    } else if (ua.includes("android")) {
        device = "Android";
    } else if (
        ua.includes("iphone") ||
        ua.includes("ipad") ||
        ua.includes("ipod")
    ) {
        device = "iOS";
    } else if (ua.includes("mac")) {
        device = "MacOS";
    } else if (ua.includes("linux")) {
        device = "Linux";
    }

    devEl.innerText = device;
}

function terminalLog(message, type = "info") {
    const logs = document.getElementById("term-logs");

    if (!logs) return;

    const line = document.createElement("div");
    let color = "text-slate-300";

    if (type === "error") {
        color = "text-rose-400";
    } else if (type === "success") {
        color = "text-emerald-400";
    } else if (type === "warn") {
        color = "text-amber-400";
    } else if (type === "system") {
        color = "text-slate-500";
    }

    line.className = `${color} break-all`;
    line.innerHTML = message;

    logs.appendChild(line);
    logs.scrollTop = logs.scrollHeight;
}

async function kuroneko(config) {
    const logs = document.getElementById("term-logs");

    if (!logs) return;

    const cmdLine = document.createElement("div");
    cmdLine.className = "text-slate-300 break-all";
    cmdLine.innerHTML = `
        <span class="text-emerald-400">➜</span>
        <span class="text-sky-400">~</span>
    `;

    const typeSpan = document.createElement("span");
    typeSpan.className = "text-white font-bold";

    cmdLine.appendChild(typeSpan);
    logs.appendChild(cmdLine);

    const commandText = "npm run dev";

    for (let i = 0; i < commandText.length; i++) {
        typeSpan.textContent += commandText.charAt(i);
        await new Promise(resolve => setTimeout(resolve, 55));
    }

    await new Promise(resolve => setTimeout(resolve, 400));

    const ver = config.settings.apiVersion || "1.0.0";

    terminalLog(`> kuroneko-api@${ver} dev`, "system");
    terminalLog("> ts-node src/index.ts", "system");

    await new Promise(resolve => setTimeout(resolve, 500));

    terminalLog("", "system");

    const allRoutes = [];

    for (const cat in config.tags) {
        config.tags[cat].forEach(route => {
            allRoutes.push({ cat, ...route });
        });
    }

    for (const route of allRoutes) {
        const color =
            route.method === "GET"
                ? "text-sky-400"
                : route.method === "POST"
                    ? "text-emerald-400"
                    : "text-amber-400";

        terminalLog(
            `[ + ] <span class="${color} font-bold w-12 inline-block">${route.method}</span> ${route.endpoint} <span class="text-slate-600">✓</span>`,
            "info"
        );

        await new Promise(resolve => setTimeout(resolve, 14));
    }

    await new Promise(resolve => setTimeout(resolve, 400));

    terminalLog("", "system");
    terminalLog(
        `[ ✓ ] Server running on ${window.location.origin}`,
        "success"
    );

    document.getElementById("term-input-line").classList.remove("hidden");
}

function setUi(config) {
    const s = config.settings;
    const navTitle = document.getElementById("nav-title");

    if (navTitle) {
        navTitle.innerText = s.apiName || "API";
    }

    if (s.favicon) {
        let link = document.querySelector("link[rel~='icon']");

        if (!link) {
            link = document.createElement("link");
        }

        link.rel = "icon";
        link.href = s.favicon;

        document.head.appendChild(link);
    }
}

function buildExampleSnippets(origin, endpoint) {
    const url = `${origin}${endpoint}`;

    return {
        curl: `curl -X GET "${url}"`,

        javascript: `fetch("${url}")
  .then(res => res.json())
  .then(data => console.log(data));`,

        nodejs: `const https = require("https");

https.get("${url}", (res) => {
  let data = "";

  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log(JSON.parse(data)));
});`,

        python: `import requests

response = requests.get("${url}")
print(response.json())`,

        php: `<?php

$response = file_get_contents("${url}");
$data = json_decode($response, true);
print_r($data);`,

        java: `HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${url}"))
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request,
    HttpResponse.BodyHandlers.ofString()
);

System.out.println(response.body());`,

        golang: `resp, err := http.Get("${url}")

if err != nil {
    panic(err)
}

defer resp.Body.Close()

body, _ := io.ReadAll(resp.Body)
fmt.Println(string(body))`
    };
}

function langLabel(lang) {
    const map = {
        curl: "cURL",
        javascript: "JavaScript",
        nodejs: "Node.js",
        python: "Python",
        php: "PHP",
        java: "Java",
        golang: "Go"
    };

    return map[lang] || lang;
}

window.switchLangTab = lang => {
    const code = document.getElementById("example-code");

    if (code) {
        code.innerText = exampleSnippets[lang] || "";
    }

    document.querySelectorAll(".lang-tab").forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.getAttribute("data-lang") === lang
        );
    });
};

function buildResponseExamples() {
    return {
        success: JSON.stringify(
            {
                creator: "Danzz",
                status: true,
                result: [
                    {
                        title: "Billie Eilish - WILDFLOWER (Official Lyric Video)",
                        thumbnail: "https://i.ytimg.com/vi/l08Zw-RY__Q/hq720.jpg",
                        duration: "4.22",
                        uploaded: "2 tahun yang lalu",
                        views: "382.992.956 x ditonton",
                        url: "https://youtu.be/l08Zw-RY__Q",
                        videoId: "l08Zw-RY__Q"
                    }
                ]
            },
            null,
            2
        ),

        error: JSON.stringify(
            {
                creator: "Danzz",
                status: false,
                message: "Internal server error"
            },
            null,
            2
        ),

        ratelimit: JSON.stringify(
            {
                creator: "Danzz",
                status: false,
                message: "Too many requests. You are temporarily banned"
            },
            null,
            2
        )
    };
}

function buildStatusCodes() {
    return [
        {
            code: "200",
            cls: "c2xx",
            label: "OK",
            desc: "Request successful, result returned in the response body."
        },
        {
            code: "400",
            cls: "c4xx",
            label: "Bad Request",
            desc: "Missing or invalid parameters in the request."
        },
        {
            code: "404",
            cls: "c4xx",
            label: "Not Found",
            desc: "Endpoint does not exist."
        },
        {
            code: "429",
            cls: "c429",
            label: "Too Many Requests",
            desc: "Rate limit exceeded, client is temporarily banned."
        },
        {
            code: "500",
            cls: "c5xx",
            label: "Internal Server Error",
            desc: "Unexpected error occurred on the server."
        }
    ];
}

function renderIntro(config) {
    const el = document.getElementById("intro-view");

    if (!el) return;

    const origin = window.location.origin;
    const cats = Object.keys(config.tags || {});
    const firstCat = cats[0];
    const firstRoute = firstCat
        ? config.tags[firstCat][0]
        : null;

    const exampleEndpoint = firstRoute
        ? firstRoute.endpoint
        : "/api/info/ping";

    const apiName = config.settings.apiName || "KuroNeko API";

    exampleSnippets = buildExampleSnippets(
        origin,
        exampleEndpoint
    );

    const responses = buildResponseExamples();
    const statusCodes = buildStatusCodes();

    const langs = [
        "curl",
        "javascript",
        "nodejs",
        "python",
        "php",
        "java",
        "golang"
    ];

    const tabsHtml = langs
        .map(
            (lang, i) => `
                <button
                    class="lang-tab ${i === 0 ? "active" : ""}"
                    data-lang="${lang}"
                    onclick="switchLangTab('${lang}')"
                >
                    ${langLabel(lang)}
                </button>
            `
        )
        .join("");

    const rowsHtml = statusCodes
        .map(
            status => `
                <tr>
                    <td>
                        <span class="status-code ${status.cls}">
                            ${status.code}
                        </span>
                    </td>
                    <td>${status.label}</td>
                    <td>${status.desc}</td>
                </tr>
            `
        )
        .join("");

    el.innerHTML = `
        <div class="mb-5">
            <h2
                class="font-black text-xl"
                style="color:#1E1B4B"
            >
                Introduction
            </h2>

            <p
                class="text-xs font-bold"
                style="color:#94A3B8"
            >
                Quick guide to using ${apiName}
            </p>
        </div>

        <p
            class="text-sm leading-relaxed font-semibold mb-6"
            style="color:#475569"
        >
            Welcome to the ${apiName} documentation.
            Open the menu in the top-left corner to browse
            endpoints grouped by category, then select one
            to view its details and try it out directly from here.
        </p>

        <h3
            class="font-black text-sm mb-2"
            style="color:#1E1B4B"
        >
            Example Usage
        </h3>

        <div class="lang-tabs">
            ${tabsHtml}
        </div>

        <div
            class="intro-code"
            id="example-code"
        ></div>

        <h3
            class="font-black text-sm mb-2"
            style="color:#1E1B4B"
        >
            Response Format
        </h3>

        <div class="resp-examples">
            <div class="resp-card">
                <div class="resp-head">
                    <span class="resp-badge ok">
                        200 OK
                    </span>
                    <span class="resp-label">
                        Success
                    </span>
                </div>

                <div
                    class="resp-code"
                    id="resp-success"
                ></div>
            </div>

            <div class="resp-card">
                <div class="resp-head">
                    <span class="resp-badge err">
                        500 Internal Server Error
                    </span>
                    <span class="resp-label">
                        Error
                    </span>
                </div>

                <div
                    class="resp-code"
                    id="resp-error"
                ></div>
            </div>

            <div class="resp-card">
                <div class="resp-head">
                    <span class="resp-badge limit">
                        429 Too Many Requests
                    </span>
                    <span class="resp-label">
                        Rate Limited
                    </span>
                </div>

                <div
                    class="resp-code"
                    id="resp-ratelimit"
                ></div>
            </div>
        </div>

        <h3
            class="font-black text-sm mb-2 mt-6"
            style="color:#1E1B4B"
        >
            Status Codes
        </h3>

        <table class="status-table">
            <thead>
                <tr>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Description</th>
                </tr>
            </thead>

            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;

    document.getElementById("example-code").innerText =
        exampleSnippets.curl;

    document.getElementById("resp-success").innerText =
        responses.success;

    document.getElementById("resp-error").innerText =
        responses.error;

    document.getElementById("resp-ratelimit").innerText =
        responses.ratelimit;
}

function buildSidebarTree(tags) {
    const tree = document.getElementById("sidebar-tree");

    if (!tree) return;

    tree.innerHTML = "";
    routesById = {};

    const introBtn = document.createElement("button");

    introBtn.id = "sidebar-intro-btn";
    introBtn.className = "folder-btn intro-nav-btn active";

    introBtn.innerHTML = `
        <div
            class="folder-icon"
            style="background:linear-gradient(135deg,#60A5FA,#1D4ED8)"
        >
            <i class="fa-solid fa-house"></i>
        </div>

        <span class="folder-title">
            Introduction
        </span>
    `;

    introBtn.addEventListener("click", () => {
        backToIntro();
        closeSidebar();
    });

    tree.appendChild(introBtn);

    for (const [cat, routes] of Object.entries(tags)) {
        const catId = `cat-${cat.replace(/\s+/g, "-")}`;
        const wrap = document.createElement("div");

        wrap.className = "folder-wrap";

        wrap.innerHTML = `
            <button
                class="folder-btn"
                onclick="toggleFolder('${catId}')"
            >
                <div class="folder-icon">
                    <i class="fa-solid fa-folder"></i>
                </div>

                <span class="folder-title">
                    ${cat}
                </span>

                <span class="folder-count">
                    ${routes.length}
                </span>

                <i
                    id="arrow-${catId}"
                    class="fa-solid fa-chevron-down folder-arrow"
                ></i>
            </button>

            <div
                id="files-${catId}"
                class="folder-files hidden"
            ></div>
        `;

        const filesEl = wrap.querySelector(
            `#files-${catId}`
        );

        routes.forEach((route, idx) => {
            const id = `${cat}-${idx}`.replace(/\s+/g, "-");

            routesById[id] = {
                cat,
                ...route
            };

            const methodClass =
                route.method === "GET"
                    ? "get"
                    : route.method === "POST"
                        ? "post"
                        : route.method === "DELETE"
                            ? "delete"
                            : "other";

            const btn = document.createElement("button");

            btn.className = "file-item";
            btn.id = `file-${id}`;

            btn.setAttribute(
                "data-search",
                `${route.name} ${route.endpoint} ${cat}`.toLowerCase()
            );

            btn.innerHTML = `
                <span class="mini-badge ${methodClass}">
                    ${route.method}
                </span>

                <span class="file-name">
                    ${route.name}
                </span>
            `;

            btn.addEventListener("click", () => {
                selectEndpoint(id);
            });

            filesEl.appendChild(btn);
        });

        tree.appendChild(wrap);
    }
}

window.toggleFolder = catId => {
    document
        .getElementById(`files-${catId}`)
        .classList.toggle("hidden");

    document
        .getElementById(`arrow-${catId}`)
        .classList.toggle("rotate-180");
};

function selectEndpoint(id) {
    const route = routesById[id];

    if (!route) return;

    document.querySelectorAll(".file-item").forEach(file => {
        file.classList.remove("active");
    });

    document
        .getElementById("sidebar-intro-btn")
        .classList.remove("active");

    const btn = document.getElementById(`file-${id}`);

    if (btn) {
        btn.classList.add("active");
    }

    renderEndpointCard(route, id);

    document
        .getElementById("intro-view")
        .classList.add("hidden");

    const ev = document.getElementById("endpoint-view");

    ev.classList.remove("hidden");
    ev.classList.add("flex");

    closeSidebar();
}

window.backToIntro = () => {
    const ev = document.getElementById("endpoint-view");

    ev.classList.add("hidden");
    ev.classList.remove("flex");
    ev.innerHTML = "";

    document
        .getElementById("intro-view")
        .classList.remove("hidden");

    document.querySelectorAll(".file-item").forEach(file => {
        file.classList.remove("active");
    });

    document
        .getElementById("sidebar-intro-btn")
        .classList.add("active");
};

function renderEndpointCard(route, id) {
    const ev = document.getElementById("endpoint-view");

    let copyUrl = route.endpoint;

    if (
        route.method === "GET" &&
        route.params &&
        route.params.length > 0
    ) {
        copyUrl =
            `${route.endpoint}?` +
            route.params
                .map(param => `${param.name}=`)
                .join("&");
    }

    let inputs = "";

    if (route.params?.length) {
        inputs = `
            <div class="grid gap-3 px-5 pb-5">
                ${route.params
                    .map(
                        param => `
                            <div>
                                <label
                                    class="text-[11px] font-bold mb-1.5 block"
                                    style="color:#64748B"
                                >
                                    ${param.name}
                                    ${
                                        param.required
                                            ? '<span style="color:#FB7185">*</span>'
                                            : ""
                                    }
                                </label>

                                <input
                                    type="text"
                                    id="input-${id}-${param.name}"
                                    placeholder="${
                                        param.description ||
                                        "Masukkan nilai..."
                                    }"
                                    class="clay-input"
                                >
                            </div>
                        `
                    )
                    .join("")}
            </div>
        `;
    }

    const methodClass =
        route.method === "GET"
            ? "get"
            : route.method === "POST"
                ? "post"
                : route.method === "DELETE"
                    ? "delete"
                    : "other";

    ev.innerHTML = `
        <button
            class="back-btn w-fit"
            onclick="backToIntro()"
        >
            <i class="fa-solid fa-arrow-left"></i>
            Semua Endpoint
        </button>

        <div class="ep-card reveal in">
            <div class="p-5">
                <div
                    class="flex items-center gap-2 mb-3 text-[11px] font-bold"
                    style="color:#A78BFA"
                >
                    <i class="fa-solid fa-folder text-[10px]"></i>
                    <span>${route.cat}</span>
                </div>

                <div class="flex items-center gap-3">
                    <span class="method-badge ${methodClass}">
                        ${route.method}
                    </span>

                    <div class="flex flex-col min-w-0">
                        <code
                            class="font-bold text-[13px] truncate"
                            style="color:#1E1B4B"
                        >
                            ${route.endpoint}
                        </code>

                        <span
                            class="text-[11px] font-semibold truncate"
                            style="color:#94A3B8"
                        >
                            ${route.name}
                        </span>
                    </div>
                </div>
            </div>

            ${inputs}

            <div
                class="px-5 pb-5 flex gap-3 items-center border-t pt-4"
                style="border-color:#F1F5F9"
            >
                <button
                    id="btn-exec-${id}"
                    onclick="testReq(this,'${route.endpoint}','${route.method}','${id}')"
                    class="clay-btn flex-1 h-11 text-[12px] tracking-wide"
                >
                    <i class="fa-solid fa-play text-xs"></i>
                    EXECUTE
                </button>

                <button
                    onclick="copy('${copyUrl}')"
                    class="clay-icon-btn"
                    title="Copy URL"
                >
                    <i class="fa-regular fa-copy"></i>
                </button>
            </div>

            <div
                id="res-area-${id}"
                class="hidden mx-5 mb-5 rounded-2xl overflow-hidden clay-console-screen"
            >
                <div
                    class="flex justify-between items-center px-4 py-2.5 border-b border-white/10"
                >
                    <div class="flex items-center gap-2">
                        <span
                            id="status-dot-${id}"
                            class="status-dot status-waiting"
                        ></span>

                        <span
                            id="status-${id}"
                            class="text-slate-400 font-bold font-mono text-[10px]"
                        >
                            WAITING
                        </span>
                    </div>

                    <span
                        id="time-${id}"
                        class="text-slate-500 font-mono text-[10px]"
                    >
                        --ms
                    </span>
                </div>

                <div class="flex justify-end gap-3 px-4 pt-2">
                    <a
                        id="dl-btn-${id}"
                        class="hidden text-emerald-400 text-xs"
                    >
                        <i class="fa-solid fa-download"></i>
                    </a>

                    <button
                        onclick="copyRes('${id}')"
                        class="text-sky-400 text-xs"
                    >
                        <i class="fa-regular fa-clone"></i>
                    </button>

                    <button
                        onclick="reset('${id}')"
                        class="text-rose-400 text-xs"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div
                    id="output-${id}"
                    class="font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-[300px] p-4 text-slate-300 leading-relaxed"
                ></div>
            </div>
        </div>
    `;
}

function setupSidebarEvents() {
    document
        .getElementById("menu-toggle")
        .addEventListener("click", openSidebar);

    document
        .getElementById("sidebar-close")
        .addEventListener("click", closeSidebar);

    document
        .getElementById("sidebar-overlay")
        .addEventListener("click", closeSidebar);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeSidebar();
    });
}

function openSidebar() {
    document.getElementById("sidebar").classList.add("open");
    document
        .getElementById("sidebar-overlay")
        .classList.add("show");

    document
        .getElementById("menu-toggle")
        .setAttribute("aria-expanded", "true");

    document
        .getElementById("sidebar")
        .setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document
        .getElementById("sidebar-overlay")
        .classList.remove("show");

    document
        .getElementById("menu-toggle")
        .setAttribute("aria-expanded", "false");

    document
        .getElementById("sidebar")
        .setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

function setSearch() {
    const input = document.getElementById("search-input");
    const noResults = document.getElementById("no-results");

    if (!input) return;

    input.addEventListener("input", e => {
        const val = e.target.value.toLowerCase().trim();
        const wraps = document.querySelectorAll(".folder-wrap");

        if (val === "") {
            wraps.forEach(w => {
                w.classList.remove("hidden");

                w.querySelectorAll(".file-item").forEach(f => {
                    f.classList.remove("hidden");
                });

                w.querySelector(".folder-files").classList.add("hidden");
                w.querySelector(".folder-arrow").classList.remove("rotate-180");
            });

            if (noResults) {
                noResults.classList.add("hidden");
            }

            return;
        }

        let anyVisible = false;

        wraps.forEach(w => {
            const files = w.querySelector(".folder-files");
            const arrow = w.querySelector(".folder-arrow");
            let match = 0;

            w.querySelectorAll(".file-item").forEach(f => {
                const text = f.getAttribute("data-search");

                if (text.includes(val)) {
                    f.classList.remove("hidden");
                    match++;
                } else {
                    f.classList.add("hidden");
                }
            });

            if (match > 0) {
                w.classList.remove("hidden");
                files.classList.remove("hidden");
                arrow.classList.add("rotate-180");
                anyVisible = true;
            } else {
                w.classList.add("hidden");
            }
        });

        if (noResults) {
            noResults.classList.toggle("hidden", anyVisible);
            noResults.classList.toggle("flex", !anyVisible);
        }
    });
}

window.copy = text => {
    navigator.clipboard.writeText(
        window.location.origin + text
    );

    messeg("ENDPOINT COPIED");
    terminalLog(`Copied URL: ${text}`);
};

window.copyRes = id => {
    const out = document.getElementById(`output-${id}`);

    if (!out.innerText) return;

    navigator.clipboard.writeText(out.innerText);
    messeg("RESPONSE COPIED");
};

window.reset = id => {
    document
        .getElementById(`res-area-${id}`)
        .classList.add("hidden");

    document.getElementById(`output-${id}`).innerHTML = "";

    const dlBtn = document.getElementById(`dl-btn-${id}`);

    if (dlBtn) {
        dlBtn.classList.add("hidden");
    }

    document
        .querySelectorAll(`[id^="input-${id}-"]`)
        .forEach(input => {
            input.value = "";
        });

    document.getElementById(`status-dot-${id}`).className =
        "status-dot status-waiting";

    document.getElementById(`status-${id}`).innerText =
        "WAITING";

    document.getElementById(`time-${id}`).innerText =
        "--ms";
};

window.testReq = async (btn, url, method, id) => {
    if (btn.disabled) return;

    const out = document.getElementById(`output-${id}`);
    const status = document.getElementById(`status-${id}`);
    const statusDot = document.getElementById(`status-dot-${id}`);
    const time = document.getElementById(`time-${id}`);
    const dlBtn = document.getElementById(`dl-btn-${id}`);
    const originalBtnText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `
        <i class="fa-solid fa-circle-notch fa-spin"></i>
    `;

    document
        .getElementById(`res-area-${id}`)
        .classList.remove("hidden");

    if (dlBtn) {
        dlBtn.classList.add("hidden");
        dlBtn.href = "#";
    }

    status.innerText = "PROCESSING...";
    statusDot.className = "status-dot status-waiting";

    out.innerHTML = `
        <span class="text-slate-500 italic">
            establishing connection...
        </span>
    `;

    const params = {};

    document
        .querySelectorAll(`[id^="input-${id}-"]`)
        .forEach(input => {
            if (input.value) {
                params[
                    input.id.split(`input-${id}-`)[1]
                ] = input.value;
            }
        });

    const fetchUrl =
        url +
        (
            method === "GET" &&
            Object.keys(params).length
                ? "?" + new URLSearchParams(params)
                : ""
        );

    const opts = { method };

    if (method !== "GET") {
        opts.headers = {
            "Content-Type": "application/json"
        };

        opts.body = JSON.stringify(params);
    }

    const fullUrl = fetchUrl.startsWith("http")
        ? fetchUrl
        : window.location.origin + fetchUrl;

    const startTime = Date.now();

    const timerInterval = setInterval(() => {
        time.innerText = `${Date.now() - startTime}ms`;
    }, 75);

    try {
        const req = await fetch(fetchUrl, opts);

        clearInterval(timerInterval);

        const duration = Date.now() - startTime;

        status.innerText =
            `${req.status} ${req.statusText}`;

        statusDot.className = req.ok
            ? "status-dot status-success"
            : "status-dot status-error";

        time.innerText = `${duration}ms`;

        terminalLog(
            `[ ${req.status} ] ${method} ${fullUrl} (${duration}ms)`,
            req.ok ? "success" : "error"
        );

        const type = req.headers.get("content-type");

        if (type?.includes("json")) {
            const json = await req.json();
            out.innerHTML = syntaxHighlight(json);
        } else if (type?.startsWith("image")) {
            const blob = await req.blob();
            const urlObj = URL.createObjectURL(blob);

            if (dlBtn) {
                dlBtn.href = urlObj;
                dlBtn.download = `img-${Date.now()}.jpg`;
                dlBtn.classList.remove("hidden");
            }

            out.innerHTML = `
                <div class="flex justify-center p-2">
                    <img
                        src="${urlObj}"
                        class="max-w-full rounded-xl max-h-[280px]"
                    >
                </div>
            `;
        } else {
            out.innerText = await req.text();
        }
    } catch (err) {
        clearInterval(timerInterval);

        out.innerHTML = `
            <span class="text-rose-400 font-bold">
                CONNECTION_REFUSED
            </span>
            <br>
            <span class="text-slate-500">
                ${err.message}
            </span>
        `;

        status.innerText = "ERR";
        statusDot.className = "status-dot status-error";

        terminalLog(
            `Fetch Failed: ${err.message}`,
            "error"
        );
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
};

function syntaxHighlight(json) {
    if (typeof json !== "string") {
        json = JSON.stringify(json, undefined, 2);
    }

    return json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            match => {
                let cls = "json-number";
                if (/^"/.test(match)) {
                    cls = /:$/.test(match)
                        ? "json-key"
                        : "json-string";
                } else if (/true|false/.test(match)) {
                    cls = "json-boolean";
                } else if (/null/.test(match)) {
                    cls = "json-null";
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
}