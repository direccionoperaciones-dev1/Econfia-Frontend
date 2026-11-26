// Lienzo de diseño del brochure (estilo Canva): la página plana y grande donde se
// selecciona, arrastra y cambia de tamaño cualquier bloque, y se agregan elementos libres.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AlignHorizontalJustifyCenter, BarChart3, BringToFront, Copy, Image as ImageIcon, MoveDiagonal2, RotateCcw, RotateCw, SendToBack,
  Shapes, Smile, Trash2, Type,
} from "lucide-react";
import PaginaBrochure, { ALTO, ANCHO, EstilosBrochure, claveAjuste } from "../brochure/PaginaBrochure";
import { ETIQUETAS_CAMPO, ICONOS, variablesTema } from "../brochure/brochureBase";
import { ANIMACIONES_ELEMENTO, FORMAS, TIPOS_ELEMENTO, elementoNuevo } from "../brochure/Elementos";

const inputClass = "w-full rounded-xl border border-line/20 bg-surface-2/60 px-3 py-2 text-sm text-content outline-none transition focus:border-brand";
const redondo = (n) => Math.round(n);
const NOMBRES = { ...ETIQUETAS_CAMPO, logo: "Logo", items: "Tarjeta", puntos: "Viñetas", boton: "Botón", imagen: "Imagen", titulo: "Título" };
const AGREGAR = [["texto", Type], ["imagen", ImageIcon], ["icono", Smile], ["forma", Shapes], ["grafica", BarChart3]];
const IMAN = 6; // px de diseño: a esta distancia se pega a una guía
const MARGEN = 44;

// Imanta un rango [inicio, inicio+largo] a las guías: devuelve el corrimiento y la guía usada.
function imantar(inicio, largo, guias) {
  let mejor = null;
  [inicio, inicio + largo / 2, inicio + largo].forEach((borde) => guias.forEach((g) => {
    const d = g - borde;
    if (Math.abs(d) <= IMAN && (!mejor || Math.abs(d) < Math.abs(mejor.d))) mejor = { d, g };
  }));
  return mejor || { d: 0, g: null };
}

function buscarNodo(raiz, sel) {
  if (!raiz || !sel) return null;
  const limpio = (v) => String(v).replace(/[^\w.-]/g, "");
  if (sel.tipo === "elemento") return raiz.querySelector(`[data-elemento="${limpio(sel.id)}"]`);
  return raiz.querySelector(`[data-campo="${limpio(sel.campo)}"]${sel.item != null ? `[data-item="${Number(sel.item)}"]` : ""}`);
}

