// Capas de fondo de una página: base (color, degradado o imagen) y animación
// (constelaciones, meteoros, mundo girando, burbujas). Van detrás del contenido.
import React, { useEffect, useRef } from "react";
import { ALTO, ANCHO } from "./medidas";
import { enlaceSeguro } from "./brochureBase";

export const FONDOS_BASE = { plantilla: "El de la plantilla", color: "Color sólido", degradado: "Degradado", imagen: "Imagen" };
export const FONDOS_ANIMADOS = {
  ninguna: "Sin animación", constelaciones: "Constelaciones en movimiento", meteoros: "Lluvia de meteoros",
  mundo: "Mundo girando", burbujas: "Burbujas de luz",
};

const urlCss = (u) => `url("${String(u).replace(/"/g, "%22")}")`;

export function FondoBase({ pagina }) {
  const tipo = pagina.fondo_base || "plantilla";
  if (tipo === "plantilla") return null;
  let estilo = null;
  if (tipo === "color") estilo = { background: pagina.fondo_color || "#ffffff" };
  if (tipo === "degradado") estilo = { background: `linear-gradient(${Number(pagina.fondo_angulo ?? 160)}deg, ${pagina.fondo_color || "#2c1470"}, ${pagina.fondo_color2 || "#0d0724"})` };
  if (tipo === "imagen") {
    const url = enlaceSeguro(pagina.fondo_imagen);
    if (!url) return null;
    estilo = { backgroundImage: urlCss(url), backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (!estilo) return null;
  const oscurecer = tipo === "imagen" ? Math.max(0, Math.min(90, Number(pagina.fondo_oscurecer ?? 45))) / 100 : 0;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ ...estilo, zIndex: -3 }}>
    {oscurecer > 0 && <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${oscurecer})` }} />}
  </div>;
}

// Lienzo animado a ~30 fps. `estatico` dibuja un solo cuadro (miniaturas).
function useLienzo(dibujar, estatico, deps) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext?.("2d");
    if (!ctx) return undefined;
    let id = null;
    let ultimo = 0;
    let t = 0;
    const paso = (ahora) => {
      if (ahora - ultimo > 33) { ultimo = ahora; t += 1; ctx.clearRect(0, 0, ANCHO, ALTO); dibujar(ctx, t); }
      id = requestAnimationFrame(paso);
    };
    if (estatico || typeof requestAnimationFrame === "undefined") { dibujar(ctx, 40); return undefined; }
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estatico, ...deps]);
  return ref;
}

function semillas(n, semilla) {
  let s = semilla * 9301 + 49297;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return Array.from({ length: n }, () => [r(), r(), r(), r()]);
}

function Constelaciones({ color, estatico, semilla }) {
  const puntos = useRef(semillas(46, semilla).map(([a, b, c, d]) => ({ x: a * ANCHO, y: b * ALTO, vx: (c - 0.5) * 0.6, vy: (d - 0.5) * 0.6 })));
  const ref = useLienzo((ctx) => {
    const ps = puntos.current;
    ps.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > ANCHO) p.vx *= -1;
      if (p.y < 0 || p.y > ALTO) p.vy *= -1;
    });
    ctx.strokeStyle = color; ctx.fillStyle = color;
    for (let i = 0; i < ps.length; i += 1) {
      for (let j = i + 1; j < ps.length; j += 1) {
        const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
        if (d < 110) { ctx.globalAlpha = (1 - d / 110) * 0.7; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;
    ps.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill(); });
  }, estatico, [color]);
  return <canvas ref={ref} width={ANCHO} height={ALTO} className="h-full w-full" />;
}

function Mundo({ color, estatico }) {
  // Esfera de puntos (latitud/longitud) que gira sobre su eje.
  const puntos = useRef((() => {
    const lista = [];
    for (let lat = -80; lat <= 80; lat += 10) {
      const anillo = Math.max(6, Math.round(36 * Math.cos((lat * Math.PI) / 180)));
      for (let k = 0; k < anillo; k += 1) lista.push([(lat * Math.PI) / 180, (k / anillo) * Math.PI * 2]);
    }
    return lista;
  })());
  const ref = useLienzo((ctx, t) => {
    const cx = ANCHO * 0.5; const cy = ALTO * 0.5; const radio = ANCHO * 0.42;
    const giro = t * 0.012;
    ctx.fillStyle = color;
    puntos.current.forEach(([lat, lon]) => {
      const x = Math.cos(lat) * Math.sin(lon + giro);
      const z = Math.cos(lat) * Math.cos(lon + giro);
      const y = Math.sin(lat);
      if (z < -0.15) return;
      ctx.globalAlpha = 0.25 + Math.max(0, z) * 0.75;
      ctx.beginPath(); ctx.arc(cx + x * radio, cy - y * radio, 1.3 + Math.max(0, z) * 1.4, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, radio + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }, estatico, [color]);
  return <canvas ref={ref} width={ANCHO} height={ALTO} className="h-full w-full" />;
}

function Meteoros({ color, semilla }) {
  const lista = semillas(9, semilla);
  return <div className="absolute inset-0 overflow-hidden">
    <style>{`@keyframes bq-meteoro { 0% { transform: translate(0,0) rotate(-35deg); opacity: 0; } 8% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(-420px, 300px) rotate(-35deg); opacity: 0; } }`}</style>
    {lista.map(([a, b, c, d], i) => <span key={i} className="absolute block h-[2px] rounded-full" style={{
      left: `${30 + a * 90}%`, top: `${b * 55}%`, width: 90 + c * 90,
      background: `linear-gradient(to right, ${color}, transparent)`, boxShadow: `0 0 8px ${color}`,
      animation: `bq-meteoro ${2.2 + d * 2.5}s linear ${(i * 0.9 + c * 2).toFixed(2)}s infinite`,
    }} />)}
    {semillas(40, semilla + 3).map(([a, b, c], i) => <span key={`e${i}`} className="absolute rounded-full" style={{ left: `${a * 100}%`, top: `${b * 100}%`, width: 1.5 + c * 1.5, height: 1.5 + c * 1.5, background: color, opacity: 0.35 + c * 0.5 }} />)}
  </div>;
}

function Burbujas({ color, semilla }) {
  return <div className="absolute inset-0 overflow-hidden">
    <style>{`@keyframes bq-burbuja { from { transform: translateY(0) scale(.8); opacity: 0; } 15% { opacity: .9; } to { transform: translateY(-860px) scale(1.15); opacity: 0; } }`}</style>
    {semillas(14, semilla).map(([a, b, c, d], i) => <span key={i} className="absolute rounded-full" style={{
      left: `${a * 95}%`, bottom: -60, width: 18 + b * 50, height: 18 + b * 50,
      background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`, filter: "blur(1px)",
      animation: `bq-burbuja ${8 + c * 8}s linear ${(d * 8).toFixed(2)}s infinite`,
    }} />)}
  </div>;
}

