// Elementos libres de una página (estilo Canva): texto, imagen, ícono, forma y
// gráfica. Cada uno tiene posición y tamaño en coordenadas de diseño (560×792).
import React from "react";
import { ICONOS, enlaceSeguro } from "./brochureBase";

export const TIPOS_ELEMENTO = {
  texto: "Texto", imagen: "Imagen", icono: "Ícono", forma: "Forma", grafica: "Gráfica",
};
export const ANIMACIONES_ELEMENTO = {
  ninguna: "Sin animación", aparecer: "Aparecer", subir: "Subir", zoom: "Acercar", latido: "Latido", flotar: "Flotar",
};
export const FORMAS = { rectangulo: "Rectángulo", circulo: "Círculo", linea: "Línea", pildora: "Píldora" };

let contador = 0;
const nuevoId = () => `e${Date.now().toString(36)}${(contador += 1)}`;

export function elementoNuevo(tipo) {
  const base = { id: nuevoId(), tipo, x: 160, y: 300, w: 240, h: 80, rot: 0, opacidad: 100, animacion: "aparecer" };
  if (tipo === "texto") return { ...base, texto: "Escribe aquí", tamano: 26, color: "", negrilla: true, alineacion: "left", fuente: "titulos", h: 70 };
  if (tipo === "imagen") return { ...base, imagen: "/img/brochure/escudo.jpg", w: 220, h: 160, radio: 18 };
  if (tipo === "icono") return { ...base, icono: "escudo", color: "", fondo: true, w: 70, h: 70 };
  if (tipo === "forma") return { ...base, forma: "rectangulo", color: "", radio: 16, w: 200, h: 120, opacidad: 85 };
  if (tipo === "grafica") return { ...base, grafica: "barras", datos: "Fast: 45\nEssencial: 30\nFull: 25", w: 300, h: 200, color: "" };
  return base;
}

export const parsearDatos = (texto) => String(texto || "").split("\n").map((l) => {
  const i = l.lastIndexOf(":");
  if (i < 0) return null;
  const valor = Number(String(l.slice(i + 1)).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(valor) ? { etiqueta: l.slice(0, i).trim(), valor } : null;
}).filter(Boolean).slice(0, 12);

function Grafica({ el, claro }) {
  const datos = parsearDatos(el.datos);
  const colores = [el.color || (claro ? "var(--b-primario)" : "var(--b-acento)"), claro ? "var(--b-acento)" : "#ffffff", "#a78bfa", "#f59e0b", "#38bdf8", "#f472b6"];
  if (!datos.length) return <div className="grid h-full place-items-center text-[11px] opacity-60">Escribe datos: «Etiqueta: valor»</div>;
  if (el.grafica === "dona") {
    const total = datos.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
    let acumulado = 0;
    const r = 15.9155;
    return <div className="flex h-full items-center gap-3">
      <svg viewBox="0 0 42 42" className="h-full max-h-full shrink-0" style={{ aspectRatio: "1" }}>
        {datos.map((d, i) => { const pct = (Math.max(0, d.valor) / total) * 100; const off = 25 - acumulado; acumulado += pct;
          return <circle key={i} cx="21" cy="21" r={r} fill="none" stroke={colores[i % colores.length]} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={off} />; })}
      </svg>
      <div className="min-w-0 space-y-1 text-[11px]">{datos.map((d, i) => <div key={i} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colores[i % colores.length] }} /><span className="truncate">{d.etiqueta}</span><b className="ml-auto pl-2">{d.valor}</b></div>)}</div>
    </div>;
  }
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return <div className="flex h-full items-end gap-2 pb-5">
    {datos.map((d, i) => <div key={i} className="relative flex h-full flex-1 flex-col justify-end">
      <div className="mb-1 text-center text-[11px] font-black">{d.valor}</div>
      <div className="rounded-t-lg" style={{ height: `${Math.max(2, (d.valor / max) * 78)}%`, background: colores[i % 2 === 0 ? 0 : 1], transition: "height .6s" }} />
      <div className="absolute -bottom-5 left-0 right-0 truncate text-center text-[10px] opacity-70">{d.etiqueta}</div>
    </div>)}
  </div>;
}

