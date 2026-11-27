// Elementos libres de una página (estilo Canva): texto, imagen, ícono, forma y
// gráfica. Cada uno tiene posición y tamaño en coordenadas de diseño (560×792).
import React, { useEffect, useState } from "react";
import { ICONOS, enlaceSeguro } from "./brochureBase";

export const TIPOS_ELEMENTO = {
  texto: "Texto", imagen: "Imagen", icono: "Ícono", forma: "Forma", grafica: "Gráfica",
};
export const ANIMACIONES_ELEMENTO = {
  ninguna: "Sin animación", aparecer: "Aparecer", subir: "Subir", zoom: "Acercar",
  latido: "Latido", flotar: "Flotar", rebotar: "Rebotar", girar: "Girar sin parar", pulso: "Pulso con onda", brillo: "Brillo",
};
export const FORMAS = { rectangulo: "Rectángulo", circulo: "Círculo", linea: "Línea", pildora: "Píldora" };
export const GRAFICAS = { barras: "Barras", barras_h: "Barras horizontales", linea: "Tendencia (línea)", dona: "Dona" };
export const MEZCLAS = {
  normal: "Normal", multiply: "Multiplicar (oscurece)", screen: "Trama (aclara)", overlay: "Superponer",
  "soft-light": "Luz suave", difference: "Diferencia", luminosity: "Luminosidad",
};
export const DESVANECER = { ninguno: "Sin desvanecer", abajo: "Hacia abajo", arriba: "Hacia arriba", bordes: "Bordes suaves", izquierda: "Hacia la izquierda", derecha: "Hacia la derecha" };

let contador = 0;
const nuevoId = () => `e${Date.now().toString(36)}${(contador += 1)}`;

export function elementoNuevo(tipo) {
  const base = { id: nuevoId(), tipo, x: 160, y: 300, w: 240, h: 80, rot: 0, opacidad: 100, animacion: "aparecer" };
  if (tipo === "texto") return { ...base, texto: "Escribe aquí", tamano: 26, color: "", negrilla: true, alineacion: "left", fuente: "titulos", h: 70 };
  if (tipo === "imagen") return { ...base, imagen: "/img/brochure/escudo.jpg", w: 220, h: 160, radio: 18 };
  if (tipo === "icono") return { ...base, icono: "escudo", color: "", fondo: true, w: 70, h: 70, animacion: "pulso" };
  if (tipo === "forma") return { ...base, forma: "rectangulo", color: "", radio: 16, w: 200, h: 120, opacidad: 85 };
  if (tipo === "grafica") return { ...base, grafica: "barras", datos: "2023: 120\n2024: 210\n2025: 340\n2026: 480", titulo_grafica: "", sufijo: "", w: 320, h: 210, color: "" };
  return base;
}

