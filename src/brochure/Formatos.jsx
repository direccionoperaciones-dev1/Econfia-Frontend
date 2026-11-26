// Los otros formatos del brochure: Folleto (tríptico), Infografía (tira larga) y
// Video (pasa solo con transiciones). Todos dibujan las mismas páginas.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import PaginaBrochure, { ALTO, ANCHO, EstilosBrochure } from "./PaginaBrochure";
import Flipbook from "./Flipbook";
import { temaDe, variablesTema } from "./brochureBase";

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

function useFlechas(siguiente, anterior) {
  useEffect(() => {
    const tecla = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
      if (e.key === "ArrowRight") siguiente();
      if (e.key === "ArrowLeft") anterior();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [siguiente, anterior]);
}

function Controles({ etiqueta, anterior, siguiente, alInicio, alFinal, acento, extra }) {
  return <div className="flex shrink-0 items-center justify-center gap-3 pb-4 pt-2">
    <button type="button" onClick={anterior} disabled={alInicio} aria-label="Anterior"
      className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-30"><ChevronLeft size={20} /></button>
    <div className="min-w-[150px] rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold tracking-wide text-white/90 backdrop-blur">{etiqueta}</div>
    <button type="button" onClick={siguiente} disabled={alFinal} aria-label="Siguiente"
      className="grid h-11 w-11 place-items-center rounded-full text-[#0d0724] transition hover:scale-105 disabled:opacity-30" style={{ background: acento }}><ChevronRight size={20} /></button>
    {extra}
  </div>;
}

// ---------- Folleto: tres caras que se despliegan ----------
export function Folleto({ contenido, irA = null, alto = "100%", controles = true, onEditar }) {
  const tema = temaDe(contenido);
  const paginas = contenido?.paginas || [];
  const marco = useRef(null);
  const { w, h } = useTamano(marco);
  const porCara = w >= 900 ? 3 : w >= 600 ? 2 : 1;
  const grupos = Math.max(1, Math.ceil(paginas.length / porCara));
  const [grupo, setGrupo] = useState(0);
  const espacioAlto = Math.max(200, h - 16);
  const ancho = Math.floor(Math.max(110, Math.min((w - 48 - (porCara - 1) * 6) / porCara, espacioAlto / PROPORCION)));

  const ir = useCallback((g) => setGrupo(Math.max(0, Math.min(grupos - 1, g))), [grupos]);
  const siguiente = useCallback(() => ir(grupo + 1), [ir, grupo]);
  const anterior = useCallback(() => ir(grupo - 1), [ir, grupo]);
  useFlechas(siguiente, anterior);
  useEffect(() => { if (irA != null) ir(Math.floor(irA / porCara)); }, [irA, porCara, ir]);
  useEffect(() => { setGrupo((g) => Math.min(g, grupos - 1)); }, [grupos]);

  const caras = paginas.slice(grupo * porCara, grupo * porCara + porCara);
  const primera = grupo * porCara;
  return <div className="flex h-full w-full flex-col" style={{ ...variablesTema(tema), height: alto }}>
    <EstilosBrochure />
    <style>{`
      @keyframes bq-despliega-izq { from { transform: perspective(1600px) rotateY(88deg); opacity: .3; } to { transform: none; opacity: 1; } }
      @keyframes bq-despliega-der { from { transform: perspective(1600px) rotateY(-88deg); opacity: .3; } to { transform: none; opacity: 1; } }
      @keyframes bq-aparece { from { transform: scale(.94); opacity: 0; } to { transform: none; opacity: 1; } }
    `}</style>
    <div ref={marco} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      {w > 0 && <div key={`${grupo}-${porCara}`} className="flex items-center" style={{ gap: porCara > 1 ? 6 : 0 }}>
        {caras.map((p, i) => {
          const animacion = porCara === 1 ? "bq-aparece" : i === 0 ? "bq-despliega-izq" : i === caras.length - 1 ? "bq-despliega-der" : "bq-aparece";
          return <div key={p.id || i} className="overflow-hidden shadow-2xl" style={{
            borderRadius: porCara === 1 ? 14 : i === 0 ? "14px 2px 2px 14px" : i === caras.length - 1 ? "2px 14px 14px 2px" : 2,
            animation: `${animacion} 800ms cubic-bezier(.2,.8,.2,1) ${i * 120}ms both`,
            transformOrigin: i === 0 ? "right center" : "left center",
          }}>
            <PaginaBrochure pagina={p} tema={tema} numero={primera + i + 1} indice={primera + i} paginas={paginas} onIr={(n) => ir(Math.floor(n / porCara))} ancho={ancho} onEditar={onEditar} />
          </div>;
        })}
      </div>}
    </div>
    {controles && <Controles etiqueta={`Caras ${primera + 1}${caras.length > 1 ? `–${primera + caras.length}` : ""} de ${paginas.length}`}
      anterior={anterior} siguiente={siguiente} alInicio={grupo === 0} alFinal={grupo === grupos - 1} acento={tema.color_acento} />}
  </div>;
}

// ---------- Infografía: tira larga que se revela al bajar ----------
export function Infografia({ contenido, irA = null, alto = "100%", onEditar }) {
  const tema = temaDe(contenido);
  const paginas = contenido?.paginas || [];
  const marco = useRef(null);
  const { w } = useTamano(marco);
  const ancho = Math.floor(Math.max(200, Math.min(w - 40, 640)));
  const refs = useRef([]);
  const listo = w > 0;
  const [visibles, setVisibles] = useState(() => new Set([0]));

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") { setVisibles(new Set(paginas.map((_, i) => i))); return undefined; }
    const io = new IntersectionObserver((entradas) => {
      setVisibles((prev) => {
        const nuevo = new Set(prev);
        entradas.forEach((e) => { if (e.isIntersecting) nuevo.add(Number(e.target.getAttribute("data-i"))); });
        return nuevo;
      });
    }, { root: marco.current, threshold: 0.12 });
    refs.current.slice(0, paginas.length).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
    // `listo`: las páginas solo existen cuando ya se midió el ancho; antes no hay nada que observar.
  }, [paginas, listo]);

  const ir = useCallback((i) => refs.current[i]?.scrollIntoView?.({ behavior: "smooth", block: "start" }), []);
  useEffect(() => { if (irA != null) ir(irA); }, [irA, ir]);

  return <div className="h-full w-full" style={{ ...variablesTema(tema), height: alto }}>
    <EstilosBrochure />
    <div ref={marco} className="h-full overflow-y-auto overflow-x-hidden px-5 py-6">
      {w > 0 && <div className="relative mx-auto" style={{ width: ancho }}>
        {paginas.map((p, i) => <div key={p.id || i} ref={(el) => { refs.current[i] = el; }} data-i={i} className="relative"
          style={{ transition: "opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1)", opacity: visibles.has(i) ? 1 : 0, transform: visibles.has(i) ? "none" : "translateY(60px)" }}>
          <div className={`overflow-hidden shadow-2xl ${i === 0 ? "rounded-t-[22px]" : ""} ${i === paginas.length - 1 ? "rounded-b-[22px]" : ""}`}>
            <PaginaBrochure pagina={p} tema={tema} numero={i + 1} indice={i} paginas={paginas} onIr={ir} ancho={ancho} onEditar={onEditar} />
          </div>
          {i < paginas.length - 1 && <div className="absolute -bottom-3 left-1/2 z-10 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full shadow-lg" style={{ background: tema.color_acento }}>
            <span className="h-2 w-2 rounded-full" style={{ background: tema.color_oscuro }} />
          </div>}
        </div>)}
      </div>}
    </div>
  </div>;
}