export default function BrochureLienzo({ pagina, tema, indice, paginas, ancho, onCambiar, seleccion, onSeleccion }) {
  const raiz = useRef(null);
  const capa = useRef(null);
  const arrastre = useRef(null);
  const [caja, setCaja] = useState(null);
  const [guiasVisibles, setGuiasVisibles] = useState({ x: null, y: null });
  const e = ancho / ANCHO;
  const elementos = pagina.elementos || [];
  const ajustes = pagina.ajustes || {};

  const ponerElementos = useCallback((lista) => onCambiar({ ...pagina, elementos: lista }), [onCambiar, pagina]);
  const ponerAjuste = useCallback((clave, valor) => {
    const nuevos = { ...(pagina.ajustes || {}) };
    if (valor) nuevos[clave] = valor; else delete nuevos[clave];
    onCambiar({ ...pagina, ajustes: nuevos });
  }, [onCambiar, pagina]);

  // Recuadro de selección (se recalcula después de cada cambio).
  useLayoutEffect(() => {
    const nodo = buscarNodo(raiz.current, seleccion);
    if (!nodo) { setCaja(null); return; }
    const a = raiz.current.getBoundingClientRect();
    const b = nodo.getBoundingClientRect();
    setCaja({ x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height });
  }, [seleccion, pagina, ancho]);

  const alPresionar = (ev) => {
    if (ev.button > 0) return; // solo clic principal
    const nodos = document.elementsFromPoint?.(ev.clientX, ev.clientY) || [];
    const golpe = nodos.find((n) => raiz.current?.contains(n) && n !== capa.current && (n.closest?.("[data-elemento]") || n.closest?.("[data-campo]")));
    const el = golpe?.closest("[data-elemento]");
    const campo = !el && golpe?.closest("[data-campo]");
    let sel = null;
    if (el) sel = { tipo: "elemento", id: el.getAttribute("data-elemento") };
    else if (campo) sel = { tipo: "campo", campo: campo.getAttribute("data-campo"), item: campo.hasAttribute("data-item") ? Number(campo.getAttribute("data-item")) : null };
    onSeleccion(sel);
    if (!sel) return;
    const original = sel.tipo === "elemento" ? elementos.find((x) => x.id === sel.id) : (ajustes[claveAjuste(sel.campo, sel.item)] || { x: 0, y: 0, s: 1 });
    arrastre.current = { modo: "mover", sel, x: ev.clientX, y: ev.clientY, original: { ...original }, movido: false, ...medirGuias(sel) };
    capa.current?.setPointerCapture?.(ev.pointerId);
  };

  // Rectángulo del elegido y guías (márgenes, centro y bordes de los demás), en px de diseño.
  const medirGuias = (sel) => {
    const base = raiz.current.getBoundingClientRect();
    const enDiseno = (r) => ({ x: (r.left - base.left) / e, y: (r.top - base.top) / e, w: r.width / e, h: r.height / e });
    const propio = buscarNodo(raiz.current, sel);
    const rect = propio ? enDiseno(propio.getBoundingClientRect()) : null;
    const gx = [MARGEN, ANCHO / 2, ANCHO - MARGEN];
    const gy = [MARGEN, ALTO / 2, ALTO - MARGEN];
    raiz.current.querySelectorAll("[data-elemento], [data-campo]").forEach((n) => {
      if (n === propio || propio?.contains(n) || n.contains(propio)) return;
      const r = enDiseno(n.getBoundingClientRect());
      if (r.w < 4 || r.h < 4) return;
      gx.push(r.x, r.x + r.w / 2, r.x + r.w);
      gy.push(r.y, r.y + r.h / 2, r.y + r.h);
    });
    return { rect, gx, gy };
  };

  const alPresionarGiro = (ev) => {
    ev.stopPropagation();
    if (!seleccion || !caja) return;
    const base = raiz.current.getBoundingClientRect();
    const original = seleccion.tipo === "elemento" ? elementos.find((x) => x.id === seleccion.id) : (ajustes[claveAjuste(seleccion.campo, seleccion.item)] || { x: 0, y: 0, s: 1 });
    arrastre.current = { modo: "girar", sel: seleccion, cx: base.left + caja.x + caja.w / 2, cy: base.top + caja.y + caja.h / 2, original: { ...original }, movido: true };
    capa.current?.setPointerCapture?.(ev.pointerId);
  };

  const alPresionarEsquina = (ev) => {
    ev.stopPropagation();
    if (!seleccion) return;
    const original = seleccion.tipo === "elemento" ? elementos.find((x) => x.id === seleccion.id) : (ajustes[claveAjuste(seleccion.campo, seleccion.item)] || { x: 0, y: 0, s: 1 });
    arrastre.current = { modo: "tamano", sel: seleccion, x: ev.clientX, y: ev.clientY, original: { ...original }, anchoBase: (caja?.w || 100) / e };
    capa.current?.setPointerCapture?.(ev.pointerId);
  };

  const alMover = (ev) => {
    const a = arrastre.current;
    if (!a) return;
    if (a.modo === "girar") {
      let grados = Math.round((Math.atan2(ev.clientY - a.cy, ev.clientX - a.cx) * 180) / Math.PI + 90);
      if (grados > 180) grados -= 360;
      const cercano = [-180, -90, -45, 0, 45, 90, 180].find((g) => Math.abs(g - grados) <= 4);
      if (cercano != null) grados = cercano;
      if (a.sel.tipo === "elemento") ponerElementos(elementos.map((x) => (x.id === a.sel.id ? { ...x, rot: grados } : x)));
      else ponerAjuste(claveAjuste(a.sel.campo, a.sel.item), { ...a.original, r: grados });
      return;
    }
    let dx = (ev.clientX - a.x) / e;
    let dy = (ev.clientY - a.y) / e;
    if (!a.movido && Math.hypot(dx, dy) < 2) return;
    a.movido = true;
    if (a.modo === "mover" && a.rect && !ev.altKey) {
      const ix = imantar(a.rect.x + dx, a.rect.w, a.gx);
      const iy = imantar(a.rect.y + dy, a.rect.h, a.gy);
      dx += ix.d; dy += iy.d;
      setGuiasVisibles({ x: ix.g, y: iy.g });
    }
    if (a.sel.tipo === "elemento") {
      const o = a.original;
      const cambio = a.modo === "mover"
        ? { x: redondo(o.x + dx), y: redondo(o.y + dy) }
        : ev.shiftKey ? (() => { const f = Math.max(0.1, (o.w + dx) / o.w); return { w: redondo(o.w * f), h: redondo(o.h * f) }; })()
          : { w: redondo(Math.max(16, o.w + dx)), h: redondo(Math.max(10, o.h + dy)) };
      ponerElementos(elementos.map((x) => (x.id === a.sel.id ? { ...x, ...cambio } : x)));
    } else {
      const o = a.original;
      const clave = claveAjuste(a.sel.campo, a.sel.item);
      if (a.modo === "mover") ponerAjuste(clave, { ...o, x: redondo((o.x || 0) + dx), y: redondo((o.y || 0) + dy) });
      else ponerAjuste(clave, { ...o, s: Math.round(Math.max(0.3, Math.min(3, (o.s || 1) * (1 + dx / Math.max(40, a.anchoBase)))) * 100) / 100 });
    }
  };
  const alSoltar = () => { arrastre.current = null; setGuiasVisibles({ x: null, y: null }); };

  const elegido = seleccion?.tipo === "elemento" ? elementos.find((x) => x.id === seleccion.id) : null;
  const agregar = (tipo) => { const nuevo = elementoNuevo(tipo); ponerElementos([...elementos, nuevo]); onSeleccion({ tipo: "elemento", id: nuevo.id }); };
  const eliminar = useCallback(() => { if (!elegido) return; ponerElementos(elementos.filter((x) => x.id !== elegido.id)); onSeleccion(null); }, [elegido, elementos, ponerElementos, onSeleccion]);
  const duplicar = () => { const copia = { ...elegido, id: elementoNuevo("x").id, x: elegido.x + 20, y: elegido.y + 20 }; ponerElementos([...elementos, copia]); onSeleccion({ tipo: "elemento", id: copia.id }); };
  const capaOrden = (alFrente) => { const resto = elementos.filter((x) => x.id !== elegido.id); ponerElementos(alFrente ? [...resto, elegido] : [elegido, ...resto]); };
  const restablecer = () => ponerAjuste(claveAjuste(seleccion.campo, seleccion.item), null);
  const centrar = () => {
    if (!caja) return;
    const d = Math.round(ANCHO / 2 - (caja.x + caja.w / 2) / e);
    if (elegido) ponerElementos(elementos.map((x) => (x.id === elegido.id ? { ...x, x: x.x + d } : x)));
    else { const k = claveAjuste(seleccion.campo, seleccion.item); const o = ajustes[k] || { x: 0, y: 0, s: 1 }; ponerAjuste(k, { ...o, x: (o.x || 0) + d }); }
  };

  // Teclado: Supr borra, flechas mueven (Shift = 10 px).
  useEffect(() => {
    const tecla = (ev) => {
      if (!seleccion || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
      if ((ev.key === "Delete" || ev.key === "Backspace") && elegido) { ev.preventDefault(); eliminar(); return; }
      const paso = ev.shiftKey ? 10 : 1;
      const d = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[ev.key];
      if (!d) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (elegido) ponerElementos(elementos.map((x) => (x.id === elegido.id ? { ...x, x: x.x + d[0], y: x.y + d[1] } : x)));
      else if (seleccion.tipo === "campo") { const k = claveAjuste(seleccion.campo, seleccion.item); const o = ajustes[k] || { x: 0, y: 0, s: 1 }; ponerAjuste(k, { ...o, x: (o.x || 0) + d[0], y: (o.y || 0) + d[1] }); }
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
  }, [seleccion, elegido, elementos, ajustes, eliminar, ponerElementos, ponerAjuste]);

  const ajusteActual = seleccion?.tipo === "campo" ? ajustes[claveAjuste(seleccion.campo, seleccion.item)] : null;
  const nombre = elegido ? TIPOS_ELEMENTO[elegido.tipo] : seleccion ? NOMBRES[seleccion.campo] || seleccion.campo : "";

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-white/60">Agregar:</span>
      {AGREGAR.map(([tipo, Icono]) => <button key={tipo} type="button" onClick={() => agregar(tipo)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"><Icono size={14} />{TIPOS_ELEMENTO[tipo]}</button>)}
    </div>

    <div className="flex justify-center">
      <div ref={raiz} className="bq-lienzo relative select-none overflow-hidden rounded-[10px] shadow-2xl" style={{ ...variablesTema(tema), width: ancho }}>
        <EstilosBrochure />
        <style>{`.bq-lienzo [data-campo]:hover, .bq-lienzo [data-elemento]:hover { outline: 1px dashed var(--b-acento); outline-offset: 2px; }`}</style>
        <PaginaBrochure pagina={pagina} tema={tema} numero={indice + 1} indice={indice} paginas={paginas} ancho={ancho} />
        <div ref={capa} data-testid="capa-lienzo" className="absolute inset-0 z-50 cursor-default touch-none"
          onPointerDown={alPresionar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}>
          {guiasVisibles.x != null && <div className="pointer-events-none absolute inset-y-0 w-px" style={{ left: guiasVisibles.x * e, background: "#f472b6", boxShadow: "0 0 4px #f472b6" }} />}
          {guiasVisibles.y != null && <div className="pointer-events-none absolute inset-x-0 h-px" style={{ top: guiasVisibles.y * e, background: "#f472b6", boxShadow: "0 0 4px #f472b6" }} />}
          {caja && <div className="pointer-events-none absolute border-2" style={{ left: caja.x - 3, top: caja.y - 3, width: caja.w + 6, height: caja.h + 6, borderColor: tema.color_acento, borderRadius: 6 }}>
            <span className="absolute -top-6 left-0 max-w-[45%] truncate whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: tema.color_acento, color: tema.color_oscuro }}>{nombre} · arrastra para mover</span>
            <button type="button" aria-label="Girar" title="Arrastra para girar" onPointerDown={alPresionarGiro}
              className="pointer-events-auto absolute -top-9 left-1/2 grid h-6 w-6 -translate-x-1/2 cursor-grab place-items-center rounded-full border-2 border-white shadow" style={{ background: tema.color_acento }}>
              <RotateCw size={12} color={tema.color_oscuro} />
            </button>
            <button type="button" aria-label="Cambiar tamaño" onPointerDown={alPresionarEsquina}
              className="pointer-events-auto absolute -bottom-2.5 -right-2.5 grid h-5 w-5 cursor-nwse-resize place-items-center rounded-full border-2 border-white shadow" style={{ background: tema.color_acento }}>
              <MoveDiagonal2 size={10} color={tema.color_oscuro} />
            </button>
          </div>}
        </div>
      </div>
    </div>

    {seleccion && <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
      <button type="button" onClick={centrar} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 font-bold text-white hover:bg-white/20"><AlignHorizontalJustifyCenter size={13} />Centrar en la página</button>
      {elegido ? <>
        <button type="button" onClick={duplicar} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 font-bold text-white hover:bg-white/20"><Copy size={13} />Duplicar</button>
        <button type="button" onClick={() => capaOrden(true)} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 font-bold text-white hover:bg-white/20"><BringToFront size={13} />Al frente</button>
        <button type="button" onClick={() => capaOrden(false)} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 font-bold text-white hover:bg-white/20"><SendToBack size={13} />Atrás</button>
        <button type="button" onClick={eliminar} className="inline-flex items-center gap-1 rounded-lg bg-red-500/80 px-2.5 py-1.5 font-bold text-white hover:bg-red-500"><Trash2 size={13} />Eliminar</button>
      </> : <button type="button" onClick={restablecer} disabled={!ajusteActual} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 font-bold text-white hover:bg-white/20 disabled:opacity-40"><RotateCcw size={13} />Volver a su lugar y tamaño</button>}
    </div>}
    <p className="text-center text-[11px] text-white/50">Clic para seleccionar · arrastra para mover (se imanta a las guías rosadas; Alt para soltarlo libre) · esquina para el tamaño · círculo de arriba para girar · flechas para mover fino · Supr para borrar · Ctrl+Z deshace</p>
  </div>;
}

// Fuera del panel: si se definieran adentro, cada letra re-crearía el campo y perdería el foco.
function Fila({ label, children }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>{children}</label>;
}

function Color({ el, poner, campo, label }) {
  return <label className="flex items-center gap-2 rounded-xl border border-line/15 p-2 text-xs font-bold text-content">
    <input type="color" value={el[campo] || "#34d399"} onChange={(e) => poner(campo, e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={label} />{label}
    {el[campo] && <button type="button" onClick={() => poner(campo, "")} className="ml-auto text-[10px] text-muted hover:text-content">Usar el del tema</button>}
  </label>;
}

// Propiedades del elemento libre seleccionado (panel derecho del editor).
export function PanelElemento({ el, onChange, CampoImagen, subir }) {
  const poner = (campo, valor) => onChange({ ...el, [campo]: valor });
  return <div className="space-y-3">
    {el.tipo === "texto" && <>
      <Fila label="Texto"><textarea id="bq-el-texto" rows={3} className={inputClass} value={el.texto || ""} onChange={(e) => poner("texto", e.target.value)} /></Fila>
      <div className="grid grid-cols-2 gap-2">
        <Fila label={`Tamaño: ${el.tamano}px`}><input type="range" min="10" max="90" value={el.tamano} onChange={(e) => poner("tamano", Number(e.target.value))} className="w-full" /></Fila>
        <Fila label="Alineación"><select className={inputClass} value={el.alineacion} onChange={(e) => poner("alineacion", e.target.value)}><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option></select></Fila>
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-bold text-content">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={Boolean(el.negrilla)} onChange={(e) => poner("negrilla", e.target.checked)} />Negrilla</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={el.fuente === "titulos"} onChange={(e) => poner("fuente", e.target.checked ? "titulos" : "normal")} />Fuente de títulos</label>
      </div>
      <Color el={el} poner={poner} campo="color" label="Color del texto" />
    </>}
    {el.tipo === "imagen" && <>
      <Fila label="Imagen"><CampoImagen valor={el.imagen} onChange={(v) => poner("imagen", v)} subir={subir} /></Fila>
      <Fila label={`Esquinas redondeadas: ${el.radio || 0}px`}><input type="range" min="0" max="120" value={el.radio || 0} onChange={(e) => poner("radio", Number(e.target.value))} className="w-full" /></Fila>
    </>}
    {el.tipo === "icono" && <>
      <Fila label="Ícono"><div className="flex flex-wrap gap-1">{Object.entries(ICONOS).map(([nombre, Icono]) => <button key={nombre} type="button" title={nombre} onClick={() => poner("icono", nombre)}
        className={`grid h-8 w-8 place-items-center rounded-lg border ${el.icono === nombre ? "border-brand bg-brand/15 text-brand" : "border-line/15 text-muted hover:text-content"}`}><Icono size={15} /></button>)}</div></Fila>
      <label className="flex items-center gap-1.5 text-xs font-bold text-content"><input type="checkbox" checked={Boolean(el.fondo)} onChange={(e) => poner("fondo", e.target.checked)} />Con fondo</label>
      <Color el={el} poner={poner} campo="color" label="Color" />
    </>}
    {el.tipo === "forma" && <>
      <Fila label="Forma"><select className={inputClass} value={el.forma} onChange={(e) => poner("forma", e.target.value)}>{Object.entries(FORMAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Fila>
      {el.forma === "rectangulo" && <Fila label={`Esquinas: ${el.radio || 0}px`}><input type="range" min="0" max="80" value={el.radio || 0} onChange={(e) => poner("radio", Number(e.target.value))} className="w-full" /></Fila>}
      <Color el={el} poner={poner} campo="color" label="Color" />
    </>}
    {el.tipo === "grafica" && <>
      <Fila label="Tipo de gráfica"><select className={inputClass} value={el.grafica} onChange={(e) => poner("grafica", e.target.value)}><option value="barras">Barras</option><option value="dona">Dona</option></select></Fila>
      <Fila label="Datos (una línea por dato: «Etiqueta: valor»)"><textarea rows={4} className={inputClass} value={el.datos || ""} onChange={(e) => poner("datos", e.target.value)} /></Fila>
      <Color el={el} poner={poner} campo="color" label="Color principal" />
    </>}
    <div className="grid grid-cols-2 gap-2">
      <Fila label={`Girar: ${el.rot || 0}°`}><input type="range" min="-180" max="180" value={el.rot || 0} onChange={(e) => poner("rot", Number(e.target.value))} className="w-full" /></Fila>
      <Fila label={`Transparencia: ${100 - (el.opacidad ?? 100)}%`}><input type="range" min="10" max="100" value={el.opacidad ?? 100} onChange={(e) => poner("opacidad", Number(e.target.value))} className="w-full" /></Fila>
    </div>
    <Fila label="Animación al aparecer"><select className={inputClass} value={el.animacion || "ninguna"} onChange={(e) => poner("animacion", e.target.value)}>{Object.entries(ANIMACIONES_ELEMENTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Fila>
    <div className="grid grid-cols-4 gap-2 text-[11px] text-muted">
      {[["x", "X"], ["y", "Y"], ["w", "Ancho"], ["h", "Alto"]].map(([k, l]) => <label key={k}>{l}<input type="number" className={inputClass} value={el[k]} onChange={(e) => poner(k, Number(e.target.value) || 0)} /></label>)}
    </div>
  </div>;
}