export const parsearDatos = (texto) => String(texto || "").split("\n").map((l) => {
  const i = l.lastIndexOf(":");
  if (i < 0) return null;
  const valor = Number(String(l.slice(i + 1)).replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(valor) ? { etiqueta: l.slice(0, i).trim(), valor } : null;
}).filter(Boolean).slice(0, 12);

const formato = (v, sufijo) => `${Number(v).toLocaleString("es-CO")}${sufijo || ""}`;

// Las gráficas crecen desde cero al aparecer; al pasar el cursor resaltan y muestran el valor.
function useCrecer(estatico, clave) {
  const [listo, setListo] = useState(Boolean(estatico));
  useEffect(() => {
    if (estatico) { setListo(true); return undefined; }
    setListo(false);
    const t = setTimeout(() => setListo(true), 60);
    return () => clearTimeout(t);
  }, [estatico, clave]);
  return listo;
}

function Grafica({ el, claro, estatico }) {
  const datos = parsearDatos(el.datos);
  const [activo, setActivo] = useState(null);
  const listo = useCrecer(estatico, `${el.grafica}|${el.datos}`);
  const principal = el.color || (claro ? "var(--b-primario)" : "var(--b-acento)");
  const secundario = claro ? "var(--b-acento)" : "#ffffff";
  const colores = [principal, secundario, "#a78bfa", "#f59e0b", "#38bdf8", "#f472b6"];
  const transicion = "all .9s cubic-bezier(.2,.8,.2,1)";
  if (!datos.length) return <div className="grid h-full place-items-center text-[11px] opacity-60">Escribe datos: «Etiqueta: valor»</div>;
  const max = Math.max(...datos.map((d) => d.valor), 1);
  const titulo = el.titulo_grafica ? <div className="mb-1 text-[12px] font-extrabold">{el.titulo_grafica}</div> : null;
  const globo = activo != null && <div className="pointer-events-none absolute right-1 top-0 z-10 rounded-lg px-2 py-1 text-[11px] font-black shadow-lg" style={{ background: principal, color: claro ? "#fff" : "var(--b-oscuro)" }}>
    {datos[activo].etiqueta}: {formato(datos[activo].valor, el.sufijo)}
  </div>;

  if (el.grafica === "dona") {
    const total = datos.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
    let acumulado = 0;
    return <div className="relative flex h-full flex-col">{titulo}{globo}
      <div className="flex min-h-0 flex-1 items-center gap-3">
        <svg viewBox="0 0 42 42" className="h-full max-h-full shrink-0" style={{ aspectRatio: "1", transform: "rotate(-90deg)" }}>
          {datos.map((d, i) => {
            const pct = (Math.max(0, d.valor) / total) * 100;
            const off = -acumulado;
            acumulado += pct;
            return <circle key={i} cx="21" cy="21" r="15.9155" fill="none" stroke={colores[i % colores.length]} strokeWidth={activo === i ? 8 : 6}
              strokeDasharray={`${listo ? pct : 0} ${100 - (listo ? pct : 0)}`} strokeDashoffset={off}
              style={{ transition: transicion, cursor: "pointer" }} onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)} />;
          })}
        </svg>
        <div className="min-w-0 space-y-1 text-[11px]">{datos.map((d, i) => <div key={i} onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)}
          className="flex cursor-pointer items-center gap-1.5 rounded px-1" style={{ background: activo === i ? "rgba(127,127,127,.15)" : undefined }}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colores[i % colores.length] }} /><span className="truncate">{d.etiqueta}</span><b className="ml-auto pl-2">{formato(d.valor, el.sufijo)}</b></div>)}</div>
      </div>
    </div>;
  }

  if (el.grafica === "barras_h") {
    return <div className="relative flex h-full flex-col">{titulo}{globo}
      <div className="flex min-h-0 flex-1 flex-col justify-around gap-1">
        {datos.map((d, i) => <div key={i} className="flex cursor-pointer items-center gap-2" onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)}>
          <span className="w-16 shrink-0 truncate text-right text-[10px] opacity-75">{d.etiqueta}</span>
          <div className="relative h-full max-h-6 min-h-[8px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(127,127,127,.15)" }}>
            <div className="h-full rounded-full" style={{ width: `${listo ? Math.max(2, (d.valor / max) * 100) : 0}%`, background: activo === i ? secundario : principal, transition: transicion, transitionDelay: `${i * 70}ms` }} />
          </div>
          <span className="w-12 shrink-0 text-[10px] font-black">{formato(d.valor, el.sufijo)}</span>
        </div>)}
      </div>
    </div>;
  }

  if (el.grafica === "linea") {
    const W = 300; const H = 120; const n = datos.length;
    const px = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * (W - 16) + 8);
    const py = (v) => H - 10 - (v / max) * (H - 26);
    const puntos = datos.map((d, i) => `${px(i)},${py(d.valor)}`).join(" ");
    const area = `8,${H - 10} ${puntos} ${px(n - 1)},${H - 10}`;
    return <div className="relative flex h-full flex-col">{titulo}{globo}
      <svg viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" className="min-h-0 w-full flex-1 overflow-visible">
        <defs><linearGradient id={`g-${el.id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={principal} stopOpacity=".45" /><stop offset="100%" stopColor={principal} stopOpacity="0" /></linearGradient></defs>
        <polygon points={area} fill={`url(#g-${el.id})`} style={{ opacity: listo ? 1 : 0, transition: "opacity 1.2s" }} />
        <polyline points={puntos} fill="none" stroke={principal} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: listo ? 0 : 1, transition: "stroke-dashoffset 1.4s cubic-bezier(.2,.8,.2,1)" }} />
        {datos.map((d, i) => <g key={i} onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)} style={{ cursor: "pointer" }}>
          <circle cx={px(i)} cy={py(d.valor)} r="14" fill="transparent" />
          <circle cx={px(i)} cy={py(d.valor)} r={activo === i ? 6 : 4} fill={activo === i ? secundario : principal} stroke="#fff" strokeWidth="1.5" style={{ transition: "r .2s", opacity: listo ? 1 : 0 }} />
          <text x={px(i)} y={H + 10} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".7">{d.etiqueta}</text>
        </g>)}
      </svg>
    </div>;
  }

  return <div className="relative flex h-full flex-col">{titulo}{globo}
    <div className="flex min-h-0 flex-1 items-end gap-2 pb-5">
      {datos.map((d, i) => <div key={i} className="relative flex h-full flex-1 cursor-pointer flex-col justify-end" onMouseEnter={() => setActivo(i)} onMouseLeave={() => setActivo(null)}>
        <div className="mb-1 text-center text-[11px] font-black" style={{ opacity: listo ? 1 : 0, transition: "opacity .6s", transitionDelay: `${300 + i * 80}ms` }}>{formato(d.valor, el.sufijo)}</div>
        <div className="rounded-t-lg" style={{
          height: listo ? `${Math.max(2, (d.valor / max) * 78)}%` : "0%", background: activo === i ? secundario : colores[i % 2 === 0 ? 0 : 1],
          transition: transicion, transitionDelay: `${i * 80}ms`, transform: activo === i ? "scaleY(1.04)" : undefined, transformOrigin: "bottom",
        }} />
        <div className="absolute -bottom-5 left-0 right-0 truncate text-center text-[10px] opacity-70">{d.etiqueta}</div>
      </div>)}
    </div>
  </div>;
}

