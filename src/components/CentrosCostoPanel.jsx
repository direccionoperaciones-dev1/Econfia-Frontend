import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Central de gastos de la empresa (la usa el dueño en Gestión Empresa).
 * Junta en un solo lugar lo que la empresa gasta en Econfia (consultas × valor
 * por consulta) y sus gastos propios, por centro de costos, contra el
 * presupuesto de cada centro. Todo se puede exportar a Excel.
 */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hoyISO = () => iso(new Date());
const inicioMesISO = () => `${hoyISO().slice(0, 8)}01`;
const PERIODOS = [
  { id: "mes", label: "Este mes", rango: () => ({ desde: inicioMesISO(), hasta: hoyISO() }) },
  {
    id: "anterior",
    label: "Mes anterior",
    rango: () => {
      const h = new Date();
      return { desde: iso(new Date(h.getFullYear(), h.getMonth() - 1, 1)), hasta: iso(new Date(h.getFullYear(), h.getMonth(), 0)) };
    },
  },
  { id: "anio", label: "Este año", rango: () => ({ desde: `${new Date().getFullYear()}-01-01`, hasta: hoyISO() }) },
];

const num = (n) => Number(n || 0).toLocaleString("es-CO");
const pesos = (n) => `$${Number(n || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
const fechaCorta = (s) => {
  const [a, m, d] = String(s).split("-");
  return `${d}/${m}/${a}`;
};
const campo = "px-3 py-2 rounded-lg bg-surface-2/70 border border-line/20 text-sm focus:outline-none focus:border-brand/50";
const tarjeta = "rounded-2xl border border-line/15 bg-surface/70 p-5";
const gastoVacio = () => ({ fecha: hoyISO(), concepto: "", categoria: "", valor: "", centro_costo: "", proveedor: "", documento: "" });

function BarraPresupuesto({ uso }) {
  if (uso === null || uso === undefined) return <span className="text-xs text-muted">Sin presupuesto</span>;
  const color = uso >= 100 ? "bg-red-500" : uso >= 80 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="min-w-[120px]">
      <div className="h-2 overflow-hidden rounded-full bg-line/15">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(uso, 100)}%` }} />
      </div>
      <span className={`mt-1 block text-[11px] font-semibold ${uso >= 100 ? "text-red-500" : uso >= 80 ? "text-amber-600" : "text-muted"}`}>
        {uso}% usado
      </span>
    </div>
  );
}

