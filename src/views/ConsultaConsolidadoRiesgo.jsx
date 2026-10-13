import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  History,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import LogoOrganizacion from "../components/LogoOrganizacion";
import Terminos from "../components/Terminos";
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
  reutilizado: { label: "Reutilizado (sin costo)", className: "bg-sky-500/10 text-sky-400" },
  consultando: { label: "Consultando ahora", className: "bg-cyan-500/10 text-cyan-400" },
  consultado: { label: "Consultado ahora", className: "bg-emerald-500/10 text-emerald-400" },
  sin_plan: { label: "Plan no activo", className: "bg-slate-500/15 text-muted" },
  sin_saldo: { label: "Sin saldo", className: "bg-amber-500/10 text-amber-400" },
  sin_autorizacion: { label: "Sin autorización", className: "bg-amber-500/10 text-amber-400" },
  sin_apellido: { label: "Falta apellido", className: "bg-amber-500/10 text-amber-400" },
  error: { label: "Error", className: "bg-red-500/10 text-red-400" },
};

function FuenteCard({ fuente }) {
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
    </article>
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

  const scoreColor = useMemo(() => {
    const categoria = data?.calificacion_actual?.categoria;
    if (categoria === "alto") return "text-red-400 border-red-500/40 bg-red-500/10";
    if (categoria === "medio") return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    if (categoria === "bajo") return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    return "text-muted border-line/20 bg-surface-2/60";
  }, [data]);

  useEffect(() => {
    if (!data?.id || data.estado !== "en_proceso") return undefined;
    const timer = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/consolidado-riesgo/consultas/${data.id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (response.ok) setData(await response.json());
      } catch (_error) {
        // El siguiente ciclo vuelve a intentar; no interrumpimos la consulta FAST.
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [API_URL, data?.estado, data?.id]);

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
              <ShieldCheck size={15} /> Expediente consolidado
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Econfia Consolidado</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
              Reúne listas, antecedentes, crédito, contacto, identidad y títulos. Los antecedentes
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
              Confirmo la autorización del titular (incluye consulta en DataCrédito)
            </label>
            <button disabled={loading || !cedula.trim() || !acepta || !consentimiento} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? <RefreshCw className="animate-spin" size={17} /> : <Database size={17} />}
              {loading ? "Consolidando..." : "Consultar consolidado"}
            </button>
          </form>
        </header>

        {data && (
          <>
            <section className="grid gap-4 md:grid-cols-[1fr_230px]">
              <div className="rounded-3xl border border-line/15 bg-surface/75 p-6 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">Persona consultada</p>
                <h2 className="mt-2 text-2xl font-black">{data.persona.nombre_completo || "Identidad pendiente"}</h2>
                <p className="mt-1 text-sm text-muted">{data.persona.tipo_doc} · {data.persona.cedula}</p>
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
              <p className="-mt-2 mb-3 text-xs text-muted">Si el dato sigue vigente se reutiliza sin costo; si venció, se consulta solo con el plan activo y se descuenta de la bolsa de ese producto.</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(data.fuentes || []).map((fuente) => <FuenteCard key={fuente.clave || fuente.producto} fuente={fuente} />)}
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
          </>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </section>
  );
}
