// src/components/NotificacionesBell.jsx
// Campanita del centro de notificaciones. Flotante (no toca el TaskBar).
// Muestra el conteo de no leídas y un panel con la lista; marca como leídas.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, X } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Token ${token}` } : {};
}

export default function NotificacionesBell() {
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const ref = useRef(null);

  const logueado = Boolean(localStorage.getItem("token"));

  const cargarConteo = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/conteo/`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNoLeidas(data.no_leidas || 0);
    } catch (_) {
      /* silencioso */
    }
  }, []);

  const cargarLista = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/?limit=30`, {
        headers: { ...authHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.notificaciones || []);
        setNoLeidas(data.no_leidas || 0);
      }
    } catch (_) {
      /* silencioso */
    } finally {
      setCargando(false);
    }
  }, []);

  // Conteo al montar + cada 60s.
  useEffect(() => {
    if (!logueado) return undefined;
    cargarConteo();
    const id = setInterval(cargarConteo, 60000);
    return () => clearInterval(id);
  }, [logueado, cargarConteo]);

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    function onClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    if (abierto) document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, [abierto]);

  const toggle = () => {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo) cargarLista();
  };

  const marcarLeida = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/${id}/leer/`, {
        method: "POST",
        headers: { ...authHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setNoLeidas(data.no_leidas ?? 0);
        setItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
        );
      }
    } catch (_) {
      /* silencioso */
    }
  };

  const marcarTodas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/leer-todas/`, {
        method: "POST",
        headers: { ...authHeaders() },
      });
      if (res.ok) {
        setNoLeidas(0);
        setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
      }
    } catch (_) {
      /* silencioso */
    }
  };

  if (!logueado) return null;

  return (
    <div ref={ref} className="fixed top-20 right-4 z-[60] md:top-24 md:right-6">
      {/* Botón campana */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Notificaciones"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-line/20 bg-surface/80 backdrop-blur text-content shadow-lg transition hover:border-brand/40 hover:text-brand"
      >
        <Bell size={20} />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {/* Panel */}
      {abierto && (
        <div className="absolute right-0 mt-2 w-[22rem] max-w-[92vw] rounded-2xl border border-line/20 bg-surface shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line/15">
            <span className="font-semibold text-content text-sm">
              Notificaciones
            </span>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="text-xs text-brand hover:underline"
                  title="Marcar todas como leídas"
                >
                  Marcar todas
                </button>
              )}
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="text-muted hover:text-content"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-line/10">
            {cargando && (
              <div className="px-4 py-6 text-center text-sm text-muted">
                Cargando…
              </div>
            )}
            {!cargando && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                No tienes notificaciones.
              </div>
            )}
            {!cargando &&
              items.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 flex gap-3 ${
                    n.leida ? "opacity-70" : "bg-brand/5"
                  }`}
                >
                  <div className="mt-1">
                    <span
                      className={`block h-2 w-2 rounded-full ${
                        n.leida ? "bg-transparent" : "bg-brand"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-content leading-snug">
                      {n.titulo}
                    </p>
                    {n.mensaje && (
                      <p className="text-xs text-muted mt-1 whitespace-pre-line line-clamp-5">
                        {n.mensaje}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-muted">{n.fecha}</span>
                      {!n.leida && (
                        <button
                          type="button"
                          onClick={() => marcarLeida(n.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline"
                        >
                          <Check size={12} /> Leída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