function Contenido({ el, claro, fuenteTitulos }) {
  const acento = claro ? "var(--b-primario)" : "var(--b-acento)";
  if (el.tipo === "texto") {
    return <div className="h-full w-full whitespace-pre-wrap break-words" style={{
      fontSize: Number(el.tamano) || 24, fontWeight: el.negrilla ? 800 : 400, textAlign: el.alineacion || "left",
      color: el.color || "inherit", lineHeight: 1.2, fontFamily: el.fuente === "titulos" ? fuenteTitulos : undefined,
    }}>{el.texto}</div>;
  }
  if (el.tipo === "imagen") {
    const url = enlaceSeguro(el.imagen);
    return url ? <img src={url} alt="" draggable={false} className="h-full w-full object-cover" style={{ borderRadius: Number(el.radio) || 0 }} />
      : <div className="grid h-full w-full place-items-center rounded-xl border-2 border-dashed border-current text-[11px] opacity-50">Imagen</div>;
  }
  if (el.tipo === "icono") {
    const C = ICONOS[el.icono] || ICONOS.estrella;
    const lado = Math.min(el.w, el.h);
    return <div className="grid h-full w-full place-items-center rounded-[28%]" style={{ background: el.fondo ? `color-mix(in srgb, ${el.color || acento} 16%, transparent)` : "transparent", color: el.color || acento }}>
      <C size={Math.max(12, lado * (el.fondo ? 0.5 : 0.85))} strokeWidth={2} />
    </div>;
  }
  if (el.tipo === "forma") {
    const color = el.color || acento;
    if (el.forma === "linea") return <div className="flex h-full w-full items-center"><div className="w-full rounded-full" style={{ height: Math.max(2, Math.min(el.h, 8)), background: color }} /></div>;
    const radio = el.forma === "circulo" ? "50%" : el.forma === "pildora" ? 9999 : Number(el.radio) || 0;
    return <div className="h-full w-full" style={{ background: color, borderRadius: radio }} />;
  }
  if (el.tipo === "grafica") return <Grafica el={el} claro={claro} />;
  return null;
}

export function EstilosElementos() {
  return <style>{`
    @keyframes bq-el-aparecer { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bq-el-subir { from { opacity: 0; translate: 0 40px; } to { opacity: 1; translate: 0 0; } }
    @keyframes bq-el-zoom { from { opacity: 0; scale: .6; } to { opacity: 1; scale: 1; } }
    @keyframes bq-el-latido { 0%,100% { scale: 1; } 50% { scale: 1.06; } }
    @keyframes bq-el-flotar { 0%,100% { translate: 0 0; } 50% { translate: 0 -8px; } }
  `}</style>;
}

const ANIMACION_CSS = {
  aparecer: "bq-el-aparecer .9s ease both", subir: "bq-el-subir .9s cubic-bezier(.2,.8,.2,1) both", zoom: "bq-el-zoom .8s cubic-bezier(.2,.8,.2,1) both",
  latido: "bq-el-latido 2.4s ease-in-out infinite", flotar: "bq-el-flotar 3.5s ease-in-out infinite",
};

export default function ElementosLibres({ elementos, claro, fuenteTitulos, estatico }) {
  if (!elementos?.length) return null;
  return <>
    <EstilosElementos />
    {elementos.map((el, i) => <div key={el.id || i} data-elemento={el.id} className="absolute" style={{
      left: el.x, top: el.y, width: el.w, height: el.h, zIndex: 20 + i,
      transform: el.rot ? `rotate(${el.rot}deg)` : undefined, opacity: (Number(el.opacidad ?? 100)) / 100,
      color: claro ? "var(--b-texto)" : "#fff",
    }}>
      <div className="h-full w-full" style={{ animation: !estatico && el.animacion && el.animacion !== "ninguna" ? ANIMACION_CSS[el.animacion] : undefined }}>
        <Contenido el={el} claro={claro} fuenteTitulos={fuenteTitulos} />
      </div>
    </div>)}
  </>;
}
