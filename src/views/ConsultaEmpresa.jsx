import { useState } from "react";
import {
  FaBuilding,
  FaBalanceScale,
  FaChartPie,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaFilePdf,
  FaIdCard,
  FaIndustry,
  FaEye,
  FaShieldAlt,
  FaStore,
  FaUserTie,
} from "react-icons/fa";
import Terminos from "../components/Terminos";
import AvisoTratamientoDatos from "../components/AvisoTratamientoDatos";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";

function SectionCard({ title, children, accent = "emerald", description }) {
  const accentMap = {
    emerald: "border-emerald-400/20 shadow-[0_18px_60px_rgba(16,185,129,0.08)] before:bg-emerald-400",
    sky: "border-sky-400/20 shadow-[0_18px_60px_rgba(56,189,248,0.08)] before:bg-sky-400",
    amber: "border-amber-400/20 shadow-[0_18px_60px_rgba(245,158,11,0.08)] before:bg-amber-400",
    violet: "border-violet-400/20 shadow-[0_18px_60px_rgba(139,92,246,0.08)] before:bg-violet-400",
  };

  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] border bg-slate-950/78 p-6 backdrop-blur-xl before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${accentMap[accent] || accentMap.emerald}`}>
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <span className="break-words text-base font-semibold leading-6 text-white">
        {value || "No disponible"}
      </span>
    </div>
  );
}

function MetricTile({ label, value, tone = "emerald" }) {
  const tones = {
    emerald: "from-emerald-400/15 to-transparent text-emerald-200",
    sky: "from-sky-400/15 to-transparent text-sky-200",
    amber: "from-amber-400/15 to-transparent text-amber-200",
    violet: "from-violet-400/15 to-transparent text-violet-200",
  };

  return (
    <div className={`rounded-2xl border border-white/8 bg-gradient-to-br ${tones[tone] || tones.emerald} p-4`}>
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value ?? "—"}</div>
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function cleanValue(value, fallback = "No disponible") {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "No reportado";
  const numeric = Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return value;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function parseMoneyNumber(value) {
  const numeric = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function CompactField({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-semibold leading-5 text-white">
        {cleanValue(value)}
      </div>
    </div>
  );
}

function FinancialMetric({ label, value, tone = "sky" }) {
  const toneMap = {
    sky: "border-sky-400/15 bg-sky-500/10 text-sky-200",
    emerald: "border-emerald-400/15 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/15 bg-amber-500/10 text-amber-200",
    violet: "border-violet-400/15 bg-violet-500/10 text-violet-200",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneMap[tone] || toneMap.sky}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </div>
      <div className="mt-2 text-base font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function isActiveStatus(value) {
  return /activa|activo|vigente/i.test(String(value || ""));
}

function getAssessmentTone(proveedoresFicticios, estado) {
  if (proveedoresFicticios?.aparece) return "critical";
  if (isActiveStatus(estado)) return "strong";
  return "review";
}

function getAssessmentData(resultadoEmpresa) {
  if (!resultadoEmpresa) return null;

  const proveedoresFicticios = resultadoEmpresa.proveedores_ficticios_dian || {};
  const camaraAfiliados = resultadoEmpresa.camara_comercio_afiliados || {};
  const actividad = resultadoEmpresa.actividad_economica || [];
  const representante = resultadoEmpresa.representante_legal || {};
  const representanteCount = representante.registros?.length || 0;
  const estado = resultadoEmpresa.estado || resultadoEmpresa.informacion_general?.["Estado de la matrícula"];
  const tone = getAssessmentTone(proveedoresFicticios, estado);

  const signals = [
    {
      label: "Estado mercantil",
      value: estado || "No disponible",
      detail: isActiveStatus(estado) ? "La matrícula se encuentra activa o vigente." : "Requiere revisión del estado reportado.",
      tone: isActiveStatus(estado) ? "emerald" : "amber",
      icon: FaShieldAlt,
    },
    {
      label: "Lista DIAN ficticios",
      value: proveedoresFicticios?.aparece ? "Coincidencia" : "Sin coincidencia",
      detail: proveedoresFicticios?.aparece
        ? "Existe alerta en proveedores ficticios DIAN."
        : "No se reporta coincidencia en la validación disponible.",
      tone: proveedoresFicticios?.aparece ? "amber" : "emerald",
      icon: FaExclamationTriangle,
    },
    {
      label: "Actividad económica",
      value: actividad.length ? `${actividad.length} actividades` : "Sin actividad",
      detail: actividad[0]?.descripcion || "No se encontraron actividades económicas estructuradas.",
      tone: actividad.length ? "sky" : "violet",
      icon: FaIndustry,
    },
    {
      label: "Representación legal",
      value: representanteCount ? `${representanteCount} registro(s)` : "Texto disponible",
      detail: representanteCount
        ? "Se extrajeron cargos, nombres e identificaciones."
        : representante.mensaje || "No se encontró información estructurada.",
      tone: representanteCount || representante.mensaje ? "sky" : "amber",
      icon: FaUserTie,
    },
    {
      label: "Círculo de afiliados",
      value: camaraAfiliados?.aparece ? "Encontrado" : "Sin coincidencia",
      detail: camaraAfiliados?.mensaje || "Validación complementaria no disponible.",
      tone: camaraAfiliados?.aparece ? "emerald" : "violet",
      icon: FaBuilding,
    },
  ];

  const toneCopy = {
    critical: {
      eyebrow: "Alerta prioritaria",
      title: "Proveedor con coincidencia sensible",
      summary: "Antes de avanzar, revisa la coincidencia DIAN y documenta la decisión comercial, tributaria y de cumplimiento.",
      classes: "border-amber-300/30 from-amber-500/18 via-slate-950 to-red-950/40",
      badge: "bg-amber-400 text-slate-950",
    },
    strong: {
      eyebrow: "Lectura inicial favorable",
      title: "Proveedor con señales operativas positivas",
      summary: "La información principal permite perfilar la empresa con estado activo y fuentes complementarias para análisis.",
      classes: "border-emerald-300/30 from-emerald-500/18 via-slate-950 to-sky-950/35",
      badge: "bg-emerald-400 text-slate-950",
    },
    review: {
      eyebrow: "Revisión recomendada",
      title: "Proveedor con información incompleta o no concluyente",
      summary: "La ficha trae datos útiles, pero conviene revisar estado, renovación y evidencia antes de calificarlo.",
      classes: "border-sky-300/25 from-sky-500/16 via-slate-950 to-violet-950/35",
      badge: "bg-sky-400 text-slate-950",
    },
  };

  return {
    ...toneCopy[tone],
    signals,
    tone,
  };
}

function normalizarEmpresaData(data) {
  return {
    nombre: data.nombre,
    nit: data.nit,
    estado: data.estado,
    camara_comercio: data.camara_comercio,
    matricula: data.matricula,
    fecha_consulta: data.fecha_consulta,
    informacion_general: data.informacion_general || {},
    actividad_economica: data.actividad_economica || [],
    representante_legal: data.representante_legal || {},
    propietario_establecimiento: data.propietario_establecimiento || {},
    proveedores_ficticios_dian: data.proveedores_ficticios_dian || {},
    camara_comercio_afiliados: data.camara_comercio_afiliados || {},
    empresa_resumen: data.empresa_resumen || {},
    captura_principal: data.captura_principal,
  };
}

function AssessmentSignal({ signal }) {
  const Icon = signal.icon;
  const toneMap = {
    emerald: "border-emerald-400/18 bg-emerald-500/10 text-emerald-200",
    sky: "border-sky-400/18 bg-sky-500/10 text-sky-200",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    violet: "border-violet-400/18 bg-violet-500/10 text-violet-200",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[signal.tone] || toneMap.sky}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Icon className="text-lg" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
            {signal.label}
          </div>
          <div className="mt-1 text-lg font-bold leading-tight text-white">
            {signal.value}
          </div>
          <div className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">
            {signal.detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionStep({ icon: Icon, title, text, tone = "sky" }) {
  const toneMap = {
    sky: "border-sky-400/15 bg-sky-500/10 text-sky-200",
    emerald: "border-emerald-400/15 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/15 bg-amber-500/10 text-amber-200",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone] || toneMap.sky}`}>
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Icon />
        </div>
        <div>
          <div className="font-bold text-white">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-300">{text}</div>
        </div>
      </div>
    </div>
  );
}

