import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck, Building2, Fingerprint, GraduationCap, Mail, MapPin, Phone, Scale, ShieldAlert, Sparkles,
} from "lucide-react";

// Previsualización web de Econfia Integrity 360 (mismo estilo del mockup PDF):
// identidad, contacto más reciente, mapa de ciudades, historial de contacto,
// radar de exposición, mapa de calor de fuentes, títulos, inmuebles y análisis IA.

const API_URL = process.env.REACT_APP_API_URL;

// Fechas "dd/mm/aaaa" se leen a mano (sin Date UTC) para no restar un día.
const anioDecimal = (ddmmyyyy) => {
  const m = String(ddmmyyyy || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return Number(m[3]) + (Number(m[2]) - 1) / 12 + (Number(m[1]) - 1) / 365;
};

const COLOR_SCORE = (s) => (s >= 4 ? "#ef4444" : s === 3 ? "#f59e0b" : s >= 1 ? "#10b981" : "#334155");
const CATEGORIA = { alto: "#ef4444", medio: "#f59e0b", bajo: "#10b981" };

// Silueta simplificada de Colombia (lat, lon) para el mapa.
const BORDE_CO = [[12.4,-71.7],[11.0,-72.6],[10.4,-72.9],[9.1,-72.8],[8.3,-72.4],[7.0,-72.0],[7.0,-70.1],[6.2,-69.4],[6.1,-67.5],[4.5,-67.8],[2.6,-67.2],[1.2,-66.9],[1.7,-69.8],[0.6,-69.5],[-0.2,-70.0],[-1.4,-69.4],[-4.2,-69.9],[-2.4,-70.9],[-2.3,-72.4],[-1.1,-74.2],[-0.1,-75.3],[0.4,-77.4],[1.2,-78.9],[2.6,-78.0],[4.0,-77.3],[6.0,-77.4],[7.4,-77.9],[8.6,-77.3],[9.4,-76.0],[10.6,-75.6],[11.1,-74.9],[11.3,-74.1],[11.6,-73.0]];
const proy = (lat, lon) => [((lon + 79.5) / 13) * 300, ((12.8 - lat) / 17.3) * 360];

function Tarjeta({ titulo, icono: Icono, children, className = "" }) {
  return (
    <section className={`rounded-[22px] border border-line/15 bg-surface/90 p-5 shadow-lg shadow-black/5 ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
        {Icono && <Icono className="h-4 w-4" />} {titulo}
      </div>
      {children}
    </section>
  );
}

function Velocimetro({ score, categoria }) {
  const color = CATEGORIA[categoria] || "#64748b";
  const frac = Math.max(0, Math.min(1, (Number(score) || 0) / 5));
  const arc = (a0, a1) => {
    const p = (a) => [80 + 62 * Math.cos(Math.PI * (1 - a)), 82 - 62 * Math.sin(Math.PI * (1 - a))];
    const [x0, y0] = p(a0); const [x1, y1] = p(a1);
    return `M${x0} ${y0} A62 62 0 0 1 ${x1} ${y1}`;
  };
  return (
    <svg viewBox="0 0 160 100" className="h-28 w-44">
      <path d={arc(0, 1)} stroke="currentColor" className="text-line/25" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d={arc(0, Math.max(frac, 0.02))} stroke={color} strokeWidth="13" fill="none" strokeLinecap="round" />
      <text x="80" y="76" textAnchor="middle" className="fill-content" fontSize="30" fontWeight="800">{score ?? "—"}</text>
      <text x="80" y="95" textAnchor="middle" fill={color} fontSize="10" fontWeight="800" style={{ textTransform: "uppercase" }}>
        {String(categoria || "").replace("_", " ")}
      </text>
    </svg>
  );
}

function Radar({ ejes }) {
  const cx = 150; const cy = 135; const R = 95;
  const pt = (i, f) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / ejes.length;
    return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a)];
  };
  return (
    <svg viewBox="0 0 300 270" className="w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ejes.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="currentColor" className="text-line/30" />
      ))}
      {ejes.map((e, i) => {
        const [x, y] = pt(i, 1); const [lx, ly] = pt(i, 1.22);
        return (
          <g key={e.eje}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-line/30" />
            <text x={lx} y={ly} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-content">{e.eje}</text>
            <text x={lx} y={ly + 11} textAnchor="middle" fontSize="8.5" className="fill-muted">{e.detalle}</text>
          </g>
        );
      })}
      <polygon points={ejes.map((e, i) => pt(i, Math.max(e.valor, 0.04)).join(",")).join(" ")} fill="rgba(34,211,238,.22)" stroke="#22d3ee" strokeWidth="2" />
      {ejes.map((e, i) => { const [x, y] = pt(i, Math.max(e.valor, 0.04)); return <circle key={i} cx={x} cy={y} r="4" fill={e.valor > 0.5 ? "#f59e0b" : "#22d3ee"} />; })}
    </svg>
  );
}

function MapaColombia({ ubicaciones }) {
  const conCoords = ubicaciones.filter((u) => u.lat != null);
  const max = Math.max(1, ...conCoords.map((u) => u.reportes + u.inmuebles * 3));
  return (
    <svg viewBox="0 0 300 360" className="w-full max-w-sm">
      <polygon points={BORDE_CO.map(([a, b]) => proy(a, b).join(",")).join(" ")} className="fill-brand/10" stroke="#2b4c7e" strokeWidth="1.5" />
      {conCoords.map((u) => {
        const [x, y] = proy(u.lat, u.lon);
        const r = 5 + ((u.reportes + u.inmuebles * 3) / max) * 13;
        return (
          <g key={u.ciudad}>
            <circle cx={x} cy={y} r={r} fill="rgba(34,211,238,.22)" stroke="#22d3ee" strokeWidth="1.5" />
            {u.inmuebles > 0 && <rect x={x + 5} y={y - 15} width="11" height="11" rx="2" fill="#a855f7" />}
            <circle cx={x} cy={y} r="3" className="fill-content" />
            <text x={x - 8} y={y + 4} textAnchor="end" fontSize="10" fontWeight="700" className="fill-content">{u.ciudad}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HistorialContacto({ items }) {
  const conFechas = items.map((i) => ({ ...i, d: anioDecimal(i.desde) ?? anioDecimal(i.ultimo), h: anioDecimal(i.ultimo) })).filter((i) => i.h);
  if (!conFechas.length) return <p className="text-sm text-muted">Sin fechas de reporte disponibles.</p>;
  const a0 = Math.floor(Math.min(...conFechas.map((i) => i.d))); const a1 = Math.ceil(Math.max(...conFechas.map((i) => i.h))) + 0.01;
  const X = (a) => 150 + ((a - a0) / (a1 - a0)) * 360;
  const ICON = { correo: "✉", telefono: "☎", direccion: "⌂" };
  const reciente = Math.max(...conFechas.map((i) => i.h));
  return (
    <svg viewBox={`0 0 520 ${conFechas.length * 22 + 26}`} className="w-full">
      {Array.from({ length: Math.ceil(a1 - a0) + 1 }, (_, k) => a0 + k).filter((a, k, arr) => arr.length < 9 || k % 2 === 0).map((a) => (
        <g key={a}>
          <line x1={X(a)} y1="0" x2={X(a)} y2={conFechas.length * 22 + 4} stroke="currentColor" className="text-line/20" />
          <text x={X(a)} y={conFechas.length * 22 + 20} textAnchor="middle" fontSize="9" className="fill-muted">{a}</text>
        </g>
      ))}
      {conFechas.map((i, k) => (
        <g key={k}>
          <text x="0" y={k * 22 + 13} fontSize="9.5" className="fill-content">{ICON[i.tipo]} {i.dato.length > 24 ? `${i.dato.slice(0, 23)}…` : i.dato}</text>
          <rect x={X(i.d)} y={k * 22 + 3} width={Math.max(6, X(i.h) - X(i.d))} height="12" rx="6" fill={reciente - i.h < 1 ? "#22d3ee" : "#475569"}>
            <title>{`${i.desde || "?"} → ${i.ultimo}`}</title>
          </rect>
        </g>
      ))}
    </svg>
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

function AnalisisIA({ consultaId }) {
  const [estado, setEstado] = useState({ cargando: false, texto: "", error: "", aviso: "" });
  const generar = async () => {
    setEstado({ cargando: true, texto: "", error: "", aviso: "" });
    try {
      const r = await fetch(`${API_URL}/api/consolidado-riesgo/consultas/${consultaId}/analisis/`, {
        method: "POST", headers: { Authorization: `Token ${localStorage.getItem("token")}` },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "No fue posible generar el análisis.");
      setEstado({ cargando: false, texto: data.analisis, error: "", aviso: data.aviso });
    } catch (e) { setEstado({ cargando: false, texto: "", error: e.message, aviso: "" }); }
  };
  return (
    <Tarjeta titulo="Análisis inteligente" icono={Sparkles} className="border-brand/25 bg-gradient-to-br from-brand/10 to-surface/90">
      {!estado.texto && (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm text-muted">La IA resume los hallazgos y propone una recomendación. Solo recibe datos <b className="text-content">anonimizados</b>: nunca nombre, documento ni datos de contacto.</p>
          <button type="button" onClick={generar} disabled={estado.cargando} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-60">
            <Sparkles className="h-4 w-4" /> {estado.cargando ? "Analizando…" : "Generar análisis con IA"}
          </button>
        </div>
      )}
      {estado.error && <p className="mt-2 text-sm text-red-500">{estado.error}</p>}
      {estado.texto && <>
        <MarkdownSimple texto={estado.texto} />
        <p className="mt-3 border-t border-line/15 pt-2 text-[11px] text-muted">{estado.aviso}</p>
      </>}
    </Tarjeta>
  );
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
            <div className="text-center"><Velocimetro score={calificacion.score} categoria={calificacion.categoria} /><div className="text-[10px] text-slate-400">Riesgo vigente</div></div>
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
        <Tarjeta titulo="Huella de exposición" icono={ShieldAlert}>
          <Radar ejes={vista.radar || []} />
          <p className="text-[11px] text-muted">Solo "Antecedentes" afecta la calificación vigente; el resto es contexto.</p>
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
          {vista.ubicaciones?.length ? <>
            <div className="flex justify-center"><MapaColombia ubicaciones={vista.ubicaciones} /></div>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400" />Dirección reportada</span><span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-purple-500" />Inmueble (SNR)</span></div>
          </> : <p className="text-sm text-muted">Sin direcciones ni inmuebles reportados.</p>}
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
            {vista.historial_contacto?.length ? <HistorialContacto items={vista.historial_contacto} /> : <p className="text-sm text-muted">Sin datos de contacto reportados.</p>}
          </Tarjeta>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo={`Mapa de calor · ${vista.fuentes_fast?.length || 0} fuentes EconfiaFast`} icono={ShieldAlert}>
          {vista.fuentes_fast?.length ? <>
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(18px, 1fr))" }}>
              {vista.fuentes_fast.map((f, i) => <div key={i} title={`${f.fuente} · score ${f.score} · ${f.estado}`} className="h-5 rounded" style={{ background: f.estado === "Sin respuesta" ? "#64748b55" : COLOR_SCORE(f.score), opacity: f.score === 0 ? 0.6 : 0.9 }} />)}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted"><span><span className="mr-1 inline-block h-2 w-2 rounded bg-emerald-500" />Limpio</span><span><span className="mr-1 inline-block h-2 w-2 rounded bg-amber-500" />Alerta media</span><span><span className="mr-1 inline-block h-2 w-2 rounded bg-red-500" />Alerta alta</span><span><span className="mr-1 inline-block h-2 w-2 rounded bg-slate-500/40" />Sin respuesta</span></div>
          </> : <p className="text-sm text-muted">No hay consulta EconfiaFast completada.</p>}
        </Tarjeta>
        <Tarjeta titulo="Formación y patrimonio" icono={GraduationCap}>
          {vista.titulos?.length ? (
            <ol className="relative mb-4 ml-2 border-l-2 border-purple-400/40">
              {vista.titulos.slice(0, 6).map((t, i) => (
                <li key={i} className="mb-2 ml-4"><span className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full ${i === 0 ? "bg-purple-500" : "bg-indigo-400"}`} /><span className={`text-sm ${i === 0 ? "font-black text-content" : "text-content/90"}`}>{t}</span></li>
              ))}
            </ol>
          ) : <p className="mb-4 text-sm text-muted">Sin títulos encontrados.</p>}
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Inmuebles por ciudad (SNR) · {vista.inmuebles?.total || 0}</div>
          {(vista.inmuebles?.por_ciudad || []).map((c) => (
            <div key={c.ciudad} className="mt-2 flex items-center gap-3 text-sm">
              <span className="w-28 truncate text-content">{c.ciudad}</span>
              <div className="h-3 flex-1 rounded-full bg-line/15"><div className="h-3 rounded-full bg-purple-500" style={{ width: `${(c.inmuebles / Math.max(...vista.inmuebles.por_ciudad.map((x) => x.inmuebles))) * 100}%` }} /></div>
              <b className="w-6 text-right text-content">{c.inmuebles}</b>
            </div>
          ))}
        </Tarjeta>
      </div>
    </div>
  );
}