export function FondoAnimado({ tipo, claro, intensidad = 60, estatico, semilla = 1 }) {
  if (!tipo || tipo === "ninguna") return null;
  const color = claro ? "var(--b-primario)" : "var(--b-acento)";
  // El canvas no entiende variables CSS: se resuelve con getComputedStyle al montar.
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ zIndex: -2, opacity: Math.max(5, Math.min(100, intensidad)) / 100 }}>
    <ColorResuelto variable={claro ? "--b-primario" : "--b-acento"}>
      {(resuelto) => tipo === "constelaciones" ? <Constelaciones color={resuelto} estatico={estatico} semilla={semilla} />
        : tipo === "mundo" ? <Mundo color={resuelto} estatico={estatico} />
          : tipo === "meteoros" ? <Meteoros color={color} semilla={semilla} />
            : tipo === "burbujas" ? <Burbujas color={color} semilla={semilla} /> : null}
    </ColorResuelto>
  </div>;
}

function ColorResuelto({ variable, children }) {
  const ref = useRef(null);
  const [color, setColor] = React.useState("#34d399");
  useEffect(() => {
    const v = ref.current && getComputedStyle(ref.current).getPropertyValue(variable).trim();
    if (v) setColor(v);
  });
  return <div ref={ref} className="absolute inset-0">{children(color)}</div>;
}
