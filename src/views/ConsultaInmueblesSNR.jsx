import React, { useCallback, useEffect, useState } from "react";
import {
  Building,
  Clock3,
  Download,
  FileSearch,
  History,
  Landmark,
  LoaderCircle,
  MapPin,
  Search,
} from "lucide-react";
import TextoAutorizacion from "../components/TextoAutorizacion";

const API_URL = process.env.REACT_APP_API_URL;

function authHeaders(extra = {}) {
  return { Authorization: `Token ${localStorage.getItem("token")}`, ...extra };
}

function actualizarSaldo(perfilConsumo) {
  if (!perfilConsumo) return;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    user.perfil = { ...(user.perfil || {}), ...perfilConsumo };
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("user-updated"));
  } catch { /* el resultado sigue siendo válido aunque no haya caché local */ }
}

function Estado({ value }) {
  const ok = value === "completado";
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${ok ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-sky-400/25 bg-sky-500/10 text-sky-300"}`}>
      {ok ? "Registros encontrados" : "Sin registros"}
    </span>
  );
}

export function AssetSearchResultados({ consulta, onPdf }) {
  if (!consulta) return null;
  const registros = consulta.registros || [];
  return (
    <section className="overflow-hidden rounded-[2rem] border border-line/15 bg-surface/90 shadow-[0_24px_70px_rgba(2,6,23,0.18)]">
      <div className="border-b border-line/10 bg-[linear-gradient(110deg,rgb(var(--th-brand)/0.16),transparent_50%,rgb(var(--th-brand-2)/0.10))] p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Estado value={consulta.estado} />
            <h2 className="mt-3 text-2xl font-black text-content">Índice inmobiliario consultado</h2>
            <p className="mt-1 text-sm text-muted">{consulta.tipo_documento} · {consulta.numero_documento} · {consulta.total_registros} registro(s)</p>
          </div>
          <button onClick={onPdf} className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-black text-brand transition hover:bg-brand/20">
            <Download size={17} /> Descargar informe Econfia
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line/10 bg-surface/70 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-muted">Fuente</div><div className="mt-2 font-bold text-content">Supernotariado y Registro</div></div>
          <div className="rounded-2xl border border-line/10 bg-surface/70 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-muted">Tiempo</div><div className="mt-2 font-bold text-content">{((consulta.duracion_ms || 0) / 1000).toFixed(2)} segundos</div></div>
          <div className="rounded-2xl border border-line/10 bg-surface/70 p-4"><div className="text-[10px] font-black uppercase tracking-widest text-muted">Costo fuente</div><div className="mt-2 font-bold text-content">${Number(consulta.valor_fuente || 0).toLocaleString("es-CO")} COP</div></div>
        </div>
      </div>

      <div className="p-5 md:p-7">
        {registros.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {registros.map((item, index) => (
              <article key={`${item.matricula}-${index}`} className="relative overflow-hidden rounded-3xl border border-sky-400/15 bg-surface-2/65 p-5">
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-500/10 text-sky-300"><Building size={24} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">Inmueble {index + 1}</div>
                    <div className="mt-1 text-xl font-black text-content">Matrícula {item.matricula || "—"}</div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex gap-3"><Landmark className="mt-0.5 shrink-0 text-brand" size={17} /><div><div className="text-[10px] font-black uppercase tracking-wider text-muted">Oficina y ciudad</div><div className="mt-1 font-semibold text-content">{item.oficina || "—"} · {item.ciudad || "—"}</div></div></div>
                      <div className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-brand-2" size={17} /><div><div className="text-[10px] font-black uppercase tracking-wider text-muted">Dirección registrada</div><div className="mt-1 leading-6 text-content">{item.direccion || "No reportada"}</div></div></div>
                      <div className="rounded-xl border border-line/10 bg-surface/70 px-3 py-2 text-xs text-muted">Vinculado a: <b className="text-content">{item.vinculado_a || "Documento"}</b></div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-sky-400/15 bg-sky-500/8 p-8 text-center">
            <FileSearch className="mx-auto text-sky-300" size={38} />
            <h3 className="mt-3 text-lg font-black text-content">La fuente no reportó inmuebles</h3>
            <p className="mt-2 text-sm text-muted">{consulta.mensaje}</p>
          </div>
        )}
        <p className="mt-5 text-xs leading-5 text-muted">Resultado informativo. No sustituye el Certificado de Tradición y Libertad ni acredita la situación jurídica del inmueble. La cuenta técnica utilizada para acceder a la fuente no se muestra.</p>
      </div>
    </section>
  );
}

export default function ConsultaInmueblesSNR() {
  const [tipoDocumento, setTipoDocumento] = useState("CC");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [autorizacion, setAutorizacion] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargarHistorial = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/inmuebles-snr/historial/?limit=12`, { headers: authHeaders() });
      if (response.ok) setHistorial((await response.json()).consultas || []);
    } catch { /* historial no bloquea el formulario */ }
  }, []);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  const consultar = async (event) => {
    event.preventDefault();
    setError("");
    if (!numeroDocumento.trim()) return setError("Ingresa el número de documento.");
    if (!autorizacion) return setError("Debes confirmar la autorización del titular.");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/inmuebles-snr/consultar/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ tipo_documento: tipoDocumento, numero_documento: numeroDocumento.trim(), autorizacion: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible consultar la fuente SNR.");
      setResultado(data);
      actualizarSaldo(data.perfil_consumo);
      cargarHistorial();
    } catch (err) {
      setError(err.message || "Error de conexión con la fuente.");
    } finally {
      setLoading(false);
    }
  };

  const descargarPdf = async (consulta = resultado) => {
    if (!consulta?.id) return;
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/inmuebles-snr/${consulta.id}/pdf/`, { headers: authHeaders() });
      if (!response.ok) throw new Error("No fue posible generar el informe.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `econfia-inmuebles-${consulta.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 pb-12 pt-4 md:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-line/15 bg-[linear-gradient(135deg,rgb(var(--th-surface)/0.96),rgb(var(--th-surface-2)/0.88))] p-5 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[0.8fr_1.2fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300"><Landmark size={16} /> Econfia Asset Search</div>
            <h1 className="mt-5 text-3xl font-black leading-tight text-content md:text-4xl">Búsqueda de activos inmobiliarios</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">Obtén oficina, matrícula inmobiliaria, dirección registrada y vínculo documental en una ficha clara de Econfia.</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted"><Clock3 size={15} className="text-brand" /> Cada consulta exitosa descuenta una consulta del saldo normal.</div>
          </div>

          <form onSubmit={consultar} className="rounded-3xl border border-line/15 bg-surface/75 p-5 backdrop-blur-xl">
            <div className="grid gap-4 sm:grid-cols-[190px_1fr]">
              <div><label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Tipo de documento</label><select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className="h-14 w-full rounded-2xl border border-line/15 bg-surface-2 px-4 font-bold text-content outline-none"><option value="CC">Cédula de ciudadanía</option><option value="CE">Cédula de extranjería</option><option value="TI">Tarjeta de identidad</option><option value="PA">Pasaporte</option><option value="NIT">NIT</option></select></div>
              <div><label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-muted">Número de documento</label><input value={numeroDocumento} onChange={(e) => setNumeroDocumento(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))} className="h-14 w-full rounded-2xl border border-line/15 bg-surface-2 px-4 text-lg font-bold text-content outline-none focus:border-brand/40" placeholder="Ingresa el documento" autoComplete="off" /></div>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-line/15 bg-surface-2/60 p-4 text-sm leading-5 text-content"><input type="checkbox" checked={autorizacion} onChange={(e) => setAutorizacion(e.target.checked)} className="mt-1 accent-sky-500" /><span><TextoAutorizacion extra=" para consultar su información y utilizarla para una finalidad legítima." /></span></label>
            {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</div>}
            <button disabled={loading} className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3.5 font-black text-slate-950 transition hover:brightness-110 disabled:opacity-60">{loading ? <><LoaderCircle className="animate-spin" size={19} /> Consultando SNR…</> : <><Search size={19} /> Consultar inmuebles</>}</button>
          </form>
        </div>
      </section>

      <AssetSearchResultados consulta={resultado} onPdf={() => descargarPdf(resultado)} />

      <section className="rounded-[2rem] border border-line/15 bg-surface/80 p-5 md:p-7">
        <div className="flex items-center gap-3"><History className="text-brand" /><div><h2 className="text-xl font-black text-content">Historial de inmuebles</h2><p className="text-sm text-muted">Solo aparecen las consultas realizadas por tu usuario.</p></div></div>
        <div className="mt-5 grid gap-3">
          {historial.length ? historial.map((item) => (
            <button key={item.id} onClick={() => setResultado(item)} className="grid w-full gap-3 rounded-2xl border border-line/10 bg-surface-2/60 p-4 text-left transition hover:border-brand/30 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div><div className="font-black text-content">{item.tipo_documento} · {item.numero_documento}</div><div className="mt-1 text-xs text-muted">{new Date(item.fecha_consulta).toLocaleString("es-CO")} · {item.total_registros} registro(s)</div></div>
              <Estado value={item.estado} />
              <span onClick={(event) => { event.stopPropagation(); descargarPdf(item); }} className="inline-flex items-center gap-1 text-xs font-black text-brand"><Download size={14} /> PDF</span>
            </button>
          )) : <div className="rounded-2xl border border-dashed border-line/20 p-7 text-center text-sm text-muted">Todavía no tienes consultas en este módulo.</div>}
        </div>
      </section>
    </div>
  );
}
