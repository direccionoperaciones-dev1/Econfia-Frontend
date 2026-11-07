// CentroNormativo.jsx — Página pública: normativa LA/FT/FPADM explicada de forma visual
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import {
  Building2,
  Landmark,
  HeartPulse,
  Users,
  Truck,
  ShieldCheck,
  Dices,
  Gavel,
  Scale,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Flag,
  Search,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Info,
  BookOpen,
  ListChecks,
  Network,
  History,
  UserCheck,
  Database,
  Briefcase,
  Cog,
  Target,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import {
  REVISION,
  SECTORES,
  FUENTES_BASE,
  CONCEPTOS,
  GRUPOS_GLOSARIO,
  OFICIAL,
  LISTAS,
  ECOSISTEMA,
  LINEA_TIEMPO,
} from "../data/normativaLaft";

const STYLE_ID = "econfia-normativa-styles";
const estilos = `
  .norm-card {
    position: relative;
    overflow: hidden;
    border-radius: 1.5rem;
    background: linear-gradient(180deg, rgb(var(--th-surface) / 0.92) 0%, rgb(var(--th-surface-2) / 0.88) 100%);
    border: 1px solid rgb(var(--th-line) / 0.12);
    transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease;
  }
  .norm-card::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top right, rgb(var(--th-brand) / 0.12), transparent 38%);
    pointer-events: none;
  }
  .norm-hover:hover {
    transform: translateY(-4px);
    border-color: rgb(var(--th-brand) / 0.35);
    box-shadow: 0 20px 60px rgb(var(--th-brand) / 0.14);
  }
  @keyframes normFade {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .norm-fade { animation: normFade .35s ease both; }

  @keyframes normUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes normPop {
    0%   { opacity: 0; transform: scale(.55); }
    70%  { opacity: 1; transform: scale(1.08); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes normSlide {
    from { opacity: 0; transform: translateX(-14px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes normBar {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes normPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgb(var(--th-brand) / .35); }
    50%      { box-shadow: 0 0 0 10px rgb(var(--th-brand) / 0); }
  }
  @keyframes normFloat {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }
  @keyframes normProgreso {
    from { width: 0%; }
    to   { width: 100%; }
  }
  .norm-up    { animation: normUp .55s cubic-bezier(.2,.7,.2,1) both; }
  .norm-pop   { animation: normPop .5s cubic-bezier(.2,.7,.2,1) both; }
  .norm-slide { animation: normSlide .45s cubic-bezier(.2,.7,.2,1) both; }
  .norm-bar   { transform-origin: left; animation: normBar .7s cubic-bezier(.2,.7,.2,1) both; }
  .norm-pulse { animation: normPulse 2.2s ease-in-out infinite; }
  .norm-float { animation: normFloat 3.5s ease-in-out infinite; }
  .norm-progreso { animation: normProgreso linear both; }
  .norm-chip { transition: transform .2s ease, box-shadow .2s ease; }
  .norm-chip:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgb(var(--th-brand) / .18); }
  @media (prefers-reduced-motion: reduce) {
    .norm-up, .norm-pop, .norm-slide, .norm-bar, .norm-pulse, .norm-float, .norm-fade { animation: none !important; }
  }
`;

if (typeof document !== "undefined") {
  let tag = document.getElementById(STYLE_ID);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_ID;
    document.head.appendChild(tag);
  }
  tag.innerHTML = estilos;
}

const retraso = (i, paso = 70) => ({ animationDelay: `${i * paso}ms` });

const COLORES = {
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-500",    ring: "ring-cyan-500/25",    border: "border-cyan-500/40",    solid: "bg-cyan-500" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-500",    ring: "ring-blue-500/25",    border: "border-blue-500/40",    solid: "bg-blue-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/25", border: "border-emerald-500/40", solid: "bg-emerald-500" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-500",    ring: "ring-pink-500/25",    border: "border-pink-500/40",    solid: "bg-pink-500" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-600",   ring: "ring-amber-500/25",   border: "border-amber-500/40",   solid: "bg-amber-500" },
  purple:  { bg: "bg-purple-500/10",  text: "text-purple-500",  ring: "ring-purple-500/25",  border: "border-purple-500/40",  solid: "bg-purple-500" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-500",  ring: "ring-orange-500/25",  border: "border-orange-500/40",  solid: "bg-orange-500" },
  teal:    { bg: "bg-teal-500/10",    text: "text-teal-500",    ring: "ring-teal-500/25",    border: "border-teal-500/40",    solid: "bg-teal-500" },
};

