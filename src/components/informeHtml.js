// Generador del "Informe de Análisis de Riesgo" (estilo AML / HUD oscuro).
// Produce un HTML autónomo (Tailwind CDN + config propia + fuentes + CSS) poblado
// con los DATOS REALES de la consulta. Se renderiza a pantalla completa en un iframe.
//
// NOTA: es una vista-informe de los resultados (no el archivo PDF). Se omiten
// metadatos auditables inventados (IP/hash/token falsos) para no mostrar datos
// que no son reales; se conserva toda la estética.

import { describirFuente } from "../utils/fuentesCatalogo";

const esc = (v) =>
  String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const esImagen = (archivo) =>
  typeof archivo === "string" && /\.(png|jpe?g|webp|gif)$/i.test(archivo.trim());

const urlHttpSegura = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const candidate = raw.startsWith("www.") ? `https://${raw}` : raw;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
};

const urlOficialResultado = (resultado) => {
  const extra = resultado?.datos_extra && typeof resultado.datos_extra === "object"
    ? resultado.datos_extra
    : {};
  const candidates = [
    resultado?.url_oficial,
    resultado?.url_fuente,
    resultado?.source_url,
    extra.url_oficial,
    extra.fuente_url,
    extra.url_fuente,
    extra.source_url,
    extra.official_url,
    extra.url,
    extra.link,
    resultado?.fuente_url,
  ];
  return candidates.map(urlHttpSegura).find(Boolean) || "";
};

// Fecha solo-fecha ("YYYY-MM-DD"): JS la toma como medianoche UTC y en hora de
// Colombia (UTC-5) retrocede un dia. Se formatea como fecha LOCAL para NO restar el dia.
const fechaSoloLocal = (value) => {
  if (!value) return "—";
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, anio, mes, dia] = m;
    return new Date(Number(anio), Number(mes) - 1, Number(dia)).toLocaleDateString("es-CO");
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("es-CO");
};

// Año sin dejar que UTC desplace un 01-01 al año anterior.
const anioLocal = (value) => {
  if (!value) return null;
  const m = String(value).match(/(\d{4})/);
  return m ? Number(m[1]) : null;
};

const fechaHoraConsulta = (value) => {
  if (!value) return "Fecha y hora no disponibles";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha y hora no disponibles";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatearMensajeResultado = (value) => {
  const raw = String(value || "Sin mensaje.").replace(/\r/g, "").trim();
  const lines = raw.split("\n");
  const structuredCount = lines.filter((line) => /^[^:/]{1,80}:\s*/.test(line.trim())).length;

  if (structuredCount < 2) {
    return `<p class="text-sm text-slate-200 font-sans whitespace-pre-wrap break-words leading-6">${esc(raw)}</p>`;
  }

  return lines.map((line) => {
    const clean = line.trim();
    if (!clean) return `<div class="h-3" aria-hidden="true"></div>`;
    const match = clean.match(/^([^:/]{1,80}):\s*(.*)$/);
    if (!match) {
      return `<p class="text-sm text-slate-200 leading-6 break-words">${esc(clean)}</p>`;
    }
    const label = esc(match[1]);
    const content = esc(match[2]);
    if (!content) {
      return `<h5 class="mt-3 first:mt-0 text-sm font-bold text-cyan-200">${label}</h5>`;
    }
    return `<div class="grid gap-1 border-b border-slate-700/40 py-1.5 sm:grid-cols-[minmax(190px,auto)_1fr]">
      <span class="text-xs font-semibold text-slate-400">${label}</span>
      <span class="text-sm text-slate-100 break-words">${content}</span>
    </div>`;
  }).join("");
};

// Paleta por categoría de riesgo
function riesgoTheme(categoria) {
  const c = (categoria || "").toLowerCase();
  if (c.includes("alto"))
    return { hex: "#ff3d00", tw: "red", dict: "RIESGO ALTO", chip: "text-red-400 bg-red-950/50 border-red-500/30", gauge: "#ff3d00", badgeBg: "bg-red-500", badgeTx: "text-white" };
  if (c.includes("medio"))
    return { hex: "#ffd600", tw: "amber", dict: "RIESGO MEDIO", chip: "text-amber-300 bg-amber-950/50 border-amber-500/30", gauge: "#ffd600", badgeBg: "bg-amber-400", badgeTx: "text-slate-900" };
  // bajo / default
  return { hex: "#00e676", tw: "emerald", dict: "RIESGO BAJO VALIDADO", chip: "text-emerald-400 bg-emerald-950/50 border-emerald-500/30", gauge: "#00e676", badgeBg: "bg-brand-emerald", badgeTx: "text-brand-navy" };
}

