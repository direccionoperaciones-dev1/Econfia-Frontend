// Contenido del Centro normativo LA/FT/FPADM.
// Revisado en noviembre de 2026. Es información general, no asesoría jurídica:
// cada norma se debe confirmar en la fuente oficial antes de usarla en una decisión.
// Si una norma cambia, se actualiza aquí y se cambia REVISION.

export const REVISION = "noviembre de 2026";

export const SECTORES = [
  {
    id: "real",
    nombre: "Sector real",
    ejemplo: "Sociedades comerciales vigiladas",
    supervisor: "Superintendencia de Sociedades",
    sigla: "Supersociedades",
    url: "https://www.supersociedades.gov.co",
    color: "cyan",
    sistemas: ["SAGRILAFT", "PTEE"],
    norma: "Circular Externa 100-000020 del 2 de julio de 2026 (nueva Circular Básica Jurídica)",
    novedad:
      "La nueva Circular Básica Jurídica integra en un solo sistema de autocontrol la gestión del riesgo LA/FT/FPADM (SAGRILAFT) y la de corrupción y soborno transnacional (PTEE).",
    exige: [
      "Oficial de cumplimiento principal y suplente",
      "Matriz de riesgos y segmentación de contrapartes",
      "Debida diligencia y debida diligencia intensificada",
      "Identificación del beneficiario final",
      "Reporte de operaciones sospechosas (ROS) a la UIAF",
      "Canales de denuncia y capacitación",
    ],
  },
  {
    id: "financiero",
    nombre: "Sector financiero",
    ejemplo: "Bancos, fiduciarias, aseguradoras, comisionistas",
    supervisor: "Superintendencia Financiera de Colombia",
    sigla: "Superfinanciera",
    url: "https://www.superfinanciera.gov.co",
    color: "blue",
    sistemas: ["SARLAFT"],
    norma: "Circular Básica Jurídica, reexpedida con la Circular Externa 006 de 2025",
    novedad:
      "En junio de 2025 la Superfinanciera reexpidió su Circular Básica Jurídica para depurar y reorganizar la regulación; el SARLAFT sigue siendo el sistema exigido a sus vigilados.",
    exige: [
      "Etapas: identificación, medición, control y monitoreo",
      "Conocimiento del cliente y del mercado",
      "Segmentación de factores de riesgo",
      "Consulta de listas vinculantes",
      "Reportes a la UIAF (ROS, transacciones en efectivo y otros)",
      "Oficial de cumplimiento con posesión ante la SFC",
    ],
  },
  {
    id: "solidario",
    nombre: "Sector solidario",
    ejemplo: "Cooperativas, fondos de empleados, mutuales",
    supervisor: "Superintendencia de la Economía Solidaria",
    sigla: "Supersolidaria",
    url: "https://www.supersolidaria.gov.co",
    color: "emerald",
    sistemas: ["SARLAFT"],
    norma: "Circular Básica Jurídica de la Supersolidaria, Título V",
    exige: [
      "SARLAFT proporcional al nivel de supervisión",
      "Conocimiento de asociados, proveedores y empleados",
      "Oficial de cumplimiento",
      "Reportes a la UIAF",
      "Formatos de seguimiento a la Supersolidaria",
    ],
  },
  {
    id: "salud",
    nombre: "Sector salud",
    ejemplo: "EPS, IPS y demás vigilados",
    supervisor: "Superintendencia Nacional de Salud",
    sigla: "Supersalud",
    url: "https://www.supersalud.gov.co",
    color: "pink",
    sistemas: ["SARLAFT", "SICOF", "PTEE"],
    norma: "Circular Externa 009 de 2016, modificada por la Circular Externa 20211700000005-5 de 2021",
    exige: [
      "SARLAFT dentro del Sistema Integrado de Gestión de Riesgos",
      "SICOF: control de corrupción, opacidad y fraude",
      "Reporte del oficial de cumplimiento",
      "Reportes a la UIAF",
    ],
  },
  {
    id: "transporte",
    nombre: "Sector transporte",
    ejemplo: "Carga, pasajeros especial, puertos, CDA, CRC, escuelas de conducción",
    supervisor: "Superintendencia de Transporte",
    sigla: "Supertransporte",
    url: "https://www.supertransporte.gov.co",
    color: "amber",
    sistemas: ["SARLAFT", "PTEE"],
    norma: "Resolución 2328 de 2025, que modificó el Capítulo 6 del Título V de la Circular Única de Infraestructura y Transporte",
    novedad:
      "En 2025 la Supertransporte eliminó el antiguo SIPLAFT y adoptó un SARLAFT con oficial de cumplimiento, debida diligencia intensificada para PEP y reporte de la ausencia de operaciones sospechosas.",
    exige: [
      "Oficial de cumplimiento y manual SARLAFT",
      "Metodología de segmentación y matriz de riesgo",
      "Debida diligencia intensificada para PEP",
      "ROS y reporte de ausencia de ROS a la UIAF",
    ],
  },
  {
    id: "vigilancia",
    nombre: "Vigilancia y seguridad privada",
    ejemplo: "Empresas de vigilancia, escoltas, transporte de valores",
    supervisor: "Superintendencia de Vigilancia y Seguridad Privada",
    sigla: "Supervigilancia",
    url: "https://www.supervigilancia.gov.co",
    color: "purple",
    sistemas: ["SARLAFT", "PTEE"],
    norma: "Circular Externa 20240000245 de 2024 (SARLAFT) y sus instrucciones complementarias",
    exige: [
      "SARLAFT proporcional al tamaño del servicio",
      "Conocimiento de clientes, socios y personal",
      "Oficial de cumplimiento",
      "Reportes a la UIAF",
    ],
  },
  {
    id: "juegos",
    nombre: "Juegos de suerte y azar",
    ejemplo: "Operadores de juegos localizados y en línea",
    supervisor: "Coljuegos",
    sigla: "Coljuegos",
    url: "https://www.coljuegos.gov.co",
    color: "orange",
    sistemas: ["SARLAFT"],
    norma: "Resolución 20195100044514 de 2019 y Resolución 202115000012784 de 2021",
    exige: [
      "Identificación de jugadores y premios",
      "Controles sobre transacciones y pagos de premios",
      "Oficial de cumplimiento",
      "Reportes a la UIAF",
    ],
  },
];

