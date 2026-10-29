import React, { useEffect, useState } from "react";

// Ajuste anual de precios por IPC. Se registra el % del año y la fecha; el
// backend (tarea diaria) sube solo el precio comercial y las tarifas de los
// planes marcados "Sube con el IPC anual". Se aplica una sola vez por año.

const inputClass = "w-full rounded-xl border border-line/20 bg-surface px-3 py-2.5 text-sm text-content outline-none transition placeholder:text-muted/60 focus:border-brand/60";
const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.13em] text-muted";
const money = (value, currency = "COP") => new Intl.NumberFormat("es-CO", {
  style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: currency === "COP" ? 0 : 2,
}).format(Number(value || 0));
// Fechas "YYYY-MM-DD" parseadas en hora LOCAL (nunca restar un día por UTC).
const fechaLocal = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO");
};

const nuevoForm = () => {
  const anio = new Date().getFullYear() + 1;
  return { anio: String(anio), porcentaje: "", fecha_aplicacion: `${anio}-01-01`, notas: "" };
};

export default function AjusteIPCPanel({ api, planes, onApplied, notify }) {
  const [ajustes, setAjustes] = useState([]);
  const [form, setForm] = useState(nuevoForm());
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aplicandoId, setAplicandoId] = useState(null);

  const cargar = async () => {
    try {
      const data = await api("/api/ajustes-ipc/");
      setAjustes(Array.isArray(data) ? data : data.results || []);
    } catch (error) { notify({ type: "error", message: error.message }); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  const pct = Number(form.porcentaje || 0);
  const conIpc = planes.filter((p) => p.ajuste_ipc !== false);

  const guardar = async (event) => {
    event.preventDefault(); setGuardando(true);
    try {
      await api("/api/ajustes-ipc/", {
        method: "POST",
        body: JSON.stringify({
          anio: Number(form.anio), porcentaje: Number(form.porcentaje),
          fecha_aplicacion: form.fecha_aplicacion || undefined, notas: form.notas,
        }),
      });
      notify({ type: "success", message: `Ajuste IPC ${form.anio} programado. Se aplicará solo el ${fechaLocal(form.fecha_aplicacion)}.` });
      setForm(nuevoForm()); await cargar();
    } catch (error) { notify({ type: "error", message: error.message }); }
    finally { setGuardando(false); }
  };

  const aplicarAhora = async (ajuste) => {
    if (!window.confirm(`¿Aplicar AHORA el IPC ${ajuste.anio} (${ajuste.porcentaje}%) a ${conIpc.length} plan(es)? Esta acción sube los precios y no se puede repetir.`)) return;
    setAplicandoId(ajuste.id);
    try {
      const r = await api(`/api/ajustes-ipc/${ajuste.id}/aplicar/`, { method: "POST" });
      notify({ type: "success", message: r.detail });
      await cargar(); await onApplied();
    } catch (error) { notify({ type: "error", message: error.message }); }
    finally { setAplicandoId(null); }
  };

  const eliminar = async (ajuste) => {
    if (!window.confirm(`¿Eliminar el ajuste IPC ${ajuste.anio} programado?`)) return;
    try { await api(`/api/ajustes-ipc/${ajuste.id}/`, { method: "DELETE" }); await cargar(); }
    catch (error) { notify({ type: "error", message: error.message }); }
  };

  const pendiente = ajustes.find((a) => !a.aplicado);

  return (
    <div className="mb-5 rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg md:p-6">
      <button type="button" onClick={() => setAbierto(!abierto)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h3 className="text-lg font-black text-content">📈 Ajuste anual por IPC</h3>
          <p className="mt-1 text-sm text-muted">
            {pendiente
              ? <>Programado: <b className="text-content">IPC {pendiente.anio} · {pendiente.porcentaje}%</b> — se aplica solo el {fechaLocal(pendiente.fecha_aplicacion)}.</>
              : "Registra el % de IPC del año y los precios suben solos en la fecha indicada."}
          </p>
        </div>
        <span className="text-xl text-muted">{abierto ? "▴" : "▾"}</span>
      </button>

      {abierto && <>
        <form onSubmit={guardar} className="mt-5 grid gap-4 md:grid-cols-4">
          <label><span className={labelClass}>Año que rige</span><input className={inputClass} type="number" min="2020" max="2100" required value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value, fecha_aplicacion: `${e.target.value}-01-01` })} /></label>
          <label><span className={labelClass}>IPC (%)</span><input className={inputClass} type="number" step="0.01" min="0.01" max="100" required placeholder="Ej. 5.20" value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: e.target.value })} /></label>
          <label><span className={labelClass}>Fecha de aplicación</span><input className={inputClass} type="date" required value={form.fecha_aplicacion} onChange={(e) => setForm({ ...form, fecha_aplicacion: e.target.value })} /></label>
          <div className="flex items-end"><button disabled={guardando || !pct} className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-60">{guardando ? "Guardando…" : "Programar ajuste"}</button></div>
          <div className="md:col-span-4"><label><span className={labelClass}>Notas (opcional)</span><input className={inputClass} placeholder="Ej. IPC certificado DANE diciembre" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></label></div>
        </form>

        {pct > 0 && conIpc.length > 0 && (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line/15">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-surface-2/80 text-[11px] uppercase tracking-[0.1em] text-muted"><tr><th className="px-4 py-2.5 text-left">Vista previa · Plan</th><th className="px-4 py-2.5 text-right">Precio actual</th><th className="px-4 py-2.5 text-right">Con IPC {pct}%</th></tr></thead>
              <tbody>{conIpc.map((p) => (
                <tr key={p.id} className="border-t border-line/10"><td className="px-4 py-2.5 font-semibold text-content">{p.nombre_display || p.nombre}</td><td className="px-4 py-2.5 text-right text-muted">{money(p.precio, p.moneda)}</td><td className="px-4 py-2.5 text-right font-bold text-emerald-500">{money(Number(p.precio) * (1 + pct / 100), p.moneda)}</td></tr>
              ))}</tbody>
            </table>
            <p className="px-4 py-2 text-xs text-muted">También suben las tarifas por volumen de cada plan. El costo interno no cambia.</p>
          </div>
        )}

        {ajustes.length > 0 && (
          <div className="mt-5 space-y-2">
            {ajustes.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/15 bg-surface-2/50 px-4 py-3">
                <div className="text-sm">
                  <b className="text-content">IPC {a.anio} · {a.porcentaje}%</b>
                  <span className="ml-2 text-muted">{a.aplicado
                    ? `Aplicado ${a.aplicado_en ? new Date(a.aplicado_en).toLocaleDateString("es-CO") : ""} (${a.aplicado_por_nombre}) · ${a.cambios.length} plan(es)`
                    : `Pendiente · se aplica solo el ${fechaLocal(a.fecha_aplicacion)}`}</span>
                  {a.notas && <span className="ml-2 text-xs text-muted">— {a.notas}</span>}
                </div>
                {a.aplicado
                  ? <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500">Aplicado ✔</span>
                  : <div className="flex gap-2">
                      <button type="button" onClick={() => aplicarAhora(a)} disabled={aplicandoId === a.id} className="rounded-xl border border-brand/50 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/10 disabled:opacity-60">{aplicandoId === a.id ? "Aplicando…" : "Aplicar ahora"}</button>
                      <button type="button" onClick={() => eliminar(a)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-muted hover:text-red-500">Eliminar</button>
                    </div>}
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}
