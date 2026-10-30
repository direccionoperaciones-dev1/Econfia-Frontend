import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CreditCard,
  Landmark,
  PiggyBank,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AnalisisFinancieroIA from "./AnalisisFinancieroIA";

// ── Helpers ─────────────────────────────────────────────────────────────────

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

// Busca la primera aparición de `key` en cualquier nivel del objeto.
// Así funciona sin importar si la respuesta viene bajo ReportHDCplus,
// productResult, o directo.
function deepFind(root, key) {
  const stack = [root];
  while (stack.length) {
    const node = stack.shift();
    if (Array.isArray(node)) {
      for (const v of node) if (v && typeof v === "object") stack.push(v);
    } else if (node && typeof node === "object") {
      if (node[key] !== undefined) return node[key];
      for (const v of Object.values(node)) if (v && typeof v === "object") stack.push(v);
    }
  }
  return undefined;
}

function fmtMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function numValue(value) {
  const numeric = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function fmtAxis(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

function fmtText(value) {
  if (value === null || value === undefined || value === "" || value === "null") return "—";
  return String(value);
}

// Estado de la cédula: la fuente a veces solo trae el código (statusId "00").
// Preferimos la descripción; si no viene, traducimos el código a texto legible.
const ESTADO_CEDULA = { "00": "Vigente", "0": "Vigente" };
function estadoDocumento(id) {
  const desc = fmtText(id?.statusDesc);
  if (desc !== "—") return desc;
  const code = String(id?.statusId ?? "").trim();
  return ESTADO_CEDULA[code] || (code && code !== "—" ? `Código ${code}` : "—");
}

// Glosario de siglas/códigos del reporte (fuente: Manual de Implementación HDC+ DataCrédito).
const HDC_GLOSARIO = [
  ["AHO", "Cuenta de ahorros"],
  ["AHD", "Cuenta de ahorros — banca digital"],
  ["CCB", "Cuenta corriente bancaria"],
  ["TDC", "Tarjeta de crédito"],
  ["CAB", "Cartera bancaria (consumo / libre inversión)"],
  ["CBR", "Cartera bancaria rotativa (cupo rotativo)"],
  ["CAV", "Cartera de ahorro y vivienda (crédito hipotecario)"],
  ["CAU", "Cartera automotriz (crédito de vehículo)"],
  ["CCF", "Cartera de compañías de financiamiento comercial"],
  ["CDC", "Cartera de comunicaciones (planes / servicios)"],
  ["CTC", "Cartera de telefonía celular"],
  ["EDU", "Cartera de educación (crédito educativo)"],
  ["NORMAL / NOR", "Cuenta sin novedades"],
  ["GMF", "Cuenta exenta del 4x1.000 (Gravamen a los Movimientos Financieros)"],
  ["ELE", "Producto electrónico / de bajo monto"],
  ["SIN GAR", "Crédito sin garantía"],
  ["ADMIS", "Garantía admisible (respaldo idóneo)"],
  ["OTR GAR", "Otras garantías idóneas"],
  ["NO IDÓNEA", "Garantía no idónea (respaldo débil)"],
  ["Al día / Vigente", "Obligación al día en el corte reportado"],
  ["Saldada", "Obligación pagada por completo y cerrada"],
  ["Cancelada vol.", "El cliente canceló el producto por voluntad propia"],
  ["Inactiva", "Cuenta sin movimientos"],
  ["Calificación A", "Riesgo normal — al día (la mejor)"],
  ["Calif. B / C / D / E", "Riesgo creciente (E = incobrable)"],
  ["Vector: N", "Mes al día (comportamiento normal)"],
  ["Vector: 1, 2, 3…", "Meses de mora (a mayor número, mayor atraso)"],
  ["Vector: —", "Mes sin información reportada"],
];

// Cada cuenta viene como { account: {...} } — devuelve el objeto real.
function acc(item) {
  return (item && typeof item === "object" && item.account) ? item.account : item || {};
}

function sumField(list, field) {
  return list.reduce((total, item) => {
    const value = Number(acc(item)[field]);
    return total + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);
}

const DEBT_COMPOSITION_COLORS = ["#38bdf8", "#34d399", "#f59e0b", "#a78bfa", "#fb7185"];

function buildDebtCompositionData({ liabilities, creditCard, global }) {
  const direct = [
    { name: "Obligaciones", value: sumBalance(liabilities), color: DEBT_COMPOSITION_COLORS[0] },
    { name: "Tarjetas", value: sumBalance(creditCard), color: DEBT_COMPOSITION_COLORS[1] },
  ].filter((item) => item.value > 0);

  if (direct.length) return direct;

  const grouped = new Map();
  global.forEach((item) => {
    const name = fmtText(item.typeOfCreditDesc || item.entity?.businessLineName || "Otros");
    // capitalValue del endeudamiento global YA viene en pesos (p.ej. 5579000 = $5.579.000).
    const value = numValue(item.capitalValue);
    if (value > 0) grouped.set(name, (grouped.get(name) || 0) + value);
  });

  return Array.from(grouped.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: DEBT_COMPOSITION_COLORS[index % DEBT_COMPOSITION_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function buildDebtTrendData(root) {
  const evolution = deepFind(root, "debtEvolution");
  const trimester = toArray(evolution?.trimester);
  if (!trimester.length) return [];

  return trimester
    .map((item) => {
      const deb = item?.DebBasic || {};
      const rawPercent = numValue(deb.usePercentage ?? deb.debtPercentage);
      return {
        period: String(item?.trimesterDate || "").slice(0, 7),
        cupo: numValue(deb.initialValue),
        saldo: numValue(deb.debtBalance),
        deuda: rawPercent <= 1 ? Math.round(rawPercent * 1000) / 10 : Math.round(rawPercent * 10) / 10,
      };
    })
    .filter((item) => item.period && (item.cupo > 0 || item.saldo > 0 || item.deuda > 0))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-8);
}

function firstValues(item) {
  const values = Array.isArray(item?.values) ? item.values : [];
  return values.find((value) => value && typeof value === "object") || {};
}

// El saldo ACTUAL vive en values[].debtBalance (NO en account). Los productos
// saldados/cancelados quedan en 0, así solo se suma la deuda vigente real y no
// se infla con valores iniciales o históricos.
function accountBalance(item) {
  const v = numValue(firstValues(item).debtBalance);
  return v > 0 ? v : numValue(acc(item).debtBalance);
}

function sumBalance(list) {
  return list.reduce((total, item) => total + accountBalance(item), 0);
}

// SOLO señales realmente negativas. OJO: "cancelada voluntariamente",
// "saldada", "pago total" y "al día" NO son negativas → no van aquí.
// "cancelada por MAL MANEJO" sí, y se detecta por "mal manejo".
const NEGATIVE_TERMS = [
  "mora",
  "vencid",
  "castig",
  "cobro jurid",
  "prejurid",
  "mal manejo",
  "dudoso recaudo",
];

function isNegativeCredit(item) {
  const a = acc(item);
  const values = firstValues(item);
  const overdue = numValue(
    values.businessValueBalanceOverdue ??
      a.businessValueBalanceOverdue ??
      values.totalValueBalanceOverdue ??
      a.totalValueBalanceOverdue
  );
  const statusText = [
    a.status?.account?.businessAccountStatusDesc,
    item?.status?.account?.businessAccountStatusDesc,
    a.paymentTypeDesc,
    a.ratingDesc,
    values.ratingDesc,
    a.liabilitiesAccount?.businessBehaviourVectorProduct,
    a.creditCardAccount?.businessBehaviourVectorProduct,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return overdue > 0 || NEGATIVE_TERMS.some((term) => statusText.includes(term));
}

function buildNegativeCreditSummary({ liabilities, creditCard, overviewCount }) {
  const products = [
    ...liabilities.map((item) => ({ item, product: "Obligación / crédito" })),
    ...creditCard.map((item) => ({ item, product: "Tarjeta de crédito" })),
  ];
  const rows = products
    .filter(({ item }) => isNegativeCredit(item))
    .map(({ item, product }) => {
      const a = acc(item);
      const values = firstValues(item);
      return {
        entity: fmtText(a.businessLineName || a.businessLineCode),
        product,
        status: fmtText(a.status?.account?.businessAccountStatusDesc || item?.status?.account?.businessAccountStatusDesc || a.paymentTypeDesc),
        overdue: numValue(values.businessValueBalanceOverdue ?? a.businessValueBalanceOverdue),
      };
    });
  const entities = Array.from(new Set(rows.map((row) => row.entity).filter((entity) => entity !== "—")));
  const count = Math.max(Number(overviewCount) || 0, rows.length);
  return { count, rows, entities };
}

// ── UI atoms ────────────────────────────────────────────────────────────────

function StatTile({ label, value, tone = "cyan" }) {
  const tones = {
    cyan: "border-brand/25 from-brand/10 to-brand-2/5",
    emerald: "border-emerald-500/25 from-emerald-500/10 to-brand/5",
    amber: "border-amber-500/25 from-amber-500/10 to-orange-500/5",
    rose: "border-rose-500/25 from-rose-500/10 to-pink-500/5",
    slate: "border-line/15 from-surface-2/80 to-surface/70",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-lg shadow-black/5 ${tones[tone] || tones.cyan}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className="mt-1.5 text-lg font-black leading-tight text-content">{value}</div>
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <section className="rounded-[22px] border border-line/15 bg-surface/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/25 bg-brand/[0.08] text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-content">{title}</h3>
        {count !== undefined && (
          <span className="rounded-full border border-line/15 bg-surface-2/70 px-2.5 py-0.5 text-xs font-semibold text-muted">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function estadoTone(desc) {
  const d = String(desc || "").toLowerCase();
  if (d.includes("mora") || d.includes("vencid") || d.includes("mal manejo")) return "rose";
  // "inactiva" contiene "activ": evaluar los estados de cierre ANTES que los activos.
  if (d.includes("saldad") || d.includes("cancel") || d.includes("pago total") || d.includes("inactiv") || d.includes("devuelt")) return "amber";
  if (d.includes("al d") || d.includes("activ") || d.includes("vigente") || d.includes("entregad")) return "emerald";
  return "slate";
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    rose: "border-rose-500/25 bg-rose-500/10 text-rose-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    slate: "border-line/15 bg-surface-2/70 text-muted",
  };
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

function UsageBar({ saldo = 0, cupo = 0 }) {
  if (cupo <= 0 && saldo <= 0) return null;
  const pct = cupo > 0 ? Math.min(100, Math.round((saldo / cupo) * 100)) : (saldo > 0 ? 100 : 0);
  // Tono según utilización: bajo = verde, medio = ámbar, alto = rojo.
  const fill =
    pct >= 80 ? "from-rose-500 to-rose-400"
    : pct >= 40 ? "from-amber-400 to-amber-300"
    : "from-cyan-400 to-emerald-400";
  return (
    <div className="mb-3 rounded-xl border border-line/10 bg-surface/60 p-2.5">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide">
        <span className="text-emerald-300/90">Saldo {fmtMoney(saldo)}</span>
        <span className="text-muted">Cupo {fmtMoney(cupo)}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full bg-gradient-to-r ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-right text-[10px] font-bold text-brand">{pct}% utilizado</div>
    </div>
  );
}

// Estado de cada producto según la fuente (para el desglose por sección).
function estadoDeItem(item, section) {
  const st = item?.status || {};
  if (section === "savings") return fmtText(st.businessBureauEventDesc);
  return fmtText(st.account?.businessAccountStatusDesc || st.payment?.businessBureauEventDesc);
}

// ¿La obligación/tarjeta está vigente (al día / activa)? "Inactiva" NO cuenta.
function esActivaEstado(estado) {
  const d = String(estado || "").toLowerCase();
  if (d.includes("inactiv")) return false;
  return d.includes("al d") || d.includes("vigente") || d.includes("activ");
}

// Normaliza el estado a una etiqueta corta y legible para las fichas de conteo.
function normalizaEstado(estado) {
  const d = String(estado || "").toUpperCase();
  if (d.includes("AL D")) return "Al día";
  if (d.includes("PAGO TOTAL")) return "Pago total";
  if (d.includes("CANCELAD")) return "Cancelada";
  if (d.includes("SALDAD")) return "Saldada";
  if (d.includes("INACTIV")) return "Inactiva";
  if (d.includes("CUENTA ACTIVA") || d.includes("ACTIVA")) return "Activa";
  if (d.includes("DEVUELT")) return "Devuelta";
  if (d.includes("NO REPORT")) return "No reportó";
  return estado && estado !== "—" ? estado : "Sin estado";
}

// Cuenta activas vs cerradas y desglosa por estado. Base: el estado reportado
// por la central (no la fecha), que es lo que define si está viva o cerrada.
function resumenEstados(items, section) {
  const counts = {};
  let activas = 0;
  for (const it of items || []) {
    const est = estadoDeItem(it, section);
    if (esActivaEstado(est)) activas += 1;
    const norm = normalizaEstado(est);
    counts[norm] = (counts[norm] || 0) + 1;
  }
  return { counts, activas, cerradas: (items?.length || 0) - activas };
}

function EstadoBreakdown({ items, section }) {
  const { counts, activas, cerradas } = resumenEstados(items, section);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
        {activas} al día / activas
      </span>
      <span className="rounded-full border border-line/15 bg-surface-2/70 px-3 py-1 text-xs font-semibold text-muted">
        {cerradas} cerradas
      </span>
      <span className="hidden text-line/30 sm:inline">|</span>
      {entries.map(([est, n]) => (
        <span key={est} className="rounded-full border border-line/12 bg-surface-2/50 px-2.5 py-1 text-[11px] font-medium text-muted">
          {est}: <strong className="text-content">{n}</strong>
        </span>
      ))}
    </div>
  );
}

function AccountCard({ titulo, subtitulo, estado, barra, filas }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line/15 bg-surface-2/70 p-4 transition hover:border-brand/25 hover:bg-surface">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-content">{titulo}</div>
          {subtitulo && <div className="mt-0.5 text-xs text-muted">{subtitulo}</div>}
        </div>
        {estado && estado !== "—" && <Badge tone={estadoTone(estado)}>{estado}</Badge>}
      </div>
      {barra && <UsageBar saldo={barra.saldo} cupo={barra.cupo} />}
      <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2">
        {filas.filter((f) => f && f.value !== "—" && f.value !== "$0").map((f) => (
          <div key={f.label}>
            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">{f.label}</div>
            <div className="mt-0.5 text-xs font-medium text-content">{f.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DebtCompositionDonut({ data }) {
  if (!data.length) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Section icon={Wallet} title="Distribución de endeudamiento actual">
      <div className="grid gap-4 rounded-2xl border border-line/15 bg-gradient-to-br from-surface-2/95 via-surface/90 to-surface-2/80 p-4 shadow-lg shadow-black/5 lg:grid-cols-[minmax(260px,0.9fr)_1.1fr]">
        <div className="relative h-[280px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {data.map((item, index) => (
                  <linearGradient key={item.name} id={`hdc-donut-${index}`} x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor={item.color} stopOpacity={0.98} />
                    <stop offset="100%" stopColor={item.color} stopOpacity={0.55} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={3}
                cornerRadius={9}
                stroke="rgba(2,6,23,0.72)"
                strokeWidth={3}
                isAnimationActive
                animationDuration={950}
              >
                {data.map((item, index) => (
                  <Cell key={item.name} fill={`url(#hdc-donut-${index})`} />
                ))}
              </Pie>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "rgb(var(--th-surface))",
                  border: "1px solid rgb(var(--th-line) / 0.18)",
                  borderRadius: 12,
                  color: "rgb(var(--th-content))",
                  boxShadow: "0 18px 48px rgba(2,6,23,.32)",
                }}
                formatter={(value, name) => [fmtMoney(value), name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Total deuda</div>
            <div className="mt-1 text-2xl font-black tracking-tight text-content">{fmtMoney(total)}</div>
          </div>
        </div>

        <div className="grid content-center gap-2">
          {data.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.name} className="rounded-2xl border border-line/15 bg-surface/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-sm font-bold text-content">{item.name}</span>
                  </div>
                  <span className="shrink-0 text-sm font-black text-brand">{percent.toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(percent, 2)}%`,
                      background: `linear-gradient(90deg, ${item.color}, rgba(255,255,255,0.56))`,
                    }}
                  />
                </div>
                <div className="mt-1.5 text-xs font-semibold text-muted">{fmtMoney(item.value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function DebtTrendChart({ data }) {
  if (!data.length) return null;

  return (
    <Section icon={Wallet} title="Evolución de cupo, saldo y % de deuda">
      <div className="rounded-2xl border border-line/15 bg-surface-2/70 p-4 shadow-lg shadow-black/5">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 14, right: 28, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="hdc-cupo-line" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <linearGradient id="hdc-saldo-line" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgb(var(--th-line))" strokeOpacity={0.62} vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fill: "rgb(var(--th-muted))", fontSize: 12 }}
                axisLine={{ stroke: "rgb(var(--th-line))" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="money"
                tickFormatter={fmtAxis}
                tick={{ fill: "rgb(var(--th-muted))", fontSize: 12 }}
                axisLine={{ stroke: "rgb(var(--th-line))" }}
                tickLine={false}
                label={{ value: "Valor reportado", angle: -90, position: "insideLeft", fill: "rgb(var(--th-muted))", fontSize: 12 }}
              />
              <YAxis
                yAxisId="percent"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "rgb(var(--th-muted))", fontSize: 12 }}
                axisLine={{ stroke: "rgb(var(--th-line))" }}
                tickLine={false}
                label={{ value: "% deuda", angle: 90, position: "insideRight", fill: "rgb(var(--th-muted))", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: "#67e8f9", strokeOpacity: 0.18 }}
                contentStyle={{
                  background: "rgb(var(--th-surface))",
                  border: "1px solid rgb(var(--th-line) / 0.18)",
                  borderRadius: 12,
                  color: "rgb(var(--th-content))",
                  boxShadow: "0 18px 48px rgba(2,6,23,.32)",
                }}
                formatter={(value, name) => {
                  if (name === "% deuda") return [`${Number(value).toFixed(1)}%`, name];
                  return [fmtMoney(value), name];
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ color: "rgb(var(--th-muted))", fontSize: 12 }}
              />
              <Line
                yAxisId="money"
                type="monotone"
                dataKey="cupo"
                name="Cupo total"
                stroke="url(#hdc-cupo-line)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "rgb(var(--th-surface))", stroke: "#38bdf8" }}
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={900}
              />
              <Line
                yAxisId="money"
                type="monotone"
                dataKey="saldo"
                name="Saldo total"
                stroke="url(#hdc-saldo-line)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "rgb(var(--th-surface))", stroke: "#34d399" }}
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={1050}
              />
              <Line
                yAxisId="percent"
                type="monotone"
                dataKey="deuda"
                name="% deuda"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="7 5"
                dot={{ r: 4, strokeWidth: 2, fill: "rgb(var(--th-surface))", stroke: "#f59e0b" }}
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Section>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

export default function HdcDetalleResultados({ data, consulta, consultaId }) {
  const [showJson, setShowJson] = useState(false);
  const [fetched, setFetched] = useState(null);
  const [loading, setLoading] = useState(Boolean(consultaId && !data));
  const [error, setError] = useState("");

  // Modo "por id": carga el detalle desde el backend.
  useEffect(() => {
    if (!consultaId || data) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/hdc/consultas/${consultaId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        const json = await response.json();
        if (!response.ok) throw new Error(json?.detail || `Error HTTP ${response.status}`);
        if (!cancelled) setFetched(json);
      } catch (e) {
        if (!cancelled) setError(e.message || "No fue posible cargar Econfia Credit Report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [consultaId, data]);

  const consultaObj = consulta || fetched || {};
  const respuesta = useMemo(() => data || fetched?.respuesta_json || {}, [data, fetched]);

  const pr = useMemo(() => respuesta || {}, [respuesta]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-t-brand border-slate-800" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-6 text-center text-sm text-rose-200">
        {error}
      </div>
    );
  }

  const basic = deepFind(pr, "basicInformation") || {};
  const natural = deepFind(pr, "nationalNatural") || {};
  // Fusionamos ambas fuentes: basicInformation trae statusId pero no statusDesc;
  // nationalNatural trae statusDesc ("VIGENTE"). Así el estado se muestra legible.
  const identificacion = { ...(natural.identification || {}), ...(basic.identification || {}) };
  const age = basic.age || natural.age || {};

  const savings = toArray(deepFind(pr, "savings"));
  const liabilities = toArray(deepFind(pr, "liabilities"));
  const creditCard = toArray(deepFind(pr, "creditCard"));
  const global = toArray(deepFind(pr, "globalIndebtedness"));
  const footprints = toArray(deepFind(pr, "inquiryFootprints"));

  const overview = deepFind(pr, "overview") || {};
  const principals = overview.principals || deepFind(pr, "principals") || {};
  const balances = overview.balances || deepFind(pr, "balances") || {};
  const responseDesc = deepFind(pr, "responseDesc");
  const consultDate = deepFind(pr, "consultDate");

  const fullName = basic.fullName || natural.fullName || consultaObj?.apellido_razon_social || "—";
  const genero = basic.genderDesc || natural.genderDesc || "";
  const edad = age.min && age.max ? `${age.min} - ${age.max} años` : "—";

  const totalDeuda = sumBalance(liabilities) + sumBalance(creditCard);
  const totalCuota = sumField(liabilities, "valueMonthlyPayment") + sumField(creditCard, "valueMonthlyPayment");
  const debtCompositionData = buildDebtCompositionData({ liabilities, creditCard, global });
  const debtTrendData = buildDebtTrendData(pr);
  const negativeSummary = buildNegativeCreditSummary({
    liabilities,
    creditCard,
    overviewCount: principals.currentNegativeCredits,
  });

  return (
    <div className="grid gap-4">
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-[24px] border border-line/15 bg-surface/90 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand/[0.06] blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
            <ShieldCheck className="h-3.5 w-3.5" />
            Econfia Credit Report
          </div>
          {responseDesc && <Badge tone="emerald">{responseDesc}</Badge>}
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-content md:text-3xl">{fullName}</h2>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <span>Doc: {fmtText(basic.personId?.personIdNumber || consultaObj?.numero_identificacion)}</span>
          {genero && <span>Género: {genero}</span>}
          <span>Edad: {edad}</span>
          {consultDate && <span>Consulta: {String(consultDate).slice(0, 10)}</span>}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Deuda total" value={fmtMoney(totalDeuda)} tone="cyan" />
        <StatTile label="Cuota mensual" value={fmtMoney(totalCuota)} tone="emerald" />
        <StatTile label="Créditos vigentes" value={fmtText(principals.currentCredits)} tone="slate" />
        <StatTile
          label="Créditos negativos"
          value={fmtText(principals.currentNegativeCredits ?? "0")}
          tone={Number(principals.currentNegativeCredits) > 0 ? "rose" : "emerald"}
        />
        <StatTile label="Créditos cerrados" value={fmtText(principals.closedCredits)} tone="slate" />
        <StatTile label="Consultas (6 meses)" value={fmtText(principals.consultedLast6Months)} tone="amber" />
        <StatTile label="Mora total" value={fmtMoney(Number(balances.totalValueBalanceOverdue) * 1000)} tone={Number(balances.totalValueBalanceOverdue) > 0 ? "rose" : "emerald"} />
        <StatTile label="Antigüedad desde" value={fmtText(principals.maturationSince)} tone="slate" />
      </div>

      <section
        className={`rounded-[22px] border p-5 shadow-xl shadow-black/5 backdrop-blur-xl ${
          negativeSummary.count > 0
            ? "border-rose-500/25 bg-rose-500/[0.07]"
            : "border-emerald-500/25 bg-emerald-500/[0.06]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              negativeSummary.count > 0
                ? "border-rose-400/25 bg-rose-400/[0.10] text-rose-300"
                : "border-emerald-400/25 bg-emerald-400/[0.10] text-emerald-300"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-content">Aclaración ejecutiva sobre reportes negativos</h3>
            <p className="mt-1 text-sm leading-6 text-muted">
              {negativeSummary.count > 0
                ? `Según la información reportada en Econfia Credit Report, el titular registra ${negativeSummary.count} producto(s) con señal negativa en centrales de riesgo.`
                : "Según la información reportada en Econfia Credit Report, no se identifican productos con señal negativa en centrales de riesgo."}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {negativeSummary.entities.length
                ? `Entidad(es) asociada(s): ${negativeSummary.entities.join(", ")}.`
                : negativeSummary.count > 0
                  ? "El resumen del reporte indica señales negativas, pero no fue posible asociarlas a una entidad específica en el detalle evaluado."
                  : "No se identifican entidades asociadas a reportes negativos en los datos evaluados."}
            </p>
            {negativeSummary.rows.length > 0 && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {negativeSummary.rows.map((row, index) => (
                  <div key={`${row.entity}-${index}`} className="rounded-xl border border-line/15 bg-surface/80 p-3">
                    <div className="text-sm font-bold text-content">{row.entity}</div>
                    <div className="mt-1 text-xs text-muted">{row.product}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-content">
                      <span className="rounded-md border border-line/15 bg-surface-2/70 px-2 py-1">Estado: {row.status}</span>
                      <span className="rounded-md border border-line/15 bg-surface-2/70 px-2 py-1">Mora: {fmtMoney(row.overdue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs leading-5 text-muted">
              La señal negativa se determina por saldo en mora positivo o por estados/calificaciones de mora,
              vencimiento, castigo, cobro jurídico o equivalentes presentes en el reporte.
            </p>
          </div>
        </div>
      </section>

      <DebtCompositionDonut data={debtCompositionData} />
      <DebtTrendChart data={debtTrendData} />

      <AnalisisFinancieroIA producto="credit_report" consultaId={consultaId || consultaObj?.id} />

      {/* Identificación */}
      <Section icon={UserRound} title="Identificación">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Documento" value={fmtText(basic.personId?.personIdNumber)} tone="slate" />
          <StatTile label="Estado documento" value={estadoDocumento(identificacion)} tone="slate" />
          <StatTile label="Expedición" value={fmtText(identificacion.issueDate)} tone="slate" />
          <StatTile label="Ciudad expedición" value={fmtText(identificacion.issuingCityName)} tone="slate" />
        </div>
      </Section>

      {/* Obligaciones */}
      {liabilities.length > 0 && (
        <Section icon={Landmark} title="Obligaciones / Créditos" count={liabilities.length}>
          <EstadoBreakdown items={liabilities} section="liabilities" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {liabilities.map((item, i) => {
              const a = acc(item);
              const v = firstValues(item);
              const st = item.status || {};
              const la = item.liabilitiesAccount || {};
              const feat = item.featuresLiabilities || {};
              return (
                <AccountCard
                  key={a.primaryKey || i}
                  titulo={fmtText(a.businessLineName)}
                  subtitulo={fmtText(feat.typeOfCreditDesc || a.accountTypeDesc)}
                  estado={fmtText(st.account?.businessAccountStatusDesc || st.payment?.businessBureauEventDesc)}
                  barra={{ saldo: numValue(v.debtBalance), cupo: numValue(v.initialValue) }}
                  filas={[
                    { label: "Cuota mensual", value: fmtMoney(v.valueMonthlyPayment) },
                    { label: "Apertura", value: fmtText(a.accountOpeningDate) },
                    { label: "Vencimiento", value: fmtText(la.expiryDate) },
                    { label: "Calificación", value: fmtText(a.ratingDesc) },
                    { label: "Saldo en mora", value: fmtMoney(v.businessValueBalanceOverdue) },
                  ]}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Tarjetas de crédito */}
      {creditCard.length > 0 && (
        <Section icon={CreditCard} title="Tarjetas de crédito" count={creditCard.length}>
          <EstadoBreakdown items={creditCard} section="creditCard" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {creditCard.map((item, i) => {
              const a = acc(item);
              const v = firstValues(item);
              const st = item.status || {};
              const feat = item.FeaturesCreditCard || {};
              return (
                <AccountCard
                  key={a.primaryKey || i}
                  titulo={fmtText(a.businessLineCode || a.businessLineName)}
                  subtitulo={fmtText(feat.franchiseName)}
                  estado={fmtText(st.account?.businessAccountStatusDesc || st.card?.cardStatusName)}
                  barra={{ saldo: numValue(v.debtBalance), cupo: numValue(v.initialValue) }}
                  filas={[
                    { label: "Cupo disponible", value: fmtMoney(v.availableBalance) },
                    { label: "Cuota mensual", value: fmtMoney(v.valueMonthlyPayment) },
                    { label: "Estado tarjeta", value: fmtText(st.card?.cardStatusName) },
                    { label: "Apertura", value: fmtText(a.accountOpeningDate) },
                  ]}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Cuentas / productos de ahorro */}
      {savings.length > 0 && (
        <Section icon={PiggyBank} title="Cuentas y productos" count={savings.length}>
          <EstadoBreakdown items={savings} section="savings" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {savings.map((item, i) => {
              const a = acc(item);
              const st = item.status || {};
              return (
                <AccountCard
                  key={a.primaryKey || i}
                  titulo={fmtText(a.businessLineName)}
                  subtitulo={fmtText(a.subAccountTypeName)}
                  estado={fmtText(st.businessBureauEventDesc)}
                  filas={[
                    { label: "Número", value: fmtText(a.accountNumber) },
                    { label: "Apertura", value: fmtText(a.accountOpeningDate) },
                    { label: "Ciudad", value: fmtText(a.filingCityName) },
                  ]}
                />
              );
            })}
          </div>
        </Section>
      )}

      {/* Endeudamiento global */}
      {global.length > 0 && (
        <Section icon={Wallet} title="Endeudamiento global" count={global.length}>
          <div className="grid gap-2.5 md:grid-cols-2">
            {global.map((item, i) => (
              <AccountCard
                key={i}
                titulo={fmtText(item.entity?.businessLineName)}
                subtitulo={fmtText(item.typeOfCreditDesc)}
                estado={item.quarterQualificationDesc || item.quarterQualification}
                filas={[
                  // capitalValue ya viene en pesos (5579000 = $5.579.000); NO multiplicar ×1000.
                  { label: "Capital", value: fmtMoney(item.capitalValue) },
                  { label: "Fuente", value: fmtText(item.sourceGlobalIndebtednessDesc) },
                  { label: "Corte", value: fmtText(item.cutoffDate) },
                  { label: "Obligaciones", value: fmtText(item.quantityOfObligations) },
                ]}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Huellas de consulta */}
      {footprints.length > 0 && (
        <Section icon={Search} title="Huellas de consulta" count={footprints.length}>
          <div className="grid gap-2 md:grid-cols-2">
            {footprints.map((item, i) => (
              <div key={item.primaryKey || i} className="flex items-center justify-between rounded-xl border border-line/15 bg-surface-2/70 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-content">{fmtText(item.inquiryBusinessName)}</div>
                  <div className="text-xs text-muted">{fmtText(item.inquiryReasonDesc)}</div>
                </div>
                <div className="shrink-0 text-xs font-medium text-brand">{fmtText(item.inquiryDate)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Glosario de siglas */}
      <Section icon={BookOpen} title="Glosario — ¿qué significan las siglas?" count={HDC_GLOSARIO.length}>
        <p className="mb-3 text-xs text-muted">
          Referencia rápida de los códigos que usa la central de riesgo en este informe.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {HDC_GLOSARIO.map(([sigla, significado]) => (
            <div key={sigla} className="rounded-2xl border border-line/15 bg-surface-2/70 p-3">
              <div className="text-xs font-bold text-brand">{sigla}</div>
              <div className="mt-0.5 text-xs text-content">{significado}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Fuente oficial */}
      <div className="rounded-2xl border border-line/15 bg-surface-2/60 px-5 py-4 text-center text-[11px] leading-5 text-muted">
        Fuente oficial de la información: <strong className="text-content">Central de Riesgo</strong> (NIT 900.422.614-8).
        Consulta realizada bajo autorización del titular.
      </div>

      {/* JSON crudo (respaldo) */}
      <div>
        <button
          type="button"
          onClick={() => setShowJson((v) => !v)}
          className="text-xs font-semibold text-brand hover:text-brand"
        >
          {showJson ? "Ocultar" : "Ver"} respuesta completa (JSON)
        </button>
        {showJson && (
          <pre className="mt-2 max-h-[28rem] overflow-auto rounded-xl border border-line/15 bg-[#02040a] p-4 text-[11px] leading-5 text-cyan-100/80">
            {JSON.stringify(respuesta, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
