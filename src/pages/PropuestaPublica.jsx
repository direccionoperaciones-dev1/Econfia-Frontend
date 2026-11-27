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
const PASOS = [
  [1, "Revisa", "Mira cada servicio, sus beneficios y el valor total."],
  [2, "Nos reunimos", "Revisamos la propuesta contigo en una reunión presencial y cerramos los detalles."],
  [3, "Empieza", "Activamos tu acceso y te acompañamos en el arranque."],
];
const pct = (v) => Number(v || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });

export default function PropuestaPublica() {
  const { token } = useParams();
  const { search } = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [visor, setVisor] = useState(null); // imagen ampliada
  const preview = new URLSearchParams(search).get("preview") === "1";

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
  // Fechas en hora local (Colombia): nunca restar un día.
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const diasRestantes = Math.round((new Date(`${data.valida_hasta}T00:00:00`) - hoy) / 86400000);

  return (
    <div className="min-h-screen bg-[#0d0724] text-white print:bg-white print:text-black">
      {/* Portada */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(167,139,250,.35),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(79,70,229,.35),transparent_45%),linear-gradient(135deg,#160b38,#2c1470_55%,#4c1d95)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pb-24">
          <div className="flex items-center justify-between">
            <div><div className="text-2xl font-black tracking-wide">ECONF<span className="text-violet-300">IA</span></div><div className="text-[10px] uppercase tracking-[0.3em] text-violet-200/80">Verificación · Antecedentes · Riesgo</div></div>
            <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
              {data.brochure && <a href={`/brochure?propuesta=${encodeURIComponent(token)}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-[#2c1470] shadow-[0_10px_30px_-8px_rgba(255,255,255,.55)] transition hover:-translate-y-0.5 hover:bg-violet-100 md:text-base"><span className="text-lg">📖</span> Conoce Econfia</a>}
              <button type="button" onClick={() => window.print()} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/20">Descargar / imprimir</button>
            </div>
          </div>
          <div className="mt-14 max-w-3xl md:mt-20">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-violet-200">Propuesta comercial N.º {data.numero}</div>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">Una propuesta a la medida de <span className="bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">{para}</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-violet-100/80">Hola {data.cliente_nombre}, preparamos {data.items.length === 1 ? "este servicio" : `estos ${data.items.length} servicios`} para que verifiques personas y empresas con rapidez, trazabilidad y respaldo legal.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Kpi label="Inversión total" valor={`${money(data.total, data.moneda)}`} sub={data.moneda} grande />
            <Kpi label="Servicios incluidos" valor={data.items.length} sub={data.items.map((i) => i.plan_nombre).join(" · ")} />
            <Kpi label={data.vencida ? "Vigencia" : "Válida hasta"} valor={data.vencida ? "Vencida" : fecha(data.valida_hasta)} sub={data.vencida ? `Venció el ${fecha(data.valida_hasta)}` : `Emitida el ${fecha(data.fecha)}`} alerta={data.vencida} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <ComoFunciona data={data} />

        {imagenes.length > 0 && <section className="mb-14">
          <Titulo kicker="Conoce la plataforma" titulo="Así se ve Econfia" />
          <div className={`grid gap-3 ${imagenes.length === 1 ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {imagenes.map((img, i) => <button key={img.id || i} type="button" onClick={() => setVisor(img)} className={`group overflow-hidden rounded-3xl border border-white/10 bg-white/5 ${i === 0 && imagenes.length > 2 ? "sm:col-span-2 lg:row-span-2" : ""}`}>
              <img src={img.url} alt={img.titulo || img.nombre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            </button>)}
          </div>
        </section>}

        <section className="mb-14">
          <Titulo kicker="Lo que te proponemos" titulo={data.items.length === 1 ? "Tu servicio" : "Tus servicios"} />
          <div className={`grid gap-5 ${data.items.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {data.items.map((item, i) => <article key={i} className="flex flex-col overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-2xl shadow-violet-950/40">
              <div className="border-b border-white/10 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300">{item.es_bono ? "🎁 Bono de regalo" : `${item.etiqueta === "servicio" ? "Servicio" : "Plan"} ${i + 1}`}</div><h3 className="mt-1 text-2xl font-black">{item.plan_nombre}</h3></div>
                  {Number(item.descuento_porcentaje) > 0 && <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">−{pct(item.descuento_porcentaje)}%</span>}
                </div>
                {item.plan_descripcion && <p className="mt-3 text-sm leading-6 text-violet-100/75">{item.plan_descripcion}</p>}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Chip>🔎 {Number(item.cantidad).toLocaleString("es-CO")} {Number(item.cantidad) === 1 ? (item.unidad_singular || "consulta") : (item.unidad_plural || "consultas")}</Chip>
                  {item.usuarios && <Chip>👥 {Number(item.usuarios).toLocaleString("es-CO")} usuario{item.usuarios === 1 ? "" : "s"}</Chip>}
                  {item.disponibilidad && <Chip>⏱ {item.disponibilidad}</Chip>}
                </div>
                {item.fuentes?.length > 0 && <details className="mt-4 text-sm text-violet-100/80">
                  <summary className="cursor-pointer font-bold text-violet-200">Fuentes incluidas ({item.fuentes.length})</summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">{item.fuentes.map((nombre, j) => <span key={j} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs">{nombre}</span>)}</div>
                </details>}
              </div>
              {item.beneficios.length > 0 && <ul className="space-y-2.5 p-6">
                {item.beneficios.map((b, j) => <li key={j} className="flex gap-3 text-sm leading-6 text-violet-50/90"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-[11px] font-black text-emerald-300">✓</span>{b}</li>)}
              </ul>}
              <div className="mt-auto space-y-1.5 border-t border-white/10 bg-black/20 p-6 text-sm">
                {!item.es_bono && <Fila k={`Precio por ${item.unidad_singular || "consulta"}`} v={money(item.precio_unitario, data.moneda)} />}
                {item.precio_paquete && <Fila k="Valor del paquete" v={money(item.precio_paquete, data.moneda)} />}
                {Number(item.descuento_volumen_porcentaje) > 0 && <Fila k="Ahorro por volumen" v={`${pct(item.descuento_volumen_porcentaje)}%`} verde />}
                {Number(item.descuento_unitario) > 0 && <Fila k={`Descuento por ${item.unidad_singular || "consulta"}`} v={`−${money(item.descuento_unitario, data.moneda)}`} verde />}
                {Number(item.descuento_porcentaje) > 0 && <Fila k="Descuento" v={`−${pct(item.descuento_porcentaje)}%`} verde />}
                {item.precio_consulta_adicional && <Fila k={item.unidad_singular === "estudio" ? "Estudio adicional" : item.unidad_singular === "prueba" ? "Prueba adicional" : "Consulta adicional"} v={money(item.precio_consulta_adicional, data.moneda)} />}
                <div className="flex items-end justify-between pt-3"><span className="font-bold text-violet-200">Valor del {item.etiqueta || "plan"}</span><span className={`text-2xl font-black ${item.es_bono ? "text-emerald-300" : ""}`}>{item.es_bono ? "Sin costo" : money(item.total, data.moneda)}</span></div>
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

        {!data.vencida && data.items.some((i) => !i.es_bono) && <Contrapropuesta data={data} token={token} preview={preview} onEnviada={(contrapropuesta) => setData((d) => ({ ...d, contrapropuesta }))} />}

        <section className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <Titulo kicker="Cómo seguimos" titulo="Así de fácil empiezas" compacto />
              <ol className="grid gap-3 sm:grid-cols-3">
                {PASOS.map(([n, titulo, texto]) => <li key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500/30 text-sm font-black text-violet-100">{n}</span>
                  <div className="mt-3 font-bold">{titulo}</div>
                  <p className="mt-1 text-sm leading-6 text-violet-100/70">{texto}</p>
                </li>)}
              </ol>
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${data.vencida ? "bg-red-500/15 text-red-200" : "bg-amber-400/10 text-amber-200"}`}>
                {data.vencida ? `⚠️ Esta propuesta venció el ${fecha(data.valida_hasta)}.` : `⏳ Válida hasta el ${fecha(data.valida_hasta)}${diasRestantes > 0 ? `: quedan ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}` : ": hoy es el último día"}.`}
              </div>
            </div>
            {data.observaciones && <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <Titulo kicker="Condiciones" titulo="Observaciones" compacto />
              <p className="whitespace-pre-line text-sm leading-7 text-violet-50/85">{data.observaciones}</p>
            </div>}
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 shadow-2xl shadow-violet-900/50 lg:sticky lg:top-6">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-violet-100">Resumen de inversión</div>
            <div className="mt-4 space-y-2 text-sm">
              {data.items.map((item, i) => <Fila key={i} k={`${item.es_bono ? "🎁 " : ""}${item.plan_nombre} × ${Number(item.cantidad).toLocaleString("es-CO")}`} v={item.es_bono ? "Regalo" : money(item.total, data.moneda)} claro />)}
              {Number(data.descuento_porcentaje) > 0 && <><div className="border-t border-white/20 pt-2"><Fila k="Subtotal" v={money(data.subtotal, data.moneda)} claro /></div><Fila k="Descuento comercial" v={`−${pct(data.descuento_porcentaje)}%`} claro /></>}
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-white/25 pt-4"><span className="text-sm font-bold">Total</span><span className="text-3xl font-black">{money(data.total, data.moneda)}</span></div>
            {data.moneda === "USD" && data.tasa_cambio_trm && <div className="mt-2 text-[11px] text-violet-100/80">Convertido con TRM {money(data.tasa_cambio_trm, "COP")} del {fecha(data.fecha_trm)}.</div>}
            <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6">¿Listo para empezar? <b>Responde el correo</b> en el que recibiste esta propuesta y agendamos la reunión presencial para revisarla juntos.</p>
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

// Explicación fija de la propuesta: se ve en todas (también en las ya enviadas),
// porque la página se arma al abrir el enlace.
function ComoFunciona({ data }) {
  const presupuesto = Number(data.presupuesto_cliente) || 0;
  const editable = !data.vencida && data.items.some((i) => !i.es_bono);
  const irACotizador = () => document.getElementById("personaliza")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const tarjetas = [
    ["🤝", "Propuesta con descuento", "Esta es una propuesta de descuento preparada para ti. La revisaremos juntos en una reunión presencial, donde resolvemos tus dudas y cerramos los detalles."],
    presupuesto > 0
      ? ["🎯", "Ajustada a tu presupuesto", `Armamos esta cotización a partir del presupuesto que nos compartiste (${money(presupuesto, data.moneda)}). Al personalizarla verás siempre cuánto te queda o si te pasas.`]
      : ["🧮", "Es un ejemplo de referencia", "Como aún no tenemos un presupuesto definido, las cantidades de esta cotización son solo un ejemplo genérico para que conozcas los precios. Si tienes un presupuesto, escríbelo al personalizar y te mostramos cuánto te alcanza."],
    ["✏️", "Cambia las cantidades a tu gusto", "En «Personaliza tu cotización» eliges cuántas consultas, estudios o pruebas quieres de cada servicio y el sistema calcula los precios automáticamente, con el descuento ya aplicado."],
  ];
  return <section className="mb-14 print:hidden">
    <Titulo kicker="Antes de empezar" titulo="Cómo funciona tu propuesta" />
    <div className="grid gap-4 md:grid-cols-3">
      {tarjetas.map(([icono, titulo, texto]) => <div key={titulo} className="rounded-3xl border border-violet-300/15 bg-white/[0.05] p-5">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/25 text-xl">{icono}</div>
        <div className="mt-3 text-lg font-black">{titulo}</div>
        <p className="mt-1.5 text-sm leading-6 text-violet-100/75">{texto}</p>
      </div>)}
    </div>
    <ul className="mt-4 grid gap-x-6 gap-y-1.5 rounded-2xl bg-white/[0.03] px-5 py-4 text-sm text-violet-100/70 sm:grid-cols-2">
      <li>• Solo cambian las cantidades; el precio por unidad es el de esta propuesta.</li>
      <li>• Los servicios de regalo (🎁 bono) no se modifican.</li>
      <li>• «Volver a lo cotizado» deja todo como estaba al inicio.</li>
      <li>• Puedes enviar una nueva versión cuando quieras; tu asesor la recibe.</li>
    </ul>
    {editable && <button type="button" onClick={irACotizador} className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-[#2c1470] transition hover:bg-violet-100">Ir a personalizar mi cotización ↓</button>}
  </section>;
}

// El cliente cambia cantidades (no precios): todo se recalcula con lo cotizado y,
// si nos dijo su presupuesto, no puede pasarse de él.
function Contrapropuesta({ data, token, preview, onEnviada }) {
  const editables = data.items.filter((i) => !i.es_bono);
  const inicial = () => Object.fromEntries(editables.map((i) => [i.id, String(i.cantidad)]));
  const [abierta, setAbierta] = useState(false);
  const [cantidades, setCantidades] = useState(inicial);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  // Si el asesor no registró presupuesto, el cliente puede escribir el suyo (opcional).
  const presupuestoAsesor = Number(data.presupuesto_cliente) || 0;
  const [presupuestoPropio, setPresupuestoPropio] = useState(() => presupuestoAsesor ? "" : String(Math.round(Number(data.contrapropuesta?.presupuesto) || 0) || ""));
  const combo = 1 - Number(data.descuento_porcentaje || 0) / 100;
  const presupuesto = presupuestoAsesor || parseInt(presupuestoPropio, 10) || 0;
  const valorDe = (item) => Number(item.valor_unitario || 0) * combo;
  const cantidadDe = (item) => Math.max(0, parseInt(cantidades[item.id], 10) || 0);
  const total = editables.reduce((acc, i) => acc + valorDe(i) * cantidadDe(i), 0);
  const restante = presupuesto - total;
  const sePasa = presupuesto > 0 && restante < -0.5;
  const cambio = editables.some((i) => cantidadDe(i) !== Number(i.cantidad));
  const algunaCantidad = editables.some((i) => cantidadDe(i) > 0);
  const poner = (item, valor) => setCantidades((c) => ({ ...c, [item.id]: String(Math.max(0, valor)) }));
  const unidad = (item, n) => n === 1 ? (item.unidad_singular || "consulta") : (item.unidad_plural || "consultas");
  const enviar = async () => {
    setEnviando(true); setMensaje(null);
    try {
      const r = await fetch(`${API_URL}/api/propuestas/publica/${encodeURIComponent(token)}/contrapropuesta/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: editables.map((i) => ({ id: i.id, cantidad: cantidadDe(i) })), comentario, ...(!presupuestoAsesor && presupuesto > 0 ? { presupuesto } : {}) }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.detail || "No fue posible enviar tu cotización personalizada.");
      setMensaje({ ok: true, texto: "Recibimos tu cotización personalizada. Tu asesor te contactará." });
      onEnviada(body.contrapropuesta);
      setAbierta(false);
    } catch (e) { setMensaje({ ok: false, texto: e.message }); }
    finally { setEnviando(false); }
  };

  return <section id="personaliza" className="mb-14 scroll-mt-6 rounded-3xl border border-violet-300/20 bg-white/[0.04] p-6 print:hidden">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <Titulo kicker="¿Quieres otra combinación?" titulo="Ajusta las cantidades" compacto />
      {!abierta && <button type="button" onClick={() => { setAbierta(true); setMensaje(null); }} className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-[#2c1470] transition hover:bg-violet-100">Personaliza tu cotización</button>}
    </div>
    <p className="max-w-3xl text-sm leading-6 text-violet-100/75">Cambia cuántas consultas, estudios o pruebas quieres de cada servicio. Los precios son los de esta propuesta y el total se calcula solo{presupuesto > 0 ? `, sin pasarte de tu presupuesto de ${money(presupuesto, data.moneda)}` : ". Las cantidades actuales son solo un ejemplo: ajústalas a lo que necesitas"}.</p>
    {data.contrapropuesta && !abierta && <div className="mt-4 rounded-2xl bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">✅ Enviaste tu cotización personalizada el {new Date(data.contrapropuesta.creada).toLocaleString("es-CO")} por {money(data.contrapropuesta.total, data.moneda)}. Tu asesor te contactará; si quieres, puedes enviar otra.</div>}
    {mensaje && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${mensaje.ok ? "bg-emerald-400/10 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>{mensaje.texto}</div>}
    {abierta && <div className="mt-5">
      {!presupuestoAsesor && <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] p-4">
        <div className="min-w-[200px] flex-1"><div className="font-black">¿Tienes un presupuesto para invertir?</div><div className="text-xs text-violet-200/70">Es opcional. Si lo escribes, te mostramos cuánto te alcanza y no te dejamos pasarte.</div></div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-violet-200">{data.moneda === "USD" ? "US$" : "$"}</span>
          <input aria-label="Tu presupuesto" inputMode="numeric" placeholder="Ej. 2000000" value={presupuestoPropio} onChange={(e) => setPresupuestoPropio(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))} className="h-10 w-44 rounded-xl border border-white/15 bg-white/10 px-3 text-right font-black text-white outline-none placeholder:font-normal placeholder:text-violet-200/40 focus:border-emerald-300" />
          {presupuestoPropio && <button type="button" onClick={() => setPresupuestoPropio("")} className="text-xs font-bold text-violet-200/70 hover:text-white">Quitar</button>}
        </div>
        {presupuesto > 0 && <div className="w-full text-xs text-emerald-200">Tu presupuesto: <b>{money(presupuesto, data.moneda)}</b></div>}
      </div>}
      <div className="space-y-3">
        {editables.map((item) => {
          const n = cantidadDe(item);
          const masQueAlcanzan = presupuesto > 0 && valorDe(item) > 0 ? Math.floor(Math.max(0, restante) / valorDe(item)) : null;
          return <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="min-w-[180px] flex-1"><div className="font-black">{item.plan_nombre}</div><div className="text-xs text-violet-200/70">{money(valorDe(item), data.moneda)} por {unidad(item, 1)} · cotizado: {Number(item.cantidad).toLocaleString("es-CO")}</div></div>
            <div className="flex items-center gap-1.5">
              <button type="button" aria-label={`Menos ${item.plan_nombre}`} onClick={() => poner(item, n - 1)} className="h-10 w-10 rounded-xl bg-white/10 text-lg font-black hover:bg-white/20">−</button>
              <input aria-label={`Cantidad de ${item.plan_nombre}`} type="number" min="0" inputMode="numeric" value={cantidades[item.id]} onFocus={(e) => e.target.select()} onChange={(e) => setCantidades((c) => ({ ...c, [item.id]: e.target.value.replace(/[^0-9]/g, "") }))} className="h-10 w-28 rounded-xl border border-white/15 bg-white/10 px-3 text-center font-black text-white outline-none focus:border-violet-300" />
              <button type="button" aria-label={`Más ${item.plan_nombre}`} onClick={() => poner(item, n + 1)} className="h-10 w-10 rounded-xl bg-white/10 text-lg font-black hover:bg-white/20">+</button>
            </div>
            <div className="w-40 text-right"><div className="font-black">{money(valorDe(item) * n, data.moneda)}</div>{masQueAlcanzan != null && masQueAlcanzan > 0 && <button type="button" onClick={() => poner(item, n + masQueAlcanzan)} className="text-[11px] font-bold text-emerald-300 hover:underline">+{masQueAlcanzan.toLocaleString("es-CO")} más te alcanzan</button>}</div>
          </div>;
        })}
      </div>
      <div className={`mt-4 rounded-2xl p-4 ${sePasa ? "bg-red-500/15" : "bg-violet-500/15"}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Nuevo total</div><div className="text-3xl font-black">{money(total, data.moneda)}</div>{Number(data.descuento_porcentaje) > 0 && <div className="text-xs text-violet-200/70">Incluye el descuento comercial de {pct(data.descuento_porcentaje)}%</div>}</div>
          {presupuesto > 0 && <div className="text-right text-sm"><div className="text-violet-200/80">Tu presupuesto: <b>{money(presupuesto, data.moneda)}</b></div><div className={`font-black ${sePasa ? "text-red-300" : "text-emerald-300"}`}>{sePasa ? `Te pasas por ${money(-restante, data.moneda)}` : `Te quedan ${money(Math.max(0, restante), data.moneda)}`}</div></div>}
        </div>
        {presupuesto > 0 && <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${sePasa ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(100, (total / presupuesto) * 100)}%` }} /></div>}
      </div>
      <textarea aria-label="Comentario para tu asesor" value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={1000} placeholder="¿Algo más que debamos saber? (opcional)" className="mt-4 min-h-20 w-full resize-y rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none placeholder:text-violet-200/40 focus:border-violet-300" />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={enviar} disabled={preview || enviando || !cambio || sePasa || !algunaCantidad} className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-black text-[#0d0724] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">{enviando ? "Enviando…" : "Enviar cotización personalizada"}</button>
        <button type="button" onClick={() => { setCantidades(inicial()); setMensaje(null); }} className="text-sm font-bold text-violet-200 hover:text-white">Volver a lo cotizado</button>
        <button type="button" onClick={() => setAbierta(false)} className="text-sm font-bold text-violet-200/70 hover:text-white">Cerrar</button>
        <span className="text-xs text-violet-200/60">{preview ? "Vista previa del asesor: aquí no se envía." : sePasa ? "Baja alguna cantidad para no pasarte de tu presupuesto." : !cambio ? "Cambia alguna cantidad para enviarla." : "Tu asesor la recibe y te envía la propuesta ajustada."}</span>
      </div>
    </div>}
  </section>;
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
