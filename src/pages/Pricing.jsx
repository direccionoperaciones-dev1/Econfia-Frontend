// src/pages/Pricing.jsx
import React, { useState } from "react";
import Header from "../components/Header";
import { FaDatabase, FaBolt, FaShieldAlt, FaHeadset } from "react-icons/fa";
import { Check, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ─── Estilos globales ─── */
const STYLE_ID = "econfia-pricing-styles";
const pricingStyles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .plan-card {
    position: relative;
    overflow: visible;
    border-radius: 1.5rem;
    background: linear-gradient(160deg, rgba(15,23,42,0.85) 0%, rgba(2,6,23,0.92) 100%);
    border: 1px solid rgba(148,163,184,0.12);
    transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease;
    height: 100%;
  }
  .plan-card:hover {
    transform: translateY(-6px);
    border-color: rgba(34,211,238,0.35);
    box-shadow: 0 20px 60px rgba(8,145,178,0.2);
  }
  .plan-card.featured {
    border-color: rgba(34,211,238,0.45);
    box-shadow: 0 0 0 1px rgba(34,211,238,0.2), 0 20px 60px rgba(8,145,178,0.25);
  }
  .plan-card.featured:hover {
    transform: translateY(-8px);
    box-shadow: 0 0 0 1px rgba(34,211,238,0.4), 0 28px 80px rgba(8,145,178,0.3);
  }
  .plan-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 1.5rem;
    background: radial-gradient(circle at top right, rgba(34,211,238,0.08), transparent 40%);
    pointer-events: none;
  }
  .fade-up { animation: fadeInUp .6s ease-out both; }
