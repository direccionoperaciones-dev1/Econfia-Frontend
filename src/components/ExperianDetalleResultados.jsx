import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  FileSearch,
  Info,
  Landmark,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnalisisFinancieroIA from "./AnalisisFinancieroIA";

function humanizeKey(key) {
  return String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function objectToText(obj) {
  return Object.values(obj || {})
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map((v) => (typeof v === "object" ? objectToText(v) : String(v)))
    .filter(Boolean)
    .join(" — ");
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "No disponible";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) {
    const parts = value
      .map((v) => (v && typeof v === "object" ? objectToText(v) : String(v ?? "")))
      .filter(Boolean);
    return parts.length ? parts.join(" · ") : "No disponible";
  }
  if (typeof value === "object") {
    const text = objectToText(value);
    return text || "No disponible";
  }
  return String(value);
}

function formatMoney(value) {
  // OJO: no usar replace(/[^\d-]/g,"") porque borra el punto decimal y convierte
  // "1313000.0" en "13130000" (×10). numericValue conserva el decimal y redondea.
  const numeric = numericValue(value);
  if (numeric === null) return displayValue(value);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function numericValue(value) {
  const raw = String(value ?? "").replace(/[^\d.-]/g, "");
  if (!raw || raw === "-" || raw === "." || raw === "-.") return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

// Devuelve el monto tal como viene de MiDecisor, YA en pesos.
// Se comprobó contra el JSON real (saldoActual "697873" = $697.873;
// cupoTotal "988690" = $988.690): vienen en pesos completos, NO en miles.
// Antes se multiplicaba ×1000 y generaba valores inflados. Único punto a ajustar
// si alguna consulta llegara en miles.
function milesAPesos(value) {
  const n = numericValue(value);
  return n === null ? 0 : n;
}

function formatPercent(value) {
  const numeric = numericValue(value);
  if (numeric === null) return displayValue(value);
  return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1)}%`;
}

function formatShortNumber(value) {
  const numeric = numericValue(value);
  if (numeric === null) return "";
  return new Intl.NumberFormat("es-CO", {
    notation: Math.abs(numeric) >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(numeric);
}

function formatPeriodLabel(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{4})[-/](\d{1,2})$/);
  if (!match) return raw;
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const year = match[1].slice(-2);
  const month = Number(match[2]);
  return `${monthNames[Math.max(0, Math.min(11, month - 1))]} ${year}`;
}

function buildTrendBars(entries) {
  const parsed = entries
    .map(([label, value]) => ({ label, value, numeric: numericValue(value) }))
    .filter((item) => item.numeric !== null && item.numeric > 0);

  if (!parsed.length) return [];

  const max = Math.max(...parsed.map((item) => item.numeric)) || 1;
  return parsed.map((item) => ({
    ...item,
    width: Math.max(8, Math.round((item.numeric / max) * 100)),
    display: formatMoney(item.value),
  }));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function compactFactsFromObject(record, keys) {
  return keys
    .map((key) => ({ label: humanizeKey(key), value: displayValue(record?.[key]) }))
    .filter((item) => item.value !== "No disponible");
}

function flattenPersonEntries(group) {
  if (!group || typeof group !== "object") return [];
  return Object.entries(group).flatMap(([bucket, values]) => {
    if (Array.isArray(values)) return values.map((value) => ({ grupo: humanizeKey(bucket), ...value }));
    if (values && typeof values === "object") return [{ grupo: humanizeKey(bucket), ...values }];
    return [];
  });
}

// ── Gauge ─────────────────────────────────────────────────────────────────────

const RATING_SCORE = { D: 50, C: 165, B: 285, BB: 430, BBB: 590, A: 760, AA: 950 };

function gaugePt(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function gaugeArc(cx, cy, r, a1, a2) {
  const s = gaugePt(cx, cy, r, a1);
  const e = gaugePt(cx, cy, r, a2);
  const large = Math.abs(a1 - a2) >= 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function gaugeColor(norm) {
  if (norm >= 0.7) return "#34d399";
  if (norm >= 0.4) return "#fbbf24";
  return "#f87171";
}

function SpeedoGauge({ value, max = 1000, displayText, label = "Score" }) {
  const CX = 100, CY = 86, R = 72, SW = 13;
  const num  = Math.min(Math.max(Number(value) || 0, 0), max);
  const norm = num / max;
  const valAngle = 180 * (1 - norm);
  const color = gaugeColor(norm);
  const z1 = 108;
  const z2 = 54;
  const needle = gaugePt(CX, CY, R - 6, valAngle);
  const iR = R - SW / 2 - 1;
  const oR = R + SW / 2 + 1;

  // arc endpoints for zone labels
  const leftY  = CY;   // y of arc left/right endpoints
  const arcTop = CY - R;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 -8 200 138" className="w-full">
        <defs>
          <linearGradient id="experian-gauge-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.9" />
          </linearGradient>
          <filter id="g-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <style>{`
          @keyframes experianGaugeDraw { to { stroke-dashoffset: 0; } }
          @keyframes experianNeedleIn {
            from { opacity: .25; transform: rotate(-16deg) scale(.82); }
            to { opacity: .95; transform: rotate(0deg) scale(1); }
          }
          @keyframes experianValueIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Background track */}
        <path d={gaugeArc(CX, CY, R, 180, 0)} fill="none" stroke="#0f172a" strokeWidth={SW} strokeLinecap="butt" />

        {/* Zone tints */}
        <path d={gaugeArc(CX, CY, R, 180, z1)} fill="none" stroke="#ef4444" strokeWidth={SW} strokeOpacity={0.22} />
        <path d={gaugeArc(CX, CY, R, z1,  z2)} fill="none" stroke="#f59e0b" strokeWidth={SW} strokeOpacity={0.22} />
        <path d={gaugeArc(CX, CY, R, z2,   0)} fill="none" stroke="#22c55e" strokeWidth={SW} strokeOpacity={0.22} />

        {/* Separator ticks */}
        {[z1, z2].map((a) => {
          const p1 = gaugePt(CX, CY, iR, a);
          const p2 = gaugePt(CX, CY, oR, a);
          return <line key={a} x1={p1.x.toFixed(1)} y1={p1.y.toFixed(1)} x2={p2.x.toFixed(1)} y2={p2.y.toFixed(1)} stroke="#020617" strokeWidth={2.5} />;
        })}

        {/* Active arc */}
        {norm > 0.005 && (
          <path
            d={gaugeArc(CX, CY, R, 180, valAngle)}
            fill="none"
            stroke="url(#experian-gauge-gradient)"
            strokeWidth={SW}
            strokeLinecap="round"
            filter="url(#g-glow)"
            strokeOpacity={0.9}
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset="100"
            style={{ animation: "experianGaugeDraw 1.05s cubic-bezier(.2,.8,.2,1) forwards" }}
          />
        )}

        {/* Needle */}
        <line x1={CX} y1={CY} x2={needle.x.toFixed(1)} y2={needle.y.toFixed(1)}
          stroke="white" strokeWidth={2.5} strokeLinecap="round" filter="url(#g-glow)" opacity={0.9}
          style={{ transformOrigin: `${CX}px ${CY}px`, animation: "experianNeedleIn .85s cubic-bezier(.2,.8,.2,1) .18s both" }} />
        <circle cx={CX} cy={CY} r={7}   fill="#020617" stroke={color} strokeWidth={2.5} />
        <circle cx={CX} cy={CY} r={2.5} fill={color} />

        {/* Zone labels — fixed, safe positions */}
        <text x="16"  y={leftY + 17} textAnchor="middle" fontSize={6.5} fill="#475569">ALTO</text>
        <text x={CX}  y={arcTop - 15} textAnchor="middle" fontSize={6.5} fill="#475569">MEDIO</text>
        <text x="184" y={leftY + 17} textAnchor="middle" fontSize={6.5} fill="#475569">BAJO</text>

        {/* Separator line before value */}
        <line x1="60" y1={CY + 16} x2="140" y2={CY + 16} stroke="#1e293b" strokeWidth={1} />

        {/* Value — clearly below pivot (pivot bottom at CY+7=93, text top at ~103) */}
        <text x={CX} y={CY + 32} textAnchor="middle" fontSize={22} fontWeight="700" fill={color}
          style={{ animation: "experianValueIn .55s ease-out .45s both" }}>
          {displayText ?? num}
        </text>
        <text x={CX} y={CY + 43} textAnchor="middle" fontSize={7} fill="#475569" letterSpacing="2">
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