export const CONCEPTOS = [
  {
    id: "laft",
    termino: "LA/FT/FPADM",
    corto: "Los tres riesgos que se gestionan",
    texto:
      "Lavado de activos, financiación del terrorismo y financiación de la proliferación de armas de destrucción masiva. Son los riesgos que todo sistema de autocontrol debe identificar, medir, controlar y monitorear.",
  },
  {
    id: "dd",
    termino: "Debida diligencia",
    corto: "Conocer a la contraparte",
    texto:
      "Conjunto de verificaciones para conocer a clientes, proveedores, empleados y socios: quiénes son, a qué se dedican, de dónde vienen sus recursos y si aparecen en listas restrictivas.",
  },
  {
    id: "ddi",
    termino: "Debida diligencia intensificada",
    corto: "Más controles para más riesgo",
    texto:
      "Verificación reforzada para contrapartes de mayor riesgo, como PEP, personas de países de alto riesgo o actividades con activos virtuales. Exige más soportes y aprobación de un nivel superior.",
  },
  {
    id: "bf",
    termino: "Beneficiario final",
    corto: "Quién está detrás",
    texto:
      "La persona natural que finalmente posee o controla una empresa. La Ley 2195 de 2022 refuerza su identificación y la DIAN lleva el Registro Único de Beneficiarios Finales (RUB).",
  },
  {
    id: "pep",
    termino: "PEP",
    corto: "Personas expuestas políticamente",
    texto:
      "Servidores públicos con funciones de poder o manejo de recursos, según el Decreto 830 de 2021. La condición se mantiene durante el cargo y por dos años después de dejarlo. Las normas de cada sector extienden los controles a su círculo cercano.",
  },
  {
    id: "ros",
    termino: "ROS",
    corto: "Reporte de operación sospechosa",
    texto:
      "Comunicación confidencial a la UIAF cuando una operación no guarda relación con el perfil de la contraparte. No es una denuncia penal y no requiere certeza del delito.",
  },
  {
    id: "oc",
    termino: "Oficial de cumplimiento",
    corto: "El responsable del sistema",
    texto:
      "Persona designada por el máximo órgano social para promover, desarrollar y vigilar el sistema de autocontrol. Debe tener formación, experiencia, independencia y un suplente.",
  },
  {
    id: "matriz",
    termino: "Matriz de riesgo",
    corto: "El mapa del riesgo",
    texto:
      "Herramienta que cruza los factores de riesgo (contrapartes, productos, canales y jurisdicciones) con su probabilidad e impacto, para definir controles y priorizar la vigilancia.",
  },
];

