import { useEffect, useRef, useState } from "react";

/**
 * Botón junto a la campanita: muestra a qué centro de costos se cargan las
 * consultas del usuario y le deja cambiarlo. Solo aparece si su empresa tiene
 * centros activos.
 */
export default function SelectorCentroCosto() {
  const API = process.env.REACT_APP_API_URL;
  const [datos, setDatos] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const headers = () => ({ "Content-Type": "application/json", Authorization: `Token ${localStorage.getItem("token")}` });

  useEffect(() => {
    let vivo = true;
    fetch(`${API}/api/mi-centro-costo/`, { headers: headers() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo) setDatos(j); })
      .catch(() => {});
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  useEffect(() => {
    const cerrar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, []);

  if (!datos || !(datos.disponibles || []).length) return null;

  const escoger = async (id) => {
    setAbierto(false);
    try {
      const r = await fetch(`${API}/api/mi-centro-costo/`, { method: "POST", headers: headers(), body: JSON.stringify({ centro_costo: id }) });
      if (r.ok) setDatos(await r.json());
    } catch { /* se mantiene el centro anterior */ }
  };

  const actual = datos.actual;
  return (
    <div ref={ref} className="fixed top-20 right-[4.25rem] z-[60] md:top-24 md:right-[5.25rem]">
      <button type="button" onClick={() => setAbierto((v) => !v)} title="Centro de costos al que se cargan tus consultas"
        className={`inline-flex h-11 max-w-[46vw] items-center gap-2 rounded-full border bg-surface/80 px-4 text-sm font-semibold shadow-lg backdrop-blur transition ${actual ? "border-brand/40 text-content" : "border-amber-400/50 text-amber-500"}`}>
        <span aria-hidden>🏷️</span>
        <span className="truncate">{actual ? actual.nombre : "Sin centro de costos"}</span>
        <span aria-hidden className="text-xs text-muted">▾</span>
      </button>
      {abierto && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line/20 bg-surface shadow-2xl">
          <div className="border-b border-line/15 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Cargar mis consultas a</div>
          {datos.disponibles.map((c) => (
            <button key={c.id} type="button" onClick={() => escoger(c.id)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand/10 ${actual?.id === c.id ? "font-bold text-brand" : "text-content"}`}>
              <span className="truncate">{c.nombre}{c.codigo ? <span className="ml-1 text-xs text-muted">{c.codigo}</span> : null}</span>
              {actual?.id === c.id && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