// ── Metric palette ────────────────────────────────────────────────────────────

const METRIC_COLORS = {
  Viabilidad:       { top: "border-t-emerald-500/60", text: "text-emerald-500" },
  Riesgo:           { top: "border-t-amber-500/60",   text: "text-amber-500"   },
  "Monto sugerido": { top: "border-t-emerald-500/60", text: "text-emerald-500" },
  Alertas:          { top: "border-t-rose-500/60",    text: "text-rose-500"    },
};

const TONE_PALETTE = {
  emerald: { top: "border-t-emerald-500/60", text: "text-emerald-500" },
  amber:   { top: "border-t-amber-500/60",   text: "text-amber-500"   },
  rose:    { top: "border-t-rose-500/60",    text: "text-rose-500"    },
  cyan:    { top: "border-t-brand/50",    text: "text-brand"       },
};

function MetricCard({ label, value, hint, tone }) {
  // `tone` (si viene) manda sobre el color por etiqueta: así "Alertas" no se
  // pinta de rojo cuando las alertas no son realmente negativas.
  const palette = tone ? TONE_PALETTE[tone] : (METRIC_COLORS[label] ?? TONE_PALETTE.cyan);
  const Icon =
    label === "Monto sugerido" ? Wallet :
    label === "Alertas" ? AlertTriangle :
    label === "Viabilidad" ? BadgeCheck :
    Landmark;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-line/15 border-t-2 ${palette.top} bg-surface-2/70 px-5 py-4 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:bg-surface`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand/[0.06] blur-2xl transition group-hover:bg-brand/[0.10]" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line/15 bg-surface/80 text-brand shadow-inner">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{label}</div>
          <div className={`mt-2 text-2xl font-extrabold tracking-tight ${palette.text}`}>{displayValue(value)}</div>
          {hint ? <div className="mt-1.5 text-[11px] leading-4 text-muted">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value }) {
  return (
    <div className="group flex min-w-[150px] flex-col rounded-2xl border border-line/15 bg-surface-2/70 px-4 py-3 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:bg-surface">
      <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted transition group-hover:text-brand">{label}</div>
      <div className="mt-1 text-sm font-bold text-content">{displayValue(value)}</div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children, action }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-line/15 bg-surface/90 p-6 shadow-xl shadow-black/5 backdrop-blur-xl transition duration-300 hover:border-brand/20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-52 w-52 rounded-full bg-brand/[0.035] blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand/25 bg-brand/[0.08] text-brand shadow-[0_0_28px_rgba(34,211,238,0.08)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-content">{title}</h3>
            {description ? (
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="relative mt-6">{children}</div>
    </section>
  );
}

function FactGrid({ items, columns = "md:grid-cols-2 xl:grid-cols-3" }) {
  const filteredItems = items.filter(Boolean);
  if (!filteredItems.length)
    return <p className="text-sm italic text-muted">No hay información relevante para mostrar.</p>;

  return (
    <div className={`grid gap-2.5 ${columns}`}>
      {filteredItems.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="group rounded-2xl border border-line/15 bg-surface-2/70 px-5 py-4 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:bg-surface"
        >
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted transition group-hover:text-brand">
            {item.label}
          </div>
          <div className="mt-1.5 text-sm font-medium leading-snug text-content">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function AnimatedTrendBars({ items }) {
  if (!items.length) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-brand/20 bg-brand/[0.05] p-5 shadow-lg shadow-black/5">
      <style>{`
        @keyframes experianBarGrow {
          from { opacity: .35; transform: scaleX(0); }
          to { opacity: 1; transform: scaleX(1); }
        }
      `}</style>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-brand">
            Tendencia financiera
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">
            Comparativo visual de los valores más relevantes de la respuesta.
          </p>
        </div>
        <div className="hidden rounded-full border border-line/15 bg-surface/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:block">
          Barras
        </div>
      </div>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={`${item.label}-${item.display}`} className="grid gap-2">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-muted">{item.label}</span>
              <span className="font-bold text-content">{item.display}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line/10">
              <div
                className="h-full origin-left rounded-full bg-gradient-to-r from-sky-400 via-brand to-emerald-300 shadow-[0_0_24px_rgba(45,212,191,0.22)]"
                style={{
                  width: `${item.width}%`,
                  transform: "scaleX(0)",
                  animation: `experianBarGrow 800ms cubic-bezier(.2,.8,.2,1) ${index * 90}ms forwards`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactList({ items, emptyLabel = "Sin registros relevantes." }) {
  if (!items.length)
    return <p className="text-sm italic text-muted">{emptyLabel}</p>;

  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <div
          key={`${index}-${displayValue(item?.numeroDocumento || item?.nombre || item)}`}
          className="group rounded-2xl border border-line/15 bg-surface-2/70 px-5 py-4 shadow-lg shadow-black/5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-brand/25 hover:bg-surface"
        >
          {typeof item === "string" ? (
            <div className="text-sm leading-6 text-content">{item}</div>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {Object.entries(item)
                .filter(([, value]) => value !== null && value !== undefined && value !== "")
                .map(([key, value]) => (
                  <div key={key}>
                    <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted transition group-hover:text-brand">
                      {humanizeKey(key)}
                    </div>
                    <div className="mt-1 text-sm leading-snug text-content">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const GRUPO_COLORS = {
  principales:      "border-cyan-500/25 bg-cyan-500/[0.07] text-cyan-300",
  suplentes:        "border-line/20 bg-surface-2/70 text-muted",
  "empresa auditora":"border-violet-500/25 bg-violet-500/[0.07] text-violet-300",
};

function grupoColor(grupo) {
  const k = String(grupo || "").toLowerCase();
  for (const [token, cls] of Object.entries(GRUPO_COLORS)) {
    if (k.includes(token)) return cls;
  }
  return "border-line/20 bg-surface-2/70 text-muted";
}

function PersonCard({ item }) {
  if (typeof item === "string") {
    return (
      <div className="rounded-xl border border-line/15 bg-surface-2/70 px-4 py-3">
        <p className="text-sm text-content">{item}</p>
      </div>
    );
  }

  const {
    grupo,
    cargo,
    estado,
    nombre,
    apellidos,
    tipoDocumento,
    numeroDocumento,
    fechaNombramiento,
    ...rest
  } = item;

  const fullName = [nombre, apellidos].filter(Boolean).join(" ") || null;
  const docInfo  = [tipoDocumento, numeroDocumento].filter(Boolean).join(" ") || null;
  const extras   = Object.entries(rest).filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <div className="group overflow-hidden rounded-xl border border-line/15 bg-surface-2/70 transition hover:border-brand/20 hover:bg-surface">
      {/* badge strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line/10 px-4 py-2.5">
        {grupo && (
          <span className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${grupoColor(grupo)}`}>
            {grupo}
          </span>
        )}
        {cargo && <span className="text-xs font-medium text-muted">{cargo}</span>}
      </div>

      {/* body */}
      <div className="px-4 py-3">
        {fullName && <p className="mb-3 text-sm font-semibold text-content">{fullName}</p>}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {estado && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted transition group-hover:text-brand">Estado</div>
              <div className="mt-0.5 text-xs font-medium text-content">{estado}</div>
            </div>
          )}
          {docInfo && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted transition group-hover:text-brand">Documento</div>
              <div className="mt-0.5 text-xs font-medium text-content">{docInfo}</div>
            </div>
          )}
          {fechaNombramiento && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted transition group-hover:text-brand">Nombramiento</div>
              <div className="mt-0.5 text-xs font-medium text-content">{fechaNombramiento}</div>
            </div>
          )}
          {extras.map(([k, v]) => (
            <div key={k}>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted transition group-hover:text-brand">
                {humanizeKey(k)}
              </div>
              <div className="mt-0.5 text-xs font-medium text-content">
                {Array.isArray(v) ? v.join(", ") : String(v)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonList({ items, emptyLabel = "Sin registros relevantes." }) {
  if (!items.length) return <p className="text-sm italic text-muted">{emptyLabel}</p>;
  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <PersonCard key={`${index}-${item?.numeroDocumento || item?.nombre || index}`} item={item} />
      ))}
    </div>
  );
}

