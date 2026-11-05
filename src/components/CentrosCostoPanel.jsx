import { useCallback, useEffect, useState } from "react";

/**
 * Centros de costos de la empresa (lo usa el dueño en Gestión Empresa):
 * crear y desactivar centros, asignar el centro por defecto de cada usuario
 * y ver/descargar el consumo por centro.
 */
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const inicioMesISO = () => `${hoyISO().slice(0, 8)}01`;
const num = (n) => Number(n || 0).toLocaleString("es-CO");
const campo = "px-3 py-2 rounded-lg bg-surface-2/70 border border-line/20 text-sm focus:outline-none focus:border-brand/50";

export default function CentrosCostoPanel({ api, headers, onToast }) {
  const [datos, setDatos] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: "", codigo: "" });
  const [rango, setRango] = useState({ desde: inicioMesISO(), hasta: hoyISO() });
  const [reporte, setReporte] = useState(null);
  const [abierto, setAbierto] = useState(null);

  const pedir = useCallback(async (ruta, opciones = {}) => {
    const r = await fetch(`${api}${ruta}`, { ...opciones, headers: headers() });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "No se pudo completar");
    return j;
  }, [api, headers]);

  const cargar = useCallback(async () => {
    try { setDatos(await pedir("/api/empresa/centros-costo/")); }
    catch (e) { onToast({ type: "error", message: e.message }); }
  }, [pedir, onToast]);

  const cargarReporte = useCallback(async () => {
    try { setReporte(await pedir(`/api/empresa/centros-costo/reporte/?desde=${rango.desde}&hasta=${rango.hasta}`)); }
    catch (e) { onToast({ type: "error", message: e.message }); }
  }, [pedir, rango, onToast]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { cargarReporte(); }, [cargarReporte]);

  const crear = async () => {
    if (!nuevo.nombre.trim()) { onToast({ type: "error", message: "Escribe el nombre del centro." }); return; }
    try {
      await pedir("/api/empresa/centros-costo/", { method: "POST", body: JSON.stringify(nuevo) });
      setNuevo({ nombre: "", codigo: "" });
      onToast({ type: "success", message: "Centro de costos creado." });
      cargar();
    } catch (e) { onToast({ type: "error", message: e.message }); }
  };

  const cambiarEstado = async (centro) => {
    if (centro.activo && !window.confirm(`¿Desactivar «${centro.nombre}»? Sus usuarios quedarán sin centro y su historial se conserva.`)) return;
    try {
      await pedir(`/api/empresa/centros-costo/${centro.id}/`, { method: "PATCH", body: JSON.stringify({ activo: !centro.activo }) });
      cargar(); cargarReporte();
    } catch (e) { onToast({ type: "error", message: e.message }); }
  };

  const asignar = async (usuario, centroId) => {
    try {
      await pedir(`/api/empresa/usuarios/${usuario.perfil_id}/centro-costo/`, { method: "PATCH", body: JSON.stringify({ centro_costo: centroId || null }) });
      onToast({ type: "success", message: `Centro de ${usuario.username} actualizado.` });
      cargar();
    } catch (e) { onToast({ type: "error", message: e.message }); }
  };

  const descargar = async () => {
    try {
      const r = await fetch(`${api}/api/empresa/centros-costo/reporte/?desde=${rango.desde}&hasta=${rango.hasta}&formato=xlsx`, { headers: headers() });
      if (!r.ok) throw new Error("No se pudo descargar el Excel");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url; a.download = `centros_costo_${rango.desde}_${rango.hasta}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { onToast({ type: "error", message: e.message }); }
  };

  const activos = (datos?.centros || []).filter((c) => c.activo);
  const maximo = Math.max(1, ...(reporte?.centros || []).map((c) => c.consultas));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line/20 bg-surface/70 p-4">
        <h2 className="font-bold">Centros de costos</h2>
        <p className="mb-3 text-xs text-muted">Cada consulta queda cargada al centro que el usuario tenga activo. Cada usuario puede cambiar el suyo desde el botón junto a la campanita.</p>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Nombre del centro" placeholder="Nombre, ej. Talento humano" value={nuevo.nombre} onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && crear()} className={`${campo} min-w-[220px] flex-1`} />
          <input aria-label="Código del centro" placeholder="Código (opcional)" value={nuevo.codigo} onChange={(e) => setNuevo((n) => ({ ...n, codigo: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && crear()} className={`${campo} w-44`} />
          <button type="button" onClick={crear} className="rounded-lg bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white">Crear centro</button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(datos?.centros || []).map((c) => (
            <div key={c.id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${c.activo ? "border-line/20 bg-surface-2/50" : "border-line/10 bg-surface-2/20 opacity-60"}`}>
              <div className="min-w-0">
                <div className="truncate font-semibold">{c.nombre}</div>
                <div className="text-xs text-muted">{c.codigo ? `${c.codigo} · ` : ""}{num(c.consultas_mes)} consultas este mes{c.activo ? "" : " · desactivado"}</div>
              </div>
              <button type="button" onClick={() => cambiarEstado(c)} className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${c.activo ? "border-line/20 text-muted hover:text-content" : "border-brand/30 text-brand"}`}>{c.activo ? "Desactivar" : "Activar"}</button>
            </div>
          ))}
          {datos && datos.centros.length === 0 && <p className="text-sm text-muted">Aún no hay centros. Crea el primero arriba.</p>}
        </div>
      </div>

      {activos.length > 0 && <div className="rounded-xl border border-line/20 bg-surface/70 p-4">
        <h2 className="mb-1 font-bold">Centro por defecto de cada usuario</h2>
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
      </div>}

      <div className="rounded-xl border border-line/20 bg-surface/70 p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-bold">Consumo por centro de costos</h2>
            <p className="text-xs text-muted">{reporte ? `${num(reporte.total)} consultas en el periodo` : "Cargando…"}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2 text-xs">
            <label className="flex flex-col gap-1 text-muted">Desde<input type="date" value={rango.desde} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} className={campo} /></label>
            <label className="flex flex-col gap-1 text-muted">Hasta<input type="date" value={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} className={campo} /></label>
            <button type="button" onClick={descargar} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 font-semibold text-emerald-600">Descargar Excel</button>
          </div>
        </div>
        <div className="space-y-2">
          {(reporte?.centros || []).map((f) => (
            <div key={f.centro_costo_id ?? "sin"} className="rounded-lg bg-surface-2/40 px-3 py-2.5">
              <button type="button" onClick={() => setAbierto(abierto === f.centro ? null : f.centro)} className="w-full text-left">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className={`font-semibold ${f.centro_costo_id ? "" : "text-muted"}`}>{f.centro}</span>
                  <span className="whitespace-nowrap"><b>{num(f.consultas)}</b> <span className="text-xs text-muted">· {f.porcentaje}% · {f.usuarios} usuario{f.usuarios === 1 ? "" : "s"}</span></span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line/10"><div className={`h-full rounded-full ${f.centro_costo_id ? "bg-gradient-to-r from-brand to-brand-2" : "bg-line/40"}`} style={{ width: `${(f.consultas / maximo) * 100}%` }} /></div>
              </button>
              {abierto === f.centro && <div className="mt-2 grid gap-3 border-t border-line/10 pt-2 text-xs sm:grid-cols-2">
                <div><div className="mb-1 font-semibold text-muted">Por usuario</div>{f.detalle_usuarios.map((d) => <div key={d.usuario} className="flex justify-between"><span>{d.usuario}</span><b>{num(d.consultas)}</b></div>)}</div>
                <div><div className="mb-1 font-semibold text-muted">Por tipo de consulta</div>{f.detalle_tipos.map((d) => <div key={d.tipo} className="flex justify-between gap-2"><span className="truncate">{d.tipo}</span><b>{num(d.consultas)}</b></div>)}</div>
              </div>}
            </div>
          ))}
          {reporte && reporte.centros.length === 0 && <p className="text-sm text-muted">No hay consultas en este periodo.</p>}
        </div>
      </div>
    </div>
  );
}
