import { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ===== Nombres legibles por plan ===== */
const PLAN_LABELS = {
  "econfiafast":         "EconfiaFast",
  "essencial-express":   "Essencial Express",
  "essential-express":   "Essential Express",
  "basic-element":       "Basic Element",
  "basic-elemnt":        "Basic Element",
  "essential":           "Essential",
  "empresa":             "Empresa",
  "empresa rues":        "Empresa RUES",
  "experian":            "Econfia Adjudicator",
  "econfia adjudicator": "Econfia Adjudicator",
  "econfia credit report": "Econfia Credit Report",
  "econfia recognize":   "Econfia Contact Search",
  "econfia contact search": "Econfia Contact Search",
  "econfia asset search": "Econfia Asset Search",
  "validacion-titulos":  "Validación Títulos",
  "contratista":         "Contratista",
  "ecorefull":           "E-corefull",
};

function getPlanLabel(tipo_consulta) {
  if (!tipo_consulta) return "—";
  return PLAN_LABELS[tipo_consulta.toLowerCase().trim()] ?? tipo_consulta;
}

/* ===== Duraciones por tipo de plan ===== */
const DURATION_MAP = {
  "econfiafast":          2 * 60 * 1000,
  "essencial-express":   80 * 1000,
  "essential-express":   80 * 1000,
  "basic-element":        4 * 60 * 1000,
  "basic-elemnt":         4 * 60 * 1000,
  "essential":            5 * 60 * 1000,
  "empresa":              5 * 60 * 1000,
  "empresa rues":         5 * 60 * 1000,
  "experian":            90 * 1000,
  "validacion-titulos":   6 * 60 * 1000,
  "contratista":         10 * 60 * 1000,
  "ecorefull":           11 * 60 * 1000,
};
const DEFAULT_DURATION = 8 * 60 * 1000;

function getDuration(tipo_consulta) {
  if (!tipo_consulta) return DEFAULT_DURATION;
  const key = tipo_consulta.toLowerCase().trim();
  return DURATION_MAP[key] ?? DEFAULT_DURATION;
}

function useStartTimes(items, getId, getFecha) {
  const startsRef = useRef(new Map());
  useEffect(() => {
    for (const it of items) {
      const id = getId(it);
      if (id == null) continue;
      if (!startsRef.current.has(id)) {
        const fecha = getFecha(it);
        const start = fecha ? new Date(fecha).getTime() : Date.now();
        startsRef.current.set(id, start);
      }
    }
  }, [items, getId, getFecha]);
  return startsRef;
}
function useTicker(ms = 1000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}
function percentFrom(startTs, nowTs, tipo_consulta) {
  const duration = getDuration(tipo_consulta);
  const elapsed = Math.max(0, nowTs - startTs);
  const pct = Math.min(1, elapsed / duration);
  return Math.round(pct * 100);
}

/* Devuelve colores según el % de tiempo transcurrido:
   0–33 % → rojo  |  33–66 % → morado  |  66–100 % → verde */
function barColors(percent) {
  if (percent < 33) return {
    bar:  "linear-gradient(90deg, #7f1d1d 0%, #dc2626 50%, #f87171 100%)",
    glow: "rgba(239,68,68,0.55)",
    text: "#fca5a5",
    border: "rgba(239,68,68,0.30)",
  };
  if (percent < 66) return {
    bar:  "linear-gradient(90deg, #581c87 0%, #7e22ce 50%, #a855f7 100%)",
    glow: "rgba(168,85,247,0.55)",
    text: "#c084fc",
    border: "rgba(168,85,247,0.30)",
  };
  return {
    bar:  "linear-gradient(90deg, #166534 0%, #16a34a 45%, #4ade80 100%)",
    glow: "rgba(34,197,94,0.65)",
    text: "#4ade80",
    border: "rgba(34,197,94,0.35)",
  };
}

function ProgressBar({ percent = 0, compact = false }) {
  const { bar, glow, border } = barColors(percent);
  const height = compact ? 8 : 10;
  // El relleno va de 4% (mínimo visible) a 100%
  const fill = Math.max(4, Math.min(percent, 100));
  return (
    <div style={{
      width: "100%",
      height,
      borderRadius: 999,
      background: "rgb(var(--th-line) / 0.15)",
      border: `1px solid ${border}`,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Barra de relleno */}
      <div style={{
        position: "absolute",
        top: 0, left: 0,
        height: "100%",
        width: `${fill}%`,
        borderRadius: 999,
        background: bar,
        boxShadow: `0 0 12px 1px ${glow}`,
        transition: "width 1s ease, background 1.5s ease, box-shadow 1.5s ease",
      }}>
        {/* Brillo deslizante sobre la barra */}
        <div style={{
          position: "absolute",
          top: 0, right: 0,
          width: "35%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))",
          animation: "shimmerSlide 1.8s ease-in-out infinite",
          borderRadius: 999,
        }} />
      </div>
      <style>{`
        @keyframes shimmerSlide {
          0%   { opacity: 0; transform: translateX(-60%); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(20%); }
        }
      `}</style>
    </div>
  );
}

function ElegantCard({ children, className = "" }) {
  return (
    <div
      className={[
        "px-4 py-3 rounded-xl border text-content",
        "bg-surface-2/50",
        "border-brand/30 hover:border-brand/50 transition-all duration-300",
        "shadow-[0_4px_20px_rgba(6,182,212,0.15)] hover:shadow-[0_6px_25px_rgba(6,182,212,0.25)]",
        "backdrop-blur-xl hover:scale-[1.02] transform",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ===== DOCK: ahora con loader circular + barra ===== */
function ProcessDockPortal({ items }) {
  const [container, setContainer] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("id", "econfia-process-dock");
    document.body.appendChild(el);
    setContainer(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  const startsRef = useStartTimes(items, it => it.row_id || it.id, it => it.fecha);
  useTicker(1000);

  if (!container) return null;
  const now = Date.now();
  return createPortal(
    <div className="fixed top-4 right-4 z-[9999]">
      <div className="backdrop-blur-xl bg-surface/90 border border-brand/30 shadow-[0_8px_32px_rgba(6,182,212,0.3)] rounded-2xl w-[320px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line/15">
          <div className="flex items-center gap-3 text-content">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            <span className="text-sm font-bold tracking-wide bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">
              {items.length > 0
                ? `Procesando ${items.length} ${items.length === 1 ? "caso" : "casos"}`
                : "Sin procesos en curso"}
            </span>
          </div>
          <button
            onClick={() => setOpen(v => !v)}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand/15 hover:bg-brand/25 text-brand border border-brand/30 transition-all duration-300"
          >
            {open ? "Minimizar" : "Expandir"}
          </button>
        </div>

        {open && items.length > 0 && (
          <div className="px-4 pb-4 pt-3 max-h-[50vh] overflow-auto scrollbar-thin scrollbar-thumb-brand/30 scrollbar-track-transparent">
            <div className="flex flex-col gap-3">
              {items.map(card => {
                const start = startsRef.current.get(card.row_id || card.id) ?? now;
                const percent = percentFrom(start, now, card.tipo_consulta);
                return (
                  <ElegantCard key={`${card.id}-${card.persona}`} className="gap-2">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="inline-block w-5 h-5 rounded-full border-2 border-line/30 animate-spin"
                        style={{ borderTopColor: barColors(percent).text, boxShadow: `0 0 10px ${barColors(percent).glow}` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-content line-clamp-1">{card.persona}</div>
                        <div className="text-xs text-muted mt-0.5">
                          {card.cedula ? `CC ${card.cedula}` : ""}
                          {card.fecha ? ` · ${new Date(card.fecha).toLocaleTimeString()}` : ""}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: barColors(percent).text }}>
                      </span>
                    </div>
                    <ProgressBar percent={percent} />
                  </ElegantCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>,
    container
  );
}

/* ===== TABLA: Estado = solo barra + % (sin loader ni texto) ===== */
export default function TablaResultados({
  data = [],
  onVerResultados,
  onOpenLive,
  onExportExcel,
  onExportPdf,
  exportingExcel = false,
  exportingPdf = false,
  exportDisabled = false,
  exportCount = 0,
  pagina: paginaProp,
  setPagina: setPaginaProp,
}) {
  // Página controlada desde el padre (para conservarla al volver del detalle).
  // Si no llegan props, cae a estado interno para no romper otros usos.
  const [paginaInterna, setPaginaInterna] = useState(1);
  const pagina = paginaProp ?? paginaInterna;
  const setPagina = setPaginaProp ?? setPaginaInterna;
  const porPagina = 4;

  const totalPaginas = Math.ceil(data.length / porPagina);
  const startIndex = (pagina - 1) * porPagina;
  const datosPagina = data.slice(startIndex, startIndex + porPagina);

  const enProcesoCards = useMemo(() => {
    // Integrity 360 muestra su propio avance dentro del detalle; no va al aviso flotante.
    const enProceso = data.filter(
      i => (i.estado || "").toLowerCase() === "en_proceso" && i.source !== "consolidado-riesgo"
    );
    const map = new Map();
    for (const it of enProceso) {
      const persona =
        (it.nombre && String(it.nombre).trim()) ||
        (it.candidato_nombre && String(it.candidato_nombre).trim()) ||
        (it.candidato && String(it.candidato).trim()) ||
        "Persona en proceso";
      const key = persona;
      if (!map.has(key)) {
        map.set(key, {
          persona,
          id: it.id,
          row_id: it.row_id || `row-${it.id}`,
          cedula: it.cedula,
          fecha: it.fecha,
          tipo_consulta: it.tipo_consulta,
        });
      }
    }
    return Array.from(map.values());
  }, [data]);

  const startsRef = useStartTimes(data, it => it.row_id || it.id, it => it.fecha);
  useTicker(1000);
  const now = Date.now();

  return (
    <>
      <ProcessDockPortal items={enProcesoCards} />

      <div className="backdrop-blur-xl bg-surface/90 border border-line/20 shadow-[0_8px_32px_rgb(var(--th-brand)/0.10)] rounded-xl md:rounded-2xl overflow-hidden">
        {/* Header elegante */}
        <div className="px-3 md:px-4 py-1.5 md:py-2 bg-surface-2/85 border-b border-line/20">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h3 className="text-sm md:text-base font-bold text-content flex items-center gap-1.5 md:gap-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Historial de Consultas
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onExportExcel}
                disabled={exportDisabled || exportingExcel || exportingPdf}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-ok/40 bg-ok/12 px-3 py-2 text-[11px] md:text-xs font-semibold text-ok shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 hover:bg-ok/20 hover:border-ok/60 disabled:cursor-not-allowed disabled:opacity-45"
                title={
                  exportDisabled
                    ? "No hay consultas completadas en el filtro actual para exportar."
                    : `Exportar ${exportCount} consulta${exportCount === 1 ? "" : "s"} al informe Excel`
                }
              >
                {exportingExcel ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-ok/30 border-t-ok animate-spin" />
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l4-4m-4 4l-4-4m-4 7h16" />
                  </svg>
                )}
                <span>{exportingExcel ? "Generando Excel..." : "Descargar informe Excel"}</span>
                {!exportDisabled && !exportingExcel && (
                  <span className="rounded-full bg-ok/15 px-2 py-0.5 text-[10px] font-bold text-ok">
                    {exportCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onExportPdf}
                disabled={exportDisabled || exportingPdf || exportingExcel}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-brand/40 bg-brand/12 px-3 py-2 text-[11px] md:text-xs font-semibold text-brand shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 hover:bg-brand/20 hover:border-brand/60 disabled:cursor-not-allowed disabled:opacity-45"
                title={
                  exportDisabled
                    ? "No hay consultas completadas en el filtro actual para exportar."
                    : `Exportar ${exportCount} consulta${exportCount === 1 ? "" : "s"} al informe PDF`
                }
              >
                {exportingPdf ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h6l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 3v5h5" />
                  </svg>
                )}
                <span>{exportingPdf ? "Generando PDF..." : "Descargar informe PDF"}</span>
                {!exportDisabled && !exportingPdf && (
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                    {exportCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabla con scroll */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
            <tr className="bg-surface-2/90 border-b border-line/20">
                <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider" title="Consecutivo de tus consultas">N°</th>
                <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">NIT/Documento</th>
                <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Tipo de Consulta</th>
                <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Nombre</th>
              <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Estado</th>
              <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Inicio</th>
              <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Fin</th>
              <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider" title="Duración de la consulta en segundos">Duración (s)</th>
              <th className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/10">
              {datosPagina.map((item, idx) => {
                const estado = (item.estado || "").toLowerCase();
                const isProcessing = estado === "en_proceso";
                const isDone = estado === "completado"
                  || (item.source === "inmuebles-snr" && estado === "sin_resultados")
                  || item.source === "consolidado-riesgo";
                const start = startsRef.current.get(item.row_id || item.id) ?? now;
                const percent = percentFrom(start, now, item.tipo_consulta);

                return (
                  <tr
                    key={item.row_id || item.id}
                    className="group hover:bg-brand/5 transition-all duration-300 align-top"
                  >
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-muted font-mono text-[10px] md:text-xs">
                      {/* Consecutivo por usuario (el id real de BD queda en el title, para soporte) */}
                      <span
                        title={`ID interno: ${item.id}`}
                        className="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-lg bg-surface-2/60 border border-line/15 group-hover:border-brand/40 transition-colors text-[10px] md:text-xs"
                      >
                        {item.numero_usuario ?? item.id}
                      </span>
                    </td>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-content font-semibold text-xs md:text-sm">
                      {item.tipo === "EMPRESA" ? item.nit : item.cedula}
                    </td>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-brand font-semibold text-xs md:text-sm">
                      {getPlanLabel(item.tipo_consulta)}
                    </td>
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-content font-medium text-xs md:text-sm">
                      {item.tipo === "EMPRESA" ? item.nombre : (item.nombre || "—")}
                    </td>

                    {/* ESTADO con badges elegantes */}
                    <td className="px-2 md:px-3 py-1.5 md:py-2">
                      {isProcessing ? (
                        <div className="max-w-[140px]">
                          <ProgressBar percent={percent} compact />
                        </div>
                      ) : isDone ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ok/15 border border-ok/40 text-ok font-semibold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Completado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-2/60 border border-line/15 text-muted text-xs">
                          {item.estado || "—"}
                        </span>
                      )}
                    </td>

                    {/* Inicio */}
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-muted text-[10px] md:text-xs">
                      {(item.fecha_inicio || item.fecha) ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-brand font-semibold">
                            {new Date(item.fecha_inicio || item.fecha).toLocaleDateString()}
                          </span>
                          <span className="text-muted">
                            {new Date(item.fecha_inicio || item.fecha).toLocaleTimeString()}
                          </span>
                        </div>
                      ) : "—"}
                    </td>

                    {/* Fin */}
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-muted text-[10px] md:text-xs">
                      {item.fecha_fin ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-content font-semibold">
                            {new Date(item.fecha_fin).toLocaleDateString()}
                          </span>
                          <span className="text-muted">
                            {new Date(item.fecha_fin).toLocaleTimeString()}
                          </span>
                        </div>
                      ) : "—"}
                    </td>

                    {/* Duración (s) */}
                    <td className="px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs">
                      {item.duracion_segundos != null ? (
                        <span className="inline-flex items-center rounded-md bg-surface-2/60 border border-line/15 text-content font-mono font-semibold px-2 py-1">
                          {item.duracion_segundos}s
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>

                    <td className="px-2 md:px-3 py-1.5 md:py-2">
                      {isDone ? (
                        <button
                          onClick={() => onVerResultados?.(item)}
                          className="px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-brand to-brand-2 hover:brightness-105 rounded-lg font-semibold transition-all duration-300 shadow-[0_0_20px_rgb(var(--th-brand)/0.22)] hover:scale-105 transform text-[10px] md:text-xs"
                          style={{ color: "rgb(var(--th-brand-contrast))" }}
                        >
                          Ver resultados
                        </button>
                      ) : (
                        <button
                          title="Ver fuentes en vivo"
                          onClick={() => onOpenLive?.(item.id)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand/10 border border-brand/30 rounded-lg text-brand hover:bg-brand/20 hover:border-brand/60 transition-all duration-200 text-[10px] md:text-xs"
                          style={{ minWidth: 0 }}
                        >
                          <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="2" className="text-brand" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2.5 2.5" className="text-brand" />
                          </svg>
                          Fuentes
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación elegante */}
        <div className="flex justify-between items-center px-2 md:px-3 py-1.5 md:py-2 mb-0.5 md:mb-1 bg-surface-2/85 border-t border-line/20">
          <button
            onClick={() => setPagina(prev => Math.max(prev - 1, 1))}
            disabled={pagina === 1}
            className="px-2 md:px-3 py-1 md:py-1.5 bg-brand/15 hover:bg-brand/25 border border-brand/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-brand font-semibold transition-all duration-300 flex items-center gap-1 text-[10px] md:text-xs"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <span className="text-muted font-semibold text-[10px] md:text-xs">
            Página <span className="text-brand">{pagina}</span> de <span className="text-brand">{totalPaginas || 1}</span>
          </span>

          <button
            onClick={() => setPagina(prev => Math.min(prev + 1, totalPaginas || 1))}
            disabled={pagina === totalPaginas || totalPaginas === 0}
            className="px-2 md:px-3 py-1 md:py-1.5 bg-brand/15 hover:bg-brand/25 border border-brand/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-brand font-semibold transition-all duration-300 flex items-center gap-1 text-[10px] md:text-xs"
          >
            Siguiente
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