`;

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.innerHTML = pricingStyles;
  document.head.appendChild(tag);
}

/* ─── Datos de planes ─── */
const PLANS = [
  {
    id: "essential",
    title: "E-ssential",
    subtitle: "Consultas puntuales a fuentes clave. Ideal para validaciones ocasionales.",
    color: "cyan",
    features: [
      "1 validación = 1 consulta",
      "Acceso a fuentes esenciales",
      "Antecedentes básicos (Policía, Procuraduría, Contraloría)",
      "Reporte PDF individual",
      "Soporte estándar",
    ],
    cta: "Empezar ahora",
    featured: false,
  },
  // Essential Express retirado del catálogo comercial (ya no se ofrece como plan).
  {
    id: "basic-element",
    title: "Basic Element",
    subtitle: "El punto de entrada a ECONFIA. Validación esencial a bajo costo.",
    color: "slate",
    features: [
      "1 validación = 1 consulta",
      "Fuentes básicas de verificación",
      "Reporte PDF individual",
      "Soporte estándar",
    ],
    cta: "Empezar ahora",
    featured: false,
  },
  {
    id: "fask",
    title: "EconfiaFast",
    subtitle: "El plan más completo y veloz. Cobertura total con prioridad máxima.",
    color: "blue",
    badge: "Popular",
    features: [
      "1 validación = 1 consulta",
      "Acceso a +200 fuentes nacionales e internacionales",
      "Listas OFAC, ONU, Interpol, PEP y SARLAFT",
      "Reporte PDF individual",
      "Reporte PDF resumen (sin capturas)",
      "Reporte PDF consolidado con capturas",
      "Resultados en tiempo real con prioridad",
      "Soporte prioritario",
    ],
    cta: "Empezar ahora",
    featured: true,
  },
  {
    id: "corefull",
    title: "E-CoreFull",
    subtitle: "Máxima cobertura para organizaciones con procesos de cumplimiento exigentes.",
    color: "indigo",
    features: [
      "1 validación = 1 consulta",
      "Acceso a +200 fuentes",
      "Listas restrictivas nacionales e internacionales",
      "Reporte PDF individual y consolidado",
      "Exportación Excel para análisis BI",
      "Resultados en tiempo real",
      "Soporte prioritario",
    ],
    cta: "Empezar ahora",
    featured: false,
  },
  {
    id: "contratista",
    title: "E-Contratista",
    subtitle: "Centraliza los documentos que necesita un contratista antes de contratar.",
    color: "purple",
    features: [
      "1 validación = 1 consulta",
      "Certificados: Contraloría, Procuraduría, Policía",
      "Medidas Correctivas y Sanciones Disciplinarias",
      "Constancias de afiliación y soportes contractuales",
      "Reporte PDF individual y auditoría",
      "Soporte prioritario",
    ],
    cta: "Empezar ahora",
    featured: false,
  },
  {
    id: "titulos",
    title: "Validación de Títulos",
    subtitle: "Verifica la autenticidad de títulos y documentos académicos para RRHH y cumplimiento.",
    color: "amber",
    features: [
      "Revisión de títulos y soportes académicos",
      "Validación documental para selección y vinculación",
      "Evidencia organizada para auditoría interna",
      "Soporte para equipos de talento humano",
      "Reporte con contexto claro para decisiones",
    ],
    cta: "Empezar ahora",
    featured: false,
  },
  {
    id: "empresa",
    title: "Empresa (RUES)",
    subtitle: "Consulta y valida información empresarial desde el registro oficial colombiano.",
    color: "emerald",
    features: [
      "Consulta desde el RUES (Registro Único Empresarial)",
      "Razón social, NIT, estado y representantes legales",
      "Validación de proveedores, aliados y terceros",
      "Reporte PDF formato ejecutivo A4",
      "Ideal para due diligence corporativo",
    ],
    cta: "Empezar ahora",
    featured: false,
  },
];

const colorText = {
  cyan:   "text-cyan-300",
  teal:   "text-teal-300",
  slate:  "text-slate-300",
  blue:   "text-blue-300",
  indigo: "text-indigo-300",
  purple: "text-purple-300",
  emerald:"text-emerald-300",
  amber:  "text-amber-300",
};
const colorBadgeBg = {
  cyan:   "from-cyan-500 to-blue-500",
  teal:   "from-teal-500 to-cyan-500",
  slate:  "from-slate-500 to-slate-600",
  blue:   "from-blue-500 to-indigo-500",
  indigo: "from-indigo-500 to-violet-500",
  purple: "from-purple-500 to-pink-500",
  emerald:"from-emerald-500 to-teal-500",
  amber:  "from-amber-500 to-orange-500",
};
const colorCheckBg = {
  cyan:   "bg-cyan-400/15 text-cyan-300",
  teal:   "bg-teal-400/15 text-teal-300",
  slate:  "bg-slate-400/15 text-slate-300",
  blue:   "bg-blue-400/15 text-blue-300",
  indigo: "bg-indigo-400/15 text-indigo-300",
  purple: "bg-purple-400/15 text-purple-300",
  emerald:"bg-emerald-400/15 text-emerald-300",
  amber:  "bg-amber-400/15 text-amber-300",
};
const colorCtaBorder = {
  cyan:   "hover:border-cyan-400/50",
  teal:   "hover:border-teal-400/50",
  slate:  "hover:border-slate-400/50",
  blue:   "hover:border-blue-400/50",
  indigo: "hover:border-indigo-400/50",
  purple: "hover:border-purple-400/50",
  emerald:"hover:border-emerald-400/50",
  amber:  "hover:border-amber-400/50",
};

/* ─── Tarjeta de plan ─── */
function PlanCard({ title, subtitle, color, badge, features, cta, featured }) {
  const navigate = useNavigate();
  return (
    <div className={`plan-card p-7 flex flex-col gap-5 ${featured ? "featured" : ""}`}>
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r ${colorBadgeBg[color]} text-white text-[11px] font-bold shadow-lg whitespace-nowrap`}>
          <Star className="w-3 h-3 fill-white" /> {badge}
        </div>
      )}

      {/* Encabezado */}
      <div className="mt-1">
        <h3 className={`text-xl font-bold ${colorText[color]}`} style={{ fontFamily: "poppins, sans-serif" }}>
          {title}
        </h3>
        <p className="text-slate-400 text-sm mt-1 leading-relaxed">{subtitle}</p>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Features */}
      <ul className="flex flex-col gap-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${colorCheckBg[color]}`}>
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span className="text-slate-300 text-sm leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => navigate("/contacto")}
        className={`mt-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
          featured
            ? `bg-gradient-to-r ${colorBadgeBg[color]} text-white hover:opacity-90 hover:shadow-lg`
            : `border border-white/15 bg-white/5 text-white hover:bg-white/10 ${colorCtaBorder[color]}`
        }`}
        style={{ fontFamily: "poppins, sans-serif" }}
      >
        {cta}
      </button>
    </div>
  );
}

