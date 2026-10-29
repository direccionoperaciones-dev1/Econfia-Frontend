import React, { useCallback, useEffect, useRef, useState } from "react";
import MonitoreoAyuda from "./MonitoreoAyuda";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Tokens de tema de la app (claro/oscuro automático)
const T = {
  text: "rgb(var(--th-content))",
  muted: "rgb(var(--th-content) / 0.6)",
  brand: "rgb(var(--th-brand))",
  brand2: "rgb(var(--th-brand-2))",
  surface: "rgb(var(--th-surface))",
  surface2: "rgb(var(--th-surface-2))",
  line: "rgb(var(--th-line) / 0.14)",
  lineSoft: "rgb(var(--th-line) / 0.06)",
};

// Colores semánticos de estado (válidos en cualquier tema)
const VERDE = "#22c55e", AMBAR = "#f59e0b", ROJO = "#ef4444";
const ESTADO_COLOR = {
  ok: ["rgba(34,197,94,.18)", VERDE], lento: ["rgba(245,158,11,.18)", AMBAR],
  bloqueo: ["rgba(239,68,68,.18)", ROJO], no_encontrado: ["rgba(239,68,68,.18)", ROJO],
  error_servidor: ["rgba(239,68,68,.18)", ROJO], error: ["rgba(239,68,68,.18)", ROJO],
  timeout: ["rgba(245,158,11,.18)", AMBAR],
};
const dispColor = (p) => (p >= 90 ? VERDE : p >= 50 ? AMBAR : ROJO);

const cardStyle = {
  borderRadius: 16, padding: 18,
};
const tdC = { padding: "9px 12px", textAlign: "center" };

// Descripción de cada columna de la tabla (para tooltip + modal de ayuda)
const COLUMNAS = [
  { key: "Fuente", tip: "Nombre interno de la fuente / bot que se está monitoreando." },
  { key: "Sondeos", tip: "Cuántas veces se ha sondeado la fuente en la ventana elegida (7/30/90 días)." },
  { key: "Disp %", tip: "% de sondeos exitosos (respondió OK o lento). Verde ≥90%, ámbar ≥50%, rojo por debajo." },
  { key: "Lat. med (ms)", tip: "Latencia mediana: el tiempo típico que tarda la fuente en responder, en milisegundos." },
  { key: "P95", tip: "Latencia del percentil 95: el 95% de las respuestas fueron más rápidas que este valor (mide los picos lentos)." },
  { key: "Bloq.", tip: "Veces que la fuente respondió con bloqueo: 403, 429 o captcha/anti-bot." },
  { key: "T/O", tip: "Timeouts: la fuente no respondió dentro del límite de 15 segundos." },
  { key: "Err.", tip: "Errores de conexión, SSL o error de servidor (5xx)." },
  { key: "Último", tip: "Estado del sondeo más reciente de esta fuente." },
];

