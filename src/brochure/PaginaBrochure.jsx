import React from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { ICONOS, TIPOS_PAGINA, enlaceSeguro } from "./brochureBase";

// Tamaño de diseño de una página (A4 vertical). El libro la escala al espacio disponible.
export const ANCHO = 560;
export const ALTO = 792;

// Estilos con las variables del tema: el "cajón" sobresale en color al pasar el cursor.
export function EstilosBrochure() {
  return <style>{`
    .bq-pagina { font-family: 'Poppins', system-ui, sans-serif; }
    .bq-titulo { font-family: var(--b-fuente); letter-spacing: -0.02em; }
    .bq-claro { background: var(--b-claro); color: var(--b-texto); }
    .bq-oscuro { background: linear-gradient(160deg, var(--b-primario), var(--b-oscuro) 70%); color: #fff; }
    .bq-kicker { color: var(--b-acento); }
    .bq-claro .bq-kicker { color: var(--b-primario); }
    .bq-cajon { transition: transform .35s cubic-bezier(.2,.8,.2,1), background-color .3s, color .3s, box-shadow .35s, border-color .3s; }
    .bq-claro .bq-cajon { background: #fff; border: 1px solid rgba(0,0,0,.06); }
    .bq-oscuro .bq-cajon { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
    .bq-cajon:hover { transform: translateY(-5px) scale(1.035); background: var(--b-primario) !important; color: #fff; border-color: transparent;
      box-shadow: 0 18px 40px -12px var(--b-primario); z-index: 2; position: relative; }
    .bq-oscuro .bq-cajon:hover { background: var(--b-acento) !important; color: var(--b-oscuro); box-shadow: 0 18px 40px -12px var(--b-acento); }
    .bq-icono { transition: background-color .3s, color .3s, transform .35s; background: color-mix(in srgb, var(--b-primario) 12%, transparent); color: var(--b-primario); }
    .bq-oscuro .bq-icono { background: color-mix(in srgb, var(--b-acento) 18%, transparent); color: var(--b-acento); }
    .bq-cajon:hover .bq-icono { background: var(--b-acento); color: var(--b-oscuro); transform: rotate(-8deg) scale(1.08); }
    .bq-oscuro .bq-cajon:hover .bq-icono { background: var(--b-oscuro); color: var(--b-acento); }
    .bq-cajon:hover .bq-suave { color: inherit; opacity: .9; }
    .bq-valor { color: var(--b-primario); }
    .bq-oscuro .bq-valor { color: var(--b-acento); }
    .bq-cajon:hover .bq-valor { color: inherit; }
    .bq-acento-bg { background: var(--b-acento); color: var(--b-oscuro); }
    .bq-primario-bg { background: var(--b-primario); color: #fff; }
    .bq-img { transition: transform .8s cubic-bezier(.2,.8,.2,1); }
    .bq-marco:hover .bq-img { transform: scale(1.06); }
    .bq-boton { transition: transform .25s, box-shadow .25s; }
    .bq-boton:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -10px var(--b-acento); }
  `}</style>;
}