const MASCARA = {
  abajo: "linear-gradient(to bottom, black 45%, transparent)", arriba: "linear-gradient(to top, black 45%, transparent)",
  izquierda: "linear-gradient(to left, black 45%, transparent)", derecha: "linear-gradient(to right, black 45%, transparent)",
  bordes: "radial-gradient(ellipse at center, black 45%, transparent 75%)",
};

function filtroImagen(el) {
  const partes = [];
  if (Number(el.desenfoque)) partes.push(`blur(${Number(el.desenfoque)}px)`);
  if (el.brillo != null && Number(el.brillo) !== 100) partes.push(`brightness(${Number(el.brillo)}%)`);
  if (el.contraste != null && Number(el.contraste) !== 100) partes.push(`contrast(${Number(el.contraste)}%)`);
  if (Number(el.gris)) partes.push(`grayscale(${Number(el.gris)}%)`);
  return partes.join(" ") || undefined;
}

function Contenido({ el, claro, fuenteTitulos, estatico }) {
  const acento = claro ? "var(--b-primario)" : "var(--b-acento)";
  if (el.tipo === "texto") {
    const relleno = el.relleno_imagen && enlaceSeguro(el.relleno_imagen);
    return <div className="h-full w-full whitespace-pre-wrap break-words" style={{
      fontSize: Number(el.tamano) || 24, fontWeight: el.negrilla ? 800 : 400, textAlign: el.alineacion || "left",
      color: relleno ? "transparent" : el.color || "inherit", lineHeight: 1.15, fontFamily: el.fuente === "titulos" ? fuenteTitulos : undefined,
      textShadow: el.resplandor ? `0 0 ${Math.round((Number(el.tamano) || 24) / 2)}px ${el.color || acento}` : undefined,
      ...(relleno ? { backgroundImage: `url("${relleno.replace(/"/g, "%22")}")`, backgroundSize: "cover", backgroundPosition: "center", WebkitBackgroundClip: "text", backgroundClip: "text" } : {}),
    }}>{el.texto}</div>;
  }
  if (el.tipo === "imagen") {
    const url = enlaceSeguro(el.imagen);
    const mascara = MASCARA[el.desvanecer];
    return url ? <img src={url} alt="" draggable={false} className="h-full w-full object-cover" style={{
      borderRadius: Number(el.radio) || 0, filter: filtroImagen(el),
      WebkitMaskImage: mascara, maskImage: mascara,
    }} />
      : <div className="grid h-full w-full place-items-center rounded-xl border-2 border-dashed border-current text-[11px] opacity-50">Imagen</div>;
  }
  if (el.tipo === "icono") {
    const C = ICONOS[el.icono] || ICONOS.estrella;
    const lado = Math.min(el.w, el.h);
    const color = el.color || acento;
    return <div className="relative grid h-full w-full place-items-center rounded-[28%]" style={{ background: el.fondo ? `color-mix(in srgb, ${color} 16%, transparent)` : "transparent", color }}>
      {el.animacion === "pulso" && !estatico && <span className="absolute inset-0 rounded-[28%]" style={{ border: `2px solid ${color}`, animation: "bq-el-onda 1.8s ease-out infinite" }} />}
      <C size={Math.max(12, lado * (el.fondo ? 0.5 : 0.85))} strokeWidth={2} />
    </div>;
  }
  if (el.tipo === "forma") {
    const color = el.color || acento;
    if (el.forma === "linea") return <div className="flex h-full w-full items-center"><div className="w-full rounded-full" style={{ height: Math.max(2, Math.min(el.h, 8)), background: color }} /></div>;
    const radio = el.forma === "circulo" ? "50%" : el.forma === "pildora" ? 9999 : Number(el.radio) || 0;
    return <div className="h-full w-full" style={{ background: color, borderRadius: radio, filter: Number(el.desenfoque) ? `blur(${Number(el.desenfoque)}px)` : undefined }} />;
  }
  if (el.tipo === "grafica") return <Grafica el={el} claro={claro} estatico={estatico} />;
  return null;
}

