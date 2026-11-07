// Contenido del Centro normativo LA/FT/FPADM.
// Revisado en noviembre de 2026. Es información general, no asesoría jurídica:
// cada norma se debe confirmar en la fuente oficial antes de usarla en una decisión.
// Si una norma cambia, se actualiza aquí y se cambia REVISION.

export const REVISION = "noviembre de 2026";

// Fuentes que aplican a cualquier sector (base de toda debida diligencia).
export const FUENTES_BASE = [
  "Lista ONU (vinculante)",
  "OFAC",
  "Unión Europea",
  "Procuraduría",
  "Contraloría",
  "Policía Nacional",
];

// estado: "vigente" | "historica". Las vigentes se muestran primero.
export const SECTORES = [
  {
    id: "real",
    nombre: "Sector real",
    ejemplo: "Sociedades comerciales vigiladas",
    regulador: "Superintendencia de Sociedades",
    sigla: "Supersociedades",
    url: "https://www.supersociedades.gov.co",
    color: "cyan",
    sistemas: ["SAGRILAFT", "PTEE"],
    instrumento: "Circular Básica Jurídica de la Supersociedades",
    novedad:
      "La nueva Circular Básica Jurídica integra en un solo sistema de autocontrol la gestión del riesgo LA/FT/FPADM (SAGRILAFT) y la de corrupción y soborno transnacional (PTEE).",
    normas: [
      { norma: "Circular Externa 100-000020 de 2026", tema: "Nueva Circular Básica Jurídica: SAGRILAFT y PTEE integrados", estado: "vigente" },
      { norma: "Circular Externa 100-000011 de 2021", tema: "PTEE, Capítulo XIII de la circular anterior", estado: "historica" },
      { norma: "Circular Externa 100-000004 de 2021", tema: "Modificó el SAGRILAFT del Capítulo X", estado: "historica" },
      { norma: "Circular Externa 100-000016 de 2020", tema: "SAGRILAFT, Capítulo X de la circular anterior", estado: "historica" },
    ],
    exige: [
      "Oficial de cumplimiento principal y suplente",
      "Matriz de riesgos y segmentación de contrapartes",
      "Debida diligencia y debida diligencia intensificada",
      "Identificación del beneficiario final",
      "Reporte de operaciones sospechosas (ROS) a la UIAF",
      "Canales de denuncia y capacitación",
    ],
    fuentes: ["RUES", "Boletines de Supersociedades", "Multas y sanciones SECOP", "Rama Judicial", "SIGEP (PEP)"],
  },
  {
    id: "financiero",
    nombre: "Sector financiero",
    ejemplo: "Bancos, fiduciarias, aseguradoras, comisionistas",
    regulador: "Superintendencia Financiera de Colombia",
    sigla: "Superfinanciera",
    url: "https://www.superfinanciera.gov.co",
    color: "blue",
    sistemas: ["SARLAFT"],
    instrumento: "Circular Básica Jurídica de la Superfinanciera",
    novedad:
      "En junio de 2025 la Superfinanciera reexpidió su Circular Básica Jurídica para depurar y reorganizar la regulación; el SARLAFT sigue siendo el sistema exigido a sus vigilados.",
    normas: [
      { norma: "Circular Externa 006 de 2025", tema: "Reexpide la Circular Básica Jurídica", estado: "vigente" },
      { norma: "Circular Externa 027 de 2020", tema: "Actualizó las instrucciones del SARLAFT", estado: "historica" },
      { norma: "Circular Externa 029 de 2014", tema: "Circular Básica Jurídica anterior", estado: "historica" },
    ],
    exige: [
      "Etapas: identificación, medición, control y monitoreo",
      "Conocimiento del cliente y del mercado",
      "Segmentación de factores de riesgo",
      "Consulta de listas vinculantes",
      "Reportes a la UIAF (ROS, efectivo y otros)",
      "Oficial de cumplimiento posesionado ante la SFC",
    ],
    fuentes: ["Reino Unido (OFSI)", "INTERPOL", "BID y Banco Mundial", "Rama Judicial", "RUES", "SIGEP (PEP)"],
  },
  {
    id: "solidario",
    nombre: "Sector solidario",
    ejemplo: "Cooperativas, fondos de empleados, mutuales",
    regulador: "Superintendencia de la Economía Solidaria",
    sigla: "Supersolidaria",
    url: "https://www.supersolidaria.gov.co",
    color: "emerald",
    sistemas: ["SARLAFT"],
    instrumento: "Circular Básica Jurídica de la Supersolidaria, Título V",
    normas: [
      { norma: "Circular Básica Jurídica, Título V", tema: "SARLAFT para las organizaciones solidarias", estado: "vigente" },
    ],
    exige: [
      "SARLAFT proporcional al nivel de supervisión",
      "Conocimiento de asociados, proveedores y empleados",
      "Oficial de cumplimiento",
      "Reportes a la UIAF",
      "Formatos de seguimiento a la Supersolidaria",
    ],
    fuentes: ["RUES", "Rama Judicial", "SIGEP (PEP)", "Multas y sanciones SECOP"],
  },
  {
    id: "salud",
    nombre: "Sector salud",
    ejemplo: "EPS, IPS y demás vigilados",
    regulador: "Superintendencia Nacional de Salud",
    sigla: "Supersalud",
    url: "https://www.supersalud.gov.co",
    color: "pink",
    sistemas: ["SARLAFT", "SICOF", "PTEE"],
    instrumento: "Circular Externa 009 de 2016 de la Supersalud y sus modificaciones",
    normas: [
      { norma: "Circular Externa 20211700000005-5 de 2021", tema: "Modifica el SARLAFT e incorpora el SICOF", estado: "vigente" },
      { norma: "Circular Externa 2022151000000053-5 de 2022", tema: "Programa de Transparencia y Ética (PTEE)", estado: "vigente" },
      { norma: "Circular Externa 009 de 2016", tema: "Instrucciones originales del SARLAFT en salud", estado: "historica" },
    ],
    exige: [
      "SARLAFT dentro del Sistema Integrado de Gestión de Riesgos",
      "SICOF: control de corrupción, opacidad y fraude",
      "Reporte del oficial de cumplimiento",
      "Reportes a la UIAF",
    ],
    fuentes: ["RETHUS (talento humano en salud)", "ADRES (afiliación)", "RUAF", "Tribunal de Ética Médica", "Rama Judicial"],
  },
  {
    id: "transporte",
    nombre: "Sector transporte",
    ejemplo: "Carga, pasajeros especial, puertos, CDA, CRC, escuelas de conducción",
    regulador: "Superintendencia de Transporte",
    sigla: "Supertransporte",
    url: "https://www.supertransporte.gov.co",
    color: "amber",
    sistemas: ["SARLAFT", "PTEE"],
    instrumento: "Circular Única de Infraestructura y Transporte, Título V, Capítulo 6",
    novedad:
      "En 2025 la Supertransporte eliminó el antiguo SIPLAFT y adoptó un SARLAFT con oficial de cumplimiento, debida diligencia intensificada para PEP y reporte de la ausencia de operaciones sospechosas.",
    normas: [
      { norma: "Resolución 2328 de 2025", tema: "Adopta el SARLAFT y elimina el SIPLAFT", estado: "vigente" },
      { norma: "Resolución 14673 de 2025", tema: "Programa de Transparencia y Ética (PTEE)", estado: "vigente" },
      { norma: "Resolución 74854 de 2016", tema: "SIPLAFT del transporte de carga", estado: "historica" },
    ],
    exige: [
      "Oficial de cumplimiento y manual SARLAFT",
      "Metodología de segmentación y matriz de riesgo",
      "Debida diligencia intensificada para PEP",
      "ROS y reporte de ausencia de ROS a la UIAF",
    ],
    fuentes: ["RUNT", "SIMIT (multas de tránsito)", "Organismos de tránsito", "Rama Judicial", "RUES"],
  },
  {
    id: "vigilancia",
    nombre: "Vigilancia y seguridad privada",
    ejemplo: "Empresas de vigilancia, escoltas, transporte de valores",
    regulador: "Superintendencia de Vigilancia y Seguridad Privada",
    sigla: "Supervigilancia",
    url: "https://www.supervigilancia.gov.co",
    color: "purple",
    sistemas: ["SARLAFT", "PTEE"],
    instrumento: "Circulares externas de la Supervigilancia (SARLAFT 2.0)",
    normas: [
      { norma: "Circular Externa 20240000245 de 2024", tema: "SARLAFT 2.0", estado: "vigente" },
      { norma: "Circular Externa 20251000000035CS de 2025", tema: "Programa de Transparencia y Ética (PTEE)", estado: "vigente" },
      { norma: "SIPLAFT", tema: "Sistema de prevención usado antes en el sector", estado: "historica" },
    ],
    exige: [
      "SARLAFT proporcional al tamaño del servicio",
      "Conocimiento de clientes, socios y personal",
      "Oficial de cumplimiento",
      "Reportes a la UIAF",
    ],
    fuentes: ["INPEC", "Rama Judicial", "Medidas correctivas (RNMC)", "RUES"],
  },
  {
    id: "juegos",
    nombre: "Juegos de suerte y azar",
    ejemplo: "Operadores de juegos localizados y en línea",
    regulador: "Coljuegos",
    sigla: "Coljuegos",
    url: "https://www.coljuegos.gov.co",
    color: "orange",
    sistemas: ["SARLAFT"],
    instrumento: "Resoluciones de Coljuegos sobre SARLAFT",
    normas: [
      { norma: "Resolución 202115000012784 de 2021", tema: "Modifica las instrucciones del SARLAFT", estado: "vigente" },
      { norma: "Resolución 20195100044514 de 2019", tema: "Instrucciones del SARLAFT para operadores", estado: "vigente" },
    ],
    exige: [
      "Identificación de jugadores y premios",
      "Controles sobre transacciones y pagos de premios",
      "Oficial de cumplimiento",
      "Reportes a la UIAF",
    ],
    fuentes: ["SIGEP (PEP)", "INTERPOL", "Rama Judicial", "RUES"],
  },
  {
    id: "publico",
    nombre: "Entidades públicas",
    ejemplo: "Ministerios, alcaldías, gobernaciones y demás entidades del Estado",
    regulador: "Secretaría de Transparencia de la Presidencia (lineamientos)",
    sigla: "Secretaría de Transparencia",
    url: "https://www.secretariatransparencia.gov.co",
    color: "teal",
    sistemas: ["SIGRIP", "PTEP"],
    instrumento: "Ley 2195 de 2022 y su reglamentación",
    novedad:
      "A las entidades públicas no les aplican el SARLAFT ni el SAGRILAFT. Gestionan el riesgo de LA/FT dentro del SIGRIP, junto con la corrupción, el soborno, el fraude y los conflictos de interés.",
    normas: [
      { norma: "Decreto 1122 de 2024", tema: "Lineamientos del SIGRIP y del PTEP", estado: "vigente" },
      { norma: "Ley 2195 de 2022", tema: "Ley de transparencia y lucha contra la corrupción", estado: "vigente" },
    ],
    exige: [
      "Programa de Transparencia y Ética Pública (PTEP)",
      "Identificación de riesgos de integridad, incluido LA/FT",
      "Responsable designado del sistema",
      "Debida diligencia de contratistas y proveedores",
    ],
    fuentes: ["SECOP (contratos y multas)", "SIGEP (PEP)", "SIRI (sanciones disciplinarias)", "Personería", "Rama Judicial"],
  },
];

