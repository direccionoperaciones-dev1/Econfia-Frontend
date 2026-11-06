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
} from "lucide-react";
import {
  REVISION,
  SECTORES,
  CONCEPTOS,
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
`;

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.innerHTML = estilos;
  document.head.appendChild(tag);
}

const COLORES = {
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-500",    ring: "ring-cyan-500/25",    border: "border-cyan-500/40",    solid: "bg-cyan-500" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-500",    ring: "ring-blue-500/25",    border: "border-blue-500/40",    solid: "bg-blue-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", ring: "ring-emerald-500/25", border: "border-emerald-500/40", solid: "bg-emerald-500" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-500",    ring: "ring-pink-500/25",    border: "border-pink-500/40",    solid: "bg-pink-500" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-600",   ring: "ring-amber-500/25",   border: "border-amber-500/40",   solid: "bg-amber-500" },
  purple:  { bg: "bg-purple-500/10",  text: "text-purple-500",  ring: "ring-purple-500/25",  border: "border-purple-500/40",  solid: "bg-purple-500" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-500",  ring: "ring-orange-500/25",  border: "border-orange-500/40",  solid: "bg-orange-500" },
};

const ICONOS_SECTOR = {
  real: Building2,
  financiero: Landmark,
  solidario: Users,
  salud: HeartPulse,
  transporte: Truck,
  vigilancia: ShieldCheck,
  juegos: Dices,
};

const ICONOS_LISTA = { vinculantes: Scale, internacionales: Globe2, nacionales: Flag };

const SECCIONES = [
  { id: "sectores", label: "¿Qué me aplica?", icon: ListChecks },
  { id: "ecosistema", label: "Ecosistema", icon: Network },
  { id: "listas", label: "Listas restrictivas", icon: Scale },
  { id: "conceptos", label: "Conceptos clave", icon: BookOpen },
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
  const sector = SECTORES.find((s) => s.id === activo);
  const c = COLORES[sector.color];
  const Icono = ICONOS_SECTOR[sector.id];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" role="tablist" aria-label="Sectores">
        {SECTORES.map((s) => {
          const I = ICONOS_SECTOR[s.id];
          const cs = COLORES[s.color];
          const sel = s.id === activo;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={sel}
              onClick={() => setActivo(s.id)}
              className={`flex min-w-[220px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition lg:min-w-0 ${
                sel ? `${cs.border} ${cs.bg} shadow-lg` : "border-line/10 bg-surface/70 hover:border-brand/25"
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cs.bg} ${cs.text} ring-1 ${cs.ring}`}>
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

      <div key={sector.id} className="norm-card norm-fade p-6 md:p-8" role="tabpanel">
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg} ${c.text} ring-1 ${c.ring}`}>
                <Icono className="h-7 w-7" />
              </span>
              <div>
                <h3 className="text-xl font-black text-content md:text-2xl">{sector.nombre}</h3>
                <p className="text-sm text-muted">{sector.ejemplo}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {sector.sistemas.map((sis) => (
                <span key={sis} className={`rounded-full ${c.solid} px-3 py-1 text-xs font-black text-white`}>
                  {sis}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-line/10 bg-surface/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">Supervisor</p>
              <p className="mt-1 text-sm font-black text-content">{sector.supervisor}</p>
            </div>
            <div className="rounded-2xl border border-line/10 bg-surface/70 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">Norma de referencia</p>
              <p className="mt-1 text-sm font-semibold text-content">{sector.norma}</p>
            </div>
          </div>

          {sector.novedad && (
            <div className={`mt-4 flex gap-3 rounded-2xl border ${c.border} ${c.bg} p-4`}>
              <Sparkles className={`mt-0.5 h-5 w-5 shrink-0 ${c.text}`} />
              <p className="text-sm leading-6 text-content">
                <span className="font-black">Novedad: </span>
                {sector.novedad}
              </p>
            </div>
          )}

          <p className="mt-6 text-sm font-black text-content">Lo que exige en la práctica</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {sector.exige.map((e) => (
              <li key={e} className="flex items-start gap-2 text-sm text-muted">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${c.text}`} />
                <span>{e}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/10 pt-5">
            <p className="text-sm text-muted">
              <span className="font-bold text-content">Con Econfia:</span> debida diligencia y consulta de listas en una sola consulta, con evidencia descargable.
            </p>
            <a
              href={sector.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line/15 px-4 py-2 text-xs font-bold text-content transition hover:border-brand/40 hover:text-brand"
            >
              Fuente oficial <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
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
          {claves.map((k) => {
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

function Conceptos() {
  const [filtro, setFiltro] = useState("");
  const [abierto, setAbierto] = useState(null);

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return CONCEPTOS;
    return CONCEPTOS.filter((c) => `${c.termino} ${c.corto} ${c.texto}`.toLowerCase().includes(q));
  }, [filtro]);

  return (
    <div>
      <div className="relative mx-auto mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar un término: PEP, ROS, beneficiario…"
          aria-label="Buscar concepto"
          className="w-full rounded-full border border-line/15 bg-surface/80 py-3 pl-11 pr-4 text-sm text-content outline-none transition focus:border-brand/50"
        />
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
                { n: CONCEPTOS.length, t: "conceptos clave" },
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
              titulo="Vinculantes, de referencia y nacionales"
              texto="No todas las listas tienen el mismo peso legal. Esta es la diferencia."
            />
            <Listas />
          </div>
        </section>

        <section id="conceptos" className="relative scroll-mt-24 py-14">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <Encabezado eyebrow="Glosario" titulo="Conceptos clave sin tecnicismos" />
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