const ICONOS_SECTOR = {
  real: Building2,
  financiero: Landmark,
  solidario: Users,
  salud: HeartPulse,
  transporte: Truck,
  vigilancia: ShieldCheck,
  juegos: Dices,
  publico: Gavel,
};

const ICONOS_LISTA = { vinculantes: Scale, referencia: Globe2, antecedentes: Flag, pep: UserCheck };

const SECCIONES = [
  { id: "sectores", label: "¿Qué me aplica?", icon: ListChecks },
  { id: "ecosistema", label: "Ecosistema", icon: Network },
  { id: "listas", label: "Listas restrictivas", icon: Scale },
  { id: "oficial", label: "Oficial de cumplimiento", icon: UserCheck },
  { id: "conceptos", label: "Glosario", icon: BookOpen },
  { id: "historia", label: "Línea de tiempo", icon: History },
];

function Encabezado({ eyebrow, titulo, texto }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-brand">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black text-content md:text-4xl">{titulo}</h2>
      {texto && <p className="mt-4 text-base leading-7 text-muted md:text-lg">{texto}</p>}
    </div>
  );
}

function ExploradorSectores() {
  const [activo, setActivo] = useState(SECTORES[0].id);
  const [pestana, setPestana] = useState("normas");
  const [verHistorial, setVerHistorial] = useState(false);
  const sector = SECTORES.find((s) => s.id === activo);
  const c = COLORES[sector.color];
  const Icono = ICONOS_SECTOR[sector.id];
  const vigentes = sector.normas.filter((n) => n.estado === "vigente");
  const historicas = sector.normas.filter((n) => n.estado !== "vigente");
  const PESTANAS = [
    { id: "normas", label: "Marco normativo", icon: History },
    { id: "exige", label: "Qué exige", icon: ListChecks },
    { id: "fuentes", label: "Fuentes Econfia", icon: Database },
  ];

  const escoger = (id) => {
    setActivo(id);
    setVerHistorial(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,300px)_1fr]">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" role="tablist" aria-label="Sectores">
        {SECTORES.map((s, i) => {
          const I = ICONOS_SECTOR[s.id];
          const cs = COLORES[s.color];
          const sel = s.id === activo;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={sel}
              onClick={() => escoger(s.id)}
              style={retraso(i, 50)}
              className={`norm-slide group flex min-w-[210px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 lg:min-w-0 ${
                sel ? `${cs.border} ${cs.bg} shadow-lg lg:translate-x-1` : "border-line/10 bg-surface/60 hover:border-brand/25 hover:lg:translate-x-1"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cs.bg} ${cs.text} ring-1 ${cs.ring} transition-transform duration-300 group-hover:scale-110 ${sel ? "scale-110" : ""}`}>
                <I className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-content">{s.nombre}</span>
                <span className="block truncate text-xs text-muted">{s.sigla}</span>
              </span>
            </button>
          );
        })}
      </div>

      <article key={sector.id} className="norm-card norm-up overflow-hidden" role="tabpanel">
        <div className={`norm-bar h-1.5 w-full ${c.solid}`} />
        <div className="relative z-10 p-6 md:p-8">
          <header className="flex flex-wrap items-center gap-4">
            <span className={`norm-pop norm-float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${c.bg} ${c.text} ring-1 ${c.ring}`}>
              <Icono className="h-7 w-7" />
            </span>
            <div className="norm-up min-w-0 flex-1" style={retraso(1)}>
              <h3 className="text-xl font-black text-content md:text-2xl">{sector.nombre}</h3>
              <p className="text-sm text-muted">{sector.ejemplo}</p>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {sector.sistemas.map((sis, i) => (
                <span key={sis} style={retraso(i + 3, 90)} className={`norm-pop rounded-full ${c.solid} px-3 py-1 text-xs font-black tracking-wide text-white shadow-md`}>
                  {sis}
                </span>
              ))}
            </div>
          </header>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[["Ente regulador", sector.regulador], ["Circular jurídica", sector.instrumento]].map(([titulo, valor], i) => (
              <div key={titulo} style={retraso(i + 2)} className={`norm-up rounded-2xl border-l-4 ${c.border} bg-surface/50 px-4 py-3`}>
                <dt className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">{titulo}</dt>
                <dd className="mt-1 text-sm font-black text-content">{valor}</dd>
              </div>
            ))}
          </dl>

          {sector.novedad && (
            <div style={retraso(4)} className={`norm-up mt-4 flex gap-3 rounded-2xl ${c.bg} px-4 py-3`}>
              <Sparkles className={`mt-0.5 h-4 w-4 shrink-0 ${c.text}`} />
              <p className="text-sm leading-6 text-content"><span className={`font-black ${c.text}`}>Novedad: </span>{sector.novedad}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-1 rounded-2xl bg-surface-2/60 p-1" role="tablist" aria-label="Detalle del sector">
            {PESTANAS.map(({ id, label, icon: I }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={pestana === id}
                onClick={() => setPestana(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition-all duration-300 ${
                  pestana === id ? `${c.solid} text-white shadow-md` : "text-muted hover:text-content"
                }`}
              >
                <I className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <div key={`${sector.id}-${pestana}`} className="mt-4 min-h-[170px]">
            {pestana === "normas" && (
              <div>
                <ol className="space-y-2">
                  {vigentes.map((n, i) => (
                    <li key={n.norma} style={retraso(i)} className="norm-slide flex flex-wrap items-start justify-between gap-2 rounded-xl bg-surface/60 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-content">{n.norma}</span>
                        <span className="block text-xs text-muted">{n.tema}</span>
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-black text-emerald-500">Vigente</span>
                    </li>
                  ))}
                </ol>
                {historicas.length > 0 && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setVerHistorial((v) => !v)}
                      aria-expanded={verHistorial}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                    >
                      <History className="h-3.5 w-3.5" />
                      {verHistorial ? "Ocultar historial" : `Ver historial (${historicas.length})`}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${verHistorial ? "rotate-180" : ""}`} />
                    </button>
                    {verHistorial && (
                      <ol className="mt-3 space-y-2 border-l-2 border-dashed border-line/25 pl-4">
                        {historicas.map((n, i) => (
                          <li key={n.norma} style={retraso(i)} className="norm-slide flex flex-wrap items-start justify-between gap-2">
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-muted">{n.norma}</span>
                              <span className="block text-xs text-muted/80">{n.tema}</span>
                            </span>
                            <span className="rounded-full bg-line/10 px-2.5 py-0.5 text-[11px] font-bold text-muted">Histórica</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
            )}

            {pestana === "exige" && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {sector.exige.map((e, i) => (
                  <li key={e} style={retraso(i, 60)} className="norm-up flex items-start gap-2 rounded-xl bg-surface/50 px-3 py-2.5 text-sm text-content/90">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${c.text}`} />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            )}

            {pestana === "fuentes" && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {sector.fuentes.map((f, i) => (
                    <span key={f} style={retraso(i, 60)} className={`norm-pop norm-chip rounded-full border ${c.border} ${c.bg} px-3 py-1.5 text-xs font-bold text-content`}>
                      {f}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted">
                  Además de la base para todos los sectores: {FUENTES_BASE.join(", ")}.
                </p>
              </div>
            )}
          </div>

          <footer className="mt-6 flex justify-end">
            <a
              href={sector.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line/15 px-4 py-2 text-xs font-bold text-content transition hover:border-brand/40 hover:text-brand"
            >
              Sitio del regulador <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </footer>
        </div>
      </article>
    </div>
  );
}
function Ecosistema() {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {ECOSISTEMA.map((e, i) => (
        <div key={e.nombre} className="relative">
          <div className="norm-card norm-hover h-full p-5">
            <div className="relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand">{e.nivel}</span>
              <p className="mt-2 text-lg font-black text-content">{e.nombre}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{e.detalle}</p>
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
                >
                  Sitio oficial <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          {i < ECOSISTEMA.length - 1 && (
            <ArrowRight
              aria-hidden
              className="absolute -right-3.5 top-1/2 z-20 hidden h-5 w-5 -translate-y-1/2 text-brand md:block"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Listas() {
  const claves = Object.keys(LISTAS);
  const [activa, setActiva] = useState(claves[0]);
  const lista = LISTAS[activa];
  const c = COLORES[lista.color];

  return (
    <div className="norm-card p-6 md:p-8">
      <div className="relative z-10">
        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Tipos de listas">
          {claves.map((k, i) => {
            const I = ICONOS_LISTA[k];
            const sel = k === activa;
            const ck = COLORES[LISTAS[k].color];
            return (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={sel}
                onClick={() => setActiva(k)}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-black transition ${
                  sel ? `${ck.border} ${ck.bg} ${ck.text}` : "border-line/15 text-muted hover:text-content"
                }`}
              >
                <span className="text-[11px] opacity-70">{i + 1}</span>
                <I className="h-4 w-4" />
                {LISTAS[k].titulo}
              </button>
            );
          })}
        </div>

        <div key={activa} className="norm-fade">
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-6 text-muted">{lista.descripcion}</p>
          <div className={`mt-6 grid gap-3 ${lista.items.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : "mx-auto max-w-md"}`}>
            {lista.items.map((it) => (
              <div key={it.nombre} className={`rounded-2xl border ${c.border} ${c.bg} p-4`}>
                <p className="text-sm font-black text-content">{it.nombre}</p>
                <p className="mt-1 text-xs text-muted">{it.detalle}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            <CheckCircle2 className="mr-1 inline h-4 w-4 text-brand" />
            Econfia consulta estas listas, entre más de 200 fuentes, en una sola búsqueda.
          </p>
        </div>
      </div>
    </div>
  );
}

const ICONOS_OFICIAL = [Briefcase, Cog, Target, Landmark];
const DURACION_TARJETA = 7000;

function OficialCumplimiento() {
  const bloques = OFICIAL.bloques;
  const [paso, setPaso] = useState(0);
  const [item, setItem] = useState(0);
  const [pausa, setPausa] = useState(() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });
  const [sobre, setSobre] = useState(false);
  const bloque = bloques[paso];
  const punto = bloque.puntos[item];
  const total = bloques.reduce((n, b) => n + b.puntos.length, 0);
  const posicion = bloques.slice(0, paso).reduce((n, b) => n + b.puntos.length, 0) + item + 1;
  const detenido = pausa || sobre;

  const mover = (delta) => {
    let p = paso;
    let i = item + delta;
    if (i >= bloques[p].puntos.length) {
      p = (p + 1) % bloques.length;
      i = 0;
    } else if (i < 0) {
      p = (p - 1 + bloques.length) % bloques.length;
      i = bloques[p].puntos.length - 1;
    }
    setPaso(p);
    setItem(i);
  };

  const irAPaso = (p) => {
    setPaso(p);
    setItem(0);
  };

  useEffect(() => {
    if (detenido) return undefined;
    const t = setTimeout(() => mover(1), DURACION_TARJETA);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, item, detenido]);

  const IconoPaso = ICONOS_OFICIAL[paso];

  return (
    <div
      className="norm-card overflow-hidden"
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") mover(1);
        if (e.key === "ArrowLeft") mover(-1);
      }}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      <div className="relative z-10 px-5 py-8 md:px-10">
        <p className="mx-auto max-w-2xl text-center text-base font-semibold text-content md:text-lg">{OFICIAL.resumen}</p>

        {/* Diagrama de flujo de los 4 pasos */}
        <div className="relative mx-auto mt-8 max-w-3xl">
          <div className="absolute left-[12.5%] right-[12.5%] top-6 h-1 rounded-full bg-line/15" aria-hidden />
          <div
            className="absolute left-[12.5%] top-6 h-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
            style={{ width: `${(paso / (bloques.length - 1)) * 75}%` }}
            aria-hidden
          />
          <div className="relative grid grid-cols-4" role="tablist" aria-label="Pasos del oficial de cumplimiento">
            {bloques.map((b, i) => {
              const I = ICONOS_OFICIAL[i];
              const actual = i === paso;
              const hecho = i < paso;
              return (
                <button
                  key={b.pregunta}
                  type="button"
                  role="tab"
                  aria-selected={actual}
                  onClick={() => irAPaso(i)}
                  className="group flex flex-col items-center gap-2 px-1 text-center"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      actual
                        ? "norm-pulse scale-110 border-brand bg-brand text-white"
                        : hecho
                          ? "border-brand bg-surface text-brand"
                          : "border-line/25 bg-surface text-muted group-hover:border-brand/50 group-hover:text-brand"
                    }`}
                  >
                    <I className="h-5 w-5" />
                  </span>
                  <span className={`text-xs font-black leading-tight md:text-sm ${actual ? "text-content" : "text-muted"}`}>{b.pregunta}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Carrusel de la idea actual */}
        <div className="mx-auto mt-8 max-w-2xl">
          <div key={`${paso}-${item}`} className="norm-up relative overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-brand/10 via-surface/60 to-surface/30 p-6 md:p-8" aria-live="polite">
            <div className="flex items-start gap-4">
              <span className="norm-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/15 text-brand ring-1 ring-brand/30">
                <IconoPaso className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand">
                  {bloque.pregunta} · {item + 1} de {bloque.puntos.length}
                </p>
                <h3 className="mt-1 text-xl font-black text-content md:text-2xl">{punto.titulo}</h3>
                <p className="mt-2 text-sm leading-7 text-muted md:text-base">{punto.texto}</p>
              </div>
            </div>
            {!detenido && (
              <div className="absolute bottom-0 left-0 h-1 bg-brand/60 norm-progreso" style={{ animationDuration: `${DURACION_TARJETA}ms` }} aria-hidden />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => mover(-1)} aria-label="Anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line/20 text-content transition hover:border-brand/50 hover:text-brand">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="flex gap-1.5">
                {bloque.puntos.map((pt, i) => (
                  <button key={pt.titulo} type="button" onClick={() => setItem(i)} aria-label={`Ir a ${pt.titulo}`}
                    className={`h-2 rounded-full transition-all duration-300 ${i === item ? "w-6 bg-brand" : "w-2 bg-line/30 hover:bg-brand/50"}`} />
                ))}
              </div>
              <span className="text-[11px] text-muted">{posicion} de {total}</span>
            </div>
            <button type="button" onClick={() => setPausa((v) => !v)} aria-label={pausa ? "Reproducir" : "Pausar"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line/20 text-muted transition hover:border-brand/50 hover:text-brand">
              {pausa ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => mover(1)} aria-label="Siguiente"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-md transition hover:scale-105">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Conceptos() {
  const [filtro, setFiltro] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [abierto, setAbierto] = useState(null);

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return CONCEPTOS.filter(
      (c) =>
        (grupo === "todos" || c.grupo === grupo) &&
        (!q || `${c.termino} ${c.corto} ${c.texto}`.toLowerCase().includes(q))
    );
  }, [filtro, grupo]);

  return (
    <div>
      <div className="relative mx-auto mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar: SARLAFT, UIAF, PEP, ROS…"
          aria-label="Buscar concepto"
          className="w-full rounded-full border border-line/15 bg-surface/80 py-3 pl-11 pr-4 text-sm text-content outline-none transition focus:border-brand/50"
        />
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2" role="group" aria-label="Filtrar glosario">
        {GRUPOS_GLOSARIO.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={grupo === g.id}
            onClick={() => setGrupo(g.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
              grupo === g.id ? "border-brand/50 bg-brand/15 text-brand" : "border-line/15 text-muted hover:text-content"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="text-center text-sm text-muted">No hay conceptos con ese término.</p>
      ) : (
        <div className="grid items-start gap-3 md:grid-cols-2">
          {visibles.map((c) => {
            const open = abierto === c.id;
            return (
              <div key={c.id} className={`norm-card ${open ? "border-brand/35" : ""}`}>
                <button
                  type="button"
                  onClick={() => setAbierto(open ? null : c.id)}
                  aria-expanded={open}
                  className="relative z-10 flex w-full items-center justify-between gap-3 p-5 text-left"
                >
                  <span>
                    <span className="block text-base font-black text-content">{c.termino}</span>
                    <span className="block text-xs text-muted">{c.corto}</span>
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-brand transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <p className="norm-fade relative z-10 px-5 pb-5 text-sm leading-6 text-muted">{c.texto}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LineaTiempo() {
  return (
    <ol className="relative mx-auto max-w-3xl border-l-2 border-brand/30 pl-8">
      {LINEA_TIEMPO.map((h) => (
        <li key={`${h.anio}-${h.norma}`} className="relative mb-6 last:mb-0">
          <span className="absolute -left-[42px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand ring-4 ring-brand/20" />
          <div className="norm-card norm-hover p-5">
            <div className="relative z-10">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-2xl font-black text-brand">{h.anio}</span>
                <span className="text-sm font-black text-content">{h.norma}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{h.texto}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function CentroNormativo() {
  useEffect(() => {
    const previo = document.title;
    document.title = "Centro normativo LA/FT | Econfia";
    return () => {
      document.title = previo;
    };
  }, []);

  return (
    <div className="min-h-screen text-content">
      <Header />

      <main className="relative overflow-hidden pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(var(--th-brand)/0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgb(var(--th-brand-2)/0.10),transparent_40%)]" />

        {/* Portada */}
        <section className="relative py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand">
              <Scale className="h-3.5 w-3.5" /> Centro normativo LA/FT/FPADM
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight text-content md:text-5xl">
              La normativa de cumplimiento, <span className="text-brand">clara y en un solo lugar</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted md:text-lg">
              Qué sistema le aplica a cada sector, qué listas hay que consultar y qué significa cada término.
              Pensado para oficiales de cumplimiento, talento humano y gerencia.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { n: SECTORES.length, t: "sectores explicados" },
                { n: Object.keys(LISTAS).length, t: "tipos de listas" },
                { n: CONCEPTOS.length, t: "términos en el glosario" },
                { n: LINEA_TIEMPO.length, t: "hitos normativos" },
              ].map(({ n, t }) => (
                <div key={t} className="rounded-2xl border border-line/10 bg-surface/70 px-5 py-3">
                  <span className="text-2xl font-black text-brand">{n}</span>
                  <span className="ml-2 text-sm text-muted">{t}</span>
                </div>
              ))}
            </div>
            <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Secciones">
              {SECCIONES.map(({ id, label, icon: I }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line/15 bg-surface/60 px-4 py-2 text-xs font-bold text-content transition hover:border-brand/40 hover:text-brand"
                >
                  <I className="h-3.5 w-3.5" /> {label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section id="sectores" className="relative scroll-mt-24 py-14">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Encabezado
              eyebrow="Por sector"
              titulo="¿Qué sistema le aplica a tu empresa?"
              texto="Escoge el sector y mira quién supervisa, qué norma rige y qué exige en la práctica."
            />
            <ExploradorSectores />
          </div>
        </section>

        <section id="ecosistema" className="relative scroll-mt-24 py-14">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Encabezado
              eyebrow="Quién es quién"
              titulo="Del estándar mundial a tu empresa"
              texto="Así baja la regulación contra el lavado de activos desde el GAFI hasta el sujeto obligado."
            />
            <Ecosistema />
          </div>
        </section>

        <section id="listas" className="relative scroll-mt-24 py-14">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Encabezado
              eyebrow="Listas restrictivas"
              titulo="Las cuatro categorías de listas"
              texto="No todas las listas tienen el mismo peso legal: unas son obligatorias, otras son estándar del mercado y otras completan el perfil de la contraparte."
            />
            <Listas />
          </div>
        </section>

        <section id="oficial" className="relative scroll-mt-24 py-14">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <Encabezado
              eyebrow="El rol clave"
              titulo="¿Qué hace un oficial de cumplimiento?"
              texto="Recorre los cuatro pasos: toca cada uno o deja que avance solo."
            />
            <OficialCumplimiento />
          </div>
        </section>

        <section id="conceptos" className="relative scroll-mt-24 py-14">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <Encabezado
              eyebrow="Glosario"
              titulo="Siglas y conceptos sin tecnicismos"
              texto="SARLAFT, SAGRILAFT, SIPLAFT, GAFI, UIAF y los términos que más pregunta un oficial de cumplimiento."
            />
            <Conceptos />
          </div>
        </section>

        <section id="historia" className="relative scroll-mt-24 py-14">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Encabezado
              eyebrow="Evolución"
              titulo="Línea de tiempo normativa"
              texto="Las normas que marcaron el cumplimiento LA/FT en Colombia, hasta la reforma de 2026."
            />
            <LineaTiempo />
          </div>
        </section>

        <section className="relative py-14">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <div className="flex gap-3 rounded-2xl border border-line/15 bg-surface/70 p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <p className="text-xs leading-6 text-muted">
                Contenido informativo revisado en {REVISION}. No constituye asesoría jurídica: las normas cambian
                y cada empresa debe confirmar en la fuente oficial de su supervisor qué le aplica según su actividad,
                ingresos y activos.
              </p>
            </div>

            <div className="norm-card mt-8 p-8 text-center md:p-12">
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-content md:text-4xl">Cumplir es más fácil con evidencia</h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
                  Haz la debida diligencia de tus contrapartes en minutos, con reportes verificables listos para auditoría.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <a
                    href="/contacto"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 text-base font-black text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(34,211,238,0.25)]"
                  >
                    Hablar con un asesor
                  </a>
                  <a
                    href="/precios"
                    className="rounded-full border border-line/15 bg-surface/70 px-8 py-4 text-base font-black text-content transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/10"
                  >
                    Ver planes
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
