import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ExternalLink, ImagePlus, Link2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import Flipbook from "../brochure/Flipbook";
import {
  BROCHURE_POR_DEFECTO, ETIQUETAS_CAMPO, FUENTES, ICONOS, TEMA_POR_DEFECTO, TIPOS_PAGINA, enlaceSeguro, paginaNueva,
} from "../brochure/brochureBase";

const copia = (v) => JSON.parse(JSON.stringify(v));
const inputClass = "w-full rounded-xl border border-line/20 bg-surface-2/60 px-3 py-2 text-sm text-content outline-none focus:border-brand";
const GALERIA = ["escudo", "seguridad", "holograma", "lupa", "vr", "datos", "legal", "contratista"].map((n) => `/img/brochure/${n}.jpg`);
const COLORES = [
  ["color_primario", "Principal"], ["color_oscuro", "Fondo oscuro"], ["color_acento", "Acento (resalta)"],
  ["color_claro", "Fondo claro"], ["color_texto", "Texto"],
];

function Campo({ label, children }) {
  return <label className="block"><span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>{children}</label>;
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
    try { onChange(await subir(archivo)); } finally { setSubiendo(false); }
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
    {items.map((it, i) => <div key={i} className="rounded-xl border border-line/15 bg-surface-2/40 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-muted"><span>Elemento {i + 1}</span>
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
  return <div className="space-y-3">
    {tipo.campos.map((campo) => {
      const label = ETIQUETAS_CAMPO[campo] || campo;
      if (campo === "imagen") return <Campo key={campo} label={label}><CampoImagen valor={pagina.imagen} onChange={(v) => poner("imagen", v)} subir={subir} /></Campo>;
      if (campo === "items") return <Campo key={campo} label={label}><EditorItems tipo={pagina.tipo} items={pagina.items || []} onChange={(v) => poner("items", v)} /></Campo>;
      if (campo === "fondo") return <Campo key={campo} label={label}><select className={inputClass} value={pagina.fondo || "claro"} onChange={(e) => poner("fondo", e.target.value)}><option value="claro">Claro</option><option value="oscuro">Oscuro (color principal)</option></select></Campo>;
      if (campo === "posicion_imagen") return <Campo key={campo} label={label}><select className={inputClass} value={pagina.posicion_imagen || "abajo"} onChange={(e) => poner("posicion_imagen", e.target.value)}><option value="arriba">Arriba</option><option value="abajo">Abajo</option></select></Campo>;
      if (campo === "boton") return <Campo key={campo} label={label}><div className="grid gap-2 sm:grid-cols-2">
        <input className={inputClass} placeholder="Texto del botón" value={pagina.boton?.texto || ""} onChange={(e) => poner("boton", { ...(pagina.boton || {}), texto: e.target.value })} />
        <input className={inputClass} placeholder="Enlace (https://, mailto:, tel:)" value={pagina.boton?.enlace || ""} onChange={(e) => poner("boton", { ...(pagina.boton || {}), enlace: e.target.value })} />
      </div></Campo>;
      if (campo === "texto" || campo === "puntos" || campo === "subtitulo") return <Campo key={campo} label={label}>
        <textarea rows={campo === "texto" ? 5 : 3} className={inputClass} value={pagina[campo] || ""} onChange={(e) => poner(campo, e.target.value)} placeholder={campo === "texto" ? "Separa los párrafos con una línea en blanco." : ""} />
      </Campo>;
      return <Campo key={campo} label={label}><input className={inputClass} value={pagina[campo] || ""} onChange={(e) => poner(campo, e.target.value)} /></Campo>;
    })}
  </div>;
}

export default function BrochureEditor({ api, setToast }) {
  const [contenido, setContenido] = useState(null);
  const [publicado, setPublicado] = useState(true);
  const [actualizado, setActualizado] = useState(null);
  const [seleccion, setSeleccion] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [cambios, setCambios] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("tarjetas");

  useEffect(() => {
    api("/api/brochure/")
      .then((d) => { setContenido(copia(d.contenido || BROCHURE_POR_DEFECTO)); setPublicado(d.publicado !== false); setActualizado(d.actualizado); })
      .catch((e) => { setToast({ type: "error", message: e.message }); setContenido(copia(BROCHURE_POR_DEFECTO)); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avisar antes de salir con cambios sin guardar.
  useEffect(() => {
    if (!cambios) return undefined;
    const aviso = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [cambios]);

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
  const agregar = () => { actualizar((c) => { c.paginas.splice(seleccion + 1, 0, paginaNueva(nuevoTipo)); return c; }); setSeleccion(seleccion + 1); };

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

  const enlacePublico = `${window.location.origin}/brochure`;
  const vistaPrevia = useMemo(() => contenido, [contenido]);

  if (!contenido) return <div className="rounded-[24px] border border-line/15 bg-surface/90 p-10 text-center text-muted">Cargando brochure…</div>;
  const pagina = paginas[seleccion] || paginas[0];

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-lg font-black text-content">Brochure interactivo</h3>
        <p className="text-sm text-muted">Se envía con cada propuesta (botón en el correo y en la página de la propuesta). {actualizado ? `Guardado el ${new Date(actualizado).toLocaleString("es-CO")}.` : "Aún no se ha guardado: tus clientes ven el borrador original."}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-line/15 px-3 py-2 text-sm font-bold text-content"><input type="checkbox" checked={publicado} onChange={(e) => { setPublicado(e.target.checked); setCambios(true); }} />Publicado</label>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(enlacePublico); setToast({ type: "success", message: "Enlace copiado." }); }} className="inline-flex items-center gap-1.5 rounded-xl border border-line/15 px-3 py-2 text-sm font-bold text-content"><Link2 size={15} />Copiar enlace</button>
        <a href="/brochure" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-line/15 px-3 py-2 text-sm font-bold text-content"><ExternalLink size={15} />Ver publicado</a>
        <button type="button" onClick={restaurar} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-muted hover:text-content"><RotateCcw size={15} />Borrador original</button>
        <button type="button" onClick={guardar} disabled={guardando || !cambios} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-black text-white shadow disabled:opacity-50"><Save size={15} />{guardando ? "Guardando…" : cambios ? "Guardar cambios" : "Guardado"}</button>
      </div>
    </div>

    <div className="grid gap-5 xl:grid-cols-[440px_1fr]">
      <div className="space-y-5">
        <section className="rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg">
          <h4 className="mb-3 font-black text-content">Colores y estilo</h4>
          <div className="grid grid-cols-2 gap-3">
            {COLORES.map(([campo, label]) => <label key={campo} className="flex items-center gap-2 rounded-xl border border-line/15 p-2 text-xs font-bold text-content">
              <input type="color" value={tema[campo]} onChange={(e) => ponerTema(campo, e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={label} />{label}
            </label>)}
            <Campo label="Fuente de títulos"><select className={inputClass} value={tema.fuente_titulos} onChange={(e) => ponerTema("fuente_titulos", e.target.value)}>{Object.keys(FUENTES).map((f) => <option key={f}>{f}</option>)}</select></Campo>
          </div>
          <div className="mt-4 grid gap-3">
            <Campo label="Logo sobre fondo oscuro"><CampoImagen valor={tema.logo} onChange={(v) => ponerTema("logo", v)} subir={subir} /></Campo>
            <Campo label="Logo sobre fondo claro"><CampoImagen valor={tema.logo_oscuro} onChange={(v) => ponerTema("logo_oscuro", v)} subir={subir} /></Campo>
          </div>
        </section>

        <section className="rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg">
          <h4 className="mb-3 font-black text-content">Páginas ({paginas.length})</h4>
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {paginas.map((p, i) => <div key={p.id || i} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${i === seleccion ? "bg-brand/15" : "hover:bg-surface-2/60"}`}>
              <button type="button" onClick={() => setSeleccion(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="w-6 text-xs font-black text-muted">{i + 1}</span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold text-content">{p.titulo || "(sin título)"}</span><span className="block text-[10px] text-muted">{TIPOS_PAGINA[p.tipo]?.nombre || p.tipo}</span></span>
              </button>
              <button type="button" disabled={i === 0} onClick={() => moverPagina(i, -1)} className="rounded p-1 text-muted hover:text-content disabled:opacity-30" aria-label="Mover antes"><ArrowUp size={14} /></button>
              <button type="button" disabled={i === paginas.length - 1} onClick={() => moverPagina(i, 1)} className="rounded p-1 text-muted hover:text-content disabled:opacity-30" aria-label="Mover después"><ArrowDown size={14} /></button>
              <button type="button" onClick={() => duplicar(i)} className="rounded p-1 text-muted hover:text-content" aria-label="Duplicar"><Copy size={14} /></button>
              <button type="button" disabled={paginas.length <= 1} onClick={() => eliminar(i)} className="rounded p-1 text-red-500 hover:bg-red-500/10 disabled:opacity-30" aria-label="Eliminar página"><Trash2 size={14} /></button>
            </div>)}
          </div>
          <div className="mt-3 flex gap-2">
            <select className={inputClass} value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} aria-label="Tipo de página nueva">{Object.entries(TIPOS_PAGINA).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}</select>
            <button type="button" onClick={agregar} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-bold text-white"><Plus size={15} />Agregar</button>
          </div>
          <p className="mt-2 text-[11px] text-muted">La página nueva se agrega después de la seleccionada. Lo ideal es un número par de páginas (la última queda como contraportada).</p>
        </section>

        {pagina && <section className="rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg">
          <h4 className="mb-1 font-black text-content">Página {seleccion + 1}: {TIPOS_PAGINA[pagina.tipo]?.nombre}</h4>
          {pagina.tipo === "indice" && <p className="mb-3 text-xs text-muted">El índice se arma solo con los títulos de las demás páginas, y cada línea lleva a su página.</p>}
          <EditorPagina pagina={pagina} onChange={(p) => ponerPagina(seleccion, p)} subir={subir} />
        </section>}
      </div>

      <div className="xl:sticky xl:top-4 xl:self-start">
        <div className="overflow-hidden rounded-[24px] border border-line/15 shadow-lg" style={{ background: `radial-gradient(circle at 80% 0%, ${tema.color_primario}cc, transparent 55%), ${tema.color_oscuro}` }}>
          <div className="px-5 pt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Vista previa · así lo ve el cliente</div>
          <Flipbook contenido={vistaPrevia} irA={seleccion} alto="min(78vh, 760px)" onCambio={undefined} />
        </div>
      </div>
    </div>
  </div>;
}
