import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  History,
  Eye,
  FileDown,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import DetalleResultados from "../components/DetalleResultados";
import ExperianDetalleResultados from "../components/ExperianDetalleResultados";
import HdcDetalleResultados from "../components/HdcDetalleResultados";
import ReconocerDetalleResultados from "../components/ReconocerDetalleResultados";
import { AssetSearchResultados } from "./ConsultaInmueblesSNR";
import LogoOrganizacion from "../components/LogoOrganizacion";
import Terminos from "../components/Terminos";
import AvisoTratamientoDatos from "../components/AvisoTratamientoDatos";
import Toast from "../components/Toast";

const DOCUMENTOS = ["CC", "TI", "CE", "PPT", "PEP", "NIT"];

function fecha(value) {
  if (!value) return "Sin consulta previa";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

const ACCIONES = {
  reutilizado: { label: "Reutilizado", className: "bg-sky-500/10 text-sky-400" },
  consultando: { label: "Consultando ahora", className: "bg-cyan-500/10 text-cyan-400" },
  consultado: { label: "Consultado ahora", className: "bg-emerald-500/10 text-emerald-400" },
  sin_plan: { label: "Plan no activo", className: "bg-slate-500/15 text-muted" },
  sin_saldo: { label: "Sin saldo", className: "bg-amber-500/10 text-amber-400" },
  sin_autorizacion: { label: "Sin autorización", className: "bg-amber-500/10 text-amber-400" },
  sin_apellido: { label: "Falta apellido", className: "bg-amber-500/10 text-amber-400" },
  error: { label: "Error", className: "bg-red-500/10 text-red-400" },
};

// Productos cuyo resultado completo se puede abrir desde la tarjeta.
const CON_DETALLE = new Set(["fast", "experian", "hdc", "reconocer", "inmuebles", "titulos", "identidad"]);

function AssetSearchDetalle({ consultaId }) {
  const API_URL = process.env.REACT_APP_API_URL;
  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/inmuebles-snr/${consultaId}/`, { headers: { Authorization: `Token ${token}` } })
      .then(async (response) => {
        const payload = await response.json();
        if (!activo) return;
        if (response.ok) setConsulta(payload);
        else setError(payload.error || `Error HTTP: ${response.status}`);
      })
      .catch(() => activo && setError("No fue posible cargar el resultado."));
    return () => { activo = false; };
  }, [API_URL, consultaId]);
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!consulta) return <p className="text-sm text-muted">Cargando...</p>;
  return <AssetSearchResultados consulta={consulta} />;
}

function DetalleProducto({ fuente }) {
  const resumen = fuente.resumen || {};
  switch (fuente.clave) {
    case "fast":
      return <DetalleResultados consultaId={fuente.consulta_id} />;
    case "experian":
      return <ExperianDetalleResultados consultaId={fuente.consulta_id} />;
    case "hdc":
      return <HdcDetalleResultados consultaId={fuente.consulta_id} />;
    case "reconocer":
      return <ReconocerDetalleResultados consultaId={fuente.consulta_id} />;
    case "inmuebles":
      return <AssetSearchDetalle consultaId={fuente.consulta_id} />;
    case "titulos":
      return (
        <div className="space-y-3">
          {(resumen.resultados || []).map((item, index) => (
            <article key={`${item.fuente}-${index}`} className="rounded-2xl border border-line/10 bg-surface-2/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{item.fuente}</p>
                <span className="text-xs text-muted">{item.estado}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-content/80">{item.mensaje || "Sin información"}</p>
            </article>
          ))}
          {!(resumen.resultados || []).length && <p className="text-sm text-muted">La consulta de títulos no tiene resultados aún.</p>}
        </div>
      );
    case "identidad":
      return (
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Nombre", resumen.nombre_completo],
            ["Tipo de documento", resumen.tipo_documento],
            ["Estado del documento", resumen.estado_documento],
            ["Fecha de expedición", resumen.fecha_expedicion],
            ["Lugar de expedición", resumen.lugar_expedicion],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-line/10 bg-surface-2/60 p-4">
              <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
              <dd className="mt-1 text-sm font-semibold">{value || "—"}</dd>
            </div>
          ))}
        </dl>
      );
    default:
      return null;
  }
}

function DetalleModal({ fuente, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-line/15 bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line/10 px-5 py-3">
          <p className="font-black">{fuente.producto}</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-content" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
          <DetalleProducto fuente={fuente} />
        </div>
      </div>
    </div>
  );
}

function FuenteCard({ fuente, onVer }) {
  const accion = ACCIONES[fuente.accion];
  const consultando = fuente.accion === "consultando";
  const titulos = fuente.clave === "titulos" ? fuente.resumen?.titulos_encontrados || [] : [];
  const color = consultando
    ? "border-cyan-500/35 text-cyan-400"
    : !fuente.disponible
      ? "border-line/15 text-muted"
      : fuente.vigente
        ? "border-emerald-500/35 text-emerald-400"
        : "border-amber-500/35 text-amber-400";
  return (
    <article className={`rounded-2xl border bg-surface/75 p-4 backdrop-blur-xl ${color}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-content">{fuente.producto}</p>
          <p className="mt-1 text-[11px] text-muted">Dato original: {fecha(fuente.fecha_origen)}</p>
        </div>
        {consultando ? <RefreshCw className="animate-spin" size={19} /> : fuente.vigente ? <CheckCircle2 size={19} /> : <Clock3 size={19} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
        {!consultando && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1">
            {!fuente.disponible ? "Sin datos" : fuente.vigente ? "Vigente" : "Requiere actualización"}
          </span>
        )}
        {accion && <span className={`rounded-full px-2.5 py-1 ${accion.className}`}>{accion.label}</span>}
      </div>
      {fuente.mensaje && <p className="mt-2 text-[11px] text-muted">{fuente.mensaje}</p>}
      {fuente.clave === "titulos" && fuente.disponible && !consultando && (
        <div className="mt-3 text-[11px] text-content/80">
          {titulos.length ? (
            <ul className="list-disc space-y-0.5 pl-4">
              {titulos.slice(0, 4).map((titulo) => <li key={titulo}>{titulo}</li>)}
              {titulos.length > 4 && <li className="text-muted">y {titulos.length - 4} más</li>}
            </ul>
          ) : (
            <p className="text-muted">Sin títulos encontrados en {fuente.resumen?.fuentes_consultadas || 0} fuentes.</p>
          )}
        </div>
      )}
      {fuente.vigente_hasta && (
        <p className="mt-3 text-[11px] text-muted">Vigencia: {fecha(fuente.vigente_hasta)}</p>
      )}
      {fuente.disponible && !consultando && CON_DETALLE.has(fuente.clave)
        && (fuente.consulta_id || fuente.clave === "identidad") && (
        <button
          type="button"
          onClick={() => onVer(fuente)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20"
        >
          <Eye size={14} /> Ver resultado
        </button>
      )}
    </article>
  );
}

function useConsolidadoPolling(apiUrl, data, setData) {
  useEffect(() => {
    if (!data?.id || data.estado !== "en_proceso") return undefined;
    const timer = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/api/consolidado-riesgo/consultas/${data.id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (response.ok) setData(await response.json());
      } catch (_error) {
        // El siguiente ciclo vuelve a intentar; no interrumpimos las consultas en curso.
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [apiUrl, data?.estado, data?.id, setData]);
}

export function ConsolidadoVista({ data }) {
  const categoria = data?.calificacion_actual?.categoria;
  const scoreColor =
    categoria === "alto" ? "text-red-400 border-red-500/40 bg-red-500/10"
      : categoria === "medio" ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
        : categoria === "bajo" ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
          : "text-muted border-line/20 bg-surface-2/60";
  const [fuenteAbierta, setFuenteAbierta] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [errorPdf, setErrorPdf] = useState("");

  // El PDF se arma completo en el backend (resumen + informes de cada producto).
  const descargarPdf = async () => {
    setDescargando(true);
    setErrorPdf("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/consolidado-riesgo/consultas/${data.id}/pdf/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `econfia-integrity-360-${data.persona.cedula}-${data.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      setErrorPdf("No fue posible generar el PDF. Intenta de nuevo.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="space-y-6">
      {fuenteAbierta && <DetalleModal fuente={fuenteAbierta} onClose={() => setFuenteAbierta(null)} />}
      <section className="grid gap-4 md:grid-cols-[1fr_230px]">
        <div className="rounded-3xl border border-line/15 bg-surface/75 p-6 backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">Persona consultada</p>
          <h2 className="mt-2 text-2xl font-black">{data.persona.nombre_completo || "Identidad pendiente"}</h2>
          <p className="mt-1 text-sm text-muted">{data.persona.tipo_doc} · {data.persona.cedula}</p>
          <button
            type="button"
            onClick={descargarPdf}
            disabled={descargando || data.estado === "en_proceso"}
            title={data.estado === "en_proceso" ? "Disponible cuando terminen las consultas" : "Descargar informe completo"}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {descargando ? <RefreshCw className="animate-spin" size={16} /> : <FileDown size={16} />}
            {descargando ? "Generando PDF..." : "Descargar PDF"}
          </button>
          {errorPdf && <p className="mt-2 text-xs text-red-400">{errorPdf}</p>}
          {data.estado === "en_proceso" && (
            <p className="mt-4 flex items-center gap-2 text-xs text-sky-400"><RefreshCw className="animate-spin" size={14} /> Consultando productos vencidos en segundo plano</p>
          )}
        </div>
        <div className={`rounded-3xl border p-6 text-center ${scoreColor}`}>
          <p className="text-[10px] font-bold uppercase tracking-[.2em]">Riesgo vigente</p>
          <p className="mt-2 text-5xl font-black">{data.calificacion_actual.score || "—"}</p>
          <p className="mt-1 text-xs font-bold uppercase">{data.calificacion_actual.categoria.replace("_", " ")}</p>
          <p className="mt-3 text-[10px] opacity-75">Solo resultados actuales</p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-black"><Database size={19} className="text-cyan-400" /> Último dato por producto</h3>
        <p className="-mt-2 mb-3 text-xs text-muted">Si el dato sigue vigente se reutiliza; si venció, se consulta solo con el plan activo y se descuenta de la bolsa de ese producto.</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data.fuentes || []).map((fuente) => (
            <FuenteCard key={fuente.clave || fuente.producto} fuente={fuente} onVer={setFuenteAbierta} />
          ))}
        </div>
      </section>

      {data.alertas_actuales?.length > 0 && (
        <section className="rounded-3xl border border-red-500/25 bg-surface/75 p-5 backdrop-blur-xl">
          <h3 className="flex items-center gap-2 text-lg font-black"><AlertTriangle size={20} className="text-red-400" /> Alertas vigentes</h3>
          <div className="mt-4 space-y-3">
            {data.alertas_actuales.map((alerta) => (
              <article key={alerta.id} className="grid gap-3 rounded-2xl border border-line/10 bg-surface-2/60 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-bold">{alerta.fuente}</p>
                  <p className="mt-2 text-sm text-content/80">{alerta.mensaje || "Hallazgo sin descripción"}</p>
                  <p className="mt-2 text-[11px] text-muted">Fecha de la fuente: {fecha(alerta.fecha_fuente)}</p>
                </div>
                <div className="flex items-center gap-2 text-red-400"><AlertTriangle size={18} /><span className="text-xl font-black">{alerta.score}</span></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-line/15 bg-surface/75 p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-black"><History size={20} className="text-violet-400" /> Histórico informativo</h3>
          <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">No afecta la calificación</span>
        </div>
        {!data.historico_informativo?.length ? (
          <p className="mt-5 text-sm text-muted">No existen hallazgos históricos con calificación 3 o superior.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {data.historico_informativo.map((item) => (
              <article key={item.id} className="grid gap-3 rounded-2xl border border-line/10 bg-surface-2/60 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{item.fuente}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.vigente ? "bg-red-500/15 text-red-400" : "bg-slate-500/15 text-muted"}`}>
                      {item.vigente ? "Aparece actualmente" : "Ya no reportado"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-content/80">{item.mensaje || "Hallazgo sin descripción"}</p>
                  <p className="mt-2 text-[11px] text-muted">Primera aparición: {fecha(item.primera_aparicion)} · Última aparición: {fecha(item.ultima_aparicion)}</p>
                </div>
                <div className="flex items-center gap-2 text-amber-400"><AlertTriangle size={18} /><span className="text-xl font-black">{item.score_maximo}</span></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Abre un consolidado guardado (por ejemplo desde la seccion Consultas). */
export function ConsolidadoDetalle({ consultaId }) {
  const API_URL = process.env.REACT_APP_API_URL;
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/consolidado-riesgo/consultas/${consultaId}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const payload = await response.json();
        if (!activo) return;
        if (response.ok) setData(payload);
        else setError(payload.error || payload.detail || `Error HTTP: ${response.status}`);
      } catch (_error) {
        if (activo) setError("No fue posible cargar el consolidado.");
      }
    })();
    return () => { activo = false; };
  }, [API_URL, consultaId]);

  useConsolidadoPolling(API_URL, data, setData);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) {
    return <p className="flex items-center gap-2 text-sm text-muted"><RefreshCw className="animate-spin" size={16} /> Cargando consolidado...</p>;
  }
  return <ConsolidadoVista data={data} />;
}

function HistorialIntegrity({ apiUrl, recarga, activoId, onAbrir }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let activo = true;
    const token = localStorage.getItem("token");
    fetch(`${apiUrl}/api/consolidado-riesgo/consultas/?limit=20`, { headers: { Authorization: `Token ${token}` } })
      .then((response) => (response.ok ? response.json() : { consultas: [] }))
      .then((payload) => activo && setItems(payload.consultas || []))
      .catch(() => {});
    return () => { activo = false; };
  }, [apiUrl, recarga]);

  if (!items.length) return null;
  return (
    <section className="rounded-3xl border border-line/15 bg-surface/75 p-5 backdrop-blur-xl">
      <h3 className="flex items-center gap-2 text-lg font-black"><History size={19} className="text-cyan-400" /> Consultas anteriores</h3>
      <div className="mt-4 divide-y divide-line/10">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAbrir(item.id)}
            className={`flex w-full flex-wrap items-center justify-between gap-2 px-2 py-2.5 text-left text-sm hover:bg-surface-2/60 ${item.id === activoId ? "bg-cyan-400/10" : ""}`}
          >
            <span className="font-semibold">{item.nombre_completo || "Sin nombre"} <span className="font-normal text-muted">· {item.cedula}</span></span>
            <span className="flex items-center gap-3 text-xs text-muted">
              <span className="uppercase">{item.estado === "en_proceso" ? "En proceso" : `Riesgo ${item.score_actual || "—"}`}</span>
              {fecha(item.created_at)}
              <Eye size={14} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function ConsultaConsolidadoRiesgo() {
  const API_URL = process.env.REACT_APP_API_URL;
  const [tipoDoc, setTipoDoc] = useState("CC");
  const [cedula, setCedula] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);

  useConsolidadoPolling(API_URL, data, setData);

  const abrirAnterior = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/consolidado-riesgo/consultas/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || payload.detail);
      setData(payload);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setToast({ type: "error", message: error.message || "No fue posible abrir la consulta." });
    }
  };

  const consultar = async (event) => {
    event.preventDefault();
    if (!cedula.trim()) return setToast({ type: "error", message: "Ingresa el número de documento." });
    if (!acepta || !consentimiento) {
      return setToast({ type: "error", message: "Confirma términos y consentimiento para continuar." });
    }
    setLoading(true);
    setData(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/consolidado-riesgo/consultar/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({ cedula: cedula.trim(), tipo_doc: tipoDoc, autorizacion_titular: consentimiento }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setToast({ type: "error", message: payload.error || `Error HTTP: ${response.status}` });
        return;
      }
      setData(payload);
      if (payload.aviso) setToast({ type: "warning", message: payload.aviso });
    } catch (_error) {
      setToast({ type: "error", message: "No fue posible construir el consolidado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen px-4 pb-36 pt-4 text-content">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="grid gap-5 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-400">
              <ShieldCheck size={15} /> Expediente integral
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Econfia Integrity 360</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              Reúne listas, antecedentes, crédito, contacto, identidad, inmuebles y títulos. Los antecedentes
              históricos se conservan como contexto y no modifican la calificación vigente.
            </p>
          </div>

          <form onSubmit={consultar} className="rounded-3xl border border-line/15 bg-surface/80 p-5 shadow-2xl backdrop-blur-xl">
            <LogoOrganizacion className="mb-4" size={48} />
            <div className="grid grid-cols-[110px_1fr] gap-2">
              <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)} className="rounded-xl border border-line/15 bg-surface-2 px-3 py-2 text-sm">
                {DOCUMENTOS.map((item) => <option key={item}>{item}</option>)}
              </select>
              <input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Número de documento" className="rounded-xl border border-line/15 bg-surface-2 px-3 py-2 text-sm outline-none focus:border-cyan-400/50" />
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="accent-cyan-500" />
              Acepto los <Terminos inline triggerClassName="text-cyan-400 underline" />
            </label>
            <label className="mt-2 flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} className="accent-cyan-500" />
              Confirmo la autorización del titular (incluye DataCrédito y SNR)
            </label>
            <AvisoTratamientoDatos className="mt-2" />
            <button disabled={loading || !cedula.trim() || !acepta || !consentimiento} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? <RefreshCw className="animate-spin" size={17} /> : <Database size={17} />}
              {loading ? "Consultando..." : "Consultar Integrity 360"}
            </button>
          </form>
        </header>

        {data && <ConsolidadoVista data={data} />}
        <HistorialIntegrity apiUrl={API_URL} recarga={data?.id} activoId={data?.id} onAbrir={abrirAnterior} />
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </section>
  );
}
