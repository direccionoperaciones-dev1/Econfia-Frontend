import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

// Presentación pública de una propuesta comercial: es lo que abre el cliente
// desde el botón del correo. No requiere sesión (el token es largo y aleatorio).

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const money = (value, currency = "COP") => new Intl.NumberFormat("es-CO", {
  style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: currency === "USD" ? 2 : 0,
}).format(Number(value || 0));
// Fecha "YYYY-MM-DD" en hora local: nunca restar un día por zona horaria.
const fecha = (iso) => iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : "";
const pct = (v) => Number(v || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });

export default function PropuestaPublica() {
  const { token } = useParams();
  const { search } = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [visor, setVisor] = useState(null); // imagen ampliada

  useEffect(() => {
    const preview = new URLSearchParams(search).get("preview") === "1" ? "?preview=1" : "";
    fetch(`${API_URL}/api/propuestas/publica/${encodeURIComponent(token)}/${preview}`)
      .then(async (r) => { if (!r.ok) throw new Error(r.status === 404 ? "Esta propuesta no existe o el enlace no es válido." : "No fue posible cargar la propuesta."); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token, search]);

  useEffect(() => {
    if (data) document.title = `Propuesta Econfia N.º ${data.numero}`;
  }, [data]);

  if (error) return <Pantalla><div className="text-center"><div className="text-5xl">🔒</div><h1 className="mt-4 text-2xl font-black">{error}</h1><p className="mt-2 text-sm text-violet-200/70">Si crees que es un error, responde el correo en el que la recibiste.</p></div></Pantalla>;
  if (!data) return <Pantalla><div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-300/30 border-t-violet-300" /></Pantalla>;

  const imagenes = data.adjuntos.filter((a) => a.tipo === "imagen");
  const videos = data.adjuntos.filter((a) => a.tipo === "video");
  const pdfs = data.adjuntos.filter((a) => a.tipo === "pdf");
  const para = data.cliente_empresa || data.cliente_nombre;

  return (
    <div className="min-h-screen bg-[#0d0724] text-white print:bg-white print:text-black">
      {/* Portada */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(167,139,250,.35),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(79,70,229,.35),transparent_45%),linear-gradient(135deg,#160b38,#2c1470_55%,#4c1d95)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pb-24">
          <div className="flex items-center justify-between">
            <div><div className="text-2xl font-black tracking-wide">ECONF<span className="text-violet-300">IA</span></div><div className="text-[10px] uppercase tracking-[0.3em] text-violet-200/80">Verificación · Antecedentes · Riesgo</div></div>
            <button type="button" onClick={() => window.print()} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/20 print:hidden">Descargar / imprimir</button>
          </div>
          <div className="mt-14 max-w-3xl md:mt-20">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-violet-200">Propuesta comercial N.º {data.numero}</div>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">Una propuesta a la medida de <span className="bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">{para}</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-violet-100/80">Hola {data.cliente_nombre}, preparamos {data.items.length === 1 ? "este plan" : `estos ${data.items.length} planes`} para que verifiques personas y empresas con rapidez, trazabilidad y respaldo legal.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Kpi label="Inversión total" valor={`${money(data.total, data.moneda)}`} sub={data.moneda} grande />
            <Kpi label="Planes incluidos" valor={data.items.length} sub={data.items.map((i) => i.plan_nombre).join(" · ")} />
            <Kpi label={data.vencida ? "Vigencia" : "Válida hasta"} valor={data.vencida ? "Vencida" : fecha(data.valida_hasta)} sub={data.vencida ? `Venció el ${fecha(data.valida_hasta)}` : `Emitida el ${fecha(data.fecha)}`} alerta={data.vencida} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        {imagenes.length > 0 && <section className="mb-14">
          <Titulo kicker="Conoce la plataforma" titulo="Así se ve Econfia" />
          <div className={`grid gap-3 ${imagenes.length === 1 ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {imagenes.map((img, i) => <button key={img.id || i} type="button" onClick={() => setVisor(img)} className={`group overflow-hidden rounded-3xl border border-white/10 bg-white/5 ${i === 0 && imagenes.length > 2 ? "sm:col-span-2 lg:row-span-2" : ""}`}>
              <img src={img.url} alt={img.titulo || img.nombre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            </button>)}
          </div>
        </section>}

        <section className="mb-14">
          <Titulo kicker="Lo que te proponemos" titulo={data.items.length === 1 ? "Tu plan" : "Tus planes"} />
          <div className={`grid gap-5 ${data.items.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {data.items.map((item, i) => <article key={i} className="flex flex-col overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-2xl shadow-violet-950/40">
              <div className="border-b border-white/10 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">Plan {i + 1}</div><h3 className="mt-1 text-2xl font-black">{item.plan_nombre}</h3></div>
                  {Number(item.descuento_porcentaje) > 0 && <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">−{pct(item.descuento_porcentaje)}%</span>}
                </div>
                {item.plan_descripcion && <p className="mt-3 text-sm leading-6 text-violet-100/75">{item.plan_descripcion}</p>}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Chip>🔎 {Number(item.cantidad).toLocaleString("es-CO")} consultas</Chip>
                  {item.usuarios && <Chip>👥 {Number(item.usuarios).toLocaleString("es-CO")} usuario{item.usuarios === 1 ? "" : "s"}</Chip>}
                  {item.disponibilidad && <Chip>⏱ {item.disponibilidad}</Chip>}
                </div>
              </div>
              {item.beneficios.length > 0 && <ul className="space-y-2.5 p-6">
                {item.beneficios.map((b, j) => <li key={j} className="flex gap-3 text-sm leading-6 text-violet-50/90"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-[11px] font-black text-emerald-300">✓</span>{b}</li>)}
              </ul>}
              <div className="mt-auto space-y-1.5 border-t border-white/10 bg-black/20 p-6 text-sm">
                <Fila k="Precio por consulta" v={money(item.precio_unitario, data.moneda)} />
                {item.precio_paquete && <Fila k="Valor del paquete" v={money(item.precio_paquete, data.moneda)} />}
                {Number(item.descuento_volumen_porcentaje) > 0 && <Fila k="Ahorro por volumen" v={`${pct(item.descuento_volumen_porcentaje)}%`} verde />}
                {Number(item.descuento_porcentaje) > 0 && <Fila k="Descuento" v={`−${pct(item.descuento_porcentaje)}%`} verde />}
                {item.precio_consulta_adicional && <Fila k="Consulta adicional" v={money(item.precio_consulta_adicional, data.moneda)} />}
                <div className="flex items-end justify-between pt-3"><span className="font-bold text-violet-200">Valor del plan</span><span className="text-2xl font-black">{money(item.total, data.moneda)}</span></div>
              </div>
            </article>)}
          </div>
        </section>

        {videos.length > 0 && <section className="mb-14">
          <Titulo kicker="En video" titulo="Míralo en acción" />
          <div className={`grid gap-5 ${videos.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {videos.map((v) => <figure key={v.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black">
              <video src={v.url} controls preload="metadata" playsInline className="aspect-video w-full bg-black" />
              <figcaption className="px-5 py-3 text-sm font-semibold text-violet-100/80">{v.titulo || v.nombre}</figcaption>
            </figure>)}
          </div>
        </section>}

        {pdfs.length > 0 && <section className="mb-14">
          <Titulo kicker="Documentos" titulo="Material de apoyo" />
          <div className="space-y-5">
            {pdfs.map((d) => <div key={d.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/15 text-lg">📄</span><div><div className="font-bold">{d.titulo || d.nombre}</div><div className="text-xs text-violet-200/60">PDF{d.tamano ? ` · ${(d.tamano / 1048576).toFixed(1)} MB` : ""}</div></div></div>
                <a href={d.url} target="_blank" rel="noopener noreferrer" download className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#2c1470] transition hover:bg-violet-100">Descargar</a>
              </div>
              <iframe src={d.url} title={d.titulo || d.nombre} className="hidden h-[70vh] w-full border-t border-white/10 bg-white md:block print:hidden" />
            </div>)}
          </div>
        </section>}

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {data.observaciones ? <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <Titulo kicker="Condiciones" titulo="Observaciones" compacto />
            <p className="whitespace-pre-line text-sm leading-7 text-violet-50/85">{data.observaciones}</p>
          </div> : <div className="hidden lg:block" />}
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 shadow-2xl shadow-violet-900/50">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-violet-100">Resumen de inversión</div>
            <div className="mt-4 space-y-2 text-sm">
              {data.items.map((item, i) => <Fila key={i} k={item.plan_nombre} v={money(item.total, data.moneda)} claro />)}
              {Number(data.descuento_porcentaje) > 0 && <><div className="border-t border-white/20 pt-2"><Fila k="Subtotal" v={money(data.subtotal, data.moneda)} claro /></div><Fila k="Descuento comercial" v={`−${pct(data.descuento_porcentaje)}%`} claro /></>}
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-white/25 pt-4"><span className="text-sm font-bold">Total</span><span className="text-3xl font-black">{money(data.total, data.moneda)}</span></div>
            {data.moneda === "USD" && data.tasa_cambio_trm && <div className="mt-2 text-[11px] text-violet-100/80">Convertido con TRM {money(data.tasa_cambio_trm, "COP")} del {fecha(data.fecha_trm)}.</div>}
            <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6">¿Listo para empezar? <b>Responde el correo</b> en el que recibiste esta propuesta y te acompañamos en la activación.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-violet-200/50">Econfia · Propuesta N.º {data.numero} · Valores sin impuestos salvo que se indique lo contrario.</footer>

      {visor && <div role="dialog" aria-modal="true" onClick={() => setVisor(null)} className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur print:hidden">
        <img src={visor.url} alt={visor.titulo || visor.nombre} className="max-h-[90vh] max-w-full rounded-2xl" />
        <button type="button" onClick={() => setVisor(null)} aria-label="Cerrar" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-2xl">×</button>
      </div>}
    </div>
  );
}

function Pantalla({ children }) {
  return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_80%_10%,rgba(167,139,250,.25),transparent_45%),linear-gradient(135deg,#160b38,#2c1470)] px-4 text-white">{children}</div>;
}
function Kpi({ label, valor, sub, grande, alerta }) {
  return <div className={`rounded-3xl border p-5 backdrop-blur ${alerta ? "border-amber-300/40 bg-amber-400/10" : "border-white/15 bg-white/10"}`}>
    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-200">{label}</div>
    <div className={`mt-2 font-black ${grande ? "text-3xl md:text-4xl" : "text-2xl"}`}>{valor}</div>
    {sub && <div className="mt-1 truncate text-xs text-violet-100/70">{sub}</div>}
  </div>;
}
function Titulo({ kicker, titulo, compacto }) {
  return <div className={compacto ? "mb-3" : "mb-6"}><div className="text-[11px] font-bold uppercase tracking-[0.3em] text-violet-300">{kicker}</div><h2 className={`mt-1 font-black ${compacto ? "text-xl" : "text-3xl md:text-4xl"}`}>{titulo}</h2></div>;
}
function Chip({ children }) { return <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-semibold text-violet-50">{children}</span>; }
function Fila({ k, v, verde, claro }) {
  return <div className="flex items-center justify-between gap-3"><span className={claro ? "text-violet-50/90" : "text-violet-100/70"}>{k}</span><span className={`font-bold ${verde ? "text-emerald-300" : ""}`}>{v}</span></div>;
}