const AdminMonitoreo = () => {
  const token = localStorage.getItem("token");
  const auth = { Authorization: `Token ${token}` };

  const [dias, setDias] = useState(30);
  const [mes, setMes] = useState("");   // "YYYY-MM"; si está, manda sobre `dias`
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [sondeando, setSondeando] = useState(false);
  const [progreso, setProgreso] = useState({ hechos: 0, total: 0 });
  const [toast, setToast] = useState(null);
  const [ayuda, setAyuda] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas"); // todas | ok | lento | problema
  const pollRef = useRef(null);

  const notificar = (msg, tipo = "ok") => setToast({ msg, tipo });
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }
  }, [toast]);

  const cargarReporte = useCallback(async (d = dias, m = mes) => {
    if (!token) return;
    setCargando(true);
    try {
      const q = m ? `mes=${m}` : `dias=${d}`;
      const r = await fetch(`${API_URL}/api/admin/monitor/reporte/?${q}`, { headers: auth });
      if (!r.ok) throw new Error("No autorizado o error del servidor");
      setReporte(await r.json());
    } catch (e) {
      notificar(e.message, "err");
    } finally {
      setCargando(false);
    }
  }, [dias, mes, token]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargarReporte(); }, [cargarReporte]);
  useEffect(() => () => clearInterval(pollRef.current), []);

  const lanzarSondeo = async () => {
    try {
      const r = await fetch(`${API_URL}/api/admin/monitor/sondear/`, {
        method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: "{}",
      });
      const data = await r.json();
      if (r.status === 409) { notificar("Ya hay un sondeo en curso.", "err"); return; }
      if (!r.ok) { notificar(data.detail || "Error al iniciar", "err"); return; }
      setSondeando(true);
      setProgreso({ hechos: 0, total: data.total });
      notificar(`Sondeo iniciado (${data.total} fuentes)…`);
      pollRef.current = setInterval(async () => {
        const e = await (await fetch(`${API_URL}/api/admin/monitor/estado/`, { headers: auth })).json();
        setProgreso({ hechos: e.hechos, total: e.total });
        if (!e.corriendo) {
          clearInterval(pollRef.current);
          setSondeando(false);
          if (e.error) notificar(`El sondeo falló: ${e.error}`, "err");
          else notificar(`Sondeo completado ✔ (${e.hechos}/${e.total})`);
          cargarReporte();
        }
      }, 1500);
    } catch (e) {
      notificar("Error de red al iniciar el sondeo", "err");
    }
  };

  const descargarExcel = async () => {
    try {
      const q = mes ? `mes=${mes}` : `dias=${dias}`;
      const r = await fetch(`${API_URL}/api/admin/monitor/excel/?${q}`, { headers: auth });
      if (!r.ok) throw new Error("No se pudo generar el Excel");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
      a.href = url;
      a.download = mes ? `monitoreo_fuentes_${mes}.xlsx` : `monitoreo_fuentes_${stamp}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      notificar("Excel descargado ✔");
    } catch (e) {
      notificar(e.message, "err");
    }
  };

  // Al elegir un preset de días se limpia el mes (y viceversa): manda uno u otro.
  const cambiarDias = (d) => { setMes(""); setDias(d); cargarReporte(d, ""); };
  const cambiarMes = (m) => { setMes(m); cargarReporte(dias, m); };

  const kpi = reporte?.kpi;
  const pct = progreso.total ? Math.round((progreso.hechos / progreso.total) * 100) : 0;

  // "Sondeos del día": revisiones del último día registrado (el acumulado va en el Excel).
  const diasArr = reporte?.fallos_por_dia || [];
  const ultimoDia = diasArr.length ? diasArr[diasArr.length - 1] : null;
  const sondeosDia = ultimoDia ? ultimoDia.total : (kpi?.sondeos_totales ?? 0);

  // Grupos de estado para el filtro rápido.
  const ESTADO_GRUPO = {
    ok: ["ok"],
    lento: ["lento"],
    problema: ["bloqueo", "timeout", "error", "error_servidor", "no_encontrado"],
  };
  const nombreFuente = (r) => r.nombre_pila || r.clave;

  // Buscador + filtro por estado.
  // Sin búsqueda y con "todas": las 60 peores. Con búsqueda o filtro: TODAS las que calcen
  // (así las fuentes OK siempre se pueden ver eligiendo el filtro "OK").
  const todasFuentes = reporte?.disponibilidad || [];
  const qBusqueda = busqueda.trim().toLowerCase();
  let base = todasFuentes;
  if (qBusqueda) {
    base = base.filter(
      (r) => nombreFuente(r).toLowerCase().includes(qBusqueda) || r.clave.toLowerCase().includes(qBusqueda)
    );
  }
  if (filtroEstado !== "todas") {
    const estados = ESTADO_GRUPO[filtroEstado] || [];
    base = base.filter((r) => estados.includes(r.ultimo_estado));
  }
  // Orden: en "Con problema" las peores primero; en el resto, las verdes (OK) primero.
  base = [...base].sort((a, b) =>
    filtroEstado === "problema"
      ? a.disponibilidad_pct - b.disponibilidad_pct
      : b.disponibilidad_pct - a.disponibilidad_pct
  );
  const filtrando = qBusqueda || filtroEstado !== "todas";
  const filasVisibles = filtrando ? base : base.slice(0, 60);

  return (
    <div style={{
      fontFamily: "Segoe UI, system-ui, sans-serif", color: T.text,
      minHeight: "100vh", padding: "12px 32px 48px", boxSizing: "border-box",
      maxWidth: 1360, margin: "0 auto",
    }}>
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
            <span>📡</span> Monitoreo de fuentes
          </h1>
          <p style={{ margin: "6px 0 0", color: T.muted }}>
            Disponibilidad, latencia y frecuencia de actualización de las fuentes externas.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setAyuda(true)} title="Cómo funciona este panel"
            style={{
              cursor: "pointer", padding: "9px 14px", borderRadius: 12, fontWeight: 800,
              color: T.text, background: T.surface2, border: `1px solid ${T.line}`,
            }}>ℹ️ ¿Cómo funciona?</button>
          <div style={{ display: "flex", background: T.surface2, borderRadius: 12, padding: 4, border: `1px solid ${T.line}` }}>
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => cambiarDias(d)}
                style={{
                  border: "none", cursor: "pointer", padding: "7px 15px", borderRadius: 9, fontWeight: 700,
                  background: (!mes && dias === d) ? T.brand : "transparent",
                  color: (!mes && dias === d) ? T.surface : T.muted,
                }}>{d}d</button>
            ))}
          </div>
          {/* Selector de MES calendario (para el reporte mensual ISO 9001) */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.surface2, borderRadius: 12, padding: "4px 8px", border: `1px solid ${mes ? T.brand : T.line}` }}>
            <span title="Reporte de un mes calendario completo" style={{ fontSize: 13, fontWeight: 700, color: T.muted }}>🗓️ Mes</span>
            <input type="month" value={mes} onChange={(e) => cambiarMes(e.target.value)}
              style={{
                border: "none", background: "transparent", color: T.text,
                fontWeight: 700, fontSize: 13, cursor: "pointer", outline: "none",
              }} />
            {mes && (
              <button onClick={() => cambiarDias(dias)} title="Volver a últimos N días"
                style={{ border: "none", background: "transparent", color: T.muted, cursor: "pointer", fontWeight: 800, fontSize: 14 }}>✕</button>
            )}
          </div>
          <button onClick={lanzarSondeo} disabled={sondeando}
            style={{
              border: "none", cursor: sondeando ? "default" : "pointer", padding: "11px 20px", borderRadius: 12,
              fontWeight: 800, color: T.surface, opacity: sondeando ? 0.7 : 1,
              background: `linear-gradient(120deg, ${T.brand}, ${T.brand2})`,
              boxShadow: `0 8px 20px rgb(var(--th-brand) / 0.28)`,
            }}>
            {sondeando ? `Sondeando… ${pct}%` : "▶ Ejecutar sondeo ahora"}
          </button>
          <button onClick={descargarExcel}
            style={{
              cursor: "pointer", padding: "11px 20px", borderRadius: 12, fontWeight: 800,
              color: T.brand, background: "transparent", border: `1.5px solid ${T.brand}`,
            }}>⬇ Descargar Excel</button>
        </div>
      </div>

      {/* Barra de progreso */}
      {sondeando && (
        <div style={{ marginTop: 18, background: T.surface2, borderRadius: 999, height: 10, overflow: "hidden", border: `1px solid ${T.line}` }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${T.brand}, ${T.brand2})`, transition: "width .4s" }} />
        </div>
      )}

      {/* KPIs */}
      {kpi && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, marginTop: 24 }}>
          <KpiCard icon="📡" label="FUENTES MONITOREADAS" val={kpi.fuentes_monitoreadas} />
          <KpiCard icon="🗓️" label="SONDEOS DEL DÍA" val={sondeosDia}
            sub={ultimoDia ? `revisiones del ${ultimoDia.fecha.slice(5)} · total acumulado en el Excel` : "el total acumulado va en el Excel"} />
          <GaugeCard label="DISPONIBILIDAD PROMEDIO" pct={kpi.disponibilidad_promedio_pct} />
          <div className="th-card" style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 10, letterSpacing: .5 }}>POR ESTADO · ÚLTIMO DÍA</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(kpi.por_estado_dia || kpi.por_estado || {}).map(([e, n]) => {
                const [bg, fg] = ESTADO_COLOR[e] || ["rgb(var(--th-line) / 0.15)", T.text];
                return <span key={e} style={{ background: bg, color: fg, fontWeight: 800, fontSize: 12, padding: "3px 9px", borderRadius: 7 }}>{e}: {n}</span>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de fuentes caídas por día */}
      {reporte && (
        <Seccion titulo="Fuentes caídas por día">
          <GraficoFallos datos={reporte.fallos_por_dia} />
        </Seccion>
      )}

      {/* Tabla disponibilidad */}
      <Seccion titulo="Disponibilidad y latencia">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="🔎 Buscar fuente por nombre…"
            style={{
              flex: "1 1 260px", maxWidth: 380, padding: "10px 14px", borderRadius: 12, fontSize: 13,
              color: T.text, background: T.surface2, border: `1px solid ${T.line}`, outline: "none",
            }} />
          {/* Filtro por estado — permite ver SIEMPRE las fuentes OK */}
          <div style={{ display: "flex", background: T.surface2, borderRadius: 12, padding: 4, border: `1px solid ${T.line}` }}>
            {[["todas", "Todas"], ["ok", "✅ OK"], ["lento", "⚠ Lentas"], ["problema", "⛔ Con problema"]].map(([k, lbl]) => (
              <button key={k} onClick={() => setFiltroEstado(k)}
                style={{
                  border: "none", cursor: "pointer", padding: "7px 12px", borderRadius: 9, fontWeight: 700, fontSize: 12.5,
                  background: filtroEstado === k ? T.brand : "transparent",
                  color: filtroEstado === k ? T.surface : T.muted,
                }}>{lbl}</button>
            ))}
          </div>
          {busqueda && (
            <button onClick={() => setBusqueda("")}
              style={{ cursor: "pointer", padding: "9px 14px", borderRadius: 12, fontWeight: 700, color: T.muted, background: "transparent", border: `1px solid ${T.line}` }}>
              ✕ Limpiar
            </button>
          )}
          <span style={{ fontSize: 12.5, color: T.muted, fontWeight: 700 }}>
            Mostrando {filasVisibles.length} de {todasFuentes.length}
            {!filtrando && todasFuentes.length > 60 ? " · filtra o busca para ver todas" : ""}
          </span>
        </div>
        {cargando ? <p style={{ color: T.muted }}>Cargando…</p> : (
          <div className="th-panel" style={{ overflowX: "auto", borderRadius: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: T.text }}>
              <thead>
                <tr style={{ background: T.surface2 }}>
                  {COLUMNAS.map((c) => (
                    <th key={c.key} title={c.tip}
                      style={{ padding: "12px", textAlign: c.key === "Fuente" ? "left" : "center", fontWeight: 800, color: T.muted, borderBottom: `1px solid ${T.line}`, cursor: "help", whiteSpace: "nowrap" }}>
                      {c.key} <span style={{ opacity: 0.5, fontWeight: 400 }}>ⓘ</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasVisibles.map((r, i) => {
                  const [bg, fg] = ESTADO_COLOR[r.ultimo_estado] || ["rgb(var(--th-line) / 0.15)", T.text];
                  return (
                    <tr key={r.clave} style={{ background: i % 2 ? T.lineSoft : "transparent" }}>
                      <td style={{ padding: "9px 12px", fontWeight: 600 }}>
                        {r.nombre_pila || r.clave}
                        {r.nombre_pila && (
                          <div style={{ fontSize: 10.5, fontWeight: 500, color: T.muted, marginTop: 1 }}>{r.clave}</div>
                        )}
                      </td>
                      <td style={tdC}>{r.sondeos}</td>
                      <td style={{ ...tdC, minWidth: 92 }}>
                        <div style={{ fontWeight: 800, fontSize: 12, color: dispColor(r.disponibilidad_pct) }}>{r.disponibilidad_pct}%</div>
                        <div style={{ height: 5, borderRadius: 999, background: "rgb(var(--th-line) / 0.16)", marginTop: 4, overflow: "hidden" }}>
                          <div style={{ width: `${r.disponibilidad_pct}%`, height: "100%", background: dispColor(r.disponibilidad_pct), borderRadius: 999, transition: "width .4s" }} />
                        </div>
                      </td>
                      <td style={tdC}>{r.latencia_med_ms ?? "—"}</td>
                      <td style={tdC}>{r.latencia_p95_ms ?? "—"}</td>
                      <td style={tdC}>{r.bloqueos || ""}</td>
                      <td style={tdC}>{r.timeouts || ""}</td>
                      <td style={tdC}>{r.errores || ""}</td>
                      <td style={tdC}><span style={{ background: bg, color: fg, fontWeight: 800, fontSize: 11, padding: "3px 8px", borderRadius: 7 }}>{r.ultimo_estado || "—"}</span></td>
                    </tr>
                  );
                })}
                {reporte && !filasVisibles.length && (
                  <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: T.muted }}>
                    {filtrando ? "Sin fuentes que coincidan con el filtro o la búsqueda." : "Aún no hay sondeos. Pulsa “Ejecutar sondeo ahora”."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      {/* Frecuencia de boletines */}
      <Seccion titulo="Frecuencia real de boletines">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
          {(reporte?.frecuencia_boletines || []).map((b) => (
            <div key={b.clave} className="th-card" style={cardStyle}>
              <div style={{ fontWeight: 800, color: T.muted, fontSize: 12, letterSpacing: .5 }}>{b.clave.replace("boletin_", "").toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.brand, margin: "6px 0" }}>{b.cadencia}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{b.registros} registros · {b.lotes_de_carga} lotes</div>
            </div>
          ))}
        </div>
      </Seccion>

      {ayuda && <MonitoreoAyuda admin onClose={() => setAyuda(false)} />}

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, padding: "12px 20px", borderRadius: 12, color: "#fff",
          fontWeight: 800, background: toast.tipo === "err" ? ROJO : VERDE, boxShadow: "0 8px 24px rgba(0,0,0,.3)", zIndex: 60,
        }}>{toast.msg}</div>
      )}
    </div>
  );
};