/* ─── Carrusel de planes ─── */
const PER_PAGE = 3;

function PricingCarousel() {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const totalPages = Math.ceil(PLANS.length / PER_PAGE);

  const go = (d) => {
    setDir(d);
    setPage((p) => p + d);
  };

  const current = PLANS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <div className="relative">
      {/* Flechas */}
      <button
        onClick={() => go(-1)}
        disabled={page === 0}
        className={`absolute -left-5 md:-left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur flex items-center justify-center text-white transition-all hover:border-cyan-400/50 hover:bg-white/10 ${page === 0 ? "opacity-25 cursor-not-allowed" : ""}`}
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={() => go(1)}
        disabled={page === totalPages - 1}
        className={`absolute -right-5 md:-right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur flex items-center justify-center text-white transition-all hover:border-cyan-400/50 hover:bg-white/10 ${page === totalPages - 1 ? "opacity-25 cursor-not-allowed" : ""}`}
      >
        <ChevronRight size={18} />
      </button>

      {/* Cards */}
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={page}
          custom={dir}
          initial={{ opacity: 0, x: dir === 1 ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir === 1 ? -50 : 50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
        >
          {current.map((plan) => (
            <PlanCard key={plan.id} {...plan} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => { setDir(i > page ? 1 : -1); setPage(i); }}
            className={`rounded-full transition-all duration-300 ${
              i === page
                ? "w-6 h-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                : "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Contador */}
      <p className="text-center text-slate-500 text-xs mt-3">
        {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, PLANS.length)} de {PLANS.length} planes
      </p>
    </div>
  );
}

/* ─── Componente principal ─── */
export default function Pricing() {
  return (
    <div className="min-h-screen text-white">
      <Header />

      <main className="relative overflow-x-hidden pt-24 pb-20">
        {/* Fondos decorativos */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.10),transparent_40%)]" />
        <div className="pointer-events-none absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 md:px-10">

          {/* ── Encabezado ── */}
          <div className="text-center mb-10 fade-up">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300/90 mb-3">
              Planes y precios
            </p>
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent"
              style={{ fontFamily: "poppins, sans-serif" }}
            >
              Elige el plan perfecto para ti
            </h1>
            <p className="mt-5 text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Accede a más de{" "}
              <span className="text-cyan-300 font-semibold">200 fuentes oficiales</span> en tiempo real.
              Reportes profesionales, cumplimiento garantizado y{" "}
              <span className="text-cyan-300 font-semibold">resultados instantáneos</span>.
            </p>
          </div>

          {/* ── Ventajas ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12 fade-up">
            {[
              { icon: FaDatabase,  label: "200+ fuentes", sub: "Listas restrictivas y más." },
              { icon: FaBolt,      label: "Tiempo real",  sub: "Resultados en segundos."   },
              { icon: FaShieldAlt, label: "Cumplimiento", sub: "Soporte a normativas."     },
              { icon: FaHeadset,   label: "Soporte",      sub: "Acompañamiento experto."   },
            ].map(({ icon: Icon, label, sub }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-4 flex items-center gap-3 hover:border-cyan-400/30 hover:bg-white/[0.07] transition-all duration-300"
              >
                <Icon className="text-cyan-400 text-xl shrink-0" />
                <div>
                  <p className="font-semibold text-white text-sm">{label}</p>
                  <p className="text-slate-400 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Carrusel ── */}
          <PricingCarousel />

          {/* ── Nota inferior ── */}
          <p className="text-center text-slate-500 text-sm mt-10">
            ¿Necesitas un plan personalizado para tu empresa?{" "}
            <a href="/contacto" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
              Contáctanos
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
