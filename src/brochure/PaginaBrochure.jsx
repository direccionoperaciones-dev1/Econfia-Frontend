import React, { createContext, useContext, useMemo } from "react";
import { ArrowUpRight, Check, Pencil } from "lucide-react";
import { FUENTES, ICONOS, enlaceSeguro } from "./brochureBase";
import { ALTO, ANCHO } from "./medidas";
import { FondoAnimado, FondoBase } from "./Fondos";
import ElementosLibres from "./Elementos";

export { ALTO, ANCHO };

// Ajustes de posición/tamaño que se hacen arrastrando en el lienzo: {clave: {x, y, s}}.
// Se aplican con `translate`/`scale` (no `transform`) para no pisar el efecto hover.
const AjustesCtx = createContext({});
export const claveAjuste = (campo, item) => (item != null ? `${campo}.${item}` : campo);
function useAj() {
  const ajustes = useContext(AjustesCtx);
  return (campo, item) => {
    const a = ajustes?.[claveAjuste(campo, item)];
    if (!a) return undefined;
    return {
      translate: `${Number(a.x) || 0}px ${Number(a.y) || 0}px`, scale: String(Number(a.s) || 1),
      rotate: a.r ? `${Number(a.r)}deg` : undefined, transformOrigin: a.r ? "center" : "top left",
    };
  };
}

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
    /* Modo edición: todo lo que se puede tocar se marca al pasar el cursor. */
    .bq-editable [data-campo] { cursor: pointer; }
    .bq-editable [data-campo]:hover { outline: 2px dashed var(--b-acento); outline-offset: 4px; border-radius: 10px; }
    .bq-editable .bq-lapiz { opacity: 0; transition: opacity .2s; }
    .bq-editable:hover .bq-lapiz { opacity: 1; }
  `}</style>;
}

const parrafos = (texto) => String(texto || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
const lineas = (texto) => String(texto || "").split("\n").map((p) => p.trim()).filter(Boolean);
const Icono = ({ nombre, size = 22 }) => { const C = ICONOS[nombre] || ICONOS.estrella; return <C size={size} strokeWidth={2} />; };

// ---------- Adornos (marca de agua) ----------
function aleatorio(semilla) {
  let s = (semilla * 9301 + 49297) % 233280 || 1;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function Adorno({ tipo, intensidad = 35, semilla = 1, claro }) {
  const color = claro ? "var(--b-primario)" : "var(--b-acento)";
  const contenido = useMemo(() => {
    const r = aleatorio(semilla + 7);
    if (tipo === "constelaciones") {
      const puntos = Array.from({ length: 16 }, () => [30 + r() * 500, 30 + r() * 730, 1.2 + r() * 2.4]);
      const lineasC = [];
      puntos.forEach((p, i) => {
        const cercanos = puntos.map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2);
        cercanos.forEach(([j, d]) => { if (d < 190 && i < j) lineasC.push([p, puntos[j]]); });
      });
      return <>
        {lineasC.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth="0.8" strokeOpacity="0.55" />)}
        {puntos.map(([x, y, rad], i) => <g key={i}><circle cx={x} cy={y} r={rad * 2.6} fill={color} opacity="0.18" /><circle cx={x} cy={y} r={rad} fill={color} /></g>)}
      </>;
    }
    if (tipo === "puntos") {
      return Array.from({ length: 12 * 9 }, (_, i) => <circle key={i} cx={330 + (i % 9) * 24} cy={30 + Math.floor(i / 9) * 24} r="2.2" fill={color} opacity={0.25 + ((i % 9) / 9) * 0.6} />);
    }
    if (tipo === "ondas") {
      return Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${640 + i * 22} C 140 ${600 + i * 22}, 280 ${690 + i * 22}, 560 ${630 + i * 22}`} fill="none" stroke={color} strokeWidth="1.4" opacity={0.9 - i * 0.12} />);
    }
    if (tipo === "lineas") {
      return Array.from({ length: 14 }, (_, i) => <line key={i} x1={300 + i * 26} y1="0" x2={560} y2={260 - i * 26 + 260} stroke={color} strokeWidth="1" opacity="0.7" />);
    }
    if (tipo === "circulos") {
      return Array.from({ length: 6 }, (_, i) => <circle key={i} cx="540" cy="40" r={50 + i * 42} fill="none" stroke={color} strokeWidth="1.2" opacity={0.9 - i * 0.12} />);
    }
    return null;
  }, [tipo, semilla, color]);
  if (!contenido) return null;
  return <svg aria-hidden="true" viewBox={`0 0 ${ANCHO} ${ALTO}`} className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: -1, opacity: Math.max(0, Math.min(100, intensidad)) / 100 }}>{contenido}</svg>;
}