function JsonBlock({ title, value }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line/15 bg-[#02040a]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
        </div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-100/60">{title}</div>
      </div>
      <pre className="max-h-[26rem] overflow-auto p-4 text-[11px] leading-6 text-cyan-100/80">
        {JSON.stringify(value || {}, null, 2)}
      </pre>
    </div>
  );
}

function EvidenceDrawer({ open, onClose, detalle }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[12000] flex justify-end bg-slate-950/80 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cerrar evidencia tecnica"
        className="flex-1 cursor-default"
        onClick={onClose}
      />
      <aside className="relative h-full w-full max-w-3xl border-l border-white/[0.08] bg-[#04060f]/98 px-6 py-6 shadow-[-32px_0_80px_rgba(2,6,23,0.6)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              <div className="h-px w-4 bg-brand/50" />
              Soporte y auditoría
            </div>
            <h3 className="mt-2 text-xl font-bold text-white">Evidencia tecnica</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-400">
              Respuesta cruda almacenada para trazabilidad, soporte y revisión operativa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/[0.06] hover:text-rose-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 overflow-y-auto pb-6">
          <JsonBlock title="Resumen JSON" value={detalle?.resumen_json} />
          <JsonBlock title="Respuesta completa" value={detalle?.respuesta_json} />
        </div>
      </aside>
    </div>
  );
}

// Claves del objeto sugerencias que NO son la lista de recomendaciones.
const SUGERENCIA_VECTOR_KEYS = ["vectorSugerencias", "vector", "sugerencias", "recomendaciones", "listaSugerencias"];

function pickSugerenciaTexto(item) {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item;
  if (typeof item !== "object") return String(item);
  // Campos típicos de cada recomendación.
  const titulo = item.titulo || item.nombre || item.codigo || item.tipo || "";
  const detalle = item.descripcion || item.mensaje || item.detalle || item.texto || item.valor || "";
  const compuesto = [titulo, detalle].filter(Boolean).join(": ");
  return compuesto || objectToText(item);
}

function SugerenciasBlock({ sugerencias }) {
  if (!sugerencias || typeof sugerencias !== "object") {
    return (
      <CompactList items={safeArray(sugerencias)} emptyLabel="No se recibieron sugerencias." />
    );
  }

  // La lista de recomendaciones puede venir en distintas claves.
  let vector = [];
  for (const key of SUGERENCIA_VECTOR_KEYS) {
    if (Array.isArray(sugerencias[key]) && sugerencias[key].length) {
      vector = sugerencias[key];
      break;
    }
  }

  // Datos sueltos (conInformacion, etc.) que acompañan a la lista.
  const meta = Object.entries(sugerencias)
    .filter(([key, value]) => !SUGERENCIA_VECTOR_KEYS.includes(key))
    .map(([key, value]) => ({ label: humanizeKey(key), value: displayValue(value) }))
    .filter((item) => item.value !== "No disponible");

  const recomendaciones = vector.map(pickSugerenciaTexto).filter(Boolean);

  return (
    <div className="grid gap-4">
      {meta.length > 0 && <FactGrid items={meta} columns="md:grid-cols-2 xl:grid-cols-3" />}

      {recomendaciones.length > 0 ? (
        <div className="grid gap-2.5">
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">
            Recomendaciones
          </div>
          {recomendaciones.map((texto, index) => (
            <div
              key={`${index}-${texto.slice(0, 24)}`}
              className="flex gap-3 rounded-2xl border border-line/15 bg-surface-2/70 px-5 py-4 shadow-lg shadow-black/5 backdrop-blur-xl transition hover:border-brand/25 hover:bg-surface"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-brand/25 bg-brand/[0.08] text-[11px] font-bold text-brand">
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-content">{texto}</p>
            </div>
          ))}
        </div>
      ) : (
        meta.length === 0 && (
          <p className="text-sm italic text-muted">No se recibieron sugerencias estructuradas.</p>
        )
      )}
    </div>
  );
}

const PAYMENT_STATUS = {
  N: { label: "Al día", color: "bg-emerald-300", text: "text-emerald-200", border: "border-emerald-400/25" },
  D: { label: "Sin información", color: "bg-slate-400", text: "text-muted", border: "border-line/15" },
  "1": { label: "En mora (nivel 1)", color: "bg-yellow-300", text: "text-yellow-200", border: "border-yellow-400/25" },
  "2": { label: "En mora (nivel 2)", color: "bg-orange-400", text: "text-orange-200", border: "border-orange-400/25" },
  "30": { label: "Mora 30", color: "bg-yellow-300", text: "text-yellow-200", border: "border-yellow-400/25" },
  "60": { label: "Mora 60", color: "bg-orange-400", text: "text-orange-200", border: "border-orange-400/25" },
  "90": { label: "Mora 90 o mas", color: "bg-rose-500", text: "text-rose-200", border: "border-rose-400/25" },
};