const parrafos = (texto) => String(texto || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
const lineas = (texto) => String(texto || "").split("\n").map((p) => p.trim()).filter(Boolean);
const Icono = ({ nombre, size = 22 }) => { const C = ICONOS[nombre] || ICONOS.estrella; return <C size={size} strokeWidth={2} />; };

function Imagen({ src, className = "", alto }) {
  const url = enlaceSeguro(src);
  if (!url) return null;
  return <div className={`bq-marco overflow-hidden ${className}`} style={{ height: alto }}>
    <img src={url} alt="" draggable={false} className="bq-img h-full w-full object-cover" loading="lazy" />
  </div>;
}

function Encabezado({ pagina, claro }) {
  return <div>
    {pagina.kicker && <div className="bq-kicker mb-2 text-[11px] font-bold uppercase tracking-[0.28em]">{pagina.kicker}</div>}
    {pagina.titulo && <h2 className="bq-titulo text-[30px] font-extrabold leading-[1.1]">{pagina.titulo}</h2>}
    <div className="mt-4 h-1 w-14 rounded-full" style={{ background: claro ? "var(--b-primario)" : "var(--b-acento)" }} />
    {pagina.texto && <div className={`mt-4 space-y-3 text-[13px] leading-[1.7] ${claro ? "opacity-75" : "opacity-80"}`}>{parrafos(pagina.texto).map((p, i) => <p key={i}>{p}</p>)}</div>}
  </div>;
}

function Pie({ numero, tema, claro }) {
  return <div className={`absolute inset-x-11 bottom-6 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] ${claro ? "opacity-40" : "opacity-50"}`}>
    <img src={enlaceSeguro(claro ? tema.logo_oscuro : tema.logo)} alt="" className="h-5 w-auto" draggable={false} onError={(e) => { e.currentTarget.style.display = "none"; }} />
    <span>{String(numero).padStart(2, "0")}</span>
  </div>;
}

function Portada({ pagina, tema }) {
  return <div className="bq-oscuro relative h-full overflow-hidden">
    <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--b-acento)" }} />
    <Imagen src={pagina.imagen} alto={360} className="absolute inset-x-0 top-0 opacity-90 [mask-image:linear-gradient(to_bottom,black_45%,transparent)]" />
    <div className="relative flex h-full flex-col justify-end p-11 pb-14">
      <img src={enlaceSeguro(tema.logo)} alt="Logo" className="absolute left-11 top-10 h-11 w-auto drop-shadow-lg" draggable={false} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      {pagina.etiqueta && <div className="bq-acento-bg absolute right-10 top-10 grid h-16 w-16 place-items-center rounded-full text-[13px] font-black shadow-xl">{pagina.etiqueta}</div>}
      {pagina.kicker && <div className="bq-acento-bg mb-5 self-start rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em]">{pagina.kicker}</div>}
      <h1 className="bq-titulo text-[42px] font-extrabold leading-[1.05]">{pagina.titulo} {pagina.destacado && <span style={{ color: "var(--b-acento)" }}>{pagina.destacado}</span>}</h1>
      {pagina.subtitulo && <p className="mt-5 max-w-[400px] text-[14px] leading-[1.7] opacity-80">{pagina.subtitulo}</p>}
      <div className="mt-8 flex gap-2"><span className="h-1.5 w-16 rounded-full" style={{ background: "var(--b-acento)" }} /><span className="h-1.5 w-6 rounded-full bg-white/30" /><span className="h-1.5 w-3 rounded-full bg-white/20" /></div>
    </div>
  </div>;
}

function TextoImagen({ pagina, tema, numero }) {
  const claro = pagina.fondo !== "oscuro";
  const arriba = pagina.posicion_imagen === "arriba";
  const imagen = <Imagen src={pagina.imagen} alto={250} className={`rounded-[22px] shadow-xl ${arriba ? "mb-7" : "mt-7"}`} />;
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative h-full p-11`}>
    {arriba && imagen}
    <Encabezado pagina={pagina} claro={claro} />
    {lineas(pagina.puntos).length > 0 && <ul className="mt-5 space-y-2">
      {lineas(pagina.puntos).map((p, i) => <li key={i} className="bq-cajon flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-medium">
        <span className="bq-icono grid h-6 w-6 shrink-0 place-items-center rounded-full"><Check size={14} strokeWidth={3} /></span>{p}
      </li>)}
    </ul>}
    {!arriba && imagen}
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

function Indice({ pagina, tema, numero, paginas, onIr }) {
  const entradas = paginas.map((p, i) => ({ p, i })).filter(({ p }) => p.tipo !== "portada" && p.tipo !== "indice");
  return <div className="bq-claro relative h-full p-11">
    <Imagen src={pagina.imagen} alto={150} className="mb-7 rounded-[22px] shadow-lg" />
    <h2 className="bq-titulo text-[30px] font-extrabold">{pagina.titulo || "Contenido"}</h2>
    <div className="mt-4 h-1 w-14 rounded-full" style={{ background: "var(--b-primario)" }} />
    <div className="mt-6 grid gap-2">
      {entradas.map(({ p, i }) => <button key={p.id || i} type="button" onClick={(e) => { e.stopPropagation(); onIr?.(i); }}
        className="bq-cajon group flex items-center gap-4 rounded-2xl px-4 py-2.5 text-left">
        <span className="bq-valor text-[20px] font-black tabular-nums">{String(i + 1).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold">{p.titulo}</span>{p.kicker && <span className="bq-suave block truncate text-[10.5px] opacity-50">{p.kicker}</span>}</span>
        <ArrowUpRight size={16} className="opacity-40 transition group-hover:opacity-100" />
      </button>)}
    </div>
    <Pie numero={numero} tema={tema} claro />
  </div>;
}

function Tarjetas({ pagina, tema, numero }) {
  const claro = pagina.fondo !== "oscuro";
  const items = pagina.items || [];
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative h-full p-11`}>
    <Encabezado pagina={pagina} claro={claro} />
    <div className={`mt-7 grid gap-3.5 ${items.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {items.map((it, i) => <div key={i} className="bq-cajon rounded-[20px] p-5">
        <div className="bq-icono mb-4 grid h-11 w-11 place-items-center rounded-2xl"><Icono nombre={it.icono} /></div>
        <div className="text-[14.5px] font-extrabold leading-tight">{it.titulo}</div>
        {it.texto && <p className="bq-suave mt-2 text-[11.5px] leading-[1.6] opacity-70">{it.texto}</p>}
      </div>)}
    </div>
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

function Cifras({ pagina, tema, numero }) {
  const claro = pagina.fondo !== "oscuro";
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative h-full p-11`}>
    <Encabezado pagina={pagina} claro={claro} />
    <div className="mt-7 grid grid-cols-2 gap-3.5">
      {(pagina.items || []).map((it, i) => <div key={i} className="bq-cajon rounded-[20px] p-5">
        <div className="bq-valor bq-titulo text-[32px] font-black leading-none">{it.valor}</div>
        <div className="mt-3 text-[13px] font-bold">{it.titulo}</div>
        {it.texto && <div className="bq-suave mt-1 text-[11px] opacity-60">{it.texto}</div>}
      </div>)}
    </div>
    <Imagen src={pagina.imagen} alto={170} className="mt-7 rounded-[22px] shadow-xl" />
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

