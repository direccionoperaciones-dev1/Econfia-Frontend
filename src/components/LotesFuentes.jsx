import { useState, useEffect, useCallback } from "react";

/**
 * Panel de "lotes de fuentes favoritas" reutilizable para Essencial y
 * Essencial Express. Permite al usuario:
 *  - Aplicar un lote guardado a la selección actual (sin re-escribir fuentes).
 *  - Guardar la selección actual como un lote nuevo.
 *  - Actualizar / renombrar / eliminar un lote existente.
 *
 * Los lotes son SEPARADOS por módulo (prop `modulo`).
 * Solo se muestra si `enabled` (Perfil.puede_usar_lotes) es true.
 *
 * Props:
 *  - modulo: "essencial" | "essencial-express"
 *  - enabled: bool (puede_usar_lotes del perfil)
 *  - fuentes: array de fuentes disponibles [{nombre, nombre_pila}]
 *  - seleccionadas: array de nombres seleccionados actualmente
 *  - setSeleccionadas: setter del estado de selección del modal
 *  - onToast: (t) => void  para mostrar mensajes ({type, message})
 */
export default function LotesFuentes({
  modulo,
  enabled,
  fuentes = [],
  seleccionadas = [],
  setSeleccionadas,
  onToast,
}) {
  const API_URL = process.env.REACT_APP_API_URL;
  const [lotes, setLotes] = useState([]);
  const [loteId, setLoteId] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [abierto, setAbierto] = useState(false); // panel colapsado por defecto

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    };
  }, []);

  const cargarLotes = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/lotes-fuentes/?modulo=${encodeURIComponent(modulo)}`,
        { headers: authHeaders() }
      );
      if (!res.ok) return;
      const json = await res.json();
      setLotes(Array.isArray(json) ? json : []);
    } catch (err) {
      // silencioso: la ausencia de lotes no debe romper el modal
    }
  }, [API_URL, modulo, authHeaders]);

  useEffect(() => {
    if (enabled) cargarLotes();
  }, [enabled, cargarLotes]);

  if (!enabled) return null;

  const loteActual = lotes.find((l) => String(l.id) === String(loteId));

  // Conjunto de nombres disponibles hoy (para no aplicar fuentes que ya no existen).
  const nombresDisponibles = new Set(fuentes.map((f) => f.nombre));

  const handleAplicar = () => {
    if (!loteActual) return;
    const aplicables = (loteActual.fuentes || []).filter((n) =>
      nombresDisponibles.has(n)
    );
    setSeleccionadas(aplicables);
    const descartadas = (loteActual.fuentes || []).length - aplicables.length;
    onToast?.({
      type: descartadas > 0 ? "info" : "success",
      message:
        descartadas > 0
          ? `Lote aplicado: ${aplicables.length} fuentes (${descartadas} no disponibles en este módulo se omitieron).`
          : `Lote "${loteActual.nombre}" aplicado (${aplicables.length} fuentes).`,
    });
  };

  const handleGuardarNuevo = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) {
      onToast?.({ type: "error", message: "Escribe un nombre para el lote." });
      return;
    }
    if (seleccionadas.length === 0) {
      onToast?.({ type: "error", message: "Selecciona al menos una fuente para guardar el lote." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/lotes-fuentes/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ nombre, modulo, fuentes: seleccionadas }),
      });
      const json = await res.json();
      if (!res.ok) {
        onToast?.({ type: "error", message: json.error || "No se pudo guardar el lote." });
        return;
      }
      setNuevoNombre("");
      await cargarLotes();
      setLoteId(String(json.id));
      onToast?.({ type: "success", message: `Lote "${nombre}" guardado.` });
    } catch (err) {
      onToast?.({ type: "error", message: "Error guardando el lote." });
    } finally {
      setBusy(false);
    }
  };

  const handleActualizar = async () => {
    if (!loteActual) return;
    if (seleccionadas.length === 0) {
      onToast?.({ type: "error", message: "La selección actual está vacía." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/lotes-fuentes/${loteActual.id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ fuentes: seleccionadas }),
      });
      const json = await res.json();
      if (!res.ok) {
        onToast?.({ type: "error", message: json.error || "No se pudo actualizar el lote." });
        return;
      }
      await cargarLotes();
      onToast?.({ type: "success", message: `Lote "${loteActual.nombre}" actualizado con la selección actual.` });
    } catch (err) {
      onToast?.({ type: "error", message: "Error actualizando el lote." });
    } finally {
      setBusy(false);
    }
  };

  const handleRenombrar = async () => {
    if (!loteActual) return;
    const nombre = window.prompt("Nuevo nombre del lote:", loteActual.nombre);
    if (nombre === null) return;
    const limpio = nombre.trim();
    if (!limpio) {
      onToast?.({ type: "error", message: "El nombre no puede estar vacío." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/lotes-fuentes/${loteActual.id}/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ nombre: limpio }),
      });
      const json = await res.json();
      if (!res.ok) {
        onToast?.({ type: "error", message: json.error || "No se pudo renombrar el lote." });
        return;
      }
      await cargarLotes();
      onToast?.({ type: "success", message: "Lote renombrado." });
    } catch (err) {
      onToast?.({ type: "error", message: "Error renombrando el lote." });
    } finally {
      setBusy(false);
    }
  };

  const handleEliminar = async () => {
    if (!loteActual) return;
    if (!window.confirm(`¿Eliminar el lote "${loteActual.nombre}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/lotes-fuentes/${loteActual.id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        onToast?.({ type: "error", message: "No se pudo eliminar el lote." });
        return;
      }
      setLoteId("");
      await cargarLotes();
      onToast?.({ type: "success", message: "Lote eliminado." });
    } catch (err) {
      onToast?.({ type: "error", message: "Error eliminando el lote." });
    } finally {
      setBusy(false);
    }
  };

  const btnBase =
    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="mb-3 rounded-xl border border-purple-500/25 bg-purple-500/5">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6L12 2z" />
          </svg>
          <span className="text-purple-200 font-semibold text-sm">Lotes de fuentes guardados</span>
          {lotes.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-purple-500/25 text-purple-200 text-[11px] font-bold">
              {lotes.length}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[11px] text-purple-200/60 hidden sm:inline">
            {abierto ? "Ocultar" : "Mostrar"}
          </span>
          <svg
            className={`w-4 h-4 text-purple-300 transition-transform duration-300 ${abierto ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {abierto && (
      <div className="px-3 pb-3">
      {/* Aplicar / gestionar un lote existente */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
        <select
          value={loteId}
          onChange={(e) => setLoteId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400/50"
        >
          <option value="" className="bg-slate-900">
            {lotes.length === 0 ? "No tienes lotes guardados" : "Selecciona un lote…"}
          </option>
          {lotes.map((l) => (
            <option key={l.id} value={l.id} className="bg-slate-900">
              {l.nombre} ({(l.fuentes || []).length})
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={handleAplicar} disabled={!loteActual || busy}
            className={`${btnBase} bg-gradient-to-r from-brand to-brand-2 text-white hover:brightness-110`}>
            Aplicar
          </button>
          <button type="button" onClick={handleActualizar} disabled={!loteActual || busy}
            className={`${btnBase} bg-white/10 text-cyan-200 hover:bg-white/20`}>
            Actualizar
          </button>
          <button type="button" onClick={handleRenombrar} disabled={!loteActual || busy}
            className={`${btnBase} bg-white/10 text-cyan-200 hover:bg-white/20`}>
            Renombrar
          </button>
          <button type="button" onClick={handleEliminar} disabled={!loteActual || busy}
            className={`${btnBase} bg-red-500/20 text-red-300 hover:bg-red-500/30`}>
            Eliminar
          </button>
        </div>
      </div>

      {/* Pista del flujo de edición */}
      <p className="text-[11px] text-purple-200/70 mb-2 leading-snug">
        ✏️ Para editar un lote: pulsa <b>Aplicar</b>, marca o desmarca fuentes en la lista de abajo y luego <b>Actualizar</b>.
      </p>

      {/* Guardar la selección actual como lote nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nombre del nuevo lote (ej. Conductores transporte)"
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/40 text-xs focus:outline-none focus:border-purple-400/50"
        />
        <button type="button" onClick={handleGuardarNuevo} disabled={busy}
          className={`${btnBase} bg-purple-500/80 text-white hover:bg-purple-400`}>
          Guardar selección ({seleccionadas.length})
        </button>
      </div>
      </div>
      )}
    </div>
  );
}