// ---------- Piezas ----------
function Imagen({ src, className = "", alto, campo = "imagen" }) {
  const aj = useAj();
  const url = enlaceSeguro(src);
  if (!url) return null;
  return <div data-campo={campo} className={`bq-marco overflow-hidden ${className}`} style={{ height: alto, ...aj(campo) }}>
    <img src={url} alt="" draggable={false} className="bq-img h-full w-full object-cover" loading="lazy" />
  </div>;
}

function Logo({ src, className }) {
  const aj = useAj();
  const url = enlaceSeguro(src);
  if (!url) return null;
  return <img src={url} alt="Logo" data-campo="logo" className={className} style={aj("logo")} draggable={false} onError={(e) => { e.currentTarget.style.display = "none"; }} />;
}

function Encabezado({ pagina, claro }) {
  const aj = useAj();
  return <div>
    {pagina.kicker && <div data-campo="kicker" style={aj("kicker")} className="bq-kicker mb-2 text-[11px] font-bold uppercase tracking-[0.28em]">{pagina.kicker}</div>}
    {pagina.titulo && <h2 data-campo="titulo" style={aj("titulo")} className="bq-titulo text-[30px] font-extrabold leading-[1.1]">{pagina.titulo}</h2>}
    <div className="mt-4 h-1 w-14 rounded-full" style={{ background: claro ? "var(--b-primario)" : "var(--b-acento)" }} />
    {pagina.texto && <div data-campo="texto" style={aj("texto")} className={`mt-4 space-y-3 text-[13px] leading-[1.7] ${claro ? "opacity-75" : "opacity-80"}`}>{parrafos(pagina.texto).map((p, i) => <p key={i}>{p}</p>)}</div>}
  </div>;
}

function Pie({ numero, tema, claro }) {
  return <div className={`absolute inset-x-11 bottom-6 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] ${claro ? "opacity-40" : "opacity-50"}`}>
    <Logo src={claro ? tema.logo_oscuro : tema.logo} className="h-5 w-auto" />
    <span>{String(numero).padStart(2, "0")}</span>
  </div>;
}

// ---------- Tipos de página ----------
function Portada({ pagina, tema, adorno }) {
  const aj = useAj();
  return <div className="bq-oscuro relative isolate h-full overflow-hidden">
    {adorno}
    <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--b-acento)", zIndex: -1 }} />
    <Imagen src={pagina.imagen} alto={360} className="absolute inset-x-0 top-0 opacity-90 [mask-image:linear-gradient(to_bottom,black_45%,transparent)]" />
    <div className="relative flex h-full flex-col justify-end p-11 pb-14">
      <Logo src={tema.logo} className="absolute left-11 top-10 h-11 w-auto drop-shadow-lg" />
      {pagina.etiqueta && <div data-campo="etiqueta" style={aj("etiqueta")} className="bq-acento-bg absolute right-10 top-10 grid h-16 w-16 place-items-center rounded-full text-[13px] font-black shadow-xl">{pagina.etiqueta}</div>}
      {pagina.kicker && <div data-campo="kicker" style={aj("kicker")} className="bq-acento-bg mb-5 self-start rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em]">{pagina.kicker}</div>}
      <h1 data-campo="titulo" style={aj("titulo")} className="bq-titulo text-[42px] font-extrabold leading-[1.05]">{pagina.titulo} {pagina.destacado && <span data-campo="destacado" style={{ color: "var(--b-acento)" }}>{pagina.destacado}</span>}</h1>
      {pagina.subtitulo && <p data-campo="subtitulo" style={aj("subtitulo")} className="mt-5 max-w-[400px] text-[14px] leading-[1.7] opacity-80">{pagina.subtitulo}</p>}
      <div className="mt-8 flex gap-2"><span className="h-1.5 w-16 rounded-full" style={{ background: "var(--b-acento)" }} /><span className="h-1.5 w-6 rounded-full bg-white/30" /><span className="h-1.5 w-3 rounded-full bg-white/20" /></div>
    </div>
  </div>;
}