// Color por BANDAS (grupos) con degradé interno de cada color:
//   1-4 verde · 5-9 amarillo · 10-14 naranja · 15-25 rojo.
// Dentro de cada banda varía la luminosidad para el degradé del grupo.
function heatColor(v) {
  let hue, t;
  if (v <= 4) { hue = 140; t = (v - 1) / 3; }        // verde
  else if (v <= 9) { hue = 52; t = (v - 5) / 4; }    // amarillo
  else if (v <= 14) { hue = 28; t = (v - 10) / 4; }  // naranja
  else { hue = 0; t = (v - 15) / 10; }               // rojo
  const light = 54 - Math.min(1, Math.max(0, t)) * 16; // más oscuro al subir dentro del grupo
  return `hsl(${hue}, 85%, ${light}%)`;
}

// Matriz de calor 5x5 con el punto en (probabilidad, consecuencia)
function matrizHeatmap(prob, cons) {
  const p = Math.min(5, Math.max(1, num(prob) || 1));
  const co = Math.min(5, Math.max(1, num(cons) || 1));
  let rows = "";
  for (let row = 5; row >= 1; row--) {
    let cells = "";
    for (let col = 1; col <= 5; col++) {
      const val = row * col;
      const here = col === p && row === co;
      const dot = here
        ? `<span class="w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-white shadow-lg animate-ping absolute"></span>
           <span class="w-3.5 h-3.5 rounded-full bg-cyan-200 border-2 border-white shadow-lg relative z-10"></span>`
        : `${val}`;
      const bg = heatColor(val);
      const txt = val <= 9 ? "#07140a" : "#ffffff";
      cells += `<div class="h-9 rounded flex items-center justify-center relative ${here ? "ring-2 ring-white z-10" : ""}" style="background:${bg};color:${txt}">${dot}</div>`;
    }
    rows += `<div class="grid grid-cols-5 gap-1 text-[10px] font-mono font-bold text-center">${cells}</div>`;
  }
  return rows;
}

