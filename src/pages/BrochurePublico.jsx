import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Flipbook from "../brochure/Flipbook";
import { BROCHURE_POR_DEFECTO, temaDe } from "../brochure/brochureBase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const FUENTES_GOOGLE = {
  Montserrat: "Montserrat:wght@600;700;800;900",
  "Playfair Display": "Playfair+Display:wght@600;700;800;900",
};

// Brochure que acompaña la propuesta: se abre sin sesión desde el correo o la propuesta.
export default function BrochurePublico() {
  const { search } = useLocation();
  const tokenPropuesta = new URLSearchParams(search).get("propuesta");
  const [contenido, setContenido] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch(`${API_URL}/api/brochure/publico/`)
      .then(async (r) => {
        if (r.status === 404) throw new Error("El brochure no está disponible en este momento.");
        const body = await r.json().catch(() => ({}));
        if (vivo) setContenido(body.contenido || BROCHURE_POR_DEFECTO);
      })
      .catch((e) => { if (vivo) { if (e.message.includes("brochure")) setError(e.message); else setContenido(BROCHURE_POR_DEFECTO); } });
    return () => { vivo = false; };
  }, []);

  const tema = temaDe(contenido);
  useEffect(() => {
    const familia = FUENTES_GOOGLE[tema.fuente_titulos];
    if (!familia || document.getElementById(`bq-fuente-${familia}`)) return;
    const link = document.createElement("link");
    link.id = `bq-fuente-${familia}`;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${familia}&display=swap`;
    document.head.appendChild(link);
  }, [tema.fuente_titulos]);

  useEffect(() => { document.title = "Brochure · Econfia"; }, []);

  return <div className="flex h-[100dvh] flex-col overflow-hidden text-white" style={{
    background: `radial-gradient(circle at 80% 0%, ${tema.color_primario}cc, transparent 55%), radial-gradient(circle at 0% 100%, ${tema.color_acento}33, transparent 45%), ${tema.color_oscuro}`,
  }}>
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-8">
      <img src={tema.logo} alt="Econfia" className="h-8 w-auto sm:h-9" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      {tokenPropuesta && <a href={`/propuesta/${encodeURIComponent(tokenPropuesta)}`}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/20 sm:text-sm">
        <ArrowLeft size={16} /> Volver a mi propuesta
      </a>}
    </header>
    <main className="min-h-0 flex-1">
      {error ? <div className="grid h-full place-items-center px-6 text-center text-white/80">{error}</div>
        : contenido ? <Flipbook contenido={contenido} />
          : <div className="grid h-full place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" /></div>}
    </main>
    <p className="hidden shrink-0 pb-3 text-center text-[11px] text-white/40 sm:block">Usa las flechas del teclado, arrastra o toca las esquinas para pasar la hoja.</p>
  </div>;
}
