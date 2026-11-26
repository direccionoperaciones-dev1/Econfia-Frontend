import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import PaginaBrochure, { ALTO, ANCHO, EstilosBrochure } from "./PaginaBrochure";
import { temaDe, variablesTema } from "./brochureBase";

const DURACION = 900; // ms del giro de una hoja
const PROPORCION = ALTO / ANCHO;

function useTamano(ref) {
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const medir = () => setTam({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return tam;
}

/**
 * Revista a doble página: cada hoja tiene frente (página par) y reverso (impar)
 * y gira 180° sobre el lomo. En pantallas angostas muestra una página a la vez.
 *
 * `irA` (índice de página) permite que el editor salte a la página que se edita.
 */
export default function Flipbook({ contenido, irA = null, alto = "100%", onCambio, controles = true }) {
  const tema = temaDe(contenido);
  const paginas = useMemo(() => {
    const lista = contenido?.paginas || [];
    // Número par de caras: si sobra una, la contraportada queda de reverso con el logo.
    return lista.length % 2 ? [...lista, { tipo: "blanca", id: "_blanca" }] : lista;
  }, [contenido]);
  const total = paginas.length;
  const hojas = total / 2;

  const marco = useRef(null);
  const { w, h } = useTamano(marco);
  const doble = w >= 820;
  const espacioAlto = Math.max(200, h - (controles ? 76 : 16));
  const anchoPagina = Math.floor(Math.max(120, Math.min(doble ? (w - 120) / 2 : w - 32, espacioAlto / PROPORCION)));
  const altoPagina = Math.round(anchoPagina * PROPORCION);

  const [giradas, setGiradas] = useState(0); // hojas volteadas (modo doble)
  const [pagina, setPagina] = useState(0); // página actual (modo una)
  const [moviendo, setMoviendo] = useState({ desde: 0, hasta: 0, hasta_t: 0 });
  const [direccion, setDireccion] = useState(1);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  const paginaActual = doble ? (giradas === 0 ? 0 : 2 * giradas - 1) : pagina;

  // Refs con el valor vigente: así irAPagina no cambia en cada giro (el editor la usa en un efecto).
  const giradasRef = useRef(0);
  const paginaRef = useRef(0);
  giradasRef.current = giradas;
  paginaRef.current = pagina;

  const irAPagina = useCallback((p) => {
    const destino = Math.max(0, Math.min(total - 1, p));
    if (doble) {
      const actual = giradasRef.current;
      const objetivo = Math.ceil(destino / 2);
      if (objetivo === actual) return;
      setMoviendo({ desde: actual, hasta: objetivo, hasta_t: Date.now() + DURACION + Math.abs(objetivo - actual) * 90 });
      giradasRef.current = objetivo;
      setGiradas(objetivo);
    } else {
      const actual = paginaRef.current;
      if (destino === actual) return;
      setDireccion(destino > actual ? 1 : -1);
      paginaRef.current = destino;
      setPagina(destino);
    }
  }, [doble, total]);

  const siguiente = useCallback(() => (doble ? irAPagina(2 * giradas + 1) : irAPagina(pagina + 1)), [doble, giradas, pagina, irAPagina]);
  const anterior = useCallback(() => (doble ? irAPagina(Math.max(0, 2 * giradas - 3)) : irAPagina(pagina - 1)), [doble, giradas, pagina, irAPagina]);

  // Al pasar de una a doble página (o al revés) conserva la página que se estaba viendo.
  const previoDoble = useRef(doble);
  useEffect(() => {
    if (previoDoble.current === doble) return;
    previoDoble.current = doble;
    if (doble) setGiradas(Math.ceil(pagina / 2)); else setPagina(giradas === 0 ? 0 : 2 * giradas - 1);
  }, [doble, pagina, giradas]);

  useEffect(() => { if (irA != null) irAPagina(irA); }, [irA, irAPagina]);
  useEffect(() => { onCambio?.(paginaActual); }, [paginaActual, onCambio]);

  useEffect(() => {
    const tecla = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
      if (e.key === "ArrowRight") siguiente();
      if (e.key === "ArrowLeft") anterior();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [siguiente, anterior]);

  // Deslizar con el dedo / arrastrar con el mouse.
  const inicio = useRef(null);
  const alPresionar = (e) => { const p = e.touches?.[0] || e; inicio.current = { x: p.clientX, y: p.clientY }; };
  const alSoltar = (e) => {
    if (!inicio.current) return;
    const p = e.changedTouches?.[0] || e;
    const dx = p.clientX - inicio.current.x;
    const dy = p.clientY - inicio.current.y;
    inicio.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? siguiente : anterior)();
  };

  const alternarPantalla = () => {
    const el = marco.current?.parentElement;
    if (!document.fullscreenElement && el?.requestFullscreen) { el.requestFullscreen(); setPantallaCompleta(true); }
    else if (document.exitFullscreen) { document.exitFullscreen(); setPantallaCompleta(false); }
  };
  useEffect(() => {
    const salir = () => setPantallaCompleta(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", salir);
    return () => document.removeEventListener("fullscreenchange", salir);
  }, []);

  const animando = Date.now() < moviendo.hasta_t;
  const [, refrescar] = useState(0);
  useEffect(() => {
    if (!animando) return undefined;
    const t = setTimeout(() => refrescar((n) => n + 1), moviendo.hasta_t - Date.now() + 20);
    return () => clearTimeout(t);
  }, [animando, moviendo]);

  const etiqueta = doble
    ? (giradas === 0 ? "Portada" : giradas === hojas ? "Contraportada" : `${2 * giradas} – ${2 * giradas + 1} de ${total}`)
    : `${pagina + 1} de ${total}`;
  const alInicio = doble ? giradas === 0 : pagina === 0;
  const alFinal = doble ? giradas === hojas : pagina === total - 1;

  const cara = (indice, lado) => <div className="absolute inset-0 overflow-hidden" style={{
    backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
    transform: lado === "reverso" ? "rotateY(180deg)" : undefined,
    borderRadius: lado === "reverso" ? "14px 0 0 14px" : "0 14px 14px 0",
    boxShadow: "0 30px 60px -25px rgba(0,0,0,.55)",
  }}>
    <PaginaBrochure pagina={paginas[indice]} tema={tema} numero={indice + 1} paginas={paginas} onIr={irAPagina} ancho={anchoPagina} />
    {/* sombra del lomo */}
    <div className="pointer-events-none absolute inset-y-0 w-10" style={{
      [lado === "reverso" ? "right" : "left"]: 0,
      background: `linear-gradient(to ${lado === "reverso" ? "left" : "right"}, rgba(0,0,0,.28), transparent)`,
    }} />
  </div>;

  return <div className="relative flex h-full w-full flex-col" style={{ ...variablesTema(tema), height: alto }}>
    <EstilosBrochure />
    <div ref={marco} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden select-none"
      onMouseDown={alPresionar} onMouseUp={alSoltar} onTouchStart={alPresionar} onTouchEnd={alSoltar}>
      {w > 0 && (doble ? (
        <div className="relative" style={{
          width: anchoPagina * 2, height: altoPagina, perspective: 2600,
          transform: `translateX(${giradas === 0 ? -anchoPagina / 2 : giradas === hojas ? anchoPagina / 2 : 0}px)`,
          transition: `transform ${DURACION}ms cubic-bezier(.645,.045,.355,1)`,
        }}>
          {Array.from({ length: hojas }, (_, j) => {
            const volteada = j < giradas;
            const enMovimiento = animando && j >= Math.min(moviendo.desde, moviendo.hasta) && j < Math.max(moviendo.desde, moviendo.hasta);
            const retraso = enMovimiento ? Math.abs(j - moviendo.desde) * 90 : 0;
            return <div key={paginas[2 * j]?.id || j} className="absolute top-0" style={{
              left: anchoPagina, width: anchoPagina, height: altoPagina,
              transformStyle: "preserve-3d", transformOrigin: "left center",
              transform: `rotateY(${volteada ? -180 : 0}deg)`,
              transition: `transform ${DURACION}ms cubic-bezier(.645,.045,.355,1) ${retraso}ms`,
              zIndex: enMovimiento ? 100 + (moviendo.hasta > moviendo.desde ? j : hojas - j) : volteada ? j + 1 : hojas - j + 1,
            }}>
              {cara(2 * j, "frente")}
              {cara(2 * j + 1, "reverso")}
            </div>;
          })}
          {/* esquinas que invitan a pasar la hoja */}
          {!alFinal && <button type="button" aria-label="Página siguiente" onClick={siguiente}
            className="group absolute right-0 top-0 z-[300] h-full w-11 cursor-pointer">
            <span className="absolute bottom-0 right-0 h-0 w-0 transition-all duration-300 group-hover:h-14 group-hover:w-14"
              style={{ background: "linear-gradient(225deg, transparent 50%, rgba(0,0,0,.18) 50%, rgba(255,255,255,.9) 62%, #ddd 100%)", borderTopLeftRadius: 6 }} />
          </button>}
          {!alInicio && <button type="button" aria-label="Página anterior" onClick={anterior}
            className="group absolute left-0 top-0 z-[300] h-full w-11 cursor-pointer">
            <span className="absolute bottom-0 left-0 h-0 w-0 transition-all duration-300 group-hover:h-14 group-hover:w-14"
              style={{ background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,.18) 50%, rgba(255,255,255,.9) 62%, #ddd 100%)", borderTopRightRadius: 6 }} />
          </button>}
        </div>
      ) : (
        <div className="relative" style={{ width: anchoPagina, height: altoPagina, perspective: 1800 }}>
          <div key={pagina} className="absolute inset-0 overflow-hidden rounded-[14px] shadow-2xl" style={{
            animation: `bq-entra-${direccion > 0 ? "der" : "izq"} 650ms cubic-bezier(.2,.8,.2,1)`, transformOrigin: direccion > 0 ? "left center" : "right center",
          }}>
            <PaginaBrochure pagina={paginas[pagina]} tema={tema} numero={pagina + 1} paginas={paginas} onIr={irAPagina} ancho={anchoPagina} />
          </div>
          <style>{`
            @keyframes bq-entra-der { from { transform: rotateY(-35deg) translateX(30%); opacity: 0; } to { transform: none; opacity: 1; } }
            @keyframes bq-entra-izq { from { transform: rotateY(35deg) translateX(-30%); opacity: 0; } to { transform: none; opacity: 1; } }
          `}</style>
        </div>
      ))}
    </div>

    {controles && <div className="flex shrink-0 items-center justify-center gap-3 pb-4 pt-2">
      <button type="button" onClick={anterior} disabled={alInicio} aria-label="Anterior"
        className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-30"><ChevronLeft size={20} /></button>
      <div className="min-w-[150px] rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold tracking-wide text-white/90 backdrop-blur">{etiqueta}</div>
      <button type="button" onClick={siguiente} disabled={alFinal} aria-label="Siguiente"
        className="grid h-11 w-11 place-items-center rounded-full text-[#0d0724] transition hover:scale-105 disabled:opacity-30" style={{ background: tema.color_acento }}><ChevronRight size={20} /></button>
      <button type="button" onClick={alternarPantalla} aria-label="Pantalla completa"
        className="ml-2 hidden h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:grid">{pantallaCompleta ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
    </div>}
  </div>;
}