// Texto plano de una alerta (viene como string o como objeto con .alerta).
function alertaTexto(alerta) {
  if (typeof alerta === "string") return alerta;
  return String(alerta?.alerta || Object.values(alerta || {}).filter(Boolean).join(" "));
}

// Clasifica una alerta según su significado real para la persona:
//  - "ok": buena noticia (p.ej. NO aparece en listas restrictivas).
//  - "risk": señal negativa real (mora, castigo, embargo, coincidencia en listas...).
//  - "info": novedad informativa, ni buena ni mala (p.ej. nuevas direcciones).
function classifyAlerta(alerta) {
  const text = alertaTexto(alerta).toLowerCase();
  const positivo = /(no se encuentra|sin coincidencia|no coincid|ninguna coincidencia|no presenta|no registra|no reporta|no aparece|no tiene)/.test(text);
  if (positivo) return { kind: "ok", label: "Sin novedad", explica: "Es una validación positiva: la fuente NO encontró nada negativo en este punto." };
  const riesgo = /(mora|vencid|castig|cobro jur|prejur|embargo|demanda|fallec|mal manejo|dudoso|coincid\w* con.*lista|reportad\w* negativ)/.test(text);
  if (riesgo) return { kind: "risk", label: "Requiere revisión", explica: "Es una señal negativa: conviene revisarla antes de decidir." };
  return { kind: "info", label: "Informativa", explica: "Es un dato informativo, ni bueno ni malo por sí solo." };
}

const ALERT_STYLES = {
  ok:   { wrap: "border-emerald-400/25 bg-emerald-400/[0.06]", icon: "text-emerald-400", title: "text-emerald-700 dark:text-emerald-100", Icon: CheckCircle2 },
  info: { wrap: "border-cyan-400/20 bg-cyan-400/[0.05]",       icon: "text-cyan-300",    title: "text-content",                          Icon: Info },
  risk: { wrap: "border-rose-400/25 bg-rose-400/[0.06]",       icon: "text-rose-400",    title: "text-rose-700 dark:text-rose-100",      Icon: AlertTriangle },
};

// Cuántas de las alertas son realmente de riesgo (para no pintar todo en rojo).
function contarAlertasRiesgo(alertas) {
  return safeArray(alertas).filter((a) => classifyAlerta(a).kind === "risk").length;
}

function paymentStatusFor(value) {
  const key = String(value || "").trim().toUpperCase();
  return PAYMENT_STATUS[key] || PAYMENT_STATUS.D;
}

function buildAdjudicatorDebtData(crediticio) {
  const trimestres = safeArray(crediticio?.evolucionRoPN?.trimestres);
  const cuotas = safeArray(crediticio?.evolucionSaldoCuotaPN?.trimestres);
  const cuotaByTrimester = new Map(
    cuotas.map((item) => [String(item?.trimestre || ""), milesAPesos(item?.cuotaTotal)])
  );

  return trimestres
    .map((item) => {
      const periodo = item?.trimestre || item?.periodo || item?.anioMes;
      return {
        periodo: formatPeriodLabel(periodo),
        rawPeriodo: String(periodo || ""),
        cupo: milesAPesos(item?.cupoTotal),
        saldo: milesAPesos(item?.saldoTotal),
        deuda: numericValue(item?.porcentajeDeuda) || 0,
        cuota: cuotaByTrimester.get(String(periodo || "")) || 0,
      };
    })
    .filter((item) => item.rawPeriodo);
}

function buildPaymentBehaviorData(crediticio) {
  return safeArray(crediticio?.comportamientoPago?.vectorComportamiento)
    .map((item) => {
      const status = paymentStatusFor(item?.comportamiento);
      return {
        periodo: formatPeriodLabel(item?.anioMes),
        code: String(item?.comportamiento || "-").toUpperCase(),
        ...status,
      };
    })
    .filter((item) => item.periodo)
    .slice(-14);
}

function AdjudicatorTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-line/15 bg-surface px-4 py-3 text-xs shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="mb-2 font-bold text-content">{label}</div>
      <div className="grid gap-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex min-w-[190px] items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-content">
              {entry.dataKey === "deuda" ? formatPercent(entry.value) : formatMoney(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Estimación de ingreso mensual + capacidad: cuánto del ingreso se va en cuotas
// y cuánto queda disponible. Elegante y honesto (usa solo datos reales).
function MonthlyCapacity({ ingreso, cuotaVsIngreso }) {
  const ing = numericValue(ingreso) || 0;
  if (ing <= 0) return null;
  const semestral = ing * 6;
  const pct = Math.max(0, Math.min(100, numericValue(cuotaVsIngreso) || 0));
  const cuota = Math.round((ing * pct) / 100);
  const disponible = Math.max(0, ing - cuota);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/15 bg-surface-2/70 p-5 shadow-lg shadow-black/5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-300/50 via-brand/25 to-transparent" />
      <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">Ingreso mensual estimado</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tracking-tight text-content">{formatMoney(ing)}</span>
        <span className="text-xs font-semibold text-muted">/ mes</span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-muted">Estimación de la fuente sobre los últimos ~6 meses.</p>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-brand/20 bg-brand/[0.05] px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Ingreso semestral estimado (×6)</span>
        <span className="text-sm font-black text-brand">{formatMoney(semestral)}</span>
      </div>

      <div className="mt-4 flex h-3.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line/10">
        {pct > 0 && (
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300" style={{ width: `${pct}%` }} />
        )}
        <div className="h-full flex-1 bg-gradient-to-r from-brand to-emerald-400" />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-amber-300">Cuotas {formatMoney(cuota)}</span>
        <span className="text-emerald-300">Disponible {formatMoney(disponible)}</span>
      </div>
    </div>
  );
}

function IncomeGauge({ ingreso, cuotaVsIngreso }) {
  const percent = numericValue(cuotaVsIngreso) || 0;
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line/15 bg-surface-2/70 p-5 shadow-lg shadow-black/5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand/60 via-emerald-300/30 to-transparent" />
      <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">
        Analisis de ingresos
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-content">{formatMoney(ingreso)}</div>
      <p className="mt-1 text-xs leading-5 text-muted">
        Ingreso mensual <strong>estimado por la fuente</strong> (promedio de los últimos ~6 meses),
        a partir de su comportamiento financiero — no es el salario que declara la persona.
        Se compara contra la cuota mensual de sus créditos.
      </p>

      <div className="mt-5 flex items-end gap-5">
        <div className="relative h-36 w-16 overflow-hidden rounded-2xl border border-line/15 bg-surface p-1.5">
          <div className="absolute inset-x-2 bottom-2 top-2 grid grid-rows-5 gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="rounded bg-surface-2" />
            ))}
          </div>
          <div
            className="absolute inset-x-1.5 bottom-1.5 rounded-xl bg-gradient-to-t from-brand to-emerald-300 shadow-[0_0_26px_rgba(45,212,191,0.28)] transition-all duration-700"
            style={{ height: `${Math.max(5, clamped)}%` }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-3xl font-black text-cyan-200">{formatPercent(percent)}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
            Cuota vs ingreso
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-emerald-300 transition-all duration-700"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] leading-4 text-muted">
            {percent <= 0
              ? "0% significa que hoy NO tiene cuotas de crédito activas: sus deudas actuales no comprometen su ingreso. Es una señal buena."
              : `Sus cuotas mensuales equivalen al ${formatPercent(percent)} de su ingreso. Entre más bajo, mayor capacidad para asumir un nuevo crédito.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdjudicatorCreditBehaviorPanel({ context, detalle }) {
  const crediticio = context?.respuesta?.comportamientoCrediticio || {};
  const chartData = buildAdjudicatorDebtData(crediticio);
  const paymentData = buildPaymentBehaviorData(crediticio);
  const ingreso = context?.endeudamiento?.ingreso || detalle?.ingreso_estimado;
  const cuotaVsIngreso = context?.endeudamiento?.porcentajeCuotaVsIngreso || detalle?.porcentaje_cuota_vs_ingreso;
  const hasVisualData = chartData.length || paymentData.length || ingreso || context.alertas.length;

  if (!hasVisualData) return null;

  return (
    <SectionCard
      icon={AlertTriangle}
      title="Endeudamiento y comportamiento de pago"
      description="Cómo ha evolucionado su deuda trimestre a trimestre. Cupo = cuánto crédito le han aprobado; Saldo = cuánto debe; % deuda = qué parte del cupo está usando. Si cupo y saldo están en $0, quiere decir que en ese período no tenía créditos con saldo reportado."
      action={
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-1.5 text-xs font-semibold text-emerald-200">
          Econfia Adjudicator
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.05] p-5 shadow-lg shadow-black/5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-brand">
                Evolucion de cupo, saldo y deuda
              </div>
              <p className="mt-1 text-xs leading-5 text-muted">
                Eje izquierdo = pesos ($ cupo y saldo). Eje derecho = % de deuda. Cada punto es un trimestre.
                La línea azul es el cupo, las barras verdes el saldo y la línea naranja punteada el % usado.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-sky-400" />Cupo</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" />Saldo</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" />% deuda</span>
            </div>
          </div>

          {chartData.length ? (
            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 18, right: 8, bottom: 6, left: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.13)" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fill: "rgb(var(--th-muted))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="money"
                    tick={{ fill: "rgb(var(--th-muted))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatShortNumber}
                    width={58}
                  />
                  <YAxis
                    yAxisId="percent"
                    orientation="right"
                    tick={{ fill: "rgb(var(--th-muted))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                    width={42}
                  />
                  <Tooltip content={<AdjudicatorTooltip />} cursor={{ fill: "rgba(56,189,248,0.06)" }} />
                  <Bar
                    yAxisId="money"
                    dataKey="saldo"
                    name="Saldo total"
                    barSize={24}
                    radius={[8, 8, 2, 2]}
                    fill="#2dd4bf"
                    fillOpacity={0.42}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="cupo"
                    name="Cupo total"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#67e8f9", stroke: "#082f49", strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="percent"
                    type="monotone"
                    dataKey="deuda"
                    name="% deuda"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    strokeDasharray="7 5"
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm italic text-muted">
              No se recibio evolución trimestral estructurada.
            </p>
          )}

          {paymentData.length ? (
            <div className="mt-5 border-t border-line/10 pt-4">
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">
                Comportamiento de pago mensual
              </div>
              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-300" />Al día (N)</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-yellow-300" />En mora (1, 2, 3…)</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-400" />Sin información (—)</span>
              </div>
              <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(64px,1fr))]">
                {paymentData.map((item) => (
                  <div
                    key={`${item.periodo}-${item.code}`}
                    title={`${item.periodo}: ${item.label}`}
                    className={`rounded-xl border ${item.border} bg-surface-2/70 px-2 py-2 text-center`}
                  >
                    <div className={`mx-auto h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <div className="mt-1.5 text-[9px] font-semibold text-muted">{item.periodo}</div>
                    <div className={`mt-0.5 text-[10px] font-black ${item.text}`}>{item.code}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4">
          <IncomeGauge ingreso={ingreso} cuotaVsIngreso={cuotaVsIngreso} />
          <MonthlyCapacity ingreso={ingreso} cuotaVsIngreso={cuotaVsIngreso} />
          <div className="rounded-2xl border border-line/15 bg-surface-2/70 p-5 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">Alertas</div>
                <div className="mt-1 text-2xl font-black text-content">{context.alertas.length}</div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                context.alertas.length ? "bg-amber-400/[0.10] text-amber-600 dark:text-amber-200" : "bg-emerald-400/[0.10] text-emerald-600 dark:text-emerald-200"
              }`}>
                {context.alertas.length ? "Revisar" : "Sin alertas"}
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {context.alertas.length ? (
                context.alertas.slice(0, 3).map((alerta, index) => (
                  <div key={`${index}-${alerta?.alerta || alerta}`} className="rounded-xl border border-amber-400/15 bg-amber-400/[0.045] px-4 py-3">
                    <div className="text-xs font-bold text-amber-700 dark:text-amber-100">{displayValue(alerta?.alerta || alerta)}</div>
                    {alerta?.colocacion || alerta?.modificacion ? (
                      <div className="mt-1 text-[11px] text-muted">
                        {[alerta?.colocacion, alerta?.modificacion].filter(Boolean).join(" | ")}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm italic text-muted">No se reportaron alertas para esta consulta.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function buildExecutiveMetrics(detalle, isPj, alertas = []) {
  const totalAlertas = safeArray(alertas).length || Number(detalle?.cantidad_alertas || 0);
  const alertasRiesgo = contarAlertasRiesgo(alertas);
  // Rojo solo si hay alertas realmente negativas; si no, ámbar (hay novedades
  // informativas) o verde (ninguna alerta).
  const alertaTone = alertasRiesgo > 0 ? "rose" : (totalAlertas > 0 ? "amber" : "emerald");
  const alertaHint = alertasRiesgo > 0
    ? `${alertasRiesgo} de ${totalAlertas} requieren revisión.`
    : (totalAlertas > 0 ? "Novedades informativas, ninguna negativa." : "Sin novedades reportadas.");
  const montoHint = "Valor de crédito que el modelo sugiere según su capacidad de pago.";

  if (isPj) {
    return [
      { label: "Riesgo",         value: detalle?.nivel_riesgo || detalle?.resumen_json?.nivel, hint: "Nivel de riesgo estimado de la empresa." },
      { label: "Monto sugerido", value: formatMoney(detalle?.monto_sugerido || detalle?.resumen_json?.monto_sugerido), hint: montoHint },
      { label: "Alertas",        value: totalAlertas, hint: alertaHint, tone: alertaTone },
    ];
  }
  return [
    { label: "Viabilidad",     value: detalle?.viabilidad || detalle?.resumen_json?.viabilidad, hint: "Qué tan viable es otorgarle crédito (ALTA = buen perfil)." },
    { label: "Monto sugerido", value: formatMoney(detalle?.monto_sugerido || detalle?.resumen_json?.monto_sugerido), hint: montoHint },
    { label: "Alertas",        value: totalAlertas, hint: alertaHint, tone: alertaTone },
  ];
}

function buildGaugeProps(detalle, isPj) {
  if (isPj) {
    const ratingStr = String(detalle?.rating || detalle?.resumen_json?.rating || "").toUpperCase();
    return { value: RATING_SCORE[ratingStr] ?? 0, max: 1000, displayText: ratingStr || "—", label: "Rating" };
  }
  const score = Number(detalle?.score_valor || detalle?.resumen_json?.score) || 0;
  return { value: score, max: 1000, label: "Score" };
}

// Glosario del Adjudicator (Tabla 12 ratingRecaudos + términos generales).
const ADJ_GLOSARIO = [
  ["Score", "Puntaje de riesgo de 0 a 1000 (entre más alto, mejor perfil y menor riesgo)."],
  ["Viabilidad ALTA / MEDIA / BAJA", "Recomendación de otorgamiento según el perfil (ALTA = favorable)."],
  ["Rating recaudo A", "Suele cumplir solo con el envío de la factura."],
  ["Rating recaudo B", "Cumple con la factura + un recordatorio de pago amable."],
  ["Rating recaudo C", "Cumple con la factura + cobranza contundente (intensidad alta)."],
  ["Rating recaudo D", "Requiere reestructuración o acuerdo de pago."],
  ["Rating recaudo N", "Sin información suficiente para calificar."],
  ["Ingreso mensual estimado", "Lo calcula la fuente (Experian) según el comportamiento financiero, no el salario declarado."],
  ["Ingreso semestral estimado", "Proyección del ingreso mensual a 6 meses (mensual ×6)."],
  ["Cuota vs. ingreso", "Parte del ingreso que se va en cuotas (0% = sin cuotas activas)."],
  ["% de deuda", "Porcentaje del cupo aprobado que está usando."],
  ["Monto sugerido", "Crédito que el modelo sugiere según su capacidad de pago."],
  ["Créditos vigentes / cerrados", "Obligaciones activas / ya pagadas o canceladas."],
  ["Comportamiento: N", "Mes al día (normal)."],
  ["Comportamiento: 1, 2, 3…", "Meses de mora (a mayor número, mayor atraso)."],
  ["Comportamiento: —", "Mes sin información reportada."],
];

export default function ExperianDetalleResultados({ consultaId }) {
  const API_URL = process.env.REACT_APP_API_URL;
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDetalle() {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/experian/consultas/${consultaId}/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || data?.error || `Error HTTP: ${response.status}`);
        }

        if (!cancelled) setDetalle(data);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "No fue posible cargar el detalle de Econfia Adjudicator.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetalle();
    return () => { cancelled = true; };
  }, [API_URL, consultaId]);

  const context = useMemo(() => {
    const respuesta = detalle?.respuesta_json?.content?.respuesta || {};
    const validacion = respuesta?.validacion || {};
    return {
      respuesta,
      validacion,
      datosBasicos:       validacion?.datosBasicos || {},
      perfilGeneral:      validacion?.perfilGeneral || {},
      matricula:          validacion?.matricula || {},
      datosContacto:      validacion?.datosContacto || {},
      informacionRiesgo:  respuesta?.informacionRiesgo || {},
      comportamiento:     respuesta?.comportamientoCrediticio?.indicadoresValores || {},
      endeudamiento:      respuesta?.endeudamiento || {},
      sugerencias:        respuesta?.sugerencias || {},
      estadosFinancieros: respuesta?.estadosFinancieros || {},
      socios:             safeArray(validacion?.socios?.sociosAccionistas || respuesta?.socios),
      representantes:     flattenPersonEntries(validacion?.representanteLegal || respuesta?.representantes),
      juntaDirectiva:     flattenPersonEntries(validacion?.juntaDirectiva),
      revisoriaFiscal:    flattenPersonEntries(validacion?.revisoriaFiscal),
      mallaVinculos:      respuesta?.mallaVinculos || {},
      alertas:            safeArray(respuesta?.informacionRiesgo?.alertas),
    };
  }, [detalle]);

  const isPj = detalle?.tipo_resultado === "pj";
  const displayName =
    context.datosBasicos?.nombreCompleto ||
    context.datosBasicos?.razonSocial ||
    detalle?.apellido_razon_social ||
    detalle?.numero_identificacion;
  const metrics    = useMemo(() => buildExecutiveMetrics(detalle, isPj, context.alertas), [detalle, isPj, context.alertas]);
  const gaugeProps = useMemo(() => buildGaugeProps(detalle, isPj),       [detalle, isPj]);

  const summaryFacts = useMemo(() => {
    if (isPj) {
      return [
        { label: "Actividad economica",  value: displayValue(context.perfilGeneral?.actividadEconomica) },
        { label: "Organizacion juridica", value: displayValue(context.perfilGeneral?.organizacionJuridica) },
        { label: "Empleados",            value: displayValue(context.perfilGeneral?.rangosEmpleados || context.perfilGeneral?.numeroEmpleados) },
        { label: "Capital pagado",        value: formatMoney(context.perfilGeneral?.capitalPagado) },
      ].filter((item) => item.value !== "No disponible");
    }
    return compactFactsFromObject(detalle?.resumen_json || {}, ["score", "viabilidad", "monto_sugerido", "segmento"]);
  }, [context.perfilGeneral, detalle?.resumen_json, isPj]);

  const validationFacts = useMemo(() => {
    const base = [
      { label: "Documento",          value: `${detalle?.tipo_identificacion || ""} ${detalle?.numero_identificacion || ""}`.trim() },
      { label: isPj ? "Razon social" : "Titular", value: displayValue(context.datosBasicos?.nombreCompleto || context.datosBasicos?.razonSocial || detalle?.apellido_razon_social) },
      { label: "Estado interno",     value: displayValue(detalle?.estado) },
      { label: "Respuesta del producto", value: displayValue(detalle?.status_experian) },
      { label: "Estado contenido",   value: displayValue(detalle?.content_status) },
      { label: "Mensaje",            value: displayValue(detalle?.mensaje) },
    ];

    if (isPj) {
      return [
        ...base,
        ...compactFactsFromObject(context.matricula, ["camaraComercio", "numero", "estado", "ultimaRenovacion"]),
        ...compactFactsFromObject(context.datosContacto, ["ciudad", "telefono", "email"]),
      ];
    }

    return [...base, ...compactFactsFromObject(context.datosBasicos, Object.keys(context.datosBasicos || {}).slice(0, 4))];
  }, [
    context.datosBasicos,
    context.datosContacto,
    context.matricula,
    detalle?.apellido_razon_social,
    detalle?.content_status,
    detalle?.estado,
    detalle?.mensaje,
    detalle?.numero_identificacion,
    detalle?.status_experian,
    detalle?.tipo_identificacion,
    isPj,
  ]);

  const riskFacts = useMemo(() => [
    ...compactFactsFromObject(context.informacionRiesgo, ["rating", "nivel", "puntajeScore", "ratingRiesgoSectorial"]),
    ...compactFactsFromObject(context.comportamiento, ["creditosVigentes", "creditosCerrados", "saldoActual", "valorCuota", "porcentajeDeuda"]).map(
      (item) =>
        item.label.toLowerCase().includes("saldo") || item.label.toLowerCase().includes("cuota")
          ? { ...item, value: formatMoney(milesAPesos(item.value)) }
          : item
    ),
  ], [context.comportamiento, context.informacionRiesgo]);

  const sectoresConCredito = useMemo(
    () =>
      safeArray(context.comportamiento?.sectores).filter(
        (s) =>
          Number(s?.creditosVigentes || 0) +
            Number(s?.creditosCerrados || 0) +
            Number(s?.totalPrincipal || 0) >
          0
      ),
    [context.comportamiento]
  );

  const financeFacts = useMemo(() => {
    if (isPj) {
      return compactFactsFromObject(context.estadosFinancieros, [
        "ventasNetas", "utilidadOperacional", "utilidadNeta", "activosTotales", "pasivosTotales", "patrimonio",
      ]).map((item) => ({ ...item, value: formatMoney(item.value) }));
    }
    return compactFactsFromObject(context.endeudamiento, Object.keys(context.endeudamiento || {})).map((item) => ({
      ...item,
      value: item.label.toLowerCase().includes("porcentaje") ? formatPercent(item.value) : formatMoney(item.value),
    }));
  }, [context.endeudamiento, context.estadosFinancieros, isPj]);

  const trendBars = useMemo(() => {
    if (isPj) {
      return buildTrendBars([
        ["Ventas netas", context.estadosFinancieros?.ventasNetas],
        ["Utilidad operacional", context.estadosFinancieros?.utilidadOperacional],
        ["Utilidad neta", context.estadosFinancieros?.utilidadNeta],
        ["Activos totales", context.estadosFinancieros?.activosTotales],
        ["Pasivos totales", context.estadosFinancieros?.pasivosTotales],
        ["Patrimonio", context.estadosFinancieros?.patrimonio],
      ]);
    }

    return buildTrendBars([
      // Todos ya vienen en pesos (milesAPesos solo normaliza el número).
      ["Saldo actual", milesAPesos(context.comportamiento?.saldoActual || context.endeudamiento?.saldoActual)],
      ["Valor cuota", milesAPesos(context.comportamiento?.valorCuota || context.endeudamiento?.valorCuota)],
      ["Monto sugerido", detalle?.monto_sugerido || detalle?.resumen_json?.monto_sugerido],
      ["Saldo en mora", milesAPesos(context.comportamiento?.saldoMora || context.endeudamiento?.saldoMora)],
    ]);
  }, [context.comportamiento, context.endeudamiento, context.estadosFinancieros, detalle?.monto_sugerido, detalle?.resumen_json, isPj]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full border border-brand/25" />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-t-brand border-slate-800" />
          </div>
          <p className="text-sm font-semibold text-content">Cargando Econfia Adjudicator</p>
          <p className="mt-1 text-xs text-muted">Un momento por favor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/[0.05] p-8 text-center shadow-[0_0_40px_rgba(244,63,94,0.07)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/[0.08]">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-content">Error al cargar Econfia Adjudicator</h3>
          <p className="mt-2 text-sm leading-6 text-rose-200/70">{error}</p>
        </div>
      </div>
    );
  }

  if (!detalle) return null;

  return (
    <>
      <div className="h-full overflow-y-auto pr-1">
        <div className="grid gap-4 pb-8">

          {/* ── Hero header ─────────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-[30px] border border-line/15 bg-surface/90 px-6 py-7 shadow-2xl shadow-black/5 backdrop-blur-xl md:px-8 md:py-8">
            <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-brand/[0.055] blur-3xl" />
            <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-violet-500/[0.035] blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

            <div className="relative grid gap-6 xl:grid-cols-[1.35fr_330px_300px] xl:items-stretch">
              {/* ── Left: identity ───────────────────────────────────────── */}
              <div className="flex min-w-0 flex-col justify-center">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.08] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-brand shadow-[0_0_30px_rgba(34,211,238,0.08)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Econfia Adjudicator
                </div>

                <h2 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-content md:text-4xl md:leading-tight">
                  {displayName}
                </h2>

                <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
                  Lectura consolidada para decisión comercial — validación, riesgo y capacidad financiera en una sola vista.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <StatBadge
                    label="Documento"
                    value={`${detalle.tipo_identificacion || ""} ${detalle.numero_identificacion || ""}`.trim()}
                  />
                  <StatBadge label="Resultado" value={isPj ? "Persona jurídica" : "Persona natural"} />
                  <StatBadge label="Estado" value={detalle.estado} />
                </div>
              </div>

              {/* ── Center: gauge ───────────────────────────────────────── */}
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[26px] border border-line/15 bg-surface-2/70 p-5 shadow-lg shadow-black/5 backdrop-blur-xl">
                <SpeedoGauge {...gaugeProps} />
                <p className="mt-3 max-w-[280px] text-center text-[11px] leading-4 text-muted">
                  {isPj
                    ? "Rating de riesgo de la empresa. Mientras mejor la letra (AA es lo más alto), menor es el riesgo."
                    : "Puntaje de 0 a 1000. Entre más alto, mejor es el perfil y menor el riesgo. La aguja hacia “BAJO” (derecha) significa riesgo bajo."}
                </p>
              </div>

              {/* ── Right: metric cards ─────────────────────────────────── */}
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setShowEvidence(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line/15 bg-surface-2/70 px-4 py-3 text-sm font-semibold text-content shadow-lg shadow-black/5 transition hover:border-brand/25 hover:bg-surface hover:text-brand"
                >
                  <FileSearch className="h-4 w-4 text-brand" />
                  Ver evidencia tecnica
                </button>
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} tone={metric.tone} />
                ))}
                <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] px-5 py-4 text-sm leading-6 text-muted shadow-lg shadow-black/5">
                  <span className="font-semibold text-brand">Nivel de lectura:</span>{" "}
                  úselo como apoyo para la decisión; no reemplaza el análisis crediticio completo.
                </div>
              </div>
            </div>
          </section>

          <AnalisisFinancieroIA producto="adjudicator" consultaId={consultaId} />

          <SectionCard
            icon={AlertTriangle}
            title="Alertas"
            description="Novedades y validaciones que la fuente reportó. Ojo: no todas son malas — una validación en verde significa que NO se encontró nada negativo."
            action={
              (() => {
                const riesgo = contarAlertasRiesgo(context.alertas);
                const total = context.alertas.length;
                const cls = riesgo > 0
                  ? "border-rose-500/30 bg-rose-500/[0.07] text-rose-600 dark:text-rose-300"
                  : total > 0
                    ? "border-brand/30 bg-brand/[0.07] text-brand dark:text-brand"
                    : "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-300";
                const txt = riesgo > 0
                  ? `${riesgo} por revisar`
                  : total > 0 ? `${total} informativa${total !== 1 ? "s" : ""}` : "Sin alertas";
                return <div className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${cls}`}>{txt}</div>;
              })()
            }
          >
            {context.alertas.length ? (
              <div className="grid gap-2.5">
                {context.alertas.map((alerta, index) => {
                  const cls = classifyAlerta(alerta);
                  const style = ALERT_STYLES[cls.kind];
                  const AIcon = style.Icon;
                  return (
                    <div key={`alerta-${index}`} className={`rounded-xl border ${style.wrap} px-4 py-3`}>
                      <div className="flex items-start gap-2.5">
                        <AIcon className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon}`} />
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${style.title}`}>
                            {displayValue(alerta?.alerta || alerta)}
                          </div>
                          <div className="mt-1 text-[11px] leading-4 text-muted">{cls.explica}</div>
                          {alerta?.colocacion || alerta?.modificacion ? (
                            <div className="mt-1 text-[11px] text-muted">
                              {[alerta?.colocacion, alerta?.modificacion].filter(Boolean).join(" · ")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm italic text-muted">No se reportaron alertas para esta consulta.</p>
            )}
          </SectionCard>

          <SectionCard
            icon={Briefcase}
            title="Resumen ejecutivo"
            description="Variables de negocio destacadas para una lectura inicial rápida."
          >
            <FactGrid items={summaryFacts} />
          </SectionCard>

          <SectionCard
            icon={isPj ? Building2 : UserRound}
            title="Identificación y validación"
            description="Datos base de la consulta, estado de respuesta y referencias principales."
          >
            <FactGrid items={validationFacts} />
          </SectionCard>

          {!isPj ? <AdjudicatorCreditBehaviorPanel context={context} detalle={detalle} /> : null}

          <SectionCard
            icon={Landmark}
            title="Riesgo"
            description="Señales de perfil crediticio y comportamiento reportado por la consulta."
            action={
              <div
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                  context.alertas.length
                    ? "border-amber-500/30 bg-amber-500/[0.07] text-amber-300"
                    : "border-line/15 bg-surface-2/70 text-muted"
                }`}
              >
                {context.alertas.length
                  ? `${context.alertas.length} alerta${context.alertas.length !== 1 ? "s" : ""} registrada${context.alertas.length !== 1 ? "s" : ""}`
                  : "Sin alertas estructuradas"}
              </div>
            }
          >
            <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <FactGrid items={riskFacts} columns="md:grid-cols-2" />
              <div className="rounded-xl border border-line/15 bg-surface-2/70 p-4">
                <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">Alertas</div>
                <div className="mt-3">
                  <CompactList
                    items={context.alertas.map((alerta) =>
                      typeof alerta === "string"
                        ? alerta
                        : Object.values(alerta || {}).filter(Boolean).join(" | ")
                    )}
                    emptyLabel="No se reportaron alertas estructuradas en esta respuesta."
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {sectoresConCredito.length ? (
            <SectionCard
              icon={Landmark}
              title="Detalle de créditos por sector"
              description="Distribución de los créditos vigentes y cerrados según el sector reportado por la fuente."
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                      <th className="pb-2 pr-4 font-semibold">Sector</th>
                      <th className="pb-2 px-3 text-center font-semibold">Vigentes</th>
                      <th className="pb-2 px-3 text-center font-semibold">Cerrados</th>
                      <th className="pb-2 px-3 text-right font-semibold">Valor inicial</th>
                      <th className="pb-2 pl-3 text-right font-semibold">Saldo actual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectoresConCredito.map((s, i) => (
                      <tr key={`sector-${i}`} className="border-t border-line/10">
                        <td className="py-2.5 pr-4 font-semibold text-content">{displayValue(s?.sector)}</td>
                        <td className="py-2.5 px-3 text-center text-content">{s?.creditosVigentes ?? "0"}</td>
                        <td className="py-2.5 px-3 text-center text-content">{s?.creditosCerrados ?? "0"}</td>
                        <td className="py-2.5 px-3 text-right text-muted">{formatMoney(milesAPesos(s?.valorInicial))}</td>
                        <td className="py-2.5 pl-3 text-right text-muted">{formatMoney(milesAPesos(s?.saldoActual))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] italic text-muted">
                Los créditos se presentan agrupados por sector, permitiendo una lectura clara de la información financiera sin detallar el nombre específico de cada entidad.
              </p>
            </SectionCard>
          ) : null}

          <SectionCard
            icon={Wallet}
            title="Finanzas"
            description={
              isPj
                ? "Resumen financiero consolidado para lectura comercial."
                : "Indicadores usados por el análisis. Ingreso = ingreso mensual estimado por la fuente (no el salario declarado). Porcentaje cuota vs ingreso = qué parte de ese ingreso se va en pagar cuotas (0 = sin cuotas activas). Monto sugerido = crédito recomendado según su capacidad."
            }
          >
            <FactGrid items={financeFacts} />
            <AnimatedTrendBars items={trendBars} />
          </SectionCard>

          {!isPj ? (
            <SectionCard
              icon={BadgeCheck}
              title="Sugerencias"
              description="Recomendaciones devueltas para apoyo en la decisión."
            >
              <SugerenciasBlock sugerencias={context.sugerencias} />
            </SectionCard>
          ) : (
            <SectionCard
              icon={UserRound}
              title="Relacionados"
              description="Partes vinculadas y órganos relevantes de la persona jurídica."
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-surface-2" />
                      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">Socios</div>
                      <div className="h-px flex-1 bg-surface-2" />
                    </div>
                    <PersonList items={context.socios} emptyLabel="Sin socios estructurados." />
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-surface-2" />
                      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">Representación legal</div>
                      <div className="h-px flex-1 bg-surface-2" />
                    </div>
                    <PersonList items={context.representantes} emptyLabel="Sin representantes estructurados." />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-surface-2" />
                      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">Junta directiva</div>
                      <div className="h-px flex-1 bg-surface-2" />
                    </div>
                    <PersonList items={context.juntaDirectiva} emptyLabel="Sin junta estructurada." />
                  </div>
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-surface-2" />
                      <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">Revisoría fiscal y vínculos</div>
                      <div className="h-px flex-1 bg-surface-2" />
                    </div>
                    <PersonList
                      items={[
                        ...context.revisoriaFiscal,
                        ...safeArray(context.mallaVinculos?.linkedRestrictiveSummary),
                      ]}
                      emptyLabel="Sin novedades estructuradas."
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {!isPj && (
            <SectionCard
              icon={Info}
              title="Glosario — ¿qué significan estos términos?"
              description="Referencia rápida de los códigos y calificaciones que usa la fuente en este análisis."
            >
              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
                {ADJ_GLOSARIO.map(([sigla, significado]) => (
                  <div key={sigla} className="rounded-2xl border border-line/15 bg-surface-2/70 px-4 py-3">
                    <div className="text-xs font-bold text-brand">{sigla}</div>
                    <div className="mt-0.5 text-xs leading-snug text-content">{significado}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <div className="rounded-2xl border border-line/15 bg-surface-2/60 px-5 py-4 text-center text-[11px] leading-5 text-muted">
            Fuente oficial de la información: <strong className="text-content">Central de Riesgo</strong> (NIT 900.422.614-8).
            Consulta realizada bajo autorización del titular.
          </div>
        </div>
      </div>  

      <EvidenceDrawer
        open={showEvidence}
        onClose={() => setShowEvidence(false)}
        detalle={detalle}
      />
    </>
  );
}