function Pasos({ pagina, tema, numero }) {
  const claro = pagina.fondo !== "oscuro";
  const items = pagina.items || [];
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative h-full p-11`}>
    <Encabezado pagina={pagina} claro={claro} />
    <div className="relative mt-8 space-y-3">
      <div className="absolute bottom-6 left-[27px] top-6 w-0.5 opacity-20" style={{ background: claro ? "var(--b-primario)" : "var(--b-acento)" }} />
      {items.map((it, i) => <div key={i} className="bq-cajon relative flex items-start gap-4 rounded-[20px] p-4">
        <span className={`${claro ? "bq-primario-bg" : "bq-acento-bg"} relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-black shadow-lg`}>{i + 1}</span>
        <div className="pt-1"><div className="text-[14px] font-extrabold">{it.titulo}</div>{it.texto && <p className="bq-suave mt-1 text-[11.5px] leading-[1.6] opacity-70">{it.texto}</p>}</div>
      </div>)}
    </div>
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

function Contacto({ pagina, tema }) {
  const boton = pagina.boton || {};
  return <div className="bq-oscuro relative h-full overflow-hidden">
    <Imagen src={pagina.imagen} alto={300} className="absolute inset-x-0 bottom-0 opacity-25 [mask-image:linear-gradient(to_top,black_30%,transparent)]" />
    <div className="absolute -left-20 top-40 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: "var(--b-acento)" }} />
    <div className="relative flex h-full flex-col p-11">
      <img src={enlaceSeguro(tema.logo)} alt="Logo" className="h-11 w-auto self-start" draggable={false} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <div className="mt-auto">
        <Encabezado pagina={pagina} />
        <div className="mt-6 space-y-2.5">
          {(pagina.items || []).map((it, i) => {
            const href = enlaceSeguro(it.enlace);
            const Tag = href ? "a" : "div";
            return <Tag key={i} {...(href ? { href, target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation() } : {})}
              className="bq-cajon flex items-center gap-4 rounded-2xl px-4 py-3">
              <span className="bq-icono grid h-10 w-10 shrink-0 place-items-center rounded-xl"><Icono nombre={it.icono} size={18} /></span>
              <span><span className="bq-suave block text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{it.titulo}</span><span className="block text-[14px] font-bold">{it.texto}</span></span>
            </Tag>;
          })}
        </div>
        {boton.texto && enlaceSeguro(boton.enlace) && <a href={enlaceSeguro(boton.enlace)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="bq-boton bq-acento-bg mt-7 inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-black">{boton.texto}<ArrowUpRight size={18} /></a>}
      </div>
    </div>
  </div>;
}

function Blanca({ tema }) {
  return <div className="bq-oscuro grid h-full place-items-center"><img src={enlaceSeguro(tema.logo)} alt="" className="h-14 w-auto opacity-60" draggable={false} /></div>;
}

const RENDER = { portada: Portada, texto_imagen: TextoImagen, indice: Indice, tarjetas: Tarjetas, cifras: Cifras, pasos: Pasos, contacto: Contacto, blanca: Blanca };

// Una página a su tamaño de diseño, escalada a `ancho` px.
export default function PaginaBrochure({ pagina, tema, numero, paginas, onIr, ancho }) {
  const Render = RENDER[pagina?.tipo] || (TIPOS_PAGINA[pagina?.tipo] ? Blanca : Blanca);
  const escala = ancho / ANCHO;
  return <div className="relative overflow-hidden" style={{ width: ancho, height: ALTO * escala }}>
    <div className="bq-pagina absolute left-0 top-0" style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})`, transformOrigin: "top left" }}>
      <Render pagina={pagina} tema={tema} numero={numero} paginas={paginas} onIr={onIr} />
    </div>
  </div>;
}