export const GRUPOS_GLOSARIO = [
  { id: "todos", label: "Todos" },
  { id: "sistemas", label: "Sistemas" },
  { id: "entidades", label: "Entidades" },
  { id: "conceptos", label: "Conceptos" },
];

export const CONCEPTOS = [
  {
    id: "sarlaft",
    grupo: "sistemas",
    termino: "SARLAFT",
    corto: "Sistema del sector financiero y otros supervisados",
    texto:
      "Sistema de Administración del Riesgo de Lavado de Activos y Financiación del Terrorismo. Lo exige la Superfinanciera a bancos, aseguradoras y demás vigilados; otros supervisores, como Supersolidaria, Supersalud, Supertransporte, Supervigilancia y Coljuegos, lo exigen con sus propias reglas.",
  },
  {
    id: "sagrilaft",
    grupo: "sistemas",
    termino: "SAGRILAFT",
    corto: "Sistema de las empresas del sector real",
    texto:
      "Sistema de Autocontrol y Gestión del Riesgo Integral de LA/FT/FPADM. Lo exige la Supersociedades a las sociedades que vigila y que superan ciertos umbrales de ingresos o activos. Desde la Circular Externa 100-000020 de 2026 se gestiona en un solo sistema junto con el PTEE.",
  },
  {
    id: "siplaft",
    grupo: "sistemas",
    termino: "SIPLAFT",
    corto: "Sistema anterior de prevención y control",
    texto:
      "Sistema de Prevención y Control del Lavado de Activos y la Financiación del Terrorismo. Se usó en sectores como el transporte de carga (Resolución 74854 de 2016 de la Supertransporte) y la vigilancia privada. En el transporte fue reemplazado por el SARLAFT en 2025.",
  },
  {
    id: "ptee",
    grupo: "sistemas",
    termino: "PTEE",
    corto: "Programa de Transparencia y Ética Empresarial",
    texto:
      "Programa de las empresas para prevenir la corrupción y el soborno transnacional. Lo exigen la Supersociedades y otros supervisores; en el sector público su equivalente es el PTEP (Programa de Transparencia y Ética Pública).",
  },
  {
    id: "sigrip",
    grupo: "sistemas",
    termino: "SIGRIP",
    corto: "El sistema de las entidades públicas",
    texto:
      "Sistema de Gestión de Riesgos para la Integridad Pública. Las entidades del Estado lo usan, con lineamientos de la Secretaría de Transparencia, para gestionar en un solo sistema la corrupción, el soborno, el fraude, los conflictos de interés y el LA/FT.",
  },
  {
    id: "gafi",
    grupo: "entidades",
    termino: "GAFI",
    corto: "Grupo de Acción Financiera Internacional",
    texto:
      "Organismo intergubernamental que fija las 40 Recomendaciones, el estándar mundial contra el lavado de activos, la financiación del terrorismo y la proliferación. Colombia participa a través del GAFILAT, su grupo regional.",
  },
  {
    id: "gafilat",
    grupo: "entidades",
    termino: "GAFILAT",
    corto: "Grupo regional del GAFI para Latinoamérica",
    texto:
      "Agrupa a los países de la región, entre ellos Colombia, y evalúa cómo cumplen las Recomendaciones del GAFI mediante evaluaciones mutuas.",
  },
  {
    id: "uiaf",
    grupo: "entidades",
    termino: "UIAF",
    corto: "Unidad de Información y Análisis Financiero",
    texto:
      "Unidad de inteligencia financiera de Colombia, creada por la Ley 526 de 1999. Recibe los reportes de operaciones sospechosas (ROS) y demás reportes de los sujetos obligados, y los analiza para detectar lavado de activos y financiación del terrorismo.",
  },
  {
    id: "laft",
    grupo: "conceptos",
    termino: "LA/FT/FPADM",
    corto: "Los tres riesgos que se gestionan",
    texto:
      "Lavado de activos, financiación del terrorismo y financiación de la proliferación de armas de destrucción masiva. Son los riesgos que todo sistema de autocontrol debe identificar, medir, controlar y monitorear.",
  },
  {
    id: "dd",
    grupo: "conceptos",
    termino: "Debida diligencia",
    corto: "Conocer a la contraparte",
    texto:
      "Conjunto de verificaciones para conocer a clientes, proveedores, empleados y socios: quiénes son, a qué se dedican, de dónde vienen sus recursos y si aparecen en listas restrictivas.",
  },
  {
    id: "ddi",
    grupo: "conceptos",
    termino: "Debida diligencia intensificada",
    corto: "Más controles para más riesgo",
    texto:
      "Verificación reforzada para contrapartes de mayor riesgo, como PEP, personas de países de alto riesgo o actividades con activos virtuales. Exige más soportes y aprobación de un nivel superior.",
  },
  {
    id: "bf",
    grupo: "conceptos",
    termino: "Beneficiario final",
    corto: "Quién está detrás",
    texto:
      "La persona natural que finalmente posee o controla una empresa. La Ley 2195 de 2022 refuerza su identificación y la DIAN lleva el Registro Único de Beneficiarios Finales (RUB).",
  },
  {
    id: "pep",
    grupo: "conceptos",
    termino: "PEP",
    corto: "Personas expuestas políticamente",
    texto:
      "Servidores públicos con funciones de poder o manejo de recursos, según el Decreto 830 de 2021. La condición se mantiene durante el cargo y por dos años después de dejarlo. Las normas de cada sector extienden los controles a su círculo cercano.",
  },
  {
    id: "ros",
    grupo: "conceptos",
    termino: "ROS",
    corto: "Reporte de operación sospechosa",
    texto:
      "Comunicación confidencial a la UIAF cuando una operación no guarda relación con el perfil de la contraparte. No es una denuncia penal y no requiere certeza del delito.",
  },
  {
    id: "oc",
    grupo: "conceptos",
    termino: "Oficial de cumplimiento",
    corto: "El responsable del sistema",
    texto:
      "Persona designada por el máximo órgano social para promover, desarrollar y vigilar el sistema de autocontrol. Debe tener formación, experiencia, independencia y un suplente.",
  },
  {
    id: "matriz",
    grupo: "conceptos",
    termino: "Matriz de riesgo",
    corto: "El mapa del riesgo",
    texto:
      "Herramienta que cruza los factores de riesgo (contrapartes, productos, canales y jurisdicciones) con su probabilidad e impacto, para definir controles y priorizar la vigilancia.",
  },
];

