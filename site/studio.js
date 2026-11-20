(function () {
  const body = document.body;
  const themeSel = document.getElementById("themeSelect");
  const fontSel = document.getElementById("fontSelect");
  const btnSel = document.getElementById("btnStyleSelect");
  const accentSel = document.getElementById("accentSelect");

  const cycleFontBtn = document.getElementById("cycleFontBtn");
  const cycleDesignBtn = document.getElementById("cycleDesignBtn");
  const cycleColorBtn = document.getElementById("cycleColorBtn");

  const FONTS = ["sans", "mono", "serif"];
  const DESIGNS = ["rounded", "pill", "sharp", "outline"];
  const ACCENTS = ["blue", "emerald", "rose", "violet"];
  const GRAPH_MODES = ["line", "area", "bar"];

  const STORAGE_KEY = "devopshunt_prefs_v3";
  const GRAPH_KEY = "devopshunt_graph_mode_v1";

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
      accent: body.getAttribute("data-accent") || "blue",
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (_) {}
  }

  function cycleListValue(list, currentVal, fallback) {
    const idx = list.indexOf(currentVal);
    if (idx === -1) return fallback || list[0];
    return list[(idx + 1) % list.length];
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

  if (cycleFontBtn) {
    cycleFontBtn.addEventListener("click", () => {
      const next = cycleListValue(FONTS, body.getAttribute("data-font") || "sans", "sans");
      applySettings({ font: next });
      persistSettings();
    });
  }

  if (cycleDesignBtn) {
    cycleDesignBtn.addEventListener("click", () => {
      const next = cycleListValue(DESIGNS, body.getAttribute("data-btn") || "rounded", "rounded");
      applySettings({ btnStyle: next });
      persistSettings();
    });
  }

  if (cycleColorBtn) {
    cycleColorBtn.addEventListener("click", () => {
      const next = cycleListValue(ACCENTS, body.getAttribute("data-accent") || "blue", "blue");
      applySettings({ accent: next });
      persistSettings();
    });
  }

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

  // System Telemetry & Live Logs Page (logs.html)
  const logBody = document.getElementById("logBody");
  const graphSvg = document.getElementById("telemetryGraph");
  const graphModeLabel = document.getElementById("graphModeLabel");
  const changeGraphBtn = document.getElementById("changeGraphBtn");
  const pauseBtn = document.getElementById("pauseLogsBtn");
  const clearBtn = document.getElementById("clearLogsBtn");
  const statusDot = document.getElementById("statusDot");

  const kpiLoad = document.getElementById("kpiLoad");
  const kpiLoadBlock = document.getElementById("kpiLoadBlock");
  const kpiMem = document.getElementById("kpiMem");
  const kpiMemBlock = document.getElementById("kpiMemBlock");
  const kpiDisk = document.getElementById("kpiDisk");
  const kpiDiskBlock = document.getElementById("kpiDiskBlock");
  const kpiCronTime = document.getElementById("kpiCronTime");
  const kpiCronBlock = document.getElementById("kpiCronBlock");

  if (logBody || graphSvg) {
    let graphMode = "line";
    try {
      const savedMode = localStorage.getItem(GRAPH_KEY);
      if (savedMode && GRAPH_MODES.includes(savedMode)) graphMode = savedMode;
    } catch (_) {}

    let latestSeries = [
      { time: "T-105s", value: 24 },
      { time: "T-90s", value: 26 },
      { time: "T-75s", value: 25 },
      { time: "T-60s", value: 28 },
      { time: "T-45s", value: 27 },
      { time: "T-30s", value: 29 },
      { time: "T-15s", value: 28 },
      { time: "Now", value: 30 },
    ];

    let paused = false;

    function modeTitle(m) {
      if (m === "area") return "Area Wave";
      if (m === "bar") return "Bar Telemetry";
      return "Line Trend";
    }

    function renderGraph(series) {
      if (!graphSvg) return;
      const w = 760;
      const h = 240;
      const padLeft = 44;
      const padRight = 20;
      const padTop = 22;
      const padBottom = 34;
      const plotW = w - padLeft - padRight;
      const plotH = h - padTop - padBottom;

      const pts = series.map((d, i) => {
        const val = Math.max(2, Math.min(100, Number(d.value) || 10));
        const x = padLeft + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
        const y = padTop + plotH - (val / 100) * plotH;
        return { x, y, val, label: d.time || "" };
      });

      const styles = getComputedStyle(document.body);
      const accent = (styles.getPropertyValue("--accent") || "#2563eb").trim();
      const accent2 = (styles.getPropertyValue("--accent-2") || "#06b6d4").trim();
      const muted = (styles.getPropertyValue("--muted") || "#64748b").trim();
      const border = (styles.getPropertyValue("--border") || "#cbd5e1").trim();

      let svgContent = `
        <defs>
          <linearGradient id="graphGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${accent}" />
            <stop offset="100%" stop-color="${accent2}" />
          </linearGradient>
          <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${accent}" stop-opacity="0.35" />
            <stop offset="100%" stop-color="${accent2}" stop-opacity="0.02" />
          </linearGradient>
        </defs>
      `;

      [0, 25, 50, 75, 100].forEach((tick) => {
        const gy = padTop + plotH - (tick / 100) * plotH;
        svgContent += `<line x1="${padLeft}" y1="${gy.toFixed(1)}" x2="${w - padRight}" y2="${gy.toFixed(1)}" stroke="${border}" stroke-dasharray="4 4" stroke-width="1" />`;
        svgContent += `<text x="${padLeft - 8}" y="${(gy + 4).toFixed(1)}" text-anchor="end" fill="${muted}" font-size="11">${tick}%</text>`;
      });

      if (graphMode === "bar") {
        const slotW = plotW / Math.max(1, pts.length);
        const barW = Math.max(14, slotW * 0.52);
        pts.forEach((p) => {
          const bx = p.x - barW / 2;
          const bh = Math.max(4, padTop + plotH - p.y);
          svgContent += `<rect x="${bx.toFixed(1)}" y="${p.y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="url(#graphGrad)" />`;
          svgContent += `<text x="${p.x.toFixed(1)}" y="${(h - 10).toFixed(1)}" text-anchor="middle" fill="${muted}" font-size="10">${p.label}</text>`;
        });
      } else if (graphMode === "area") {
        const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
        const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;
        svgContent += `<path d="${areaPath}" fill="url(#areaFill)" />`;
        svgContent += `<path d="${linePath}" fill="none" stroke="url(#graphGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
        pts.forEach((p) => {
          svgContent += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="${accent}" stroke="#ffffff" stroke-width="1.5" />`;
          svgContent += `<text x="${p.x.toFixed(1)}" y="${(h - 10).toFixed(1)}" text-anchor="middle" fill="${muted}" font-size="10">${p.label}</text>`;
        });
      } else {
        const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
        svgContent += `<path d="${linePath}" fill="none" stroke="url(#graphGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />`;
        pts.forEach((p) => {
          svgContent += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="#ffffff" stroke="${accent}" stroke-width="2.5" />`;
          svgContent += `<text x="${p.x.toFixed(1)}" y="${(h - 10).toFixed(1)}" text-anchor="middle" fill="${muted}" font-size="10">${p.label}</text>`;
        });
      }

      graphSvg.innerHTML = svgContent;
      if (graphModeLabel) graphModeLabel.textContent = modeTitle(graphMode);
    }

    function appendLogs(logItems) {
      if (!logBody || paused || !Array.isArray(logItems)) return;
      logItems.forEach((entry) => {
        const svc = (entry.svc || "systemd").toLowerCase();
        const cls = svc === "nginx" ? "svc-nginx" : svc === "systemd" ? "svc-systemd" : "svc-cron";
        const row = document.createElement("div");
        row.className = "log-line";
        row.innerHTML =
          `<span class="ts">[${entry.ts || ""}]</span> ` +
          `<span class="${cls}">[${svc}]</span> ` +
          `<span class="ok">${entry.status || "OK"}: ${entry.msg || ""}</span>`;
        logBody.appendChild(row);
      });
      logBody.scrollTop = logBody.scrollHeight;
    }

    // Read real live memory directly from /proc/meminfo on the host
    async function pollRealMemory() {
      if (paused || !kpiMem) return;
      try {
        const res = await fetch(`/proc/meminfo?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const txt = await res.text();
        const totalMatch = txt.match(/^MemTotal:\s+(\d+)\s+kB/m);
        const availMatch = txt.match(/^MemAvailable:\s+(\d+)\s+kB/m);
        if (!totalMatch || !availMatch) return;

        const totalMiB = Math.round(Number(totalMatch[1]) / 1024);
        const availMiB = Math.round(Number(availMatch[1]) / 1024);
        const usedMiB = Math.max(0, totalMiB - availMiB);
        const pct = totalMiB > 0 ? Math.round((usedMiB / totalMiB) * 100) : 0;

        kpiMem.textContent = `${pct}%`;
        if (kpiMemBlock) {
          kpiMemBlock.textContent = `${usedMiB} MiB / ${totalMiB} MiB • ${availMiB} MiB free`;
        }
      } catch (_) {}
    }

    async function fetchTelemetrySnapshot() {
      if (paused) return;
      try {
        const res = await fetch(`assets/cron-logs.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        if (data.metrics) {
          if (kpiLoad) kpiLoad.textContent = data.metrics.load_1m ?? "—";
          if (kpiLoadBlock) kpiLoadBlock.textContent = data.metrics.load_detail || "vCPU & uptime";

          if (data.metrics.mem_pct != null && kpiMem) {
            kpiMem.textContent = `${data.metrics.mem_pct}%`;
          }
          if (kpiMemBlock && data.metrics.mem_detail) {
            kpiMemBlock.textContent = data.metrics.mem_detail;
          }

          if (kpiDisk) kpiDisk.textContent = data.metrics.disk_pct != null ? `${data.metrics.disk_pct}%` : "—";
          if (kpiDiskBlock) kpiDiskBlock.textContent = data.metrics.disk_detail || "Filesystem /";

          if (kpiCronBlock) {
            kpiCronBlock.textContent = data.metrics.snapshot_detail || (data.host ? `Host: ${data.host}` : "Host active");
          }
        }
        if (kpiCronTime && data.generated_at) {
          kpiCronTime.textContent = data.generated_at;
        }
        if (Array.isArray(data.series) && data.series.length > 0) {
          latestSeries = data.series;
          renderGraph(latestSeries);
        }
        if (Array.isArray(data.logs) && data.logs.length > 0) {
          appendLogs(data.logs);
        }
      } catch (_) {
        renderGraph(latestSeries);
      }
    }

    if (changeGraphBtn) {
      changeGraphBtn.addEventListener("click", () => {
        graphMode = cycleListValue(GRAPH_MODES, graphMode, "line");
        try {
          localStorage.setItem(GRAPH_KEY, graphMode);
        } catch (_) {}
        renderGraph(latestSeries);
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

    [themeSel, accentSel, cycleColorBtn].forEach((el) => {
      if (!el) return;
      el.addEventListener("change", () => renderGraph(latestSeries));
      el.addEventListener("click", () => setTimeout(() => renderGraph(latestSeries), 20));
    });

    renderGraph(latestSeries);
    fetchTelemetrySnapshot();
    pollRealMemory();
    setInterval(fetchTelemetrySnapshot, 6000);
    setInterval(pollRealMemory, 2500);
  }
})();