const KpiCard = ({ icon, label, val, color, sub }) => (
  <div className="th-card" style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14 }}>
    {icon && (
      <div style={{
        width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 23, flexShrink: 0,
        background: `linear-gradient(140deg, rgb(var(--th-brand) / 0.20), rgb(var(--th-brand-2) / 0.08))`,
        border: `1px solid rgb(var(--th-brand) / 0.22)`,
      }}>{icon}</div>
    )}
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, marginBottom: 4, letterSpacing: .5 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || T.text, lineHeight: 1.05 }}>{val}</div>
      {sub && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  </div>
);

// Anillo/gauge de disponibilidad
const GaugeCard = ({ label, pct }) => {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  const R = 33, C = 2 * Math.PI * R;
  const color = dispColor(p);
  return (
    <div className="th-card" style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 82, height: 82, flexShrink: 0 }}>
        <svg width="82" height="82" viewBox="0 0 82 82">
          <circle cx="41" cy="41" r={R} fill="none" stroke="rgb(var(--th-line) / 0.16)" strokeWidth="9" />
          <circle cx="41" cy="41" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - p / 100)} transform="rotate(-90 41 41)"
            style={{ transition: "stroke-dashoffset .7s ease" }} />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 19, fontWeight: 800, color,
        }}>{p}%</div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, letterSpacing: .5 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 5 }}>de sondeos exitosos (OK o lento)</div>
      </div>
    </div>
  );
};

