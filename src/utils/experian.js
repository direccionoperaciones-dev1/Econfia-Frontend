export const EXPERIAN_DOCUMENT_OPTIONS = [
  { value: "1", label: "Cédula de ciudadanía" },
  { value: "2", label: "Cédula de extranjería" },
  { value: "3", label: "NIT" },
  { value: "4", label: "Tarjeta de identidad" },
  { value: "5", label: "Pasaporte" },
  { value: "6", label: "PEP" },
  { value: "7", label: "PPT" },
];

export function getExperianSubjectField(tipoIdentificacion) {
  const normalized = String(tipoIdentificacion || "").trim().toUpperCase();
  const isNit = normalized === "3" || normalized === "NIT";

  if (isNit) {
    return {
      key: "apellidoRazonSocial",
      label: "Razón social",
      placeholder: "Ingrese la razón social",
      persona: "pj",
    };
  }

  return {
    key: "apellidoRazonSocial",
    label: "Primer apellido",
    placeholder: "Ingrese el primer apellido",
    persona: "pn",
  };
}

export function isExperianConsulta(item) {
  const source = String(item?.source || "").trim().toLowerCase();
  const tipo = String(item?.tipo_consulta || item?.tipo || "").trim().toLowerCase();
  return source === "experian" || tipo === "experian" || tipo === "econfia adjudicator";
}

export function normalizeExperianConsulta(item) {
  return {
    ...item,
    id: item.id,
    row_id: `experian-${item.id}`,
    source: "experian",
    tipo: item.tipo_resultado === "pj" ? "EMPRESA" : "PERSONA",
    tipo_consulta: "Econfia Adjudicator",
    cedula: item.numero_identificacion || "",
    nit: item.numero_identificacion || "",
    nombre: item.nombre_mostrado || item.apellido_razon_social || "",
    fecha: item.created_at || item.updated_at || null,
    consulta_original_id: item.id,
  };
}

// ── Econfia Credit Report ──────────────────────────────────────────────────

export function isHdcConsulta(item) {
  const source = String(item?.source || "").trim().toLowerCase();
  const tipo = String(item?.tipo_consulta || item?.tipo || "").trim().toLowerCase();
  return source === "hdc" || tipo === "hdc" || tipo === "historia de crédito" || tipo === "econfia credit report";
}

export function normalizeHdcConsulta(item) {
  return {
    ...item,
    id: item.id,
    row_id: `hdc-${item.id}`,
    source: "hdc",
    tipo: "PERSONA",
    tipo_consulta: "Econfia Credit Report",
    cedula: item.numero_identificacion || "",
    nombre: item.nombre_mostrado || item.apellido_razon_social || "",
    fecha: item.created_at || item.updated_at || null,
    consulta_original_id: item.id,
  };
}

// ── Econfia Contact Search (Reconocer) ──────────────────────────────────────

export function isReconocerConsulta(item) {
  const source = String(item?.source || "").trim().toLowerCase();
  const tipo = String(item?.tipo_consulta || item?.tipo || "").trim().toLowerCase();
  return source === "reconocer" || tipo === "reconocer" || tipo === "econfia recognize" || tipo === "econfia contact search";
}

export function normalizeReconocerConsulta(item) {
  return {
    ...item,
    id: item.id,
    row_id: `reconocer-${item.id}`,
    source: "reconocer",
    tipo: "PERSONA",
    tipo_consulta: "Econfia Contact Search",
    cedula: item.numero_identificacion || "",
    nombre: item.nombre_mostrado || item.apellido_razon_social || "",
    fecha: item.created_at || item.updated_at || null,
    consulta_original_id: item.id,
  };
}

// ── Econfia Integrity 360 ─────────────────────────────────────────────────────

export function isConsolidadoConsulta(item) {
  return String(item?.source || "").trim().toLowerCase() === "consolidado-riesgo";
}

export function normalizeConsolidadoConsulta(item) {
  return {
    ...item,
    id: item.id,
    row_id: `consolidado-riesgo-${item.id}`,
    source: "consolidado-riesgo",
    tipo: "PERSONA",
    tipo_consulta: "Econfia Integrity 360",
    cedula: item.cedula || "",
    nombre: item.nombre_completo || "",
    fecha: item.created_at || item.updated_at || null,
    consulta_original_id: item.id,
  };
}

// ── Empresa RUES ───────────────────────────────────────────────────────────

export function isAssetSearchConsulta(item) {
  const source = String(item?.source || "").trim().toLowerCase();
  const tipo = String(item?.tipo_consulta || item?.tipo || "").trim().toLowerCase();
  return source === "inmuebles-snr" || tipo === "econfia asset search";
}

export function normalizeAssetSearchConsulta(item) {
  return {
    ...item,
    id: item.id,
    row_id: `inmuebles-snr-${item.id}`,
    source: "inmuebles-snr",
    tipo: "PERSONA",
    tipo_consulta: "Econfia Asset Search",
    cedula: item.numero_documento || "",
    nombre: "Consulta de activos inmobiliarios",
    fecha: item.fecha_inicio || item.fecha_consulta || null,
    consulta_original_id: item.id,
  };
}

export function isEmpresaConsulta(item) {
  const source = String(item?.source || "").trim().toLowerCase();
  const tipo = String(item?.tipo_consulta || item?.tipo || "").trim().toLowerCase();
  return source === "empresa-rues" || tipo === "empresa rues" || tipo === "empresa";
}

export function normalizeEmpresaConsulta(item) {
  return {
    ...item,
    id: item.nit || item.id,
    row_id: `empresa-rues-${item.nit || item.id}`,
    source: "empresa-rues",
    tipo: "EMPRESA",
    tipo_consulta: "Empresa RUES",
    estado: "completado",
    cedula: item.nit || "",
    nit: item.nit || "",
    nombre: item.nombre || "Empresa consultada",
    fecha: item.fecha_consulta || null,
    empresa_data: item,
    integraciones_pendientes: {
      econfia_adjudicator: false,
    },
  };
}