function EmpresaGraficosEjecutivos({ resultadoEmpresa }) {
  if (!resultadoEmpresa) return null;

  const actividad = resultadoEmpresa.actividad_economica || [];
  const representante = resultadoEmpresa.representante_legal || {};
  const proveedores = resultadoEmpresa.proveedores_ficticios_dian || {};
  const afiliados = resultadoEmpresa.camara_comercio_afiliados || {};
  const afiliadosRegistros = afiliados.registros || [];
  const propietarioRegistros = resultadoEmpresa.propietario_establecimiento?.registros || [];

  const cobertura = [
    { name: "RUES", value: resultadoEmpresa.informacion_general && Object.keys(resultadoEmpresa.informacion_general).length ? 1 : 0, color: "#38bdf8" },
    { name: "Actividad", value: actividad.length ? 1 : 0, color: "#2dd4bf" },
    { name: "Representante", value: representante.registros?.length || representante.mensaje ? 1 : 0, color: "#a78bfa" },
    { name: "DIAN", value: proveedores.mensaje ? 1 : 0, color: "#f59e0b" },
    { name: "Afiliados", value: afiliados.mensaje ? 1 : 0, color: "#fb7185" },
  ];
  const coberturaTotal = cobertura.reduce((sum, item) => sum + item.value, 0);
  const coberturaPct = Math.round((coberturaTotal / cobertura.length) * 100);
  const senales = [
    { name: "Mercantil", valor: isActiveStatus(resultadoEmpresa.estado) ? 100 : 45 },
    { name: "Actividad", valor: Math.min(100, actividad.length * 35) },
    { name: "Rep. legal", valor: representante.registros?.length ? 90 : representante.mensaje ? 65 : 20 },
    { name: "DIAN", valor: proveedores.aparece ? 25 : proveedores.mensaje ? 95 : 45 },
    { name: "Afiliados", valor: afiliados.aparece ? 85 : afiliados.mensaje ? 55 : 25 },
  ];
  const financieros = afiliadosRegistros
    .slice(0, 3)
    .map((item, index) => ({
      name: item.razon_social || `Registro ${index + 1}`,
      ingresos: parseMoneyNumber(item.financiero?.ingresos_actividad_ordinaria),
      patrimonio: parseMoneyNumber(item.financiero?.patrimonio),
    }))
    .filter((item) => item.ingresos || item.patrimonio);

  return (
    <SectionCard
      title="Lectura gráfica empresarial"
      accent="sky"
      description="Resumen visual para evaluar cobertura de fuentes, señales de revisión y capacidad reportada cuando exista información financiera."
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black text-white">Cobertura de fuentes</div>
              <div className="text-xs text-slate-400">Disponibilidad de señales por fuente.</div>
            </div>
            <FaChartPie className="text-brand" />
          </div>
          <div className="grid gap-3 sm:grid-cols-[210px_1fr]">
            <div className="relative h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cobertura}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="82%"
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="rgba(2,6,23,0.76)"
                    strokeWidth={3}
                    isAnimationActive
                    animationDuration={900}
                  >
                    {cobertura.map((item) => (
                      <Cell key={item.name} fill={item.value ? item.color : "rgba(148,163,184,0.18)"} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "rgba(6,24,31,0.96)",
                      border: "1px solid rgba(103,232,249,0.18)",
                      borderRadius: 12,
                      color: "#e8f1f2",
                    }}
                    formatter={(value) => [value ? "Disponible" : "No disponible", "Estado"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-white">{coberturaPct}%</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">cobertura</div>
              </div>
            </div>
            <div className="grid content-center gap-2">
              {cobertura.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.value ? item.color : "rgba(148,163,184,0.45)" }} />
                    {item.name}
                  </span>
                  <span className={item.value ? "text-xs font-black text-emerald-200" : "text-xs font-black text-slate-500"}>
                    {item.value ? "OK" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <div className="mb-3">
            <div className="text-sm font-black text-white">Señales para calificación</div>
            <div className="text-xs text-slate-400">Lectura visual para priorizar revisión.</div>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={senales} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#24424c" strokeOpacity={0.45} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#9bb9c3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#9bb9c3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(103,232,249,0.06)" }}
                  contentStyle={{
                    background: "rgba(6,24,31,0.96)",
                    border: "1px solid rgba(103,232,249,0.18)",
                    borderRadius: 12,
                    color: "#e8f1f2",
                  }}
                />
                <Bar dataKey="valor" name="Indicador" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1000}>
                  {senales.map((item) => (
                    <Cell key={item.name} fill={item.valor < 50 ? "#f59e0b" : item.valor > 80 ? "#2dd4bf" : "#38bdf8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricTile label="Fuentes disponibles" value={`${coberturaTotal}/${cobertura.length}`} tone="sky" />
        <MetricTile label="Establecimientos" value={propietarioRegistros.length || "—"} tone="violet" />
        <MetricTile label="Registros afiliados" value={afiliadosRegistros.length || "—"} tone="emerald" />
      </div>

      {financieros.length > 0 && (
        <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
          <div className="mb-3">
            <div className="text-sm font-black text-white">Indicadores financieros reportados</div>
            <div className="text-xs text-slate-400">Ingresos y patrimonio desde fuentes complementarias.</div>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financieros} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#24424c" strokeOpacity={0.45} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#9bb9c3", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}M`} tick={{ fill: "#9bb9c3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(103,232,249,0.06)" }}
                  formatter={(value, name) => [formatMoney(value), name]}
                  contentStyle={{
                    background: "rgba(6,24,31,0.96)",
                    border: "1px solid rgba(103,232,249,0.18)",
                    borderRadius: 12,
                    color: "#e8f1f2",
                  }}
                />
                <Bar dataKey="ingresos" name="Ingresos" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="patrimonio" name="Patrimonio" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function CamaraAfiliadoCard({ item, index }) {
  const telefono =
    item.contacto?.telefono_1 ||
    item.contacto?.telefono_2 ||
    item.contacto?.telefono_3;
  const actividades = item.actividades || [];

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-sky-400/15 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_38%),rgba(15,23,42,0.66)]">
      <div className="border-b border-white/8 bg-white/[0.035] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">
              Registro afiliado {index + 1}
            </div>
            <h4 className="mt-3 text-lg font-bold leading-tight text-white">
              {item.razon_social || "Empresa afiliada"}
            </h4>
            <p className="mt-1 text-sm text-slate-300">
              Afiliada al círculo de la Cámara de Comercio con información mercantil, contacto y actividad económica registrada.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
            Afiliado
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactField label="NIT" value={item.nit} />
          <CompactField label="Matrícula mercantil" value={item.matricula_mercantil} />
          <CompactField label="Fecha afiliación" value={item.perfil?.fecha_afiliacion} />
          <CompactField label="Última renovación" value={item.perfil?.fecha_renovacion} />
        </div>

        <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Datos mercantiles principales
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <CompactField label="Tipo de organización" value={item.tipo_organizacion} />
            <CompactField label="Representante legal" value={item.perfil?.representante_legal} />
            <CompactField label="Fecha de matrícula" value={item.perfil?.fecha_matricula} />
            <CompactField label="Fecha de constitución" value={item.perfil?.fecha_constitucion} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            Contacto reportado
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <CompactField label="Dirección comercial" value={item.contacto?.direccion} />
            <CompactField label="Ciudad" value={item.contacto?.ciudad} />
            <CompactField label="Correo comercial" value={item.contacto?.correo_comercial} />
            <CompactField label="Teléfono" value={telefono} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FinancialMetric label="Ingresos ordinarios" value={formatMoney(item.financiero?.ingresos_actividad_ordinaria)} tone="sky" />
          <FinancialMetric label="Patrimonio" value={formatMoney(item.financiero?.patrimonio)} tone="emerald" />
          <FinancialMetric label="Utilidad neta" value={formatMoney(item.financiero?.utilidad_neta)} tone="amber" />
          <FinancialMetric label="Personal ocupado" value={cleanValue(item.financiero?.personas_ocupadas, "No reportado")} tone="violet" />
        </div>

        <div className="rounded-2xl border border-sky-400/12 bg-sky-500/10 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">
            Actividades económicas registradas
          </div>
          {actividades.length > 0 ? (
            <div className="mt-3 space-y-2">
              {actividades.map((actividad, actividadIndex) => (
                <div
                  key={`${actividad.codigo}-${actividadIndex}`}
                  className="rounded-xl border border-white/8 bg-slate-950/40 px-4 py-3"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-sky-300">
                    {actividadIndex === 0 ? "Actividad principal" : `Actividad ${actividadIndex + 1}`} · CIIU {actividad.codigo || "Sin código"}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-100">
                    {actividad.descripcion || "Sin descripción disponible."}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-slate-300">
              No hay actividades económicas disponibles en esta fuente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmpresaConsultaExitosaModal({ empresa, onClose, onGoToConsultas }) {
  if (!empresa) return null;

  const estadoActivo = isActiveStatus(empresa.estado);
  const alertaDian = empresa.proveedores_ficticios_dian?.aparece;

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border border-cyan-200/25 bg-[linear-gradient(180deg,#e7edf4_0%,#f5f7fa_46%,#dce4ee_100%)] text-slate-800 shadow-[0_28px_80px_rgba(2,12,27,0.55)]">
        <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(90deg,#0f2e4f_0%,#123c67_26%,#1c5d8f_52%,#0f436d_76%,#0b2f4d_100%)] opacity-95" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 overflow-hidden">
          <svg viewBox="0 0 760 48" aria-hidden="true" preserveAspectRatio="none" className="h-full w-full">
            <g stroke="rgba(255,255,255,0.42)" strokeWidth="1.5">
              {Array.from({ length: 36 }).map((_, i) => {
                const x = i * 24 - 20;
                return <line key={i} x1={x} y1="0" x2={x + 56} y2="48" />;
              })}
            </g>
          </svg>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-slate-950/30 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-slate-950/50"
        >
          Cerrar
        </button>

        <div className="relative p-6 pt-20 md:p-8 md:pt-20">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-300/70 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
                Econfia empresarial
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-800 md:text-3xl">
                Consulta procesada
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Empresa RUES registrada para revisión en Consultas
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-100/70 bg-white/70 px-4 py-3 text-right shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-[0.26em] text-slate-400">NIT</p>
              <p className="mt-1 font-mono text-base font-black tracking-[0.08em] text-slate-800">
                {empresa.nit || "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr]">
            <div className="space-y-3">
              <div className="flex h-36 items-center justify-center rounded-2xl border border-slate-300/60 bg-[linear-gradient(180deg,#d0d8e3_0%,#eef2f6_100%)]">
                <FaBuilding className="text-6xl text-sky-700" />
              </div>
              <div className="rounded-2xl border border-cyan-100/70 bg-white/55 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Fecha consulta</p>
                <p className="mt-1 text-sm font-black text-slate-700">
                  {empresa.fecha_consulta ? new Date(empresa.fecha_consulta).toLocaleDateString("es-CO") : "Hoy"}
                </p>
              </div>
            </div>

            <div className="grid content-start gap-3">
              <div className="rounded-2xl bg-white/42 p-4">
                <div className="grid gap-3 md:grid-cols-[150px_1fr]">
                  <p className="text-sm font-black uppercase tracking-wide text-slate-700">Razón social</p>
                  <p className="border-b border-slate-300/70 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-800">
                    {empresa.nombre || "Empresa consultada"}
                  </p>
                  <p className="text-sm font-black uppercase tracking-wide text-slate-700">Estado</p>
                  <p className="border-b border-slate-300/70 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-800">
                    {empresa.estado || "No reportado"}
                  </p>
                  <p className="text-sm font-black uppercase tracking-wide text-slate-700">Cámara</p>
                  <p className="border-b border-slate-300/70 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-800">
                    {empresa.camara_comercio || "No reportada"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border px-4 py-3 ${estadoActivo ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] opacity-70">Estado mercantil</p>
                  <p className="mt-1 text-lg font-black">{estadoActivo ? "Activo" : "Revisar"}</p>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${alertaDian ? "border-amber-200 bg-amber-50 text-amber-800" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`}>
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] opacity-70">DIAN</p>
                  <p className="mt-1 text-lg font-black">{alertaDian ? "Alerta" : "Sin alerta"}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-200/45 bg-[linear-gradient(90deg,rgba(15,47,77,0.08),rgba(255,255,255,0.2),rgba(24,93,143,0.12))] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Resultado disponible en Consultas
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
                    Abra el historial de consultas para revisar ficha, gráficos y PDF.
                  </span>
                  <button
                    type="button"
                    onClick={onGoToConsultas}
                    className="rounded-full border border-cyan-200/40 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-white"
                  >
                    Ir a Consultas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsultaEmpresa() {
  const navigate = useNavigate();
  const [tipoDoc] = useState("NIT");
  const [nit, setNit] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [toast, setToast] = useState(null);
  const [resultadoEmpresa, setResultadoEmpresa] = useState(null);
  const [capturaAmpliada, setCapturaAmpliada] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nit) {
      setToast({ type: "error", message: "Ingresa el NIT de la persona natural o jurídica." });
      return;
    }
    if (!acepta) {
      setToast({ type: "error", message: "Debes aceptar los términos y condiciones." });
      return;
    }
    if (!consentimiento) {
      setToast({ type: "error", message: "Debes confirmar que cuentas con el consentimiento del titular." });
      return;
    }

    setLoading(true);
    setToast(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/consultar-empresa-rues/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ nit, tipo_consulta: "empresa" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: data.error || `Error HTTP: ${res.status}` });
        return;
      }

      setResultadoEmpresa(normalizarEmpresaData(data));
    } catch (error) {
      setToast({ type: "error", message: "Ocurrió un error en la consulta." });
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPdf = async () => {
    if (!resultadoEmpresa || generandoPdf) return;

    setGenerandoPdf(true);
    try {
      const token = localStorage.getItem("token");
      const nit = resultadoEmpresa.nit;
      const response = await fetch(`${API_URL}/api/descargar-pdf-empresa/${nit}/`, {
        method: "GET",
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No fue posible obtener el PDF del servidor.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Informe_Empresa_${nit}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setToast({ type: "error", message: error.message || "No fue posible generar el PDF de empresa." });
    } finally {
      setGenerandoPdf(false);
    }
  };

  const handleNuevaConsulta = () => {
    setResultadoEmpresa(null);
    setToast(null);
    setNit("");
  };

  const perfil = resultadoEmpresa?.empresa_resumen?.perfil || {};
  const metricas = resultadoEmpresa?.empresa_resumen?.metricas || {};
  const historia = resultadoEmpresa?.empresa_resumen?.historia_empresarial || [];
  const propietarioData = resultadoEmpresa?.propietario_establecimiento || {};
  const propietarioRegistros = propietarioData?.registros || [];
  const proveedoresFicticios = resultadoEmpresa?.proveedores_ficticios_dian || {};
  const proveedoresFicticiosRegistros = proveedoresFicticios?.registros || [];
  const camaraAfiliados = resultadoEmpresa?.camara_comercio_afiliados || {};
  const camaraAfiliadosRegistros = camaraAfiliados?.registros || [];
  const generalPreferredOrder = [
    "Identificación",
    "Categoria de la Matrícula",
    "Tipo de Sociedad",
    "Tipo Organización",
    "Cámara de Comercio",
    "Número de Matrícula",
    "Fecha de Matrícula",
    "Fecha de Vigencia",
    "Estado de la matrícula",
    "Fecha de renovación",
    "Último año renovado",
    "Fecha de Actualización",
    "Emprendimiento Social",
  ];
  const generalEntriesMap = resultadoEmpresa?.informacion_general || {};
  const generalEntries = [
    ...generalPreferredOrder
      .filter((key) => Object.prototype.hasOwnProperty.call(generalEntriesMap, key))
      .map((key) => [key, generalEntriesMap[key]]),
    ...Object.entries(generalEntriesMap).filter(([key]) => !generalPreferredOrder.includes(key)),
  ];
  const assessment = getAssessmentData(resultadoEmpresa);

  return (
    <>
    <div className="relative z-0 mx-auto max-w-7xl px-4 pb-8 pt-3 md:px-6 md:pb-10 md:pt-4">
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-line/15 bg-[linear-gradient(135deg,rgb(var(--th-surface)/0.96),rgb(var(--th-surface-2)/0.9)_48%,rgb(var(--th-surface)/0.96))] p-5 shadow-[0_30px_80px_rgba(2,6,23,0.16)]">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgb(var(--th-brand)/0.08)_45%,transparent_62%)]" />
          <div className="relative grid gap-6 xl:grid-cols-[0.85fr_1.45fr] xl:items-center">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">
                <FaBuilding className="text-brand" />
                Empresa RUES
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight text-content md:text-3xl">
                Consulta mercantil empresarial
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Valida RUES, Cámara de Comercio, actividad económica, representación legal y señales de proveedor desde una sola consulta.
              </p>
              <div className="mt-5 grid gap-2 text-xs text-muted sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-2xl border border-line/15 bg-surface-2/70 px-4 py-3 shadow-sm shadow-black/5">
                  <div className="font-black uppercase tracking-[0.16em] text-brand">Fuente</div>
                  <div className="mt-1 font-semibold text-content">RUES + complementarias</div>
                </div>
                <div className="rounded-2xl border border-line/15 bg-surface-2/70 px-4 py-3 shadow-sm shadow-black/5">
                  <div className="font-black uppercase tracking-[0.16em] text-ok">Salida</div>
                  <div className="mt-1 font-semibold text-content">Ficha + PDF empresarial</div>
                </div>
                <div className="rounded-2xl border border-line/15 bg-surface-2/70 px-4 py-3 shadow-sm shadow-black/5">
                  <div className="font-black uppercase tracking-[0.16em] text-brand-2">Cruce futuro</div>
                  <div className="mt-1 font-semibold text-content">Adjudicator pendiente</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-line/15 bg-surface/70 p-4 shadow-[inset_0_1px_0_rgb(var(--th-content)/0.05),0_18px_50px_rgba(2,6,23,0.10)] backdrop-blur-xl">
              <div className="grid gap-4 lg:grid-cols-[150px_1fr]">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-content/80">
                    Tipo
                  </label>
                  <select
                    className="h-14 w-full rounded-2xl border border-line/15 bg-surface-2/80 px-4 text-base font-bold text-content outline-none"
                    value={tipoDoc}
                    disabled
                  >
                    <option value="NIT">NIT</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-content/80">
                    NIT persona natural o jurídica
                  </label>
                  <input
                    type="text"
                    className="h-14 w-full rounded-2xl border border-line/15 bg-surface-2/80 px-4 text-lg font-bold text-content outline-none transition placeholder:text-muted/70 focus:border-brand/45 focus:bg-surface focus:ring-2 focus:ring-brand/15"
                    placeholder="Ej: 900000001"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px] lg:items-stretch">
                <div className="rounded-2xl border border-line/15 bg-surface-2/55 p-4">
                  <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                    Autorización requerida
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label htmlFor="acepta" className="flex cursor-pointer items-start gap-3 rounded-xl border border-line/15 bg-surface/70 px-3 py-3 text-sm leading-5 text-content/85 transition hover:border-brand/35 hover:bg-brand/10">
                      <input
                        type="checkbox"
                        id="acepta"
                        checked={acepta}
                        onChange={(e) => setAcepta(e.target.checked)}
                        className="mt-1 accent-sky-500"
                      />
                      <span>Acepto los <Terminos inline />.</span>
                    </label>

                    <label htmlFor="consentimiento" className="flex cursor-pointer items-start gap-3 rounded-xl border border-line/15 bg-surface/70 px-3 py-3 text-sm leading-5 text-content/85 transition hover:border-brand/35 hover:bg-brand/10">
                      <input
                        type="checkbox"
                        id="consentimiento"
                        checked={consentimiento}
                        onChange={(e) => setConsentimiento(e.target.checked)}
                        className="mt-1 accent-sky-500"
                      />
                      <span>Declaro bajo mi responsabilidad que cuento con la autorización previa del titular de los datos personales objeto de consulta o con un fundamento legal válido que me habilita para realizarla, y que utilizaré la información exclusivamente para finalidades legítimas y autorizadas para consultar esta información.</span>
                    </label>
                  </div>
                </div>

                <AvisoTratamientoDatos className="mb-3" />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-[92px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-brand-2 px-5 text-base font-black text-white shadow-[0_18px_38px_rgba(14,165,233,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:from-sky-400 hover:to-brand-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-3">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Consultando
                    </span>
                  ) : "Consultar Empresa"}
                </button>
              </div>

              {toast && (
                <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                  toast.type === "error"
                    ? "border-red-400/25 bg-red-500/10 text-danger"
                    : "border-emerald-400/25 bg-emerald-500/10 text-ok"
                }`}>
                  {toast.message}
                </div>
              )}
            </form>
          </div>
        </div>

        {false && resultadoEmpresa && (
            <>
              <div className={`overflow-hidden rounded-[2.25rem] border bg-gradient-to-br p-6 md:p-8 shadow-[0_30px_100px_rgba(2,6,23,0.42)] backdrop-blur-xl ${assessment?.classes || "border-white/10 from-slate-950 to-slate-900"}`}>
                <div className="space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${assessment?.badge || "bg-sky-400 text-slate-950"}`}>
                        <FaClipboardCheck />
                        {assessment?.eyebrow || "Evaluación empresarial"}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
                        <FaCheckCircle className="text-emerald-300" />
                        Fuente RUES
                      </div>
                    </div>

                    <h3 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-white md:text-5xl">
                      {resultadoEmpresa.nombre || "Empresa consultada"}
                    </h3>

                    <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/38 p-5">
                      <div className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
                        Lectura ejecutiva
                      </div>
                      <h4 className="mt-2 text-2xl font-bold text-white">
                        {assessment?.title}
                      </h4>
                      <p className="mt-3 text-base leading-8 text-slate-300">
                        {assessment?.summary}
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                      <InfoChip label="NIT consultado" value={resultadoEmpresa.nit || "No disponible"} />
                      <InfoChip label="Estado reportado" value={resultadoEmpresa.estado || "No disponible"} />
                      <InfoChip label="Cámara de comercio" value={resultadoEmpresa.camara_comercio || "No disponible"} />
                      <InfoChip label="Matrícula" value={resultadoEmpresa.matricula || "No disponible"} />
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleDescargarPdf}
                        disabled={generandoPdf}
                        className="inline-flex items-center gap-3 rounded-2xl border border-sky-300/25 bg-sky-400/15 px-5 py-4 text-sm font-bold text-sky-50 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200/50 hover:bg-sky-400/25 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <FaFilePdf className="text-lg text-sky-200" />
                        {generandoPdf ? "Generando PDF..." : "Descargar informe empresarial"}
                      </button>
                      <button
                        type="button"
                        onClick={handleNuevaConsulta}
                        className="inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-4 text-sm font-bold text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.1]"
                      >
                        Nueva consulta
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-slate-950/42 p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Resumen para calificación
                        </div>
                        <div className="mt-1 text-xl font-black text-white">
                          Señales clave
                        </div>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                        <FaBalanceScale />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <MetricTile label="Año matrícula" value={metricas.anio_fundacion} tone="sky" />
                      <MetricTile label="Antigüedad" value={metricas.antiguedad_anos != null ? `${metricas.antiguedad_anos} años` : "—"} tone="emerald" />
                      <MetricTile label="Actividades" value={metricas.total_actividades} tone="amber" />
                      <MetricTile
                        label="DIAN"
                        value={proveedoresFicticios?.aparece ? "Alerta" : "Sin alerta"}
                        tone={proveedoresFicticios?.aparece ? "amber" : "emerald"}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {assessment?.signals.map((signal) => (
                    <AssessmentSignal key={signal.label} signal={signal} />
                  ))}
                </div>
              </div>

              <EmpresaGraficosEjecutivos resultadoEmpresa={resultadoEmpresa} />

              <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                <div className="space-y-6">
                  <SectionCard
                    title="Información general"
                    accent="sky"
                    description="Datos registrales base para confirmar identidad, tipo de sociedad, estado, matrícula y renovación."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      {generalEntries.length > 0 ? (
                        generalEntries.map(([label, value]) => (
                          <FieldRow key={label} label={label} value={value} />
                        ))
                      ) : (
                        <div className="text-slate-300">No hay información general disponible.</div>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Actividades económicas"
                    accent="emerald"
                    description="Permite validar si el objeto comercial declarado corresponde con el producto o servicio que se va a contratar."
                  >
                    <div className="space-y-3">
                      {(resultadoEmpresa.actividad_economica || []).length > 0 ? (
                        resultadoEmpresa.actividad_economica.map((item, index) => (
                          <div key={`${item.codigo}-${index}`} className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                              {index === 0 ? "Principal" : `Actividad ${index + 1}`}
                            </div>
                            <div className="mt-2 text-white font-semibold">
                              {item.codigo || "Sin código"}
                            </div>
                            <div className="mt-1 text-slate-300">
                              {item.descripcion || "Sin descripción"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-300">No hay actividades económicas disponibles.</div>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Proveedores ficticios DIAN"
                    accent={proveedoresFicticios?.aparece ? "amber" : "emerald"}
                    description="Señal crítica para revisar riesgos tributarios, costos no deducibles y exposición por operaciones simuladas."
                  >
                    <div className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
                      proveedoresFicticios?.aparece
                        ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
                        : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                    }`}>
                      <div className="font-semibold">
                        {proveedoresFicticios?.mensaje || "Validación DIAN no disponible."}
                      </div>
                      {proveedoresFicticios?.fundamento && (
                        <div className="mt-2 text-slate-300">{proveedoresFicticios.fundamento}</div>
                      )}
                      {proveedoresFicticios?.recomendacion && (
                        <div className="mt-2 text-slate-300">{proveedoresFicticios.recomendacion}</div>
                      )}
                    </div>

                    {proveedoresFicticiosRegistros.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {proveedoresFicticiosRegistros.map((item, index) => (
                          <div key={`${item.nit}-${item.numero_resolucion}-${index}`} className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                              Registro DIAN {index + 1}
                            </div>
                            <div className="mt-3 grid gap-4 md:grid-cols-2">
                              <FieldRow label="NIT" value={item.nit} />
                              <FieldRow label="Razón social" value={item.nombre_razon_social} />
                              <FieldRow label="Año" value={item.anio} />
                              <FieldRow label="Resolución" value={item.numero_resolucion} />
                              <FieldRow label="Fecha resolución" value={item.fecha_resolucion} />
                              <FieldRow label="Publicación" value={item.medio_publicacion} />
                              <FieldRow label="Artículo" value={item.articulo} />
                              <FieldRow label="Dirección seccional" value={item.direccion_seccional} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Afiliados al círculo de la Cámara de Comercio"
                    accent={camaraAfiliados?.aparece ? "sky" : "violet"}
                    description="Fuente complementaria del círculo de afiliados para enriquecer contacto, actividad económica, representante y capacidad financiera reportada."
                  >
                    <div className={`rounded-2xl border px-4 py-4 text-sm leading-6 ${
                      camaraAfiliados?.aparece
                        ? "border-sky-400/20 bg-sky-500/10 text-sky-100"
                        : "border-violet-400/20 bg-violet-500/10 text-violet-100"
                    }`}>
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                        Validación en base de afiliados
                      </div>
                      <div className="mt-2 font-semibold">
                        {camaraAfiliados?.mensaje || "Validación de afiliados al círculo de la Cámara de Comercio no disponible."}
                      </div>
                      {camaraAfiliadosRegistros.length > 0 && (
                        <div className="mt-2 text-slate-300">
                          Se encontró información complementaria para perfilar la empresa: datos mercantiles, contacto, indicadores financieros y actividades económicas.
                        </div>
                      )}
                    </div>

                    {camaraAfiliadosRegistros.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {camaraAfiliadosRegistros.map((item, index) => (
                          <CamaraAfiliadoCard
                            key={`${item.nit}-${item.matricula_mercantil}-${index}`}
                            item={item}
                            index={index}
                          />
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Propietario / Establecimiento"
                    accent="amber"
                    description="Ayuda a entender si existen establecimientos asociados, sedes o registros vinculados a la empresa consultada."
                  >
                    <div className="space-y-4">
                      {propietarioRegistros.length > 0 ? (
                        propietarioRegistros.map((item, index) => (
                          <div key={`${item.titulo}-${index}`} className="rounded-2xl border border-white/8 bg-slate-950/35 p-5">
                            <div className="flex items-center gap-2 text-white font-semibold">
                              <FaStore className="text-amber-300" />
                              {item.titulo || `Establecimiento ${index + 1}`}
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              {Object.entries(item.campos || {}).map(([label, value]) => (
                                <FieldRow key={`${item.titulo}-${label}`} label={label} value={value} />
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-amber-400/15 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                          {propietarioData?.mensaje || "No hay información de establecimientos disponible."}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </div>

                <div className="space-y-6">
                  <SectionCard
                    title="Perfil empresarial"
                    accent="violet"
                    description="Resumen rápido de clasificación jurídica y datos que ayudan a entender la naturaleza del proveedor."
                  >
                    <div className="space-y-3">
                      <FieldRow label="Tipo de sociedad" value={perfil.tipo_sociedad} />
                      <FieldRow label="Tipo de organización" value={perfil.tipo_organizacion} />
                      <FieldRow label="Categoría de matrícula" value={perfil.categoria_matricula} />
                      <FieldRow label="Identificación RUES" value={perfil.identificacion} />
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Representante legal"
                    accent="sky"
                    description="Identifica quién representa a la empresa y permite cruzar cargos, nombres e identificaciones en revisión interna."
                  >
                    {(resultadoEmpresa.representante_legal?.registros || []).length > 0 ? (
                      <div className="space-y-3">
                        {resultadoEmpresa.representante_legal.registros.map((item, index) => (
                          <div key={`${item.cargo || item.etiqueta}-${index}`} className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                            <div className="text-xs uppercase tracking-[0.16em] text-sky-300">
                              {item.cargo || item.etiqueta || "Cargo"}
                            </div>
                            <div className="mt-2 text-white font-semibold">
                              {item.nombre || item.valor || "No disponible"}
                            </div>
                            {item.identificacion && (
                              <div className="mt-1 text-sm text-slate-300">{item.identificacion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : resultadoEmpresa.representante_legal?.mensaje ? (
                      <details className="group rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-sky-300 marker:hidden">
                          <span className="group-open:hidden">Ver detalle del nombramiento</span>
                          <span className="hidden group-open:inline">Ocultar detalle</span>
                        </summary>
                        <div className="mt-3 max-h-72 overflow-y-auto text-sm leading-7 text-slate-300 whitespace-pre-line">
                          {resultadoEmpresa.representante_legal.mensaje}
                        </div>
                      </details>
                    ) : (
                      <div className="text-slate-300">Información no disponible.</div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Historia registral"
                    accent="amber"
                    description="Fechas y señales de continuidad que ayudan a interpretar trayectoria, renovación y vigencia."
                  >
                    <div className="space-y-3">
                      {historia.map((item, index) => (
                        <div key={`${item.titulo}-${index}`} className="rounded-2xl border border-white/8 bg-slate-950/35 p-4">
                          <div className="text-xs uppercase tracking-[0.16em] text-amber-300">{item.titulo}</div>
                          <div className="mt-2 text-white text-xl font-bold">{item.valor || "—"}</div>
                          <div className="mt-1 text-sm text-slate-300">{item.detalle || "Sin detalle"}</div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {resultadoEmpresa.captura_principal && (
                    <SectionCard
                      title="Captura de la consulta"
                      accent="emerald"
                      description="Evidencia visual de la fuente consultada para soporte del análisis."
                    >
                      <button
                        type="button"
                        onClick={() => setCapturaAmpliada(true)}
                        className="group relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left shadow"
                      >
                        <img
                          src={resultadoEmpresa.captura_principal}
                          alt="Captura de la empresa"
                          className="max-h-[360px] w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.01] group-hover:opacity-100"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/90 to-transparent px-4 py-4">
                          <span className="text-sm font-bold text-white">Clic para ampliar evidencia</span>
                          <FaEye className="text-cyan-200" />
                        </div>
                      </button>
                    </SectionCard>
                  )}

                  <SectionCard
                    title="Guía de calificación"
                    accent="sky"
                    description="Orden recomendado para que el analista tome una decisión con evidencia y no solo con datos aislados."
                  >
                    <div className="space-y-3">
                      <DecisionStep
                        icon={FaIdCard}
                        title="1. Validar identidad"
                        text="Confirma que NIT, razón social, matrícula y cámara coincidan con el proveedor que se va a contratar."
                        tone="sky"
                      />
                      <DecisionStep
                        icon={FaExclamationTriangle}
                        title="2. Revisar alertas"
                        text="Si aparece en DIAN ficticios o el estado mercantil no es activo, escala la revisión antes de aprobar."
                        tone={proveedoresFicticios?.aparece ? "amber" : "emerald"}
                      />
                      <DecisionStep
                        icon={FaChartLine}
                        title="3. Evaluar capacidad"
                        text="Contrasta actividad económica, antigüedad, renovación, personal ocupado e indicadores financieros disponibles."
                        tone="emerald"
                      />
                      <DecisionStep
                        icon={FaBalanceScale}
                        title="4. Documentar decisión"
                        text="Usa el PDF como soporte de la calificación y deja observaciones si la información es incompleta."
                        tone="sky"
                      />
                    </div>
                  </SectionCard>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
    <EmpresaConsultaExitosaModal
      empresa={resultadoEmpresa}
      onClose={() => setResultadoEmpresa(null)}
      onGoToConsultas={() => {
        if (!resultadoEmpresa?.nit) {
          navigate("/d3b7f1e9");
          return;
        }
        navigate("/d3b7f1e9", {
          state: {
            openEmpresaNit: resultadoEmpresa.nit,
            openEmpresaAt: Date.now(),
          },
        });
      }}
    />
    {capturaAmpliada && resultadoEmpresa?.captura_principal && (
      <div
        className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-md"
        onClick={() => setCapturaAmpliada(false)}
      >
        <div
          className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-brand/20 bg-slate-950 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setCapturaAmpliada(false)}
            className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-sm font-black text-white transition hover:bg-white/10"
          >
            Cerrar
          </button>
          <img
            src={resultadoEmpresa.captura_principal}
            alt="Captura ampliada de la empresa"
            className="max-h-[92vh] w-full object-contain"
          />
        </div>
      </div>
    )}
    </>
  );
}
