import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck, Building2, Fingerprint, GraduationCap, Landmark, Mail, MapPin, Phone, Scale, ShieldAlert, Sparkles,
} from "lucide-react";

// Previsualización web de Econfia Integrity 360 (mismo estilo del mockup PDF):
// identidad, contacto más reciente, mapa de ciudades, historial de contacto,
// radar de exposición, mapa de calor de fuentes, títulos, inmuebles, comportamiento
// financiero y análisis IA. Las gráficas se animan al entrar en pantalla.

const API_URL = process.env.REACT_APP_API_URL;

// Fechas "dd/mm/aaaa" se leen a mano (sin Date UTC) para no restar un día.
const anioDecimal = (ddmmyyyy) => {
  const m = String(ddmmyyyy || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return Number(m[3]) + (Number(m[2]) - 1) / 12 + (Number(m[1]) - 1) / 365;
};

const COLOR_SCORE = (s) => (s >= 4 ? "#ef4444" : s === 3 ? "#f59e0b" : s >= 1 ? "#10b981" : "#334155");
const CATEGORIA = { alto: "#ef4444", medio: "#f59e0b", bajo: "#10b981" };
const COLOR_BANDA = (b = "") => (b.includes("alto") ? "#ef4444" : b.includes("medio") ? "#f59e0b" : b ? "#10b981" : "#64748b");

// Animaciones: respetan "reducir movimiento" del sistema.
const REDUCIDO = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const trans = (ms = 900, delay = 0) => (REDUCIDO ? "none" : `all ${ms}ms cubic-bezier(.22,1,.36,1) ${delay}ms`);

// true cuando el elemento entra en pantalla (una sola vez).
function useVisible() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(REDUCIDO);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return [ref, visible];
}