function TextoImagen({ pagina, tema, numero, adorno }) {
  const aj = useAj();
  const claro = pagina.fondo !== "oscuro";
  const arriba = pagina.posicion_imagen === "arriba";
  const imagen = <Imagen src={pagina.imagen} alto={250} className={`rounded-[22px] shadow-xl ${arriba ? "mb-7" : "mt-7"}`} />;
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative isolate h-full p-11`}>
    {adorno}
    {arriba && imagen}
    <Encabezado pagina={pagina} claro={claro} />
    {lineas(pagina.puntos).length > 0 && <ul data-campo="puntos" style={aj("puntos")} className="mt-5 space-y-2">
      {lineas(pagina.puntos).map((p, i) => <li key={i} className="bq-cajon flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-medium">
        <span className="bq-icono grid h-6 w-6 shrink-0 place-items-center rounded-full"><Check size={14} strokeWidth={3} /></span>{p}
      </li>)}
    </ul>}
    {!arriba && imagen}
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

// Páginas que salen en el índice (las que no son portada/índice y no se ocultaron).
export const entradasIndice = (paginas) => paginas.map((p, i) => ({ p, i }))
  .filter(({ p }) => p.tipo !== "portada" && p.tipo !== "indice" && p.tipo !== "blanca" && p.en_indice !== false);

function Indice({ pagina, tema, numero, paginas, onIr, adorno }) {
  const aj = useAj();
  const entradas = entradasIndice(paginas);
  // Se acomoda al espacio: con muchas páginas las líneas se compactan y, si no cabe, se quita la imagen.
  const n = Math.max(1, entradas.length);
  const conImagen = Boolean(enlaceSeguro(pagina.imagen)) && n <= 8;
  const disponible = conImagen ? 400 : 580;
  const alto = Math.max(26, Math.min(54, Math.floor(disponible / n) - 7));
  const conSubtitulo = alto >= 44;
  return <div className="bq-claro relative isolate h-full p-11">
    {adorno}
    {conImagen && <Imagen src={pagina.imagen} alto={150} className="mb-7 rounded-[22px] shadow-lg" />}
    <h2 data-campo="titulo" style={aj("titulo")} className="bq-titulo text-[30px] font-extrabold">{pagina.titulo || "Contenido"}</h2>
    <div className="mt-4 h-1 w-14 rounded-full" style={{ background: "var(--b-primario)" }} />
    <div data-campo="lista" style={aj("lista")} className="mt-6 grid" >
      <div className="grid" style={{ gap: alto >= 44 ? 8 : 5 }}>
        {entradas.map(({ p, i }, k) => <button key={p.id || i} type="button" data-campo="indice" data-item={k} onClick={(e) => { e.stopPropagation(); onIr?.(i); }}
          className="bq-cajon group flex items-center gap-4 rounded-2xl px-4 text-left" style={{ height: alto, ...aj("indice", k) }}>
          <span className="bq-valor font-black tabular-nums" style={{ fontSize: Math.min(20, Math.round(alto * 0.42)) }}>{String(i + 1).padStart(2, "0")}</span>
          <span className="min-w-0 flex-1"><span className="block truncate font-bold" style={{ fontSize: alto >= 40 ? 13 : 12 }}>{p.titulo}</span>{conSubtitulo && p.kicker && <span className="bq-suave block truncate text-[10.5px] opacity-50">{p.kicker}</span>}</span>
          <ArrowUpRight size={alto >= 40 ? 16 : 13} className="opacity-40 transition group-hover:opacity-100" />
        </button>)}
      </div>
    </div>
    <Pie numero={numero} tema={tema} claro />
  </div>;
}

function Tarjetas({ pagina, tema, numero, adorno }) {
  const aj = useAj();
  const claro = pagina.fondo !== "oscuro";
  const items = pagina.items || [];
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative isolate h-full p-11`}>
    {adorno}
    <Encabezado pagina={pagina} claro={claro} />
    <div className={`mt-7 grid gap-3.5 ${items.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {items.map((it, i) => <div key={i} data-campo="items" data-item={i} style={aj("items", i)} className="bq-cajon rounded-[20px] p-5">
        <div className="bq-icono mb-4 grid h-11 w-11 place-items-center rounded-2xl"><Icono nombre={it.icono} /></div>
        <div className="text-[14.5px] font-extrabold leading-tight">{it.titulo}</div>
        {it.texto && <p className="bq-suave mt-2 text-[11.5px] leading-[1.6] opacity-70">{it.texto}</p>}
      </div>)}
    </div>
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

function Cifras({ pagina, tema, numero, adorno }) {
  const aj = useAj();
  const claro = pagina.fondo !== "oscuro";
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative isolate h-full p-11`}>
    {adorno}
    <Encabezado pagina={pagina} claro={claro} />
    <div className="mt-7 grid grid-cols-2 gap-3.5">
      {(pagina.items || []).map((it, i) => <div key={i} data-campo="items" data-item={i} style={aj("items", i)} className="bq-cajon rounded-[20px] p-5">
        <div className="bq-valor bq-titulo text-[32px] font-black leading-none">{it.valor}</div>
        <div className="mt-3 text-[13px] font-bold">{it.titulo}</div>
        {it.texto && <div className="bq-suave mt-1 text-[11px] opacity-60">{it.texto}</div>}
      </div>)}
    </div>
    <Imagen src={pagina.imagen} alto={170} className="mt-7 rounded-[22px] shadow-xl" />
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