export function EstilosElementos() {
  return <style>{`
    @keyframes bq-el-aparecer { from { opacity: 0; } to { opacity: 1; } }
    @keyframes bq-el-subir { from { opacity: 0; translate: 0 40px; } to { opacity: 1; translate: 0 0; } }
    @keyframes bq-el-zoom { from { opacity: 0; scale: .6; } to { opacity: 1; scale: 1; } }
    @keyframes bq-el-latido { 0%,100% { scale: 1; } 50% { scale: 1.06; } }
    @keyframes bq-el-flotar { 0%,100% { translate: 0 0; } 50% { translate: 0 -8px; } }
    @keyframes bq-el-rebotar { 0%,100% { translate: 0 0; } 30% { translate: 0 -14px; } 50% { translate: 0 0; } 65% { translate: 0 -6px; } 80% { translate: 0 0; } }
    @keyframes bq-el-girar { to { rotate: 360deg; } }
    @keyframes bq-el-brillo { 0%,100% { filter: drop-shadow(0 0 0 transparent); } 50% { filter: drop-shadow(0 0 10px currentColor); } }
    @keyframes bq-el-onda { from { scale: 1; opacity: .8; } to { scale: 1.7; opacity: 0; } }
  `}</style>;
}

const ANIMACION_CSS = {
  aparecer: "bq-el-aparecer .9s ease both", subir: "bq-el-subir .9s cubic-bezier(.2,.8,.2,1) both", zoom: "bq-el-zoom .8s cubic-bezier(.2,.8,.2,1) both",
  latido: "bq-el-latido 2.4s ease-in-out infinite", flotar: "bq-el-flotar 3.5s ease-in-out infinite", rebotar: "bq-el-rebotar 2s ease-in-out infinite",
  girar: "bq-el-girar 6s linear infinite", brillo: "bq-el-brillo 2.2s ease-in-out infinite", pulso: "bq-el-latido 1.8s ease-in-out infinite",
};

export default function ElementosLibres({ elementos, claro, fuenteTitulos, estatico }) {
  if (!elementos?.length) return null;
  return <>
    <EstilosElementos />
    {elementos.map((el, i) => <div key={el.id || i} data-elemento={el.id} className="absolute" style={{
      left: el.x, top: el.y, width: el.w, height: el.h, zIndex: 20 + i,
      transform: el.rot ? `rotate(${el.rot}deg)` : undefined, opacity: (Number(el.opacidad ?? 100)) / 100,
      color: claro ? "var(--b-texto)" : "#fff", mixBlendMode: el.mezcla && el.mezcla !== "normal" ? el.mezcla : undefined,
    }}>
      <div className="h-full w-full" style={{ animation: !estatico && el.animacion && el.animacion !== "ninguna" ? ANIMACION_CSS[el.animacion] : undefined }}>
        <Contenido el={el} claro={claro} fuenteTitulos={fuenteTitulos} estatico={estatico} />
      </div>
    </div>)}
  </>;
}