// Cuenta de 0 al valor (números enteros).
function useContador(objetivo, activo, ms = 900) {
  const [valor, setValor] = useState(REDUCIDO ? objetivo : 0);
  useEffect(() => {
    const fin = Number(objetivo);
    if (!activo || !Number.isFinite(fin)) return undefined;
    if (REDUCIDO) { setValor(fin); return undefined; }
    let raf; const t0 = performance.now();
    const paso = (t) => {
      const f = Math.min(1, (t - t0) / ms);
      setValor(Math.round(fin * (1 - (1 - f) ** 3)));
      if (f < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, activo, ms]);
  return valor;
}

// Silueta simplificada de Colombia (lat, lon) para el mapa.
const BORDE_CO = [[12.4,-71.7],[11.0,-72.6],[10.4,-72.9],[9.1,-72.8],[8.3,-72.4],[7.0,-72.0],[7.0,-70.1],[6.2,-69.4],[6.1,-67.5],[4.5,-67.8],[2.6,-67.2],[1.2,-66.9],[1.7,-69.8],[0.6,-69.5],[-0.2,-70.0],[-1.4,-69.4],[-4.2,-69.9],[-2.4,-70.9],[-2.3,-72.4],[-1.1,-74.2],[-0.1,-75.3],[0.4,-77.4],[1.2,-78.9],[2.6,-78.0],[4.0,-77.3],[6.0,-77.4],[7.4,-77.9],[8.6,-77.3],[9.4,-76.0],[10.6,-75.6],[11.1,-74.9],[11.3,-74.1],[11.6,-73.0]];
const proy = (lat, lon) => [((lon + 79.5) / 13) * 300, ((12.8 - lat) / 17.3) * 360];

function Tarjeta({ titulo, icono: Icono, children, className = "", nota }) {
  const [ref, visible] = useVisible();
  return (
    <section
      ref={ref}
      className={`rounded-[22px] border border-line/15 bg-surface/90 p-5 shadow-lg shadow-black/5 ${className}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(14px)", transition: trans(600) }}
    >
      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
        {Icono && <Icono className="h-4 w-4" />} {titulo}
      </div>
      {typeof children === "function" ? children(visible) : children}
      {nota && <p className="mt-3 text-[11px] leading-5 text-muted">{nota}</p>}
    </section>
  );
}

// Velocímetro genérico: el arco se llena y el número cuenta hasta el valor.
function Velocimetro({ valor, max = 5, color, etiqueta, extremos = ["Bajo", "Alto"] }) {
  const [ref, visible] = useVisible();
  const n = Number(valor);
  const frac = Number.isFinite(n) ? Math.max(0.02, Math.min(1, n / max)) : 0;
  const mostrado = useContador(Number.isFinite(n) ? n : 0, visible);
  const arco = "M18 82 A62 62 0 0 1 142 82";
  return (
    <svg ref={ref} viewBox="0 0 160 104" className="h-28 w-44" role="img" aria-label={`${etiqueta || ""} ${valor ?? "sin dato"}`}>
      <path d={arco} stroke="currentColor" className="text-line/25" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d={arco} pathLength="100" stroke={color} strokeWidth="13" fill="none" strokeLinecap="round"
            strokeDasharray="100" style={{ strokeDashoffset: visible ? 100 - frac * 100 : 100, transition: trans(1100) }} />
      <text x="80" y="74" textAnchor="middle" className="fill-content" fontSize={max > 10 ? 26 : 30} fontWeight="800">
        {Number.isFinite(n) ? mostrado : "—"}
      </text>
      <text x="80" y="92" textAnchor="middle" fill={color} fontSize="10" fontWeight="800" style={{ textTransform: "uppercase" }}>
        {etiqueta}
      </text>
      <text x="18" y="101" textAnchor="middle" fontSize="8" className="fill-muted">{extremos[0]}</text>
      <text x="142" y="101" textAnchor="middle" fontSize="8" className="fill-muted">{extremos[1]}</text>
    </svg>
  );
}

// Radar: el área crece desde el centro; cada eje muestra su nivel en texto.
function Radar({ ejes, visible }) {
  const cx = 150; const cy = 135; const R = 92;
  const pt = (i, f) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / ejes.length;
    return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)];
  };
  const nivel = (v) => (v > 0.6 ? "Alto" : v > 0.25 ? "Medio" : v > 0 ? "Bajo" : "Nulo");
  return (
    <svg viewBox="0 0 300 275" className="w-full">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={ejes.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="currentColor" className="text-line/25" strokeDasharray={f < 1 ? "3 3" : undefined} />
      ))}
      {ejes.map((e, i) => {
        const [x, y] = pt(i, 1); const [lx, ly] = pt(i, 1.24);
        const alto = e.valor > 0.6;
        return (
          <g key={e.eje}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-line/25" />
            <text x={lx} y={ly - 4} textAnchor="middle" fontSize="10.5" fontWeight="800" className="fill-content">{e.eje}</text>
            <text x={lx} y={ly + 8} textAnchor="middle" fontSize="9" fontWeight="700" fill={alto ? "#f59e0b" : "#22d3ee"}>
              {nivel(e.valor)} · {e.detalle}
            </text>
          </g>
        );
      })}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: visible ? "scale(1)" : "scale(0)", transition: trans(1000, 150) }}>
        <polygon points={ejes.map((e, i) => pt(i, Math.max(e.valor, 0.05)).join(",")).join(" ")} fill="#22d3ee" fillOpacity="0.2" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />
        {ejes.map((e, i) => { const [x, y] = pt(i, Math.max(e.valor, 0.05)); return <circle key={i} cx={x} cy={y} r="4.5" fill={e.valor > 0.6 ? "#f59e0b" : "#22d3ee"} stroke="white" strokeWidth="1.5" />; })}
      </g>
    </svg>
  );
}

function MapaColombia({ ubicaciones, visible }) {
  const conCoords = ubicaciones.filter((u) => u.lat != null);
  const peso = (u) => u.reportes + u.inmuebles * 3;
  const max = Math.max(1, ...conCoords.map(peso));
  const principal = conCoords.reduce((a, u) => (!a || peso(u) > peso(a) ? u : a), null);
  return (
    <svg viewBox="0 0 300 360" className="w-full max-w-sm">
      <polygon points={BORDE_CO.map(([a, b]) => proy(a, b).join(",")).join(" ")} className="fill-brand/10" stroke="#2b4c7e" strokeWidth="1.5" strokeLinejoin="round" />
      {conCoords.map((u, k) => {
        const [x, y] = proy(u.lat, u.lon);
        const r = 5 + (peso(u) / max) * 13;
        return (
          <g key={u.ciudad} style={{ transformBox: "fill-box", transformOrigin: "center", transform: visible ? "scale(1)" : "scale(0)", opacity: visible ? 1 : 0, transition: trans(700, 200 + k * 120) }}>
            {u === principal && !REDUCIDO && (
              <circle cx={x} cy={y} r={r} fill="none" stroke="#22d3ee" strokeWidth="1.5" className="origin-center animate-ping" style={{ transformBox: "fill-box" }} />
            )}
            <circle cx={x} cy={y} r={r} fill="#22d3ee" fillOpacity="0.22" stroke="#22d3ee" strokeWidth="1.5">
              <title>{`${u.ciudad}: ${u.reportes} reporte(s)${u.inmuebles ? `, ${u.inmuebles} inmueble(s)` : ""}`}</title>
            </circle>
            {u.inmuebles > 0 && <rect x={x + 5} y={y - 15} width="11" height="11" rx="2" fill="#a855f7" />}
            <circle cx={x} cy={y} r="3" className="fill-content" />
            <text x={x - 8} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" className="fill-content">{u.ciudad}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Línea de tiempo: cada barra crece desde el primer reporte hasta el último.
function HistorialContacto({ items, visible }) {
  const conFechas = items.map((i) => ({ ...i, d: anioDecimal(i.desde) ?? anioDecimal(i.ultimo), h: anioDecimal(i.ultimo) })).filter((i) => i.h);
  if (!conFechas.length) return <p className="text-sm text-muted">Sin fechas de reporte disponibles.</p>;
  const a0 = Math.floor(Math.min(...conFechas.map((i) => i.d))); const a1 = Math.ceil(Math.max(...conFechas.map((i) => i.h))) + 0.01;
  const X = (a) => 150 + ((a - a0) / (a1 - a0)) * 360;
  const ICON = { correo: "✉", telefono: "☎", direccion: "⌂" };
  const reciente = Math.max(...conFechas.map((i) => i.h));
  const alto = conFechas.length * 22;
  return (
    <>
      <svg viewBox={`0 0 520 ${alto + 26}`} className="w-full">
        {Array.from({ length: Math.ceil(a1 - a0) + 1 }, (_, k) => a0 + k).filter((a, k, arr) => arr.length < 9 || k % 2 === 0).map((a) => (
          <g key={a}>
            <line x1={X(a)} y1="0" x2={X(a)} y2={alto + 4} stroke="currentColor" className="text-line/20" />
            <text x={X(a)} y={alto + 20} textAnchor="middle" fontSize="9" className="fill-muted">{a}</text>
          </g>
        ))}
        {conFechas.map((i, k) => {
          const actual = reciente - i.h < 1;
          return (
            <g key={k}>
              <text x="0" y={k * 22 + 13} fontSize="9.5" fontWeight={actual ? 700 : 400} className="fill-content">{ICON[i.tipo]} {i.dato.length > 24 ? `${i.dato.slice(0, 23)}…` : i.dato}</text>
              <rect x={X(i.d)} y={k * 22 + 3} width={Math.max(6, X(i.h) - X(i.d))} height="12" rx="6" fill={actual ? "#22d3ee" : "#64748b"}
                    style={{ transformBox: "fill-box", transformOrigin: "left center", transform: visible ? "scaleX(1)" : "scaleX(0)", transition: trans(800, 100 + k * 70) }}>
                <title>{`${i.desde || "?"} → ${i.ultimo}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        <span><span className="mr-1 inline-block h-2 w-3 rounded-full bg-cyan-400" />Vigente (reportado en el último año)</span>
        <span><span className="mr-1 inline-block h-2 w-3 rounded-full bg-slate-500" />Anterior</span>
      </div>
    </>
  );
}

// Mapa de calor: resumen en cifras + celdas que aparecen en cascada.
function MapaCalor({ fuentes, visible }) {
  const grupos = [
    ["Limpias", "#10b981", (f) => f.estado !== "Sin respuesta" && f.score < 3],
    ["Alerta media", "#f59e0b", (f) => f.estado !== "Sin respuesta" && f.score === 3],
    ["Alerta alta", "#ef4444", (f) => f.estado !== "Sin respuesta" && f.score >= 4],
    ["Sin respuesta", "#64748b", (f) => f.estado === "Sin respuesta"],
  ];
  const ordenadas = [...fuentes].sort((a, b) => (b.score || 0) - (a.score || 0));
  return (
    <>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {grupos.map(([k, color, fn]) => (
          <div key={k} className="rounded-xl border border-line/15 px-2 py-2 text-center">
            <div className="text-lg font-black" style={{ color }}>{fuentes.filter(fn).length}</div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{k}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(18px, 1fr))" }}>
        {ordenadas.map((f, i) => (
          <div key={i} title={`${f.fuente} · score ${f.score} · ${f.estado}`} className="h-5 rounded"
               style={{ background: f.estado === "Sin respuesta" ? "#64748b55" : COLOR_SCORE(f.score),
                        opacity: visible ? (f.score === 0 ? 0.6 : 0.95) : 0,
                        transform: visible ? "none" : "scale(.4)", transition: trans(400, Math.min(i * 12, 900)) }} />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted">Ordenadas de mayor a menor alerta. Pasa el cursor sobre una celda para ver la fuente.</p>
    </>
  );
}

// Markdown mínimo (### títulos, viñetas, **negrita**) para el análisis de IA.
function MarkdownSimple({ texto }) {
  const html = useMemo(() => {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc(texto)
      .split("\n")
      .map((l) => {
        const b = l.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
        if (/^#{1,4}\s/.test(l)) return `<h4 class="mt-3 mb-1 text-sm font-black text-content">${b.replace(/^#{1,4}\s/, "")}</h4>`;
        if (/^\s*[-*•]\s/.test(l)) return `<li class="ml-4 list-disc">${b.replace(/^\s*[-*•]\s/, "")}</li>`;
        return l.trim() ? `<p>${b}</p>` : "";
      })
      .join("");
  }, [texto]);
  // eslint-disable-next-line react/no-danger
  return <div className="space-y-1 text-sm leading-6 text-content/90" dangerouslySetInnerHTML={{ __html: html }} />;
}

// El análisis queda guardado en el backend: se genera una sola vez por consulta.
function AnalisisIA({ consultaId }) {
  const [estado, setEstado] = useState({ cargando: true, texto: "", error: "", aviso: "" });
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/consolidado-riesgo/consultas/${consultaId}/analisis/`, {
          method: "POST", headers: { Authorization: `Token ${localStorage.getItem("token")}` },
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "No fue posible generar el análisis.");
        if (vivo) setEstado({ cargando: false, texto: data.analisis, error: "", aviso: data.aviso });
      } catch (e) { if (vivo) setEstado({ cargando: false, texto: "", error: e.message, aviso: "" }); }
    })();
    return () => { vivo = false; };
  }, [consultaId]);
  return (
    <Tarjeta titulo="Análisis inteligente" icono={Sparkles} className="border-brand/25 bg-gradient-to-br from-brand/10 to-surface/90">
      {estado.cargando && (
        <div className="space-y-2" aria-label="Analizando">
          {[92, 78, 85, 60].map((w) => <div key={w} className="h-3 animate-pulse rounded bg-line/20" style={{ width: `${w}%` }} />)}
        </div>
      )}
      {estado.error && <p className="text-sm text-red-500">{estado.error}</p>}
      {estado.texto && <>
        <MarkdownSimple texto={estado.texto} />
        <p className="mt-3 border-t border-line/15 pt-2 text-[11px] text-muted">{estado.aviso}</p>
      </>}
    </Tarjeta>
  );
}

// Indicadores financieros SIN montos (los mismos que recibe la IA).
function Financiero({ fin }) {
  const lineas = [...(fin.adjudicator || []), ...(fin.credit_report || [])].map((l) => l.replace(/^-\s*/, ""));
  if (!lineas.length) return null;
  const color = COLOR_BANDA(fin.banda);
  return (
    <Tarjeta titulo="Comportamiento financiero · Adjudicator / Credit Report" icono={Landmark}
             nota="Solo indicadores de comportamiento (sin montos, cuentas ni entidades). No constituye una decisión de crédito.">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {fin.score != null && (
          <div className="shrink-0 text-center">
            <Velocimetro valor={fin.score} max={1000} color={color} etiqueta={fin.banda || "score"} extremos={["0", "1000"]} />
            <div className="text-[10px] text-muted">Score crediticio · más alto = mejor</div>
          </div>
        )}
        <ul className="grid flex-1 gap-1.5 sm:grid-cols-2">
          {lineas.map((l, i) => (
            <li key={i} className="rounded-xl border border-line/10 bg-surface-2/40 px-3 py-2 text-xs leading-5 text-content">{l}</li>
          ))}
        </ul>
      </div>
    </Tarjeta>
  );
}

function BarrasInmuebles({ porCiudad, visible }) {
  const max = Math.max(1, ...porCiudad.map((x) => x.inmuebles));
  return porCiudad.map((c, i) => (
    <div key={c.ciudad} className="mt-2 flex items-center gap-3 text-sm">
      <span className="w-28 truncate text-content">{c.ciudad}</span>
      <div className="h-3 flex-1 rounded-full bg-line/15">
        <div className="h-3 rounded-full bg-purple-500" style={{ width: visible ? `${(c.inmuebles / max) * 100}%` : "0%", transition: trans(900, i * 100) }} />
      </div>
      <b className="w-6 text-right text-content">{c.inmuebles}</b>
    </div>
  ));
}

export default function IntegrityPreview({ consultaId }) {
  const [vista, setVista] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    setVista(null); setError("");
    fetch(`${API_URL}/api/consolidado-riesgo/consultas/${consultaId}/vista/`, {
      headers: { Authorization: `Token ${localStorage.getItem("token")}` },
    })
      .then(async (r) => { if (!r.ok) throw new Error("No fue posible cargar la previsualización."); return r.json(); })
      .then((d) => vivo && setVista(d))
      .catch((e) => vivo && setError(e.message));
    return () => { vivo = false; };
  }, [consultaId]);

  if (error) return <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-500">{error}</p>;
  if (!vista) return <div className="py-16 text-center text-sm text-muted">Cargando previsualización…</div>;

  const { bio = {}, contacto = {}, calificacion = {}, profesion = {} } = vista;
  const docVigente = (bio.estado_documento || "").toUpperCase() === "VIGENTE";
  const contactoFilas = [
    ["Correo electrónico", Mail, contacto.correo],
    ["Teléfono", Phone, contacto.telefono],
    ["Dirección", MapPin, contacto.direccion],
  ];

  return (
    <div className="space-y-4">
      {/* Identidad */}
      <section className="overflow-hidden rounded-[26px] border border-cyan-400/20 bg-gradient-to-br from-[#081327] via-[#0c1d3a] to-[#13305a] p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-white/30 bg-gradient-to-br from-cyan-400 to-indigo-500 text-2xl font-black">{vista.iniciales || "?"}</div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Econfia Integrity 360</div>
              <h2 className="mt-1 text-2xl font-black leading-tight md:text-3xl">{bio.nombre || "Identidad pendiente"}</h2>
              <div className="text-sm text-slate-300">{bio.tipo_doc} {bio.documento}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold">
                {bio.estado_documento && <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${docVigente ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}><BadgeCheck className="h-3.5 w-3.5" />Documento {bio.estado_documento.toLowerCase()}</span>}
                {bio.edad && <span className="rounded-full bg-white/10 px-3 py-1">{bio.edad}</span>}
                {bio.sexo && <span className="rounded-full bg-white/10 px-3 py-1">{bio.sexo}</span>}
                {bio.lugar_expedicion && <span className="rounded-full bg-white/10 px-3 py-1">Expedido en {bio.lugar_expedicion}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {profesion.titulo && (
              <div className="rounded-2xl border border-purple-400/40 bg-purple-500/15 px-4 py-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200"><GraduationCap className="h-4 w-4" />Formación</div>
                <div className="text-lg font-black">{profesion.titulo}</div>
                {profesion.fuente && <div className="text-[11px] text-purple-200">{profesion.fuente}</div>}
              </div>
            )}
            <div className="text-center">
              <Velocimetro valor={calificacion.score} max={5} color={CATEGORIA[calificacion.categoria] || "#64748b"}
                           etiqueta={String(calificacion.categoria || "").replace("_", " ")} />
              <div className="text-[10px] text-slate-400">Riesgo vigente (1 a 5)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Datos biográficos */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[["Documento", `${bio.tipo_doc || ""} ${bio.documento || ""}`], ["Estado", bio.estado_documento], ["Edad", bio.edad],
          ["Expedición", bio.fecha_expedicion], ["Año expedición", bio.anio_expedicion], ["Lugar", bio.lugar_expedicion]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line/15 bg-surface/90 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">{k}</div>
            <div className="mt-0.5 truncate text-sm font-black text-content">{v || "No reportado"}</div>
          </div>
        ))}
      </div>

      <AnalisisIA consultaId={consultaId} />

      <Financiero fin={vista.financiero || {}} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Contacto más reciente · Contact Search" icono={Fingerprint}>
          {Object.keys(contacto).length === 0 ? <p className="text-sm text-muted">Sin consulta de Contact Search vigente.</p> : (
            <div className="divide-y divide-line/10">
              {contactoFilas.map(([k, Icono, d]) => (
                <div key={k} className="flex items-start gap-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500"><Icono className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">{k}</div>
                    <div className="break-words text-sm font-bold text-content">{d?.dato || "No reportado"}</div>
                    {(d?.ciudad || d?.fecha) && <div className="text-xs text-cyan-600 dark:text-cyan-300">{[d?.ciudad, d?.fecha && `Último reporte: ${d.fecha}`].filter(Boolean).join(" · ")}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Tarjeta>
        <Tarjeta titulo="Huella de exposición" icono={ShieldAlert}
                 nota='Más lejos del centro = más exposición. Solo "Antecedentes" afecta la calificación vigente; el resto es contexto.'>
          {(visible) => <Radar ejes={vista.radar || []} visible={visible} />}
        </Tarjeta>
      </div>

      <Tarjeta titulo={`Procesos judiciales · Rama Judicial · ${vista.procesos_judiciales?.length || 0}`} icono={Scale}>
        {vista.procesos_judiciales?.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {vista.procesos_judiciales.map((p, i) => {
              const tono = p.gravedad === "alta" ? "border-red-500/30 bg-red-500/10 text-red-500"
                : p.gravedad === "media" ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-slate-400/30 bg-slate-500/10 text-muted";
              return (
                <div key={i} className="rounded-2xl border border-line/15 bg-surface-2/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${tono}`}>{p.categoria} · {p.gravedad}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${p.como_parte_senalada ? "bg-red-500/15 text-red-500" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}`}>{p.rol}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-content">{p.tipo}</div>
                  <div className="mt-0.5 text-xs text-muted">{[p.anio_radicacion && `Radicado ${p.anio_radicacion}`, p.anio_ultima_actuacion && `última actuación ${p.anio_ultima_actuacion}`, p.despacho].filter(Boolean).join(" · ")}</div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-muted">Sin procesos judiciales reportados en la consulta EconfiaFast.</p>}
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Tarjeta titulo="Mapa de ubicaciones reportadas" icono={MapPin}>
          {(visible) => (vista.ubicaciones?.length ? <>
            <div className="flex justify-center"><MapaColombia ubicaciones={vista.ubicaciones} visible={visible} /></div>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />Dirección reportada (más grande = más reportes)</span><span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-purple-500" />Inmueble (SNR)</span></div>
          </> : <p className="text-sm text-muted">Sin direcciones ni inmuebles reportados.</p>)}
        </Tarjeta>
        <div className="space-y-4">
          <Tarjeta titulo="Ciudades" icono={Building2}>
            {vista.ubicaciones?.length ? vista.ubicaciones.slice(0, 8).map((u) => (
              <div key={u.ciudad} className="flex justify-between border-b border-line/10 py-1.5 text-sm last:border-0">
                <span className="text-content">{u.ciudad}{u.departamento && <span className="text-muted"> · {u.departamento}</span>}</span>
                <span className="font-bold text-content">{u.reportes ? `${u.reportes} reporte(s)` : ""}{u.reportes && u.inmuebles ? " · " : ""}{u.inmuebles ? `${u.inmuebles} inmueble(s)` : ""}</span>
              </div>
            )) : <p className="text-sm text-muted">Sin ciudades reportadas.</p>}
          </Tarjeta>
          <Tarjeta titulo="Historial de contacto · cuándo se reportó cada dato" icono={Phone}>
            {(visible) => (vista.historial_contacto?.length
              ? <HistorialContacto items={vista.historial_contacto} visible={visible} />
              : <p className="text-sm text-muted">Sin datos de contacto reportados.</p>)}
          </Tarjeta>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo={`Mapa de calor · ${vista.fuentes_fast?.length || 0} fuentes EconfiaFast`} icono={ShieldAlert}>
          {(visible) => (vista.fuentes_fast?.length
            ? <MapaCalor fuentes={vista.fuentes_fast} visible={visible} />
            : <p className="text-sm text-muted">No hay consulta EconfiaFast completada.</p>)}
        </Tarjeta>
        <Tarjeta titulo="Formación y patrimonio" icono={GraduationCap}>
          {(visible) => <>
            {vista.titulos?.length ? (
              <ol className="relative mb-4 ml-2 border-l-2 border-purple-400/40">
                {vista.titulos.slice(0, 6).map((t, i) => (
                  <li key={i} className="mb-2 ml-4" style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-8px)", transition: trans(500, i * 90) }}>
                    <span className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full ${i === 0 ? "bg-purple-500" : "bg-indigo-400"}`} />
                    <span className={`text-sm ${i === 0 ? "font-black text-content" : "text-content/90"}`}>{t}</span>
                  </li>
                ))}
              </ol>
            ) : <p className="mb-4 text-sm text-muted">Sin títulos encontrados.</p>}
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Inmuebles por ciudad (SNR) · {vista.inmuebles?.total || 0}</div>
            <BarrasInmuebles porCiudad={vista.inmuebles?.por_ciudad || []} visible={visible} />
          </>}
        </Tarjeta>
      </div>
    </div>
  );
}