// ---------- Video: pasa solo, con transiciones ----------
export function VideoBrochure({ contenido, irA = null, alto = "100%", controles = true, onEditar }) {
  const tema = temaDe(contenido);
  const paginas = contenido?.paginas || [];
  const segundos = Math.max(2, Math.min(30, Number(tema.video_segundos) || 6));
  const transicion = tema.video_transicion || "zoom";
  const marco = useRef(null);
  const { w, h } = useTamano(marco);
  const ancho = Math.floor(Math.max(140, Math.min(w - 32, (h - 16) / PROPORCION)));
  const [actual, setActual] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(!onEditar);
  const [inicio, setInicio] = useState(() => Date.now());
  const [progreso, setProgreso] = useState(0);

  const ir = useCallback((i) => { setActual(Math.max(0, Math.min(paginas.length - 1, i))); setInicio(Date.now()); setProgreso(0); }, [paginas.length]);
  const siguiente = useCallback(() => ir(actual + 1), [ir, actual]);
  const anterior = useCallback(() => ir(actual - 1), [ir, actual]);
  useFlechas(siguiente, anterior);
  useEffect(() => { if (irA != null) { ir(irA); setReproduciendo(false); } }, [irA, ir]);

  useEffect(() => {
    if (!reproduciendo) return undefined;
    const t = setInterval(() => {
      const p = (Date.now() - inicio) / (segundos * 1000);
      if (p >= 1) {
        if (actual >= paginas.length - 1) { setReproduciendo(false); setProgreso(1); }
        else ir(actual + 1);
      } else setProgreso(p);
    }, 80);
    return () => clearInterval(t);
  }, [reproduciendo, inicio, segundos, actual, paginas.length, ir]);

  const alternar = () => {
    if (!reproduciendo && actual >= paginas.length - 1 && progreso >= 1) { ir(0); setReproduciendo(true); return; }
    if (!reproduciendo) setInicio(Date.now() - progreso * segundos * 1000);
    setReproduciendo(!reproduciendo);
  };
  const entrada = { zoom: "bq-v-zoom", fundido: "bq-v-fundido", deslizar: "bq-v-desliza" }[transicion] || "bq-v-zoom";

  return <div className="flex h-full w-full flex-col" style={{ ...variablesTema(tema), height: alto }}>
    <EstilosBrochure />
    <style>{`
      @keyframes bq-v-zoom { from { transform: scale(1.18); opacity: 0; filter: blur(6px); } to { transform: scale(1); opacity: 1; filter: none; } }
      @keyframes bq-v-fundido { from { opacity: 0; } to { opacity: 1; } }
      @keyframes bq-v-desliza { from { transform: translateX(18%); opacity: 0; } to { transform: none; opacity: 1; } }
      @keyframes bq-v-ken { from { transform: scale(1); } to { transform: scale(1.045); } }
    `}</style>
    <div className="mx-auto flex w-full max-w-3xl shrink-0 gap-1.5 px-5 pt-3">
      {paginas.map((_, i) => <button key={i} type="button" aria-label={`Ir a la escena ${i + 1}`} onClick={() => ir(i)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
        <span className="block h-full rounded-full" style={{ background: tema.color_acento, width: `${i < actual ? 100 : i === actual ? Math.round(progreso * 100) : 0}%` }} />
      </button>)}
    </div>
    <div ref={marco} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden" onClick={onEditar ? undefined : alternar}>
      {w > 0 && paginas[actual] && <div key={actual} className="overflow-hidden rounded-[16px] shadow-2xl" style={{ animation: `${entrada} 900ms cubic-bezier(.2,.8,.2,1) both` }}>
        <div style={{ animation: reproduciendo ? `bq-v-ken ${segundos}s linear both` : undefined }}>
          <PaginaBrochure pagina={paginas[actual]} tema={tema} numero={actual + 1} indice={actual} paginas={paginas} onIr={ir} ancho={ancho} onEditar={onEditar} />
        </div>
      </div>}
    </div>
    {controles && <Controles etiqueta={`Escena ${actual + 1} de ${paginas.length}`} anterior={anterior} siguiente={siguiente}
      alInicio={actual === 0} alFinal={actual === paginas.length - 1} acento={tema.color_acento}
      extra={<button type="button" onClick={alternar} aria-label={reproduciendo ? "Pausar" : "Reproducir"}
        className="ml-2 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20">
        {reproduciendo ? <Pause size={18} /> : actual >= paginas.length - 1 && progreso >= 1 ? <RotateCcw size={18} /> : <Play size={18} />}</button>} />}
  </div>;
}

// Elige el visor según el formato del tema.
export default function VisorBrochure(props) {
  const formato = temaDe(props.contenido).formato;
  if (formato === "folleto") return <Folleto {...props} />;
  if (formato === "infografia") return <Infografia {...props} />;
  if (formato === "video") return <VideoBrochure {...props} />;
  return <Flipbook {...props} />;
}