export default function CentrosCostoPanel({ api, headers, onToast }) {
  const [vista, setVista] = useState("resumen");
  const [datos, setDatos] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [rango, setRango] = useState(PERIODOS[0].rango());
  const [abierto, setAbierto] = useState(null);
  const [nuevoCentro, setNuevoCentro] = useState({ nombre: "", codigo: "", presupuesto_mensual: "" });
  const [gasto, setGasto] = useState(gastoVacio());
  const [valorConsulta, setValorConsulta] = useState("");
  const [presupuestos, setPresupuestos] = useState({});
  const [filtroOrigen, setFiltroOrigen] = useState("todos");

  const pedir = useCallback(async (ruta, opciones = {}) => {
    const r = await fetch(`${api}${ruta}`, { ...opciones, headers: headers() });
    if (r.status === 204) return {};
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "No se pudo completar");
    return j;
  }, [api, headers]);

  const avisarError = useCallback((e) => onToast({ type: "error", message: e.message }), [onToast]);

  const cargar = useCallback(async () => {
    try {
      const j = await pedir("/api/empresa/centros-costo/");
      setDatos(j);
      setValorConsulta(j.valor_consulta ? String(j.valor_consulta) : "");
      setPresupuestos(Object.fromEntries((j.centros || []).map((c) => [c.id, c.presupuesto_mensual ? String(c.presupuesto_mensual) : ""])));
    } catch (e) { avisarError(e); }
  }, [pedir, avisarError]);

  const cargarReporte = useCallback(async () => {
    try { setReporte(await pedir(`/api/empresa/centros-costo/reporte/?desde=${rango.desde}&hasta=${rango.hasta}`)); }
    catch (e) { avisarError(e); }
  }, [pedir, rango, avisarError]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { cargarReporte(); }, [cargarReporte]);

  const refrescar = () => { cargar(); cargarReporte(); };

  const crearCentro = async () => {
    if (!nuevoCentro.nombre.trim()) { onToast({ type: "error", message: "Escribe el nombre del centro." }); return; }
    try {
      await pedir("/api/empresa/centros-costo/", { method: "POST", body: JSON.stringify(nuevoCentro) });
      setNuevoCentro({ nombre: "", codigo: "", presupuesto_mensual: "" });
      onToast({ type: "success", message: "Centro de costos creado." });
      refrescar();
    } catch (e) { avisarError(e); }
  };

  const guardarPresupuesto = async (centro) => {
    const valor = presupuestos[centro.id] ?? "";
    if (String(valor) === String(centro.presupuesto_mensual || "")) return;
    try {
      await pedir(`/api/empresa/centros-costo/${centro.id}/`, { method: "PATCH", body: JSON.stringify({ presupuesto_mensual: valor || 0 }) });
      onToast({ type: "success", message: `Presupuesto de ${centro.nombre} actualizado.` });
      refrescar();
    } catch (e) { avisarError(e); }
  };

  const cambiarEstado = async (centro) => {
    if (centro.activo && !window.confirm(`¿Desactivar «${centro.nombre}»? Sus usuarios quedarán sin centro y su historial se conserva.`)) return;
    try {
      await pedir(`/api/empresa/centros-costo/${centro.id}/`, { method: "PATCH", body: JSON.stringify({ activo: !centro.activo }) });
      refrescar();
    } catch (e) { avisarError(e); }
  };

  const asignar = async (usuario, centroId) => {
    try {
      await pedir(`/api/empresa/usuarios/${usuario.perfil_id}/centro-costo/`, { method: "PATCH", body: JSON.stringify({ centro_costo: centroId || null }) });
      onToast({ type: "success", message: `Centro de ${usuario.username} actualizado.` });
      cargar();
    } catch (e) { avisarError(e); }
  };

  const guardarValorConsulta = async () => {
    try {
      const j = await pedir("/api/empresa/gastos/configuracion/", { method: "PATCH", body: JSON.stringify({ valor_consulta: valorConsulta || 0 }) });
      onToast({ type: "success", message: `Valor por consulta: ${pesos(j.valor_consulta)}.` });
      refrescar();
    } catch (e) { avisarError(e); }
  };

  const registrarGasto = async () => {
    if (!gasto.concepto.trim() || !gasto.valor) { onToast({ type: "error", message: "Escribe el concepto y el valor del gasto." }); return; }
    try {
      await pedir("/api/empresa/gastos/", { method: "POST", body: JSON.stringify(gasto) });
      setGasto((g) => ({ ...gastoVacio(), fecha: g.fecha, centro_costo: g.centro_costo }));
      onToast({ type: "success", message: "Gasto registrado." });
      cargarReporte();
    } catch (e) { avisarError(e); }
  };

  const borrarGasto = async (m) => {
    if (!window.confirm(`¿Borrar el gasto «${m.concepto}» por ${pesos(m.valor)}?`)) return;
    try {
      await pedir(`/api/empresa/gastos/${m.id}/`, { method: "DELETE" });
      cargarReporte();
    } catch (e) { avisarError(e); }
  };

  const descargar = async () => {
    try {
      const r = await fetch(`${api}/api/empresa/centros-costo/reporte/?desde=${rango.desde}&hasta=${rango.hasta}&formato=xlsx`, { headers: headers() });
      if (!r.ok) throw new Error("No se pudo descargar el Excel");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url; a.download = `central_gastos_${rango.desde}_${rango.hasta}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { avisarError(e); }
  };

  const activos = (datos?.centros || []).filter((c) => c.activo);
  const t = reporte?.totales || {};
  const usoTotal = t.presupuesto ? Math.round((t.gastado * 1000) / t.presupuesto) / 10 : null;
  const movimientos = useMemo(
    () => (reporte?.movimientos || []).filter((m) => filtroOrigen === "todos" || m.origen === filtroOrigen),
    [reporte, filtroOrigen]
  );
  const maxCategoria = Math.max(1, ...(reporte?.categorias || []).map((c) => c.valor));
  const sinValor = datos && !datos.valor_consulta;

  return (
    <div className="space-y-5">
      {/* Encabezado y periodo */}
      <div className={`${tarjeta} flex flex-wrap items-end justify-between gap-4`}>
        <div>
          <h2 className="text-lg font-black">Central de gastos</h2>
          <p className="text-xs text-muted">Lo que tu empresa gasta en Econfia y sus gastos propios, por centro de costos.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2 text-xs">
          <div className="flex gap-1 rounded-lg bg-surface-2/60 p-1">
            {PERIODOS.map((p) => {
              const r = p.rango();
              const sel = r.desde === rango.desde && r.hasta === rango.hasta;
              return (
                <button key={p.id} type="button" onClick={() => setRango(r)}
                  className={`rounded-md px-2.5 py-1.5 font-semibold ${sel ? "bg-brand text-white" : "text-muted hover:text-content"}`}>{p.label}</button>
              );
            })}
          </div>
          <label className="flex flex-col gap-1 text-muted">Desde<input type="date" value={rango.desde} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} className={campo} /></label>
          <label className="flex flex-col gap-1 text-muted">Hasta<input type="date" value={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} className={campo} /></label>
          <button type="button" onClick={descargar} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 font-semibold text-emerald-600">Exportar Excel</button>
        </div>
      </div>

      {sinValor && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm">
          <b>Falta el valor por consulta.</b> Sin él, las consultas de Econfia salen en $0.{" "}
          <button type="button" onClick={() => setVista("configuracion")} className="font-semibold text-brand underline">Configúralo aquí</button>.
        </div>
      )}

      {/* Indicadores */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={tarjeta}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total gastado</p>
          <p className="mt-1 text-2xl font-black">{pesos(t.gastado)}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Consultas Econfia</p>
          <p className="mt-1 text-2xl font-black">{pesos(t.econfia)}</p>
          <p className="text-xs text-muted">{num(t.consultas)} consultas</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Gastos propios</p>
          <p className="mt-1 text-2xl font-black">{pesos(t.propios)}</p>
        </div>
        <div className={tarjeta}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Presupuesto del periodo</p>
          <p className="mt-1 text-2xl font-black">{t.presupuesto ? pesos(t.presupuesto) : "—"}</p>
          <div className="mt-2"><BarraPresupuesto uso={usoTotal} /></div>
        </div>
      </div>

      {/* Pestañas internas */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Central de gastos">
        {[["resumen", "Resumen por centro"], ["movimientos", "Movimientos"], ["configuracion", "Centros y configuración"]].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={vista === id} onClick={() => setVista(id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${vista === id ? "bg-surface-2 text-content ring-1 ring-brand/40" : "text-muted hover:text-content"}`}>{label}</button>
        ))}
      </div>

      {vista === "resumen" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className={`${tarjeta} overflow-x-auto p-0`}>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line/15 text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Centro</th><th className="px-3 text-right">Consultas</th><th className="px-3 text-right">Econfia</th>
                  <th className="px-3 text-right">Propios</th><th className="px-3 text-right">Total</th><th className="px-4">Presupuesto</th>
                </tr>
              </thead>
              <tbody>
                {(reporte?.centros || []).map((f) => {
                  const clave = f.centro_costo_id ?? "sin";
                  return [
                    <tr key={clave} onClick={() => setAbierto(abierto === clave ? null : clave)} className="cursor-pointer border-b border-line/10 hover:bg-surface-2/40">
                      <td className={`px-4 py-3 font-semibold ${f.centro_costo_id ? "" : "text-muted"}`}>{f.centro}</td>
                      <td className="px-3 text-right">{num(f.consultas)}</td>
                      <td className="px-3 text-right">{pesos(f.costo_econfia)}</td>
                      <td className="px-3 text-right">{pesos(f.gastos_propios)}</td>
                      <td className="px-3 text-right font-black">{pesos(f.total)}</td>
                      <td className="px-4 py-2">
                        <BarraPresupuesto uso={f.uso_presupuesto} />
                        {f.disponible !== null && <span className={`text-[11px] ${f.disponible < 0 ? "text-red-500" : "text-muted"}`}>Disponible {pesos(f.disponible)}</span>}
                      </td>
                    </tr>,
                    abierto === clave && (
                      <tr key={`${clave}-detalle`} className="border-b border-line/10 bg-surface-2/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid gap-4 text-xs sm:grid-cols-2">
                            <div>
                              <div className="mb-1 font-semibold text-muted">Consultas por usuario</div>
                              {f.detalle_usuarios.length ? f.detalle_usuarios.map((d) => (
                                <div key={d.usuario} className="flex justify-between gap-2"><span>{d.usuario}</span><span>{num(d.consultas)} · <b>{pesos(d.costo)}</b></span></div>
                              )) : <span className="text-muted">Sin consultas</span>}
                            </div>
                            <div>
                              <div className="mb-1 font-semibold text-muted">Por tipo de consulta</div>
                              {f.detalle_tipos.length ? f.detalle_tipos.map((d) => (
                                <div key={d.tipo} className="flex justify-between gap-2"><span className="truncate">{d.tipo}</span><span>{num(d.consultas)} · <b>{pesos(d.costo)}</b></span></div>
                              )) : <span className="text-muted">Sin consultas</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
            {reporte && reporte.centros.length === 0 && <p className="p-4 text-sm text-muted">Aún no hay centros ni gastos en este periodo.</p>}
          </div>

          <div className={tarjeta}>
            <h3 className="font-bold">Por categoría</h3>
            <div className="mt-3 space-y-3">
              {(reporte?.categorias || []).map((c) => (
                <div key={c.categoria}>
                  <div className="flex justify-between text-xs"><span>{c.categoria}</span><b>{pesos(c.valor)}</b></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/15">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${(c.valor / maxCategoria) * 100}%` }} />
                  </div>
                </div>
              ))}
              {reporte && reporte.categorias.length === 0 && <p className="text-xs text-muted">Sin gastos en el periodo.</p>}
            </div>
          </div>
        </div>
      )}

      {vista === "movimientos" && (
        <div className="space-y-5">
          <div className={tarjeta}>
            <h3 className="font-bold">Registrar un gasto</h3>
            <p className="mb-3 text-xs text-muted">Cualquier gasto de tu empresa: viáticos, proveedores, servicios… Queda en el centro que escojas.</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input type="date" aria-label="Fecha del gasto" value={gasto.fecha} onChange={(e) => setGasto((g) => ({ ...g, fecha: e.target.value }))} className={campo} />
              <input aria-label="Concepto del gasto" placeholder="Concepto, ej. Taxi visita a cliente" value={gasto.concepto} onChange={(e) => setGasto((g) => ({ ...g, concepto: e.target.value }))} className={`${campo} lg:col-span-2`} />
              <input aria-label="Valor del gasto" inputMode="decimal" placeholder="Valor, ej. 45.000" value={gasto.valor} onChange={(e) => setGasto((g) => ({ ...g, valor: e.target.value }))} className={campo} />
              <input aria-label="Categoría del gasto" list="categorias-gasto" placeholder="Categoría" value={gasto.categoria} onChange={(e) => setGasto((g) => ({ ...g, categoria: e.target.value }))} className={campo} />
              <select aria-label="Centro del gasto" value={gasto.centro_costo} onChange={(e) => setGasto((g) => ({ ...g, centro_costo: e.target.value }))} className={campo}>
                <option value="">Sin centro de costos</option>
                {activos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input aria-label="Proveedor" placeholder="Proveedor (opcional)" value={gasto.proveedor} onChange={(e) => setGasto((g) => ({ ...g, proveedor: e.target.value }))} className={campo} />
              <input aria-label="Documento soporte" placeholder="Factura o soporte (opcional)" value={gasto.documento} onChange={(e) => setGasto((g) => ({ ...g, documento: e.target.value }))} className={campo} />
            </div>
            <datalist id="categorias-gasto">{(datos?.categorias || []).map((c) => <option key={c} value={c} />)}</datalist>
            <button type="button" onClick={registrarGasto} className="mt-3 rounded-lg bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white">Registrar gasto</button>
          </div>

          <div className={`${tarjeta} p-0`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/15 px-4 py-3">
              <h3 className="font-bold">Movimientos del periodo</h3>
              <div className="flex gap-1 text-xs">
                {[["todos", "Todos"], ["econfia", "Econfia"], ["propio", "Gastos propios"]].map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={filtroOrigen === id} onClick={() => setFiltroOrigen(id)}
                    className={`rounded-md px-2.5 py-1.5 font-semibold ${filtroOrigen === id ? "bg-brand text-white" : "text-muted hover:text-content"}`}>{label}</button>
                ))}
              </div>
            </div>
            <ul className="divide-y divide-line/10">
              {movimientos.map((m) => (
                <li key={`${m.origen}-${m.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-semibold">{m.concepto}</div>
                    <div className="text-xs text-muted">
                      {fechaCorta(m.fecha)} · {m.centro} · {m.categoria || "Sin categoría"}
                      {m.origen === "econfia" ? ` · ${m.detalle} · ${num(m.cantidad)} × ${pesos(m.valor_unitario)}` : m.detalle ? ` · ${m.detalle}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${m.origen === "econfia" ? "bg-brand/10 text-brand" : "bg-purple-500/10 text-purple-500"}`}>
                      {m.origen === "econfia" ? "Econfia" : "Propio"}
                    </span>
                    <b className="whitespace-nowrap">{pesos(m.valor)}</b>
                    {m.origen === "propio" && (
                      <button type="button" onClick={() => borrarGasto(m)} aria-label={`Borrar ${m.concepto}`} className="text-xs text-muted hover:text-red-500">Borrar</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {reporte && movimientos.length === 0 && <p className="p-4 text-sm text-muted">No hay movimientos en este periodo.</p>}
            {reporte && reporte.movimientos_total > reporte.movimientos.length && (
              <p className="border-t border-line/10 px-4 py-3 text-xs text-muted">Se muestran los {reporte.movimientos.length} más recientes de {num(reporte.movimientos_total)}. El Excel trae todos.</p>
            )}
          </div>
        </div>
      )}

      {vista === "configuracion" && (
        <div className="space-y-5">
          <div className={tarjeta}>
            <h3 className="font-bold">Valor por consulta de Econfia</h3>
            <p className="mb-3 text-xs text-muted">El valor que paga tu empresa por cada consulta. Se usa para costear las consultas nuevas; las anteriores conservan su valor.</p>
            <div className="flex flex-wrap gap-2">
              <input aria-label="Valor por consulta" inputMode="decimal" placeholder="Ej. 9.000" value={valorConsulta} onChange={(e) => setValorConsulta(e.target.value)} className={`${campo} w-48`} />
              <button type="button" onClick={guardarValorConsulta} className="rounded-lg bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white">Guardar valor</button>
            </div>
          </div>

          <div className={tarjeta}>
            <h3 className="font-bold">Centros de costos</h3>
            <p className="mb-3 text-xs text-muted">Áreas o proyectos de tu empresa. Cada consulta se carga al centro que el usuario tenga activo (lo cambia desde el botón junto a la campanita).</p>
            <div className="flex flex-wrap gap-2">
              <input aria-label="Nombre del centro" placeholder="Nombre, ej. Talento humano" value={nuevoCentro.nombre} onChange={(e) => setNuevoCentro((n) => ({ ...n, nombre: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && crearCentro()} className={`${campo} min-w-[200px] flex-1`} />
              <input aria-label="Código del centro" placeholder="Código (opcional)" value={nuevoCentro.codigo} onChange={(e) => setNuevoCentro((n) => ({ ...n, codigo: e.target.value }))} className={`${campo} w-36`} />
              <input aria-label="Presupuesto mensual del centro" inputMode="decimal" placeholder="Presupuesto mensual (opcional)" value={nuevoCentro.presupuesto_mensual} onChange={(e) => setNuevoCentro((n) => ({ ...n, presupuesto_mensual: e.target.value }))} className={`${campo} w-56`} />
              <button type="button" onClick={crearCentro} className="rounded-lg bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white">Crear centro</button>
            </div>
            <div className="mt-4 divide-y divide-line/10 rounded-xl border border-line/15">
              {(datos?.centros || []).map((c) => (
                <div key={c.id} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${c.activo ? "" : "opacity-60"}`}>
                  <div className="min-w-0">
                    <div className="font-semibold">{c.nombre}</div>
                    <div className="text-xs text-muted">{c.codigo ? `${c.codigo} · ` : ""}{num(c.consultas_mes)} consultas este mes{c.activo ? "" : " · desactivado"}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted">Presupuesto mensual
                      <input aria-label={`Presupuesto de ${c.nombre}`} inputMode="decimal" placeholder="$ 0" value={presupuestos[c.id] ?? ""}
                        onChange={(e) => setPresupuestos((p) => ({ ...p, [c.id]: e.target.value }))}
                        onBlur={() => guardarPresupuesto(c)} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        className={`${campo} w-36 py-1.5`} />
                    </label>
                    <button type="button" onClick={() => cambiarEstado(c)} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${c.activo ? "border-line/20 text-muted hover:text-content" : "border-brand/30 text-brand"}`}>{c.activo ? "Desactivar" : "Activar"}</button>
                  </div>
                </div>
              ))}
              {datos && datos.centros.length === 0 && <p className="px-4 py-3 text-sm text-muted">Aún no hay centros. Crea el primero arriba.</p>}
            </div>
          </div>

          {activos.length > 0 && (
            <div className={tarjeta}>
              <h3 className="font-bold">Centro por defecto de cada usuario</h3>
              <p className="mb-3 text-xs text-muted">Es el centro con el que empieza a consultar; el usuario lo puede cambiar.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(datos?.usuarios || []).map((u) => (
                  <label key={u.perfil_id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2/40 px-3 py-2 text-sm">
                    <span className="truncate font-medium">{u.username}{u.es_admin ? " (dueño)" : ""}</span>
                    <select aria-label={`Centro de ${u.username}`} value={u.centro_costo || ""} onChange={(e) => asignar(u, e.target.value)} className={`${campo} max-w-[60%] py-1.5`}>
                      <option value="">Sin centro</option>
                      {activos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