export const OFICIAL = {
  resumen: "La persona que protege a la empresa de ser usada para lavado de activos, terrorismo, corrupción o soborno.",
  intro:
    "Es la persona que vela por que la empresa cumpla las leyes y regulaciones que la rigen y no sea usada para el lavado de activos, la financiación del terrorismo, la corrupción o el soborno. La designa el máximo órgano social y responde ante él.",
  bloques: [
    {
      pregunta: "¿Qué hace?",
      puntos: [
        { titulo: "Diseña el sistema de prevención", texto: "Propone y mantiene al día las políticas, el manual y los procedimientos del SARLAFT, el SAGRILAFT o el programa que aplique a la empresa." },
        { titulo: "Identifica y evalúa los riesgos", texto: "Determina en qué procesos, productos, canales y contrapartes la empresa está más expuesta al lavado de activos, el fraude o la corrupción." },
        { titulo: "Vigila las operaciones", texto: "Supervisa la debida diligencia de clientes, proveedores y empleados, y detecta operaciones inusuales." },
        { titulo: "Reporta a las autoridades", texto: "Envía a la UIAF los reportes de operaciones sospechosas (ROS) y los demás reportes que exija el supervisor." },
        { titulo: "Capacita al personal", texto: "Forma a los equipos para que reconozcan señales de alerta y actúen con integridad." },
        { titulo: "Atiende denuncias y corrige", texto: "Gestiona los canales de denuncia y propone medidas correctivas cuando hay incumplimientos." },
      ],
    },
    {
      pregunta: "¿Cómo lo hace?",
      puntos: [
        { titulo: "Con independencia", texto: "Actúa como segunda línea de defensa, separado de las áreas comerciales y operativas, para evitar conflictos de interés." },
        { titulo: "Con método y tecnología", texto: "Usa matrices de riesgo, segmentación de contrapartes y herramientas de consulta y análisis para hacer la debida diligencia de forma continua." },
        { titulo: "Con informes a la dirección", texto: "Presenta informes periódicos a la junta directiva o al máximo órgano social, con la frecuencia que fije la norma de su sector." },
      ],
    },
    {
      pregunta: "¿Para qué lo hace?",
      puntos: [
        { titulo: "Para evitar sanciones", texto: "Reduce la exposición de la empresa y sus administradores a multas, procesos administrativos y responsabilidad penal." },
        { titulo: "Para proteger el patrimonio y la reputación", texto: "Evita que la empresa sea usada para delitos financieros, algo que destruiría la confianza de clientes, bancos y aliados." },
        { titulo: "Para dar continuidad al negocio", texto: "Mantener la operación dentro de la ley evita bloqueos bancarios, cierres y la pérdida de relaciones comerciales." },
      ],
    },
    {
      pregunta: "¿Por qué existe este rol?",
      puntos: [
        { titulo: "Porque la norma lo exige", texto: "Las superintendencias exigen a sus vigilados obligados designar un oficial de cumplimiento principal y un suplente, con formación, experiencia y recursos." },
        { titulo: "Porque los mercados lo piden", texto: "Bancos, clientes e inversionistas exigen estándares internacionales contra la corrupción y el lavado de activos para hacer negocios." },
      ],
    },
  ],
};