function Pasos({ pagina, tema, numero, adorno }) {
  const aj = useAj();
  const claro = pagina.fondo !== "oscuro";
  const items = pagina.items || [];
  return <div className={`${claro ? "bq-claro" : "bq-oscuro"} relative isolate h-full p-11`}>
    {adorno}
    <Encabezado pagina={pagina} claro={claro} />
    <div className="relative mt-8 space-y-3">
      <div className="absolute bottom-6 left-[27px] top-6 w-0.5 opacity-20" style={{ background: claro ? "var(--b-primario)" : "var(--b-acento)" }} />
      {items.map((it, i) => <div key={i} data-campo="items" data-item={i} style={aj("items", i)} className="bq-cajon relative flex items-start gap-4 rounded-[20px] p-4">
        <span className={`${claro ? "bq-primario-bg" : "bq-acento-bg"} relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-black shadow-lg`}>{i + 1}</span>
        <div className="pt-1"><div className="text-[14px] font-extrabold">{it.titulo}</div>{it.texto && <p className="bq-suave mt-1 text-[11.5px] leading-[1.6] opacity-70">{it.texto}</p>}</div>
      </div>)}
    </div>
    <Pie numero={numero} tema={tema} claro={claro} />
  </div>;
}

function Contacto({ pagina, tema, adorno, editable }) {
  const aj = useAj();
  const boton = pagina.boton || {};
  return <div className="bq-oscuro relative isolate h-full overflow-hidden">
    {adorno}
    <Imagen src={pagina.imagen} alto={300} className="absolute inset-x-0 bottom-0 opacity-25 [mask-image:linear-gradient(to_top,black_30%,transparent)]" />
    <div className="absolute -left-20 top-40 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: "var(--b-acento)", zIndex: -1 }} />
    <div className="relative flex h-full flex-col p-11">
      <Logo src={tema.logo} className="h-11 w-auto self-start" />
      <div className="mt-auto">
        <Encabezado pagina={pagina} />
        <div className="mt-6 space-y-2.5">
          {(pagina.items || []).map((it, i) => {
            const href = editable ? "" : enlaceSeguro(it.enlace);
            const Tag = href ? "a" : "div";
            return <Tag key={i} data-campo="items" data-item={i} style={aj("items", i)} {...(href ? { href, target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation() } : {})}
              className="bq-cajon flex items-center gap-4 rounded-2xl px-4 py-3">
              <span className="bq-icono grid h-10 w-10 shrink-0 place-items-center rounded-xl"><Icono nombre={it.icono} size={18} /></span>
              <span><span className="bq-suave block text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{it.titulo}</span><span className="block text-[14px] font-bold">{it.texto}</span></span>
            </Tag>;
          })}
        </div>
        {boton.texto && enlaceSeguro(boton.enlace) && <a data-campo="boton" style={aj("boton")} href={editable ? undefined : enlaceSeguro(boton.enlace)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="bq-boton bq-acento-bg mt-7 inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-black">{boton.texto}<ArrowUpRight size={18} /></a>}
      </div>
    </div>
  </div>;
}

function Blanca({ tema, adorno }) {
  return <div className="bq-oscuro relative isolate grid h-full place-items-center">{adorno}<Logo src={tema.logo} className="h-14 w-auto opacity-60" /></div>;
}

const RENDER = { portada: Portada, texto_imagen: TextoImagen, indice: Indice, tarjetas: Tarjetas, cifras: Cifras, pasos: Pasos, contacto: Contacto, blanca: Blanca };
const OSCURAS = new Set(["portada", "contacto", "blanca"]);

/**
 * Una página a su tamaño de diseño, escalada a `ancho` px.
 * Con `onEditar`, cada parte marcada con data-campo abre su campo en el editor.
 */
export default function PaginaBrochure({ pagina, tema, numero, paginas, onIr, ancho, onEditar, indice, estatico }) {
  const Render = RENDER[pagina?.tipo] || Blanca;
  const escala = ancho / ANCHO;
  const tipoAdorno = pagina?.adorno && pagina.adorno !== "general" ? pagina.adorno : tema.adorno;
  const claro = !OSCURAS.has(pagina?.tipo) && pagina?.fondo !== "oscuro";
  // Capas de fondo (de atrás hacia adelante): base, animación y adorno.
  const adorno = <>
    <FondoBase pagina={pagina || {}} />
    <FondoAnimado tipo={pagina?.animacion_fondo} claro={claro} intensidad={Number(pagina?.animacion_intensidad ?? 60)} estatico={estatico} semilla={numero || 1} />
    {tipoAdorno && tipoAdorno !== "ninguno" && <Adorno tipo={tipoAdorno} intensidad={Number(tema.adorno_intensidad ?? 35)} semilla={numero || 1} claro={claro} />}
  </>;
  const editable = Boolean(onEditar);
  const alClic = editable ? (e) => {
    if (pagina?.tipo === "blanca") return;
    const el = e.target.closest?.("[data-campo]");
    e.stopPropagation();
    onEditar(indice ?? (numero - 1), el?.getAttribute("data-campo") || null, el?.hasAttribute("data-item") ? Number(el.getAttribute("data-item")) : null);
  } : undefined;
  return <div className={`relative overflow-hidden ${editable ? "bq-editable" : ""}`} style={{ width: ancho, height: ALTO * escala }} onClick={alClic}>
    <div className="bq-pagina absolute left-0 top-0" style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})`, transformOrigin: "top left" }}>
      <AjustesCtx.Provider value={pagina?.ajustes || {}}>
        <Render pagina={pagina} tema={tema} numero={numero} paginas={paginas} onIr={onIr} adorno={adorno} editable={editable} />
      </AjustesCtx.Provider>
      <ElementosLibres elementos={pagina?.elementos} claro={claro} fuenteTitulos={FUENTES[tema.fuente_titulos] || FUENTES.Poppins} estatico={estatico} />
    </div>
    {editable && pagina?.tipo !== "blanca" && <div className="bq-lapiz pointer-events-none absolute z-10 flex items-center rounded-full bg-black/70 text-white shadow-lg"
      style={{ left: 8, bottom: 8, gap: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700, lineHeight: "14px", whiteSpace: "nowrap" }}>
      <Pencil size={10} /> Clic para editar
    </div>}
  </div>;
}