export const LISTAS = {
  vinculantes: {
    titulo: "Vinculantes",
    color: "emerald",
    descripcion:
      "Obligatorias en Colombia. Según el artículo 20 de la Ley 1121 de 2006, la única lista internacional vinculante es la del Consejo de Seguridad de las Naciones Unidas.",
    items: [
      { nombre: "Consejo de Seguridad de la ONU", detalle: "Lista consolidada de sanciones (terrorismo y proliferación)" },
    ],
  },
  internacionales: {
    titulo: "Internacionales de referencia",
    color: "blue",
    descripcion:
      "No son obligatorias por ley, pero los supervisores y el mercado esperan que se consulten como buena práctica de gestión del riesgo.",
    items: [
      { nombre: "OFAC (EE. UU.)", detalle: "Lista SDN, conocida como \"Lista Clinton\"" },
      { nombre: "Unión Europea", detalle: "Sanciones financieras consolidadas" },
      { nombre: "Reino Unido (OFSI)", detalle: "Lista consolidada de sanciones financieras" },
      { nombre: "INTERPOL", detalle: "Notificaciones rojas públicas" },
      { nombre: "FBI y DEA", detalle: "Personas más buscadas" },
      { nombre: "Bancos multilaterales", detalle: "Inhabilitados por BID y Banco Mundial" },
    ],
  },
  nacionales: {
    titulo: "Nacionales",
    color: "cyan",
    descripcion:
      "Antecedentes y registros oficiales colombianos que completan el conocimiento de la contraparte.",
    items: [
      { nombre: "Procuraduría", detalle: "Antecedentes disciplinarios (SIRI)" },
      { nombre: "Contraloría", detalle: "Responsables fiscales" },
      { nombre: "Policía Nacional", detalle: "Antecedentes judiciales" },
      { nombre: "Rama Judicial", detalle: "Procesos judiciales" },
      { nombre: "SIGEP", detalle: "Servidores públicos (apoyo para identificar PEP)" },
      { nombre: "RUES", detalle: "Existencia y representación de empresas" },
    ],
  },
};

export const ECOSISTEMA = [
  {
    nivel: "Internacional",
    nombre: "GAFI",
    detalle: "Grupo de Acción Financiera Internacional. Fija las 40 Recomendaciones que son el estándar mundial contra el LA/FT.",
    url: "https://www.fatf-gafi.org",
  },
  {
    nivel: "Regional",
    nombre: "GAFILAT",
    detalle: "Grupo regional del GAFI para Latinoamérica, del que Colombia es miembro. Evalúa el cumplimiento de los países.",
    url: "https://www.gafilat.org",
  },
  {
    nivel: "Nacional",
    nombre: "UIAF",
    detalle: "Unidad de Información y Análisis Financiero, creada por la Ley 526 de 1999. Recibe los reportes y analiza la inteligencia financiera.",
    url: "https://www.uiaf.gov.co",
  },
  {
    nivel: "Supervisión",
    nombre: "Superintendencias",
    detalle: "Cada supervisor fija el sistema que deben aplicar sus vigilados (SAGRILAFT, SARLAFT, PTEE) y verifica su cumplimiento.",
  },
  {
    nivel: "Empresa",
    nombre: "Sujeto obligado",
    detalle: "Implementa el sistema: oficial de cumplimiento, debida diligencia, consulta de listas y reportes.",
  },
];

export const LINEA_TIEMPO = [
  { anio: "1999", norma: "Ley 526", texto: "Crea la UIAF como unidad de inteligencia financiera." },
  { anio: "2006", norma: "Ley 1121", texto: "Prevención de la financiación del terrorismo; la lista de la ONU es vinculante." },
  { anio: "2016", norma: "Ley 1778", texto: "Responsabilidad de las personas jurídicas por soborno transnacional." },
  { anio: "2021", norma: "Decreto 830", texto: "Actualiza el régimen de Personas Expuestas Políticamente (PEP)." },
  { anio: "2021", norma: "Resolución DIAN 000164", texto: "Crea el Registro Único de Beneficiarios Finales (RUB)." },
  { anio: "2022", norma: "Ley 2195", texto: "Transparencia y lucha contra la corrupción; refuerza el beneficiario final." },
  { anio: "2025", norma: "SFC CE 006", texto: "La Superfinanciera reexpide su Circular Básica Jurídica." },
  { anio: "2025", norma: "Supertransporte Res. 2328", texto: "El sector transporte pasa del SIPLAFT al SARLAFT." },
  { anio: "2026", norma: "Supersociedades CE 100-000020", texto: "Nueva Circular Básica Jurídica: SAGRILAFT y PTEE en un solo sistema." },
];
