import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, BookOpen, ChevronLeft, ChevronRight, Clapperboard, Columns3, Copy, ExternalLink, ImagePlus,
  Layers, Link2, MousePointerClick, Palette, Pencil, Plus, RotateCcw, Save, ScrollText, Trash2, X,
} from "lucide-react";
import VisorBrochure from "../brochure/Formatos";
import PaginaBrochure, { Adorno, EstilosBrochure } from "../brochure/PaginaBrochure";
import {
  ADORNOS, AYUDAS_CAMPO, BROCHURE_POR_DEFECTO, ETIQUETAS_CAMPO, FORMATOS, FUENTES, ICONOS, TEMA_POR_DEFECTO,
  TIPOS_PAGINA, TRANSICIONES_VIDEO, enlaceSeguro, paginaNueva, variablesTema,
} from "../brochure/brochureBase";

const copia = (v) => JSON.parse(JSON.stringify(v));
const inputClass = "w-full rounded-xl border border-line/20 bg-surface-2/60 px-3 py-2 text-sm text-content outline-none transition focus:border-brand";
const GALERIA = ["escudo", "seguridad", "holograma", "lupa", "vr", "datos", "legal", "contratista"].map((n) => `/img/brochure/${n}.jpg`);
const COLORES = [
  ["color_primario", "Principal", "Títulos, tarjetas al pasar el cursor"], ["color_acento", "Acento", "Lo que resalta: botones, cifras"],
  ["color_oscuro", "Fondo oscuro", "Portada y páginas oscuras"], ["color_claro", "Fondo claro", "Páginas claras"],
  ["color_texto", "Texto", "Letra en páginas claras"],
];
const ICONO_FORMATO = { revista: BookOpen, folleto: Columns3, infografia: ScrollText, video: Clapperboard };
const GUIA_KEY = "econfia_brochure_guia_vista";

function Campo({ id, label, ayuda, children }) {
  return <div id={id} className="rounded-xl transition-shadow">
    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
    {children}
    {ayuda && <span className="mt-1 block text-[11px] text-muted/80">{ayuda}</span>}
  </div>;
}

