(function () {
  const body = document.body;
  const themeSel = document.getElementById("themeSelect");
  const fontSel = document.getElementById("fontSelect");
  const btnSel = document.getElementById("btnStyleSelect");
  const accentSel = document.getElementById("accentSelect");

  const STORAGE_KEY = "devopshunt_prefs_v2";

  function applySettings(cfg) {
    if (!cfg) return;
    if (cfg.theme) body.setAttribute("data-theme", cfg.theme);
    if (cfg.font) body.setAttribute("data-font", cfg.font);
    if (cfg.btnStyle) body.setAttribute("data-btn", cfg.btnStyle);
    if (cfg.accent) body.setAttribute("data-accent", cfg.accent);

    if (themeSel && cfg.theme) themeSel.value = cfg.theme;
    if (fontSel && cfg.font) fontSel.value = cfg.font;
    if (btnSel && cfg.btnStyle) btnSel.value = cfg.btnStyle;
    if (accentSel && cfg.accent) accentSel.value = cfg.accent;
  }

  function persistSettings() {
    const cfg = {
      theme: body.getAttribute("data-theme") || "clean-white",
      font: body.getAttribute("data-font") || "sans",
      btnStyle: body.getAttribute("data-btn") || "rounded",
      accent: body.getAttribute("data-accent") || "slate",
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (_) {}
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved) applySettings(saved);
  } catch (_) {}

  [themeSel, fontSel, btnSel, accentSel].forEach((select) => {
    if (!select) return;
    select.addEventListener("change", () => {
      applySettings({
        theme: themeSel ? themeSel.value : undefined,
        font: fontSel ? fontSel.value : undefined,
        btnStyle: btnSel ? btnSel.value : undefined,
        accent: accentSel ? accentSel.value : undefined,
      });
      persistSettings();
    });
  });

  document.querySelectorAll("img.avatar-img").forEach((img) => {
    img.addEventListener("error", () => {
      const wrap = img.closest(".avatar-wrap");
      if (!wrap) return;
      img.remove();
      const fb = document.createElement("span");
      fb.className = "avatar-fallback";
      fb.textContent = img.getAttribute("data-initials") || "MA";
      wrap.appendChild(fb);
    });
  });

  const toggleBtn = document.getElementById("monitorLogsBtn");
  const pauseBtn = document.getElementById("pauseLogsBtn");
  const clearBtn = document.getElementById("clearLogsBtn");
  const logSection = document.getElementById("logSection");
  const logBody = document.getElementById("logBody");
  const statusDot = document.getElementById("statusDot");

  const entries = [
    { svc: "nginx", cls: "svc-nginx", msg: 'GET / HTTP/1.1 200 rt=0.001s upstream="static_site"' },
    { svc: "systemd", cls: "svc-systemd", msg: "Started devopshunt-telemetry.service - DevOps-Hunt Service Watchdog." },
    { svc: "cron", cls: "svc-cron", msg: "(root) CMD (/usr/local/bin/sysinfo.sh) -> exit status 0" },
    { svc: "nginx", cls: "svc-nginx", msg: 'GET /about.html HTTP/1.1 200 rt=0.001s' },
    { svc: "systemd", cls: "svc-systemd", msg: "systemd-journald: Runtime journal is 24.0M (max 512.0M)." },
    { svc: "cron", cls: "svc-cron", msg: "(deploy) CMD (/usr/local/bin/backup.sh) -> snapshot verified OK" },
  ];

  let idx = 0;
  let paused = false;
  let intervalId = null;

  function nowStamp() {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
  }

  function pushLog() {
    if (!logBody || paused) return;
    const item = entries[idx % entries.length];
    idx += 1;
    const row = document.createElement("div");
    row.className = "log-line";
    row.innerHTML =
      `<span class="ts">[${nowStamp()}]</span> ` +
      `<span class="${item.cls}">[${item.svc}]</span> ` +
      `<span class="ok">${item.msg}</span>`;
    logBody.appendChild(row);
    logBody.scrollTop = logBody.scrollHeight;
  }

  function startLogs() {
    if (intervalId) return;
    paused = false;
    if (statusDot) statusDot.classList.remove("paused");
    if (pauseBtn) pauseBtn.textContent = "Pause";
    pushLog();
    intervalId = setInterval(pushLog, 2000);
  }

  function stopLogs() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  if (toggleBtn && logSection) {
    toggleBtn.addEventListener("click", () => {
      const hidden = logSection.hasAttribute("hidden");
      if (hidden) {
        logSection.removeAttribute("hidden");
        toggleBtn.textContent = "Hide Live Logs";
        startLogs();
        logSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        logSection.setAttribute("hidden", "");
        toggleBtn.textContent = "Monitor Live Logs";
        stopLogs();
      }
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      paused = !paused;
      if (statusDot) statusDot.classList.toggle("paused", paused);
      pauseBtn.textContent = paused ? "Resume" : "Pause";
    });
  }

  if (clearBtn && logBody) {
    clearBtn.addEventListener("click", () => {
      logBody.innerHTML = "";
    });
  }
})();