export const LISTAS = {
  vinculantes: {
    titulo: "Vinculantes",
    color: "emerald",
    descripcion:
      "Obligatorias en Colombia. Según el artículo 20 de la Ley 1121 de 2006, la única lista internacional vinculante es la del Consejo de Seguridad de las Naciones Unidas: personas y entidades sancionadas por terrorismo, su financiación y la proliferación de armas.",
    items: [
      { nombre: "Consejo de Seguridad de la ONU", detalle: "Lista consolidada de sanciones. Una coincidencia obliga a actuar y reportar." },
    ],
  },
  referencia: {
    titulo: "No vinculantes de alta relevancia",
    color: "blue",
    descripcion:
      "No tienen un mandato legal directo en Colombia, pero consultarlas es el estándar de gestión del riesgo: aparecer en ellas puede cerrar canales bancarios y generar consecuencias legales y reputacionales.",
    items: [
      { nombre: "OFAC (Lista Clinton)", detalle: "Departamento del Tesoro de EE. UU.: narcotraficantes, terroristas y personas o empresas bloqueadas." },
      { nombre: "Unión Europea", detalle: "Sanciones financieras y listas de terrorismo de la UE." },
      { nombre: "Departamento de Estado de EE. UU.", detalle: "Organizaciones terroristas extranjeras y cárteles designados." },
      { nombre: "Reino Unido (OFSI)", detalle: "Lista consolidada de sanciones financieras." },
    ],
  },
  antecedentes: {
    titulo: "Control y antecedentes",
    color: "cyan",
    descripcion:
      "Bases públicas que se verifican en el conocimiento de clientes, proveedores, empleados y socios para completar el perfil de riesgo.",
    items: [
      { nombre: "Contraloría General", detalle: "Boletín de responsables fiscales." },
      { nombre: "Procuraduría General", detalle: "Antecedentes disciplinarios." },
      { nombre: "Policía y Fiscalía", detalle: "Antecedentes judiciales y personas buscadas." },
      { nombre: "INTERPOL", detalle: "Notificaciones rojas públicas." },
      { nombre: "DIAN", detalle: "Proveedores ficticios y contribuyentes con sanciones." },
      { nombre: "DEA y FBI", detalle: "Personas buscadas por narcotráfico y otros delitos." },
      { nombre: "Banco Mundial y BID", detalle: "Inhabilitados por corrupción o fraude." },
    ],
  },
  pep: {
    titulo: "PEP",
    color: "purple",
    descripcion:
      "No son listas de delincuentes: identifican a personas que ejercen o ejercieron funciones públicas destacadas (Decreto 830 de 2021), lo que exige una debida diligencia intensificada sobre ellas y su círculo cercano.",
    items: [
      { nombre: "SIGEP", detalle: "Directorio de servidores públicos, apoyo para identificar PEP." },
      { nombre: "Declaración PEP", detalle: "La que el propio cliente o proveedor diligencia al vincularse." },
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
  { anio: "2024", norma: "Decreto 1122", texto: "Lineamientos de transparencia e integridad para las entidades públicas (SIGRIP y PTEP)." },
  { anio: "2025", norma: "SFC CE 006", texto: "La Superfinanciera reexpide su Circular Básica Jurídica." },
  { anio: "2025", norma: "Supertransporte Res. 2328", texto: "El sector transporte pasa del SIPLAFT al SARLAFT." },
  { anio: "2026", norma: "Supersociedades CE 100-000020", texto: "Nueva Circular Básica Jurídica: SAGRILAFT y PTEE en un solo sistema." },
];