// Imagen: subir archivo, pegar URL o elegir de la galería.
function CampoImagen({ valor, onChange, subir }) {
  const ref = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const elegir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setSubiendo(true);
    try { onChange(await subir(archivo)); } catch (err) { /* el toast ya avisó */ } finally { setSubiendo(false); }
  };
  return <div className="space-y-2">
    <div className="flex items-center gap-3">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line/20 bg-surface-2">{enlaceSeguro(valor) && <img src={enlaceSeguro(valor)} alt="" className="h-full w-full object-cover" />}</div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => ref.current?.click()} disabled={subiendo} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"><ImagePlus size={14} />{subiendo ? "Subiendo…" : "Subir imagen"}</button>
        {valor && <button type="button" onClick={() => onChange("")} className="rounded-lg px-2 py-1.5 text-xs font-bold text-muted hover:text-red-500">Quitar</button>}
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={elegir} />
    </div>
    <input className={inputClass} placeholder="o pega la URL de una imagen (https://…)" value={valor || ""} onChange={(e) => onChange(e.target.value)} />
    <div className="flex gap-1.5 overflow-x-auto pb-1">{GALERIA.map((src) => <button key={src} type="button" onClick={() => onChange(src)} title="Usar esta imagen"
      className={`h-10 w-14 shrink-0 overflow-hidden rounded-md border-2 ${valor === src ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}><img src={src} alt="" className="h-full w-full object-cover" /></button>)}</div>
  </div>;
}

function EditorItems({ tipo, items, onChange }) {
  const campos = TIPOS_PAGINA[tipo]?.item || [];
  const poner = (i, campo, valor) => onChange(items.map((it, j) => (j === i ? { ...it, [campo]: valor } : it)));
  const mover = (i, d) => { const n = [...items]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); };
  return <div className="space-y-2">
    {items.map((it, i) => <div key={i} id={`bq-item-${i}`} className="rounded-xl border border-line/15 bg-surface-2/40 p-3 transition-shadow">
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-muted"><span>{it.titulo || `Elemento ${i + 1}`}</span>
        <span className="flex gap-1">
          <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} className="rounded p-1 hover:bg-surface disabled:opacity-30" aria-label="Subir"><ArrowUp size={13} /></button>
          <button type="button" disabled={i === items.length - 1} onClick={() => mover(i, 1)} className="rounded p-1 hover:bg-surface disabled:opacity-30" aria-label="Bajar"><ArrowDown size={13} /></button>
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="rounded p-1 text-red-500 hover:bg-red-500/10" aria-label="Quitar elemento"><Trash2 size={13} /></button>
        </span>
      </div>
      <div className="grid gap-2">
        {campos.map((campo) => campo === "icono"
          ? <div key={campo} className="flex flex-wrap gap-1">{Object.entries(ICONOS).map(([nombre, Icono]) => <button key={nombre} type="button" title={nombre} onClick={() => poner(i, "icono", nombre)}
              className={`grid h-8 w-8 place-items-center rounded-lg border ${it.icono === nombre ? "border-brand bg-brand/15 text-brand" : "border-line/15 text-muted hover:text-content"}`}><Icono size={15} /></button>)}</div>
          : campo === "texto"
            ? <textarea key={campo} rows={2} className={inputClass} placeholder={ETIQUETAS_CAMPO[campo]} value={it[campo] || ""} onChange={(e) => poner(i, campo, e.target.value)} />
            : <input key={campo} className={inputClass} placeholder={ETIQUETAS_CAMPO[campo]} value={it[campo] || ""} onChange={(e) => poner(i, campo, e.target.value)} />)}
      </div>
    </div>)}
    <button type="button" onClick={() => onChange([...items, Object.fromEntries(campos.map((c) => [c, c === "icono" ? "estrella" : ""]))])}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line/30 px-3 py-1.5 text-xs font-bold text-muted hover:text-content"><Plus size={14} />Agregar elemento</button>
  </div>;
}

function EditorPagina({ pagina, onChange, subir }) {
  const tipo = TIPOS_PAGINA[pagina.tipo];
  if (!tipo) return null;
  const poner = (campo, valor) => onChange({ ...pagina, [campo]: valor });
  return <div className="space-y-4">
    {tipo.campos.map((campo) => {
      const label = ETIQUETAS_CAMPO[campo] || campo;
      const props = { id: `bq-campo-${campo}`, label, ayuda: AYUDAS_CAMPO[campo] };
      if (campo === "imagen") return <Campo key={campo} {...props}><CampoImagen valor={pagina.imagen} onChange={(v) => poner("imagen", v)} subir={subir} /></Campo>;
      if (campo === "items") return <Campo key={campo} {...props}><EditorItems tipo={pagina.tipo} items={pagina.items || []} onChange={(v) => poner("items", v)} /></Campo>;
      if (campo === "fondo") return <Campo key={campo} {...props}><select className={inputClass} value={pagina.fondo || "claro"} onChange={(e) => poner("fondo", e.target.value)}><option value="claro">Claro</option><option value="oscuro">Oscuro (color principal)</option></select></Campo>;
      if (campo === "posicion_imagen") return <Campo key={campo} {...props}><select className={inputClass} value={pagina.posicion_imagen || "abajo"} onChange={(e) => poner("posicion_imagen", e.target.value)}><option value="arriba">Arriba</option><option value="abajo">Abajo</option></select></Campo>;
      if (campo === "boton") return <Campo key={campo} {...props}><div className="grid gap-2 sm:grid-cols-2">
        <input className={inputClass} placeholder="Texto del botón" value={pagina.boton?.texto || ""} onChange={(e) => poner("boton", { ...(pagina.boton || {}), texto: e.target.value })} />
        <input className={inputClass} placeholder="Enlace (https://, mailto:, tel:)" value={pagina.boton?.enlace || ""} onChange={(e) => poner("boton", { ...(pagina.boton || {}), enlace: e.target.value })} />
      </div></Campo>;
      if (campo === "texto" || campo === "puntos" || campo === "subtitulo") return <Campo key={campo} {...props}>
        <textarea rows={campo === "texto" ? 5 : 3} className={inputClass} value={pagina[campo] || ""} onChange={(e) => poner(campo, e.target.value)} />
      </Campo>;
      return <Campo key={campo} {...props}><input className={inputClass} value={pagina[campo] || ""} onChange={(e) => poner(campo, e.target.value)} /></Campo>;
    })}
    <Campo id="bq-campo-adorno" label="Adorno de esta página" ayuda="Por defecto usa el adorno general (pestaña Diseño).">
      <select className={inputClass} value={pagina.adorno || "general"} onChange={(e) => poner("adorno", e.target.value)}>
        <option value="general">Igual que el general</option>
        {Object.entries(ADORNOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </Campo>
  </div>;
}

function Pestana({ activa, onClick, icono: Icono, children }) {
  return <button type="button" onClick={onClick} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${activa ? "bg-brand text-white shadow" : "text-muted hover:text-content"}`}>
    <Icono size={14} />{children}
  </button>;
}

export default function BrochureEditor({ api, setToast }) {
  const [contenido, setContenido] = useState(null);
  const [publicado, setPublicado] = useState(true);
  const [actualizado, setActualizado] = useState(null);
  const [seleccion, setSeleccion] = useState(0);
  const [panel, setPanel] = useState("pagina");
  const [foco, setFoco] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cambios, setCambios] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("tarjetas");
  const [guia, setGuia] = useState(() => { try { return !localStorage.getItem(GUIA_KEY); } catch { return true; } });

  useEffect(() => {
    api("/api/brochure/")
      .then((d) => { setContenido(copia(d.contenido || BROCHURE_POR_DEFECTO)); setPublicado(d.publicado !== false); setActualizado(d.actualizado); })
      .catch((e) => { setToast({ type: "error", message: e.message }); setContenido(copia(BROCHURE_POR_DEFECTO)); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cambios) return undefined;
    const aviso = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [cambios]);

  // Al hacer clic en algo del brochure: lleva al campo, lo resalta y lo enfoca.
  useEffect(() => {
    if (!foco) return undefined;
    const t = setTimeout(() => {
      const id = foco.item != null ? `bq-item-${foco.item}` : `bq-campo-${foco.campo}`;
      const el = document.getElementById(id) || document.getElementById(`bq-campo-${foco.campo}`);
      if (!el) return;
      el.scrollIntoView?.({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-brand", "ring-offset-2");
      setTimeout(() => el.classList.remove("ring-2", "ring-brand", "ring-offset-2"), 1600);
      el.querySelector("input:not([type=file]):not([type=color]), textarea")?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [foco]);

  const paginas = contenido?.paginas || [];
  const tema = { ...TEMA_POR_DEFECTO, ...(contenido?.tema || {}) };
  const actualizar = (fn) => { setContenido((c) => fn(copia(c))); setCambios(true); };
  const ponerTema = (campo, valor) => actualizar((c) => ({ ...c, tema: { ...TEMA_POR_DEFECTO, ...(c.tema || {}), [campo]: valor } }));
  const ponerPagina = (i, pagina) => actualizar((c) => { c.paginas[i] = pagina; return c; });
  const moverPagina = (i, d) => { actualizar((c) => { [c.paginas[i], c.paginas[i + d]] = [c.paginas[i + d], c.paginas[i]]; return c; }); setSeleccion(i + d); };
  const duplicar = (i) => { actualizar((c) => { c.paginas.splice(i + 1, 0, { ...copia(c.paginas[i]), id: paginaNueva("x").id }); return c; }); setSeleccion(i + 1); };
  const eliminar = (i) => {
    if (paginas.length <= 1) return;
    if (!window.confirm(`¿Eliminar la página ${i + 1} «${paginas[i].titulo || TIPOS_PAGINA[paginas[i].tipo]?.nombre}»?`)) return;
    actualizar((c) => { c.paginas.splice(i, 1); return c; });
    setSeleccion(Math.max(0, i - 1));
  };
  const agregar = () => { actualizar((c) => { c.paginas.splice(seleccion + 1, 0, paginaNueva(nuevoTipo)); return c; }); setSeleccion(seleccion + 1); setPanel("pagina"); };
  const elegirPagina = (i) => { setSeleccion(i); setPanel("pagina"); };

  const alEditar = (indice, campo, item) => {
    if (indice >= paginas.length) return; // contraportada automática
    setSeleccion(indice);
    if (campo === "logo") { setPanel("diseno"); setFoco({ campo: "logos", n: Date.now() }); return; }
    setPanel("pagina");
    setFoco({ campo: campo || "titulo", item, n: Date.now() });
  };

  const subir = async (archivo) => {
    const fd = new FormData();
    fd.append("archivo", archivo);
    try {
      const r = await api("/api/brochure/imagenes/", { method: "POST", body: fd });
      return r.url;
    } catch (e) { setToast({ type: "error", message: e.message }); throw e; }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const d = await api("/api/brochure/", { method: "PUT", body: JSON.stringify({ contenido, publicado }) });
      setActualizado(d.actualizado); setCambios(false);
      setToast({ type: "success", message: "Brochure guardado. Así lo verán tus clientes." });
    } catch (e) { setToast({ type: "error", message: e.message }); }
    finally { setGuardando(false); }
  };

  const restaurar = () => {
    if (!window.confirm("¿Volver al borrador original de Econfia? Perderás los cambios que no hayas guardado (lo guardado sigue igual hasta que guardes).")) return;
    setContenido(copia(BROCHURE_POR_DEFECTO)); setSeleccion(0); setCambios(true);
  };
  const cerrarGuia = () => { setGuia(false); try { localStorage.setItem(GUIA_KEY, "1"); } catch { /* sin almacenamiento */ } };

  if (!contenido) return <div className="rounded-[24px] border border-line/15 bg-surface/90 p-10 text-center text-muted">Cargando brochure…</div>;
  const pagina = paginas[seleccion] || paginas[0];
  const fondoVista = `radial-gradient(circle at 80% 0%, ${tema.color_primario}cc, transparent 55%), ${tema.color_oscuro}`;

  return <div className="space-y-4">
    <div className="sticky top-2 z-30 flex flex-col gap-3 rounded-[24px] border border-line/15 bg-surface/95 p-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-lg font-black text-content">Brochure interactivo</h3>
        <p className="text-xs text-muted">{cambios ? "Tienes cambios sin guardar." : actualizado ? `Guardado el ${new Date(actualizado).toLocaleString("es-CO")}.` : "Aún no se ha guardado: tus clientes ven el borrador original."}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-line/15 px-3 py-2 text-sm font-bold text-content" title="Si lo desmarcas, el brochure y sus botones dejan de verse"><input type="checkbox" checked={publicado} onChange={(e) => { setPublicado(e.target.checked); setCambios(true); }} />Publicado</label>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/brochure`); setToast({ type: "success", message: "Enlace copiado." }); }} className="inline-flex items-center gap-1.5 rounded-xl border border-line/15 px-3 py-2 text-sm font-bold text-content"><Link2 size={15} />Copiar enlace</button>
        <a href="/brochure" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-line/15 px-3 py-2 text-sm font-bold text-content"><ExternalLink size={15} />Ver publicado</a>
        <button type="button" onClick={restaurar} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-muted hover:text-content" title="Vuelve al diseño inicial de Econfia"><RotateCcw size={15} />Borrador original</button>
        <button type="button" onClick={guardar} disabled={guardando || !cambios} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-black text-white shadow disabled:opacity-50"><Save size={15} />{guardando ? "Guardando…" : cambios ? "Guardar cambios" : "Guardado"}</button>
      </div>
    </div>

    {guia && <div className="relative rounded-[24px] border border-brand/30 bg-brand/10 p-5">
      <button type="button" onClick={cerrarGuia} aria-label="Cerrar guía" className="absolute right-3 top-3 rounded-full p-1 text-muted hover:text-content"><X size={16} /></button>
      <div className="mb-3 font-black text-content">Así se edita, en 3 pasos</div>
      <div className="grid gap-3 md:grid-cols-3">
        {[[MousePointerClick, "1. Haz clic en el brochure", "Toca el título, un texto, una imagen o una tarjeta y se abre su campo a la derecha."],
          [Pencil, "2. Cambia lo que quieras", "Lo ves al instante en la vista previa. En «Diseño» eliges formato, colores y adornos."],
          [Save, "3. Guarda", "Con «Guardar cambios» tus clientes lo ven así en el correo y en su propuesta."]].map(([Icono, t, d]) =>
          <div key={t} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white"><Icono size={17} /></span><span><span className="block text-sm font-bold text-content">{t}</span><span className="block text-xs text-muted">{d}</span></span></div>)}
      </div>
    </div>}

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
      <div className="space-y-3 xl:sticky xl:top-28 xl:self-start">
        <div className="overflow-hidden rounded-[24px] border border-line/15 shadow-lg" style={{ background: fondoVista }}>
          <div className="flex items-center justify-between px-5 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
            <span>Vista previa · {FORMATOS[tema.formato]?.nombre || "Revista"}</span>
            <span className="normal-case tracking-normal text-white/50">Haz clic en cualquier parte para editarla</span>
          </div>
          <VisorBrochure contenido={contenido} irA={seleccion} alto="min(70vh, 700px)" onEditar={alEditar} />
        </div>
        <div className="flex gap-2 overflow-x-auto rounded-[20px] border border-line/15 bg-surface/90 p-2" style={variablesTema(tema)}>
          <EstilosBrochure />
          {paginas.map((p, i) => <div key={p.id || i} role="button" tabIndex={0} aria-label={`Editar la página ${i + 1}`} onClick={() => elegirPagina(i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegirPagina(i); } }} title={p.titulo}
            className={`shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition ${i === seleccion ? "border-brand shadow-lg" : "border-transparent opacity-70 hover:opacity-100"}`}>
            <div className="pointer-events-none" inert="">{/* miniatura: sin botones activos dentro */}<PaginaBrochure pagina={p} tema={tema} numero={i + 1} paginas={paginas} ancho={62} /></div>
            <div className="bg-surface-2 py-0.5 text-center text-[10px] font-bold text-muted">{i + 1}</div>
          </div>)}
        </div>
      </div>

      <div className="rounded-[24px] border border-line/15 bg-surface/90 p-4 shadow-lg">
        <div className="mb-4 flex gap-1 rounded-2xl bg-surface-2/80 p-1">
          <Pestana activa={panel === "pagina"} onClick={() => setPanel("pagina")} icono={Pencil}>Editar página</Pestana>
          <Pestana activa={panel === "paginas"} onClick={() => setPanel("paginas")} icono={Layers}>Páginas</Pestana>
          <Pestana activa={panel === "diseno"} onClick={() => setPanel("diseno")} icono={Palette}>Diseño</Pestana>
        </div>

        {panel === "pagina" && pagina && <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <button type="button" disabled={seleccion === 0} onClick={() => setSeleccion(seleccion - 1)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 disabled:opacity-30" aria-label="Página anterior"><ChevronLeft size={18} /></button>
            <div className="text-center"><div className="text-sm font-black text-content">Página {seleccion + 1} de {paginas.length}</div><div className="text-[11px] text-muted">{TIPOS_PAGINA[pagina.tipo]?.nombre}</div></div>
            <button type="button" disabled={seleccion === paginas.length - 1} onClick={() => setSeleccion(seleccion + 1)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 disabled:opacity-30" aria-label="Página siguiente"><ChevronRight size={18} /></button>
          </div>
          {pagina.tipo === "indice" && <p className="mb-3 rounded-xl bg-surface-2/60 p-3 text-xs text-muted">El índice se arma solo con los títulos de las demás páginas, y cada línea lleva a su página.</p>}
          <EditorPagina pagina={pagina} onChange={(p) => ponerPagina(seleccion, p)} subir={subir} />
        </div>}

        {panel === "paginas" && <div>
          <div className="space-y-1">
            {paginas.map((p, i) => <div key={p.id || i} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${i === seleccion ? "bg-brand/15" : "hover:bg-surface-2/60"}`}>
              <button type="button" onClick={() => elegirPagina(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="w-6 text-xs font-black text-muted">{i + 1}</span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold text-content">{p.titulo || "(sin título)"}</span><span className="block text-[10px] text-muted">{TIPOS_PAGINA[p.tipo]?.nombre || p.tipo}</span></span>
              </button>
              <button type="button" disabled={i === 0} onClick={() => moverPagina(i, -1)} className="rounded p-1 text-muted hover:text-content disabled:opacity-30" aria-label="Mover antes"><ArrowUp size={14} /></button>
              <button type="button" disabled={i === paginas.length - 1} onClick={() => moverPagina(i, 1)} className="rounded p-1 text-muted hover:text-content disabled:opacity-30" aria-label="Mover después"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => duplicar(i)} className="rounded p-1 text-muted hover:text-content" aria-label="Duplicar"><Copy size={14} /></button>
              <button type="button" disabled={paginas.length <= 1} onClick={() => eliminar(i)} className="rounded p-1 text-red-500 hover:bg-red-500/10 disabled:opacity-30" aria-label="Eliminar página"><Trash2 size={14} /></button>
            </div>)}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-line/30 p-3">
            <div className="mb-2 text-xs font-bold text-content">Agregar una página nueva</div>
            <div className="flex gap-2">
              <select className={inputClass} value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} aria-label="Tipo de página nueva">{Object.entries(TIPOS_PAGINA).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}</select>
              <button type="button" onClick={agregar} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white"><Plus size={15} />Agregar</button>
            </div>
            <p className="mt-2 text-[11px] text-muted">Se agrega después de la página {seleccion + 1}. En formato Revista lo ideal es un número par de páginas.</p>
          </div>
        </div>}

        {panel === "diseno" && <div className="space-y-5">
          <Campo id="bq-campo-formato" label="Formato" ayuda="El mismo contenido, presentado de otra forma.">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FORMATOS).map(([k, f]) => { const Icono = ICONO_FORMATO[k]; return <button key={k} type="button" onClick={() => ponerTema("formato", k)}
                className={`rounded-2xl border p-3 text-left transition ${tema.formato === k ? "border-brand bg-brand/10" : "border-line/15 hover:border-brand/50"}`}>
                <Icono size={20} className={tema.formato === k ? "text-brand" : "text-muted"} />
                <div className="mt-1.5 text-sm font-black text-content">{f.nombre}</div>
                <div className="text-[11px] leading-4 text-muted">{f.descripcion}</div>
              </button>; })}
            </div>
          </Campo>
          {tema.formato === "video" && <div className="grid grid-cols-2 gap-3 rounded-2xl bg-surface-2/50 p-3">
            <Campo label={`Segundos por escena: ${tema.video_segundos}`}><input type="range" min="3" max="15" value={tema.video_segundos} onChange={(e) => ponerTema("video_segundos", Number(e.target.value))} className="w-full" aria-label="Segundos por escena" /></Campo>
            <Campo label="Transición"><select className={inputClass} value={tema.video_transicion} onChange={(e) => ponerTema("video_transicion", e.target.value)}>{Object.entries(TRANSICIONES_VIDEO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Campo>
          </div>}

          <Campo id="bq-campo-adornos" label="Adorno (marca de agua)" ayuda="Se dibuja suave detrás del contenido de todas las páginas.">
            <div className="grid grid-cols-3 gap-2" style={variablesTema(tema)}>
              {Object.entries(ADORNOS).map(([k, v]) => <button key={k} type="button" onClick={() => ponerTema("adorno", k)}
                className={`overflow-hidden rounded-xl border text-left transition ${tema.adorno === k ? "border-brand ring-2 ring-brand/30" : "border-line/15 hover:border-brand/50"}`}>
                <div className="relative isolate h-14" style={{ background: tema.color_oscuro }}>{k !== "ninguno" && <Adorno tipo={k} intensidad={80} semilla={3} />}</div>
                <div className="px-2 py-1 text-[11px] font-bold text-content">{v}</div>
              </button>)}
            </div>
            <label className="mt-2 flex items-center gap-3 text-xs font-bold text-muted">Intensidad
              <input type="range" min="5" max="100" value={tema.adorno_intensidad} onChange={(e) => ponerTema("adorno_intensidad", Number(e.target.value))} className="flex-1" aria-label="Intensidad del adorno" />
              <span className="w-8 text-right">{tema.adorno_intensidad}%</span></label>
          </Campo>

          <Campo label="Colores">
            <div className="grid gap-2">
              {COLORES.map(([campo, label, ayuda]) => <label key={campo} className="flex items-center gap-3 rounded-xl border border-line/15 p-2">
                <input type="color" value={tema[campo]} onChange={(e) => ponerTema(campo, e.target.value)} className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={label} />
                <span><span className="block text-xs font-bold text-content">{label}</span><span className="block text-[11px] text-muted">{ayuda}</span></span>
              </label>)}
            </div>
          </Campo>
          <Campo label="Fuente de los títulos"><select className={inputClass} value={tema.fuente_titulos} onChange={(e) => ponerTema("fuente_titulos", e.target.value)}>{Object.keys(FUENTES).map((f) => <option key={f}>{f}</option>)}</select></Campo>
          <div id="bq-campo-logos" className="grid gap-3 rounded-xl transition-shadow">
            <Campo label="Logo sobre fondo oscuro"><CampoImagen valor={tema.logo} onChange={(v) => ponerTema("logo", v)} subir={subir} /></Campo>
            <Campo label="Logo sobre fondo claro"><CampoImagen valor={tema.logo_oscuro} onChange={(v) => ponerTema("logo_oscuro", v)} subir={subir} /></Campo>
          </div>
        </div>}
      </div>
    </div>
  </div>;
}