// Gráfico de barras: fuentes caídas por día
const GraficoFallos = ({ datos }) => {
  if (!datos || !datos.length) {
    return <p style={{ color: T.muted }}>Aún no hay historial de sondeos para graficar.</p>;
  }
  const max = Math.max(...datos.map((d) => d.fallos), 1);
  return (
    <div className="th-panel" style={{ borderRadius: 16, padding: "22px 20px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 190, overflowX: "auto", paddingBottom: 6 }}>
        {datos.map((d) => {
          const h = Math.max(4, Math.round((d.fallos / max) * 150));
          return (
            <div key={d.fecha} title={`${d.fecha}: ${d.fallos} caídas de ${d.total} sondeadas`}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 40 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: ROJO }}>{d.fallos}</span>
              <div style={{
                width: 28, height: h, borderRadius: "7px 7px 0 0",
                background: `linear-gradient(180deg, ${ROJO}, rgba(239,68,68,.42))`,
              }} />
              <span style={{ fontSize: 10, color: T.muted, whiteSpace: "nowrap" }}>{d.fecha.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Seccion = ({ titulo, children }) => (
  <div style={{ marginTop: 30 }}>
    <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 12px", color: T.text }}>{titulo}</h2>
    {children}
  </div>
);

export default AdminMonitoreo;