// Tarjeta de una fuente/resultado
function resultadoCard(r, i, total, mediaBase, fechaConsulta) {
  // Nombre amigable de la fuente (mismo catálogo que usa el detalle), para NO
  // mostrar el slug interno (ej. "rues", "garantias_mobiliarias_oficial").
  const infoFuente = describirFuente(r) || {};
  const nombreAmigable = infoFuente.titulo && infoFuente.titulo !== "Fuente" ? infoFuente.titulo : null;
  // El nombre guardado en Fuente es autoritativo. El catálogo se usa solo
  // cuando el backend no envía nombre, nunca para sustituirlo por la categoría.
  const fuente = esc(r?.fuente || r?.fuente_nombre || nombreAmigable || "Fuente");
  const tipo = esc(r?.tipo_fuente || r?.tipo || "");
  const estado = (r?.estado || "").toString();
  const estadoLow = estado.toLowerCase();
  const ok = ["validado", "validada", "completado", "finalizado"].includes(estadoLow);
  const estadoChip = ok
    ? "bg-emerald-950/80 text-brand-emerald border-brand-emerald/40"
    : (["sin validar", "sin_validar", "error"].includes(estadoLow)
        ? "bg-rose-950/70 text-rose-300 border-rose-500/40"
        : "bg-amber-950/70 text-amber-300 border-amber-500/40");
  const score = r?.score != null ? esc(r.score) : "—";
  const mensajeHtml = formatearMensajeResultado(r?.mensaje);
  const hasImg = esImagen(r?.archivo);
  const imgUrl = hasImg
    ? `${mediaBase}${String(r.archivo).replace(/^.*?media[\\/]/, "")}`
    : "";
  const urlOficial = urlOficialResultado(r);
  const extra = r?.datos_extra && typeof r.datos_extra === "object" ? r.datos_extra : {};
  const fechaInicio = fechaHoraConsulta(
    r?.fecha_inicio_fuente || extra.fecha_inicio_fuente || r?.fecha_consulta || fechaConsulta
  );
  const fechaFinRaw = r?.fecha_fin_fuente || extra.fecha_fin_fuente;
  const fechaFin = fechaFinRaw ? fechaHoraConsulta(fechaFinRaw) : "";
  const imagenEvidencia = `<img src="${esc(imgUrl)}" alt="Evidencia ${fuente}" loading="lazy" class="w-full max-w-3xl h-auto rounded-lg border border-slate-700" />`;

  const evidencia = hasImg
    ? `
    <div class="bg-brand-card/60 rounded-xl border border-brand-border p-4 mt-4">
      <div class="flex items-center gap-2 text-xs font-mono text-slate-300 mb-3">
        <svg class="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
        <span class="font-bold uppercase tracking-wider text-white">Evidencia capturada</span>
      </div>
      <div class="rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl">
        <div class="bg-[#111827] px-4 py-2 flex items-center gap-2 border-b border-slate-700/80">
          <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span class="ml-3 text-[11px] font-mono text-slate-400 truncate">${fuente}</span>
        </div>
        <div class="bg-slate-950 p-3 flex justify-center">
          ${urlOficial
            ? `<a href="${esc(urlOficial)}" target="_blank" rel="noopener noreferrer" title="Abrir la fuente oficial" class="block w-full max-w-3xl cursor-pointer transition hover:opacity-90">${imagenEvidencia}</a>`
            : imagenEvidencia}
        </div>
      </div>
    </div>`
    : "";

  const scoreNum = parseFloat(r?.score);
  const hallazgo = Number.isFinite(scoreNum) && scoreNum >= 2;
  const nombreBusqueda = String(r?.fuente || r?.fuente_nombre || nombreAmigable || "fuente").toLowerCase().replace(/"/g, "");
  const tipoBusqueda = String(r?.tipo_fuente || r?.tipo || infoFuente.categoria || "").toLowerCase().replace(/"/g, "");

  return `
  <section id="f${i}" data-nombre="${nombreBusqueda}" data-tipo="${tipoBusqueda}" data-hallazgo="${hallazgo ? 1 : 0}" class="fuente-card scroll-mt-28 bg-brand-surface rounded-2xl border ${hallazgo ? "border-rose-500/50" : "border-brand-border/90"} overflow-hidden shadow-hud">
    <div class="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 px-6 py-3 flex items-center justify-between gap-2">
      <div class="flex items-center gap-3 min-w-0">
        <svg class="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
        <span class="font-mono font-bold text-white text-sm tracking-wide truncate">${fuente}</span>
      </div>
      <span class="hidden md:inline text-emerald-100 text-xs font-mono shrink-0">Resultado ${i} de ${total}</span>
    </div>
    <div class="p-5 sm:p-6">
      <div class="bg-brand-card rounded-xl border border-brand-border p-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-brand-border/70 pb-4 mb-4">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-brand-emerald"></span>
              <h4 class="text-base font-bold text-white font-mono truncate">${fuente}</h4>
            </div>
            ${tipo ? `<p class="text-xs text-slate-400 font-mono mt-0.5">${tipo}</p>` : ""}
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-3 py-1 text-xs font-mono font-semibold bg-blue-950/70 text-blue-300 border border-blue-700/50 rounded-lg">Score: ${score}</span>
            <span class="px-3 py-1 text-xs font-mono font-bold border rounded-lg ${estadoChip}">Estado: ${esc(estado || "—")}</span>
          </div>
        </div>
        <div class="bg-brand-navy/60 p-3 rounded-lg border border-brand-border">
          <span class="text-slate-400 block text-[10px] uppercase font-mono">Resultado del análisis</span>
          <div class="mt-2">${mensajeHtml}</div>
        </div>
        ${evidencia}
        <div class="mt-4 rounded-lg border border-cyan-500/25 bg-cyan-950/20 px-4 py-3 text-[11px] leading-5 text-slate-300">
          <p><strong class="text-cyan-300">Nota de consulta:</strong> ingreso a la fuente el ${esc(fechaInicio)}.${fechaFin ? ` Finalizó el ${esc(fechaFin)}.` : ""}</p>
          ${urlOficial
            ? `<p class="mt-1"><strong class="text-cyan-300">URL oficial de la fuente:</strong> <a href="${esc(urlOficial)}" target="_blank" rel="noopener noreferrer" class="break-all text-cyan-300 underline underline-offset-2 hover:text-cyan-200">${esc(urlOficial)}</a></p>`
            : `<p class="mt-1"><strong class="text-cyan-300">URL oficial:</strong> no registrada para esta fuente.</p>`}
          ${hasImg && urlOficial ? `<p class="mt-1 text-slate-400">Selecciona la evidencia para abrir la página oficial.</p>` : ""}
        </div>
      </div>
    </div>
  </section>`;
}

export function buildInformeHtml({ consulta, riesgo, resultados, apiUrl, qrUrl, verifyUrl, burbujaUrl }) {
  const mediaBase = `${apiUrl}/media/`;
  const cand = consulta?.candidato || {};
  const nombre =
    `${cand.first_name || cand.nombre || ""} ${cand.last_name || cand.apellido || ""}`.trim() ||
    consulta?.nombre || "—";
  const cedula = cand.document || cand.cedula || consulta?.cedula || "—";
  const sexo = cand.gender || cand.sexo || "—";
  const tipoDoc = cand.doc_type || cand.tipo_doc || "CC";
  const estadoCedula = cand.estado_cedula || cand.estado || "—";
  const birth = cand.birth_date || cand.fecha_nacimiento || null;
  const anio = anioLocal(birth);
  const edad = anio ? Math.max(0, new Date().getFullYear() - anio) : "—";
  const fechaExp = cand.fecha_expedicion ? fechaSoloLocal(cand.fecha_expedicion) : "—";
  const lugarExp = [cand.municipio_expedicion, cand.departamento_expedicion].filter(Boolean).join(" (") + (cand.departamento_expedicion ? ")" : "") || "—";
  const fecha = consulta?.fecha ? new Date(consulta.fecha).toLocaleString() : new Date().toLocaleString();

  const cat = riesgo?.categoria || "—";
  const prob = riesgo?.probabilidad ?? "—";
  const cons = riesgo?.consecuencia ?? "—";
  const score = riesgo?.riesgo ?? "—";
  const th = riesgoTheme(cat);

  // Mismas imágenes que usa el PDF (estáticas del backend): avatar por color de
  // riesgo + sexo, semáforo y logo. (Se sirven en STATIC_URL = /django_static/.)
  const catLow = (cat || "").toLowerCase();
  const colorMap = { extremo: "rojo", alto: "rojo", medio: "amarillo", bajo: "verde" };
  const color = colorMap[catLow] || "";
  // Detección de sexo robusta (mismo criterio que CardDni.jsx), para elegir
  // bien el retrato de hombre/mujer.
  const sexoLow = (sexo || "").trim().toLowerCase();
  const esFem = ["f", "femenino", "female", "mujer"].includes(sexoLow);
  const avatarFile = esFem
    ? (color ? `placeholder_${color}_femenino.png` : "placeholder_femenino_gris.png")
    : (color ? `placeholder_${color}.png` : "placeholder.png");
  const semaforoFile = `semaforo_${color || "gris"}.png`;
  // Servidas por /api/report-asset/ (confiable, no depende de /django_static/).
  const staticBase = `${apiUrl}/api/report-asset/`;
  const logoUrl = `${staticBase}logo-removebg-preview.png`;
  const avatarUrl = `${staticBase}${avatarFile}`;
  const semaforoUrl = `${staticBase}${semaforoFile}`;

  // Gauge: fracción score/5
  const frac = Math.min(1, Math.max(0, (num(score) || 0) / 5));
  const CIRC = 263.89;
  const dashoffset = (CIRC * (1 - frac)).toFixed(2);

  const items = Array.isArray(resultados) ? resultados.filter((r) => r?.mensaje || r?.score != null || r?.archivo) : [];
  const totalFuentes = items.length;
  const cards = items
    .map((r, idx) => resultadoCard(r, idx + 1, totalFuentes, mediaBase, consulta?.fecha))
    .join("\n");

  // Atajos: fuentes con hallazgo (score >= 2) para saltar directo a la fuente REAL del hallazgo.
  const conHallazgo = items
    .map((r, idx) => ({ r, idx: idx + 1, n: parseFloat(r?.score) }))
    .filter((x) => Number.isFinite(x.n) && x.n >= 2);
  const chips = conHallazgo
    .map((x) => `<a href="#f${x.idx}" class="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold hover:bg-rose-900/70 hover:border-rose-400 transition">⚠ ${esc(x.r?.fuente || x.r?.fuente_nombre || "Fuente")}</a>`)
    .join("");

  // Chips rápidos por TIPO de fuente: salta a la primera fuente de ese tipo.
  const tiposUnicos = [];
  items.forEach((r) => {
    const t = String(r?.tipo_fuente || r?.tipo || "").trim();
    if (t && !tiposUnicos.some((x) => x.toLowerCase() === t.toLowerCase())) tiposUnicos.push(t);
  });
  const chipsTipo = tiposUnicos
    .map((t) => `<button type="button" data-tipo-jump="${esc(t.toLowerCase())}" class="chip-tipo shrink-0 inline-flex items-center px-3 py-1 rounded-full bg-brand-card border border-brand-border text-slate-300 text-xs font-semibold hover:border-brand-cyan/60 hover:text-brand-cyan transition">${esc(t)}</button>`)
    .join("");

  const barraBusqueda = `
  <div class="sticky top-16 z-40 mt-4 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 bg-brand-navy/95 backdrop-blur-md border-b border-brand-border/70 space-y-2.5">
    <div class="flex flex-col lg:flex-row lg:items-center gap-3">
      <div class="relative flex-1 min-w-0">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"></path></svg>
        <input id="buscar-fuente" type="text" placeholder="Buscar fuente o tipo... (ej. policía, RUES, judicial)" autocomplete="off"
          class="w-full pl-9 pr-16 py-2 rounded-lg bg-brand-card border border-brand-border text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-brand-cyan/60 focus:ring-2 focus:ring-brand-cyan/20 transition"/>
        <span id="buscar-contador" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"></span>
      </div>
      ${conHallazgo.length
        ? `<div class="flex items-center gap-2 overflow-x-auto pb-1">
             <span class="text-xs text-rose-300 font-semibold shrink-0">${conHallazgo.length} con hallazgo:</span>
             ${chips}
           </div>`
        : `<span class="text-xs text-brand-emerald font-semibold shrink-0">✓ Sin hallazgos</span>`}
    </div>
    ${chipsTipo
      ? `<div class="flex items-center gap-2 overflow-x-auto pb-0.5">
           <span class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold shrink-0">Ir a tipo:</span>
           ${chipsTipo}
         </div>`
      : ""}
  </div>`;

  return `<!DOCTYPE html>
<html class="dark" lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>ECONFIA - Informe de Análisis de Riesgo</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet"/>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: { extend: {
      colors: { brand: { navy:'#050914', surface:'#0a1024', card:'#0f1733', border:'#1b284f', accent:'#00ff88', emerald:'#00e676', cyan:'#00e5ff', blueBar:'#152b5c' } },
      fontFamily: { sans:['"Plus Jakarta Sans"','sans-serif'], mono:['"Space Grotesk"','monospace'] },
      boxShadow: { 'neon-green':'0 0 25px -3px rgba(0,255,136,0.35)', 'neon-glow':'0 0 40px -5px rgba(0,230,118,0.25)', 'hud':'0 8px 32px 0 rgba(0,0,0,0.45)' }
    }}
  }
</script>
<style>
  .bg-grid-cyber { background-size:32px 32px; background-image:linear-gradient(to right, rgba(27,40,79,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(27,40,79,0.25) 1px, transparent 1px); }
  html,body{ margin:0; }
</style>
</head>
<body class="bg-brand-navy text-slate-200 font-sans antialiased min-h-screen bg-grid-cyber">
<div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
${barraBusqueda}

  <!-- Header -->
  <header class="bg-brand-surface/90 backdrop-blur-md rounded-2xl p-5 border border-brand-border/80 shadow-hud flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-5">
      <div class="h-14 px-3 rounded-xl bg-gradient-to-br from-emerald-400/10 via-brand-card to-cyan-500/5 border border-brand-emerald/40 flex items-center justify-center shadow-neon-green">
        <img src="${esc(logoUrl)}" alt="Econfia" class="h-10 w-auto object-contain" onerror="this.style.display='none'"/>
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-extrabold tracking-wider text-white uppercase font-mono">ECONFIA</h1>
          <span class="text-[11px] font-semibold tracking-widest uppercase bg-emerald-950/80 text-brand-emerald border border-brand-emerald/40 px-2.5 py-0.5 rounded-full">INFORME DE RIESGO</span>
        </div>
        <p class="text-xs font-semibold text-slate-300 tracking-wide mt-0.5">INFORME DE ANÁLISIS DE RIESGO</p>
        <p class="text-[11px] text-slate-400 font-mono">Due Diligence — Fuentes públicas y privadas</p>
      </div>
    </div>
    <div class="flex items-center gap-6 px-6 py-2.5 rounded-xl bg-brand-card/80 border border-brand-border">
      <div class="text-right">
        <p class="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Fecha de emisión</p>
        <p class="text-sm font-bold text-white font-mono flex items-center gap-2 justify-end"><span class="w-2 h-2 rounded-full bg-brand-emerald animate-ping"></span>${esc(fecha)}</p>
      </div>
      <div class="h-8 w-px bg-brand-border"></div>
      <div class="text-left">
        <p class="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Dictamen</p>
        <span class="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded border ${th.chip}">${esc(th.dict)}</span>
      </div>
    </div>
  </header>

  <!-- Person banner -->
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#081229] via-[#0d1d45] to-[#081229] border border-brand-border/80 px-8 py-5 shadow-hud text-center">
    <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-20 bg-brand-emerald/15 blur-3xl rounded-full pointer-events-none"></div>
    <p class="text-[11px] font-mono tracking-[0.28em] text-brand-emerald uppercase font-bold mb-1">Sujeto objeto de evaluación</p>
    <h2 class="text-2xl md:text-4xl font-extrabold tracking-wider text-white uppercase drop-shadow font-mono">${esc(nombre)}</h2>
    <div class="mt-2 flex items-center justify-center gap-4 text-xs font-mono text-slate-300 flex-wrap">
      <span>${esc(tipoDoc)}: <strong class="text-white font-bold tracking-wider">${esc(cedula)}</strong></span>
      <span class="text-slate-600">•</span>
      <span class="text-brand-emerald font-semibold">ESTADO: ${esc(estadoCedula)}</span>
      <span class="text-slate-600">•</span>
      <span>JURISDICCIÓN: COLOMBIA</span>
    </div>
    <div class="w-48 h-0.5 bg-gradient-to-r from-transparent via-brand-emerald to-transparent mx-auto mt-3"></div>
  </div>

  <!-- Dashboard grid -->
  <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
    <!-- Biometrics -->
    <section class="xl:col-span-5 bg-brand-surface rounded-2xl border border-brand-border/90 p-6 flex flex-col shadow-hud relative overflow-hidden">
      <div class="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
      <div class="flex items-center gap-2 border-b border-brand-border/60 pb-3 mb-6">
        <span class="w-2.5 h-2.5 rounded-full bg-brand-emerald shadow-neon-green"></span>
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">Identificación & Score</h3>
      </div>
      <div class="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        <div class="flex flex-col items-center">
          <div class="relative w-28 h-28 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-2 border-brand-emerald/20 animate-pulse"></div>
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="42" stroke="#1b284f" stroke-width="6"></circle>
              <circle cx="50" cy="50" fill="transparent" r="42" stroke="${th.gauge}" stroke-dasharray="${CIRC}" stroke-dashoffset="${dashoffset}" stroke-linecap="round" stroke-width="6"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span class="text-4xl font-extrabold font-mono text-white tracking-tight">${esc(score)}</span>
              <span class="text-[9px] uppercase tracking-widest text-slate-400 font-mono">PUNTAJE</span>
            </div>
          </div>
          <p class="text-[11px] uppercase tracking-wider text-slate-400 font-mono mt-2">NIVEL DE RIESGO</p>
          <span class="mt-1 px-4 py-1 text-xs font-bold font-mono tracking-widest uppercase ${th.badgeBg} ${th.badgeTx} rounded-full shadow-neon-green">${esc(cat)}</span>
        </div>
        <div class="relative flex flex-col items-center">
          <div class="w-36 h-36 rounded-full p-1.5 border-2 shadow-neon-green overflow-hidden bg-[#040914]" style="border-color:${th.hex}">
            <img src="${esc(avatarUrl)}" alt="Perfil de riesgo" class="w-full h-full object-contain rounded-full" onerror="this.style.visibility='hidden'"/>
          </div>
          <img src="${esc(semaforoUrl)}" alt="Semáforo de riesgo" class="h-14 mt-3 object-contain drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" onerror="this.style.display='none'"/>
        </div>
      </div>
      <div class="mt-6 bg-brand-card/70 rounded-xl p-4 border border-brand-border divide-y divide-brand-border/60 text-xs font-mono">
        ${row("Sexo", sexo)}
        ${row("Año de nacimiento", anio || "—")}
        ${row("Edad", edad)}
        ${row("Fecha de expedición", fechaExp)}
        ${row("Lugar de expedición", lugarExp)}
        ${row("Estado de cédula", estadoCedula)}
        ${row("Cupo numérico", cedula)}
      </div>
    </section>

    <!-- Risk matrix -->
    <section class="xl:col-span-7 bg-brand-surface rounded-2xl border border-brand-border/90 p-6 flex flex-col shadow-hud">
      <div class="flex items-center gap-2 border-b border-brand-border/60 pb-3 mb-5">
        <svg class="w-4 h-4 text-brand-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">Evaluación de Riesgo (Matriz 5x5)</h3>
      </div>
      <div class="bg-brand-card/90 rounded-xl p-4 border border-brand-border">
        <div class="flex items-stretch gap-1">
          <div class="flex items-center justify-center"><span class="-rotate-90 text-[9px] uppercase font-mono text-slate-400 tracking-wider whitespace-nowrap">CONSECUENCIA</span></div>
          <div class="flex-1 space-y-1">${matrizHeatmap(prob, cons)}</div>
        </div>
        <div class="text-center mt-2 text-[9px] uppercase font-mono text-slate-400 tracking-wider">PROBABILIDAD →</div>
        <div class="mt-3 pt-2 border-t border-slate-700/50 flex justify-between items-center text-[10px] font-mono text-slate-300 flex-wrap gap-2">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-cyan-300 inline-block"></span> Posición (P:${esc(prob)} · C:${esc(cons)})</span>
          <span class="font-bold" style="color:${th.hex}">${esc(cat)}</span>
        </div>
        <div class="mt-4 p-3 rounded-xl bg-brand-card/60 border border-brand-border text-[11px] font-mono">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-slate-400 font-semibold uppercase text-[10px]">Severidad</span>
            <span class="text-slate-400 text-[10px]">Bajo → Crítico</span>
          </div>
          <div class="grid grid-cols-4 gap-1 h-2.5 rounded overflow-hidden">
            <div style="background:linear-gradient(90deg,hsl(140,85%,54%),hsl(140,85%,40%))"></div>
            <div style="background:linear-gradient(90deg,hsl(52,85%,54%),hsl(52,85%,40%))"></div>
            <div style="background:linear-gradient(90deg,hsl(28,85%,54%),hsl(28,85%,40%))"></div>
            <div style="background:linear-gradient(90deg,hsl(0,85%,54%),hsl(0,85%,40%))"></div>
          </div>
          <div class="grid grid-cols-4 gap-1 mt-1 text-[9px] text-slate-400 text-center">
            <span>1-4 Bajo</span><span>5-9 Medio</span><span>10-14 Alto</span><span>15-25 Crítico</span>
          </div>
        </div>
      </div>
    </section>
  </div>

  ${burbujaUrl ? `
  <!-- Diagrama de burbujas de riesgo -->
  <section class="bg-brand-surface rounded-2xl border border-brand-border/90 p-6 shadow-hud">
    <div class="flex items-center gap-2 border-b border-brand-border/60 pb-3 mb-4">
      <span class="w-2.5 h-2.5 rounded-full bg-brand-emerald shadow-neon-green"></span>
      <h3 class="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">Diagrama de burbujas de riesgo</h3>
    </div>
    <div class="rounded-xl overflow-hidden border border-brand-border bg-brand-card/50 p-3 flex justify-center">
      <img src="${esc(burbujaUrl)}" alt="Diagrama de burbujas de riesgo" class="max-w-full h-auto max-h-[500px] object-contain rounded-lg" onerror="this.closest('section').style.display='none'"/>
    </div>
  </section>` : ""}

  <!-- Resultados por fuente -->
  <div class="space-y-6">
    <div class="flex items-center gap-3 px-1">
      <span class="w-2.5 h-2.5 rounded-full bg-brand-emerald shadow-neon-green"></span>
      <h3 class="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">Resultados por fuente — ${totalFuentes} consultada${totalFuentes === 1 ? "" : "s"}</h3>
    </div>
    ${cards || `<p class="text-sm text-slate-400 font-mono px-1 py-6">No hay resultados para mostrar.</p>`}
  </div>

  <!-- Verificación: QR + link público -->
  <section class="bg-brand-blueBar rounded-2xl p-5 border border-blue-900/60 shadow-hud flex flex-col sm:flex-row items-center gap-5">
    ${qrUrl ? `<div class="p-2 bg-white rounded-xl shadow-md shrink-0"><img src="${esc(qrUrl)}" alt="QR de verificación" class="w-24 h-24 object-contain" onerror="this.closest('div').style.display='none'"/></div>` : ""}
    <div class="min-w-0 flex-1 text-center sm:text-left">
      <p class="text-[11px] font-mono tracking-widest text-brand-emerald uppercase font-bold mb-1">Verificación del informe</p>
      <p class="text-sm text-slate-200 font-sans">Escanea el QR o abre el enlace para verificar la autenticidad de este reporte.</p>
      ${verifyUrl ? `<a href="${esc(verifyUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-brand-emerald border border-brand-emerald/40 font-mono text-xs font-bold transition">Verificar este informe →</a>
      <p class="text-[11px] text-slate-400 font-mono mt-2 break-all">${esc(verifyUrl)}</p>` : ""}
    </div>
  </section>

  <footer class="text-center py-4 text-xs font-mono text-slate-500 space-y-1">
    <p>© ${new Date().getFullYear()} ECONFIA — Plataforma de Cumplimiento AML / SARLAFT / SAGRILAFT.</p>
    <p class="text-[10px] text-slate-600">Resultados obtenidos de fuentes públicas y privadas. El uso e interpretación es responsabilidad del usuario.</p>
  </footer>

</div>

<!-- Botones: ir al inicio / ir al final -->
<button id="btn-final" title="Ir al final"
  class="fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-brand-cyan text-brand-navy shadow-hud flex items-center justify-center font-bold text-xl transition-opacity">↓</button>
<button id="btn-top" title="Volver al inicio"
  class="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-brand-emerald text-brand-navy shadow-neon-green flex items-center justify-center font-bold text-xl opacity-0 pointer-events-none transition-opacity">↑</button>

<script>
  (function () {
    var input = document.getElementById('buscar-fuente');
    var contador = document.getElementById('buscar-contador');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.fuente-card'));
    var total = cards.length;

    function resaltar(el) {
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('ring-2', 'ring-brand-cyan');
      setTimeout(function () { el.classList.remove('ring-2', 'ring-brand-cyan'); }, 1600);
    }

    // Devuelve las tarjetas que coinciden con el texto (nombre, tipo o contenido).
    function coincidencias(q) {
      if (!q) return [];
      return cards.filter(function (c) {
        return (c.getAttribute('data-nombre') || '').indexOf(q) !== -1
          || (c.getAttribute('data-tipo') || '').indexOf(q) !== -1
          || (c.textContent || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    // Búsqueda RÁPIDA: no esconde nada, salta a la mejor coincidencia.
    // Prioriza la fuente con hallazgo (data-hallazgo=1) para mandar al hallazgo REAL.
    function mejorCoincidencia(matches) {
      if (!matches.length) return null;
      var conHallazgo = matches.filter(function (c) { return c.getAttribute('data-hallazgo') === '1'; });
      return (conHallazgo[0] || matches[0]);
    }

    var ultimaBusqueda = '';
    var indiceCiclo = 0;

    if (input) {
      // Al escribir: actualiza el contador y salta suave a la mejor coincidencia.
      input.addEventListener('input', function () {
        var q = (input.value || '').trim().toLowerCase();
        var matches = coincidencias(q);
        contador.textContent = q ? (matches.length + ' encontrada' + (matches.length === 1 ? '' : 's')) : '';
        ultimaBusqueda = q;
        indiceCiclo = 0;
        if (matches.length) resaltar(mejorCoincidencia(matches));
      });
      // Enter: cicla entre las coincidencias (siguiente cada vez).
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        var q = (input.value || '').trim().toLowerCase();
        var matches = coincidencias(q);
        if (!matches.length) return;
        if (q !== ultimaBusqueda) { ultimaBusqueda = q; indiceCiclo = 0; }
        else { indiceCiclo = (indiceCiclo + 1) % matches.length; }
        resaltar(matches[indiceCiclo]);
      });
    }

    // Chips por tipo: saltan a la primera fuente de ese tipo.
    document.querySelectorAll('[data-tipo-jump]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = this.getAttribute('data-tipo-jump');
        var el = cards.filter(function (c) { return (c.getAttribute('data-tipo') || '') === t; })[0];
        resaltar(el);
      });
    });

    // Scroll suave para los atajos de hallazgo y el botón top
    document.querySelectorAll('a[href^="#f"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var el = document.getElementById(this.getAttribute('href').slice(1));
        if (el) { e.preventDefault(); resaltar(el); }
      });
    });

    var btnTop = document.getElementById('btn-top');
    var btnFinal = document.getElementById('btn-final');
    function actualizarBotones() {
      var mostrarTop = window.scrollY > 400;
      btnTop.style.opacity = mostrarTop ? '1' : '0';
      btnTop.style.pointerEvents = mostrarTop ? 'auto' : 'none';
      // Oculta "ir al final" cuando ya estás abajo del todo.
      if (btnFinal) {
        var alFondo = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 40);
        btnFinal.style.opacity = alFondo ? '0' : '1';
        btnFinal.style.pointerEvents = alFondo ? 'none' : 'auto';
      }
    }
    window.addEventListener('scroll', actualizarBotones);
    actualizarBotones();
    btnTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    if (btnFinal) btnFinal.addEventListener('click', function () { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); });
  })();
</script>
</body></html>`;
}

function row(label, value) {
  return `<div class="flex justify-between py-2 items-center gap-3"><span class="text-slate-400 uppercase tracking-wide">${esc(label)}:</span><span class="font-bold text-white tracking-wider text-right break-words">${esc(value)}</span></div>`;
}
