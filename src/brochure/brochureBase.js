// Brochure comercial de Econfia: tema, tipos de página y borrador por defecto.
// El contenido real se guarda en el backend (/api/brochure/); si nunca se ha
// editado, se muestra BROCHURE_POR_DEFECTO.
import {
  Award, BarChart3, Briefcase, Building2, CheckCircle2, Clock, FileCheck2, Fingerprint, Globe,
  HeartHandshake, Lock, Mail, MapPin, Phone, Plug, Scale, Search, ShieldCheck, Smartphone,
  Sparkles, Target, Users, Zap,
} from "lucide-react";

export const ICONOS = {
  escudo: ShieldCheck, rayo: Zap, lupa: Search, documento: FileCheck2, personas: Users,
  huella: Fingerprint, empresa: Building2, grafica: BarChart3, reloj: Clock, candado: Lock,
  mundo: Globe, premio: Award, alianza: HeartHandshake, maletin: Briefcase, balanza: Scale,
  check: CheckCircle2, celular: Smartphone, correo: Mail, telefono: Phone, ubicacion: MapPin,
  api: Plug, estrella: Sparkles, objetivo: Target,
};

export const FUENTES = {
  Poppins: "'Poppins', system-ui, sans-serif",
  Montserrat: "'Montserrat', system-ui, sans-serif",
  "Playfair Display": "'Playfair Display', Georgia, serif",
};

export const TEMA_POR_DEFECTO = {
  color_primario: "#2c1470",
  color_oscuro: "#0d0724",
  color_acento: "#34d399",
  color_claro: "#f7f5ff",
  color_texto: "#1e1b3a",
  fuente_titulos: "Poppins",
  logo: "/img/logo-econfia-blanco.png",
  logo_oscuro: "/img/logo-econfia.png",
  formato: "revista",
  adorno: "constelaciones",
  adorno_intensidad: 35,
  video_segundos: 6,
  video_transicion: "zoom",
};

// Mismo contenido, distintas formas de presentarlo.
export const FORMATOS = {
  revista: { nombre: "Revista", descripcion: "Doble página; las hojas se voltean como papel." },
  folleto: { nombre: "Folleto", descripcion: "Tríptico: tres caras que se despliegan juntas." },
  infografia: { nombre: "Infografía", descripcion: "Una tira larga que se revela al bajar." },
  video: { nombre: "Video", descripcion: "Pasa solo, con transiciones, como historias." },
};

// Marca de agua decorativa (detrás del contenido).
export const ADORNOS = {
  ninguno: "Sin adorno", constelaciones: "Constelaciones", puntos: "Puntos", ondas: "Ondas",
  lineas: "Líneas diagonales", circulos: "Círculos",
};

export const TRANSICIONES_VIDEO = { zoom: "Acercamiento", fundido: "Fundido", deslizar: "Deslizar" };

// Qué campos tiene cada tipo de página (lo usa el editor para armar el formulario).
export const TIPOS_PAGINA = {
  portada: { nombre: "Portada", campos: ["kicker", "titulo", "destacado", "subtitulo", "imagen", "etiqueta"] },
  texto_imagen: { nombre: "Texto + imagen", campos: ["kicker", "titulo", "texto", "puntos", "imagen", "posicion_imagen", "fondo"] },
  indice: { nombre: "Índice (automático)", campos: ["titulo", "entradas", "imagen"] },
  tarjetas: { nombre: "Tarjetas (productos, beneficios)", campos: ["kicker", "titulo", "texto", "items", "fondo"], item: ["icono", "titulo", "texto"] },
  cifras: { nombre: "Cifras", campos: ["kicker", "titulo", "texto", "items", "imagen", "fondo"], item: ["valor", "titulo", "texto"] },
  pasos: { nombre: "Pasos / proceso", campos: ["kicker", "titulo", "texto", "items", "fondo"], item: ["titulo", "texto"] },
  contacto: { nombre: "Contraportada / contacto", campos: ["kicker", "titulo", "texto", "items", "boton", "imagen"], item: ["icono", "titulo", "texto", "enlace"] },
};

export const ETIQUETAS_CAMPO = {
  entradas: "Líneas del índice", kicker: "Antetítulo (pequeño, arriba)", titulo: "Título", destacado: "Palabra destacada en color", subtitulo: "Subtítulo",
  texto: "Texto", puntos: "Viñetas (una por línea)", imagen: "Imagen", posicion_imagen: "Imagen arriba o abajo",
  fondo: "Fondo", etiqueta: "Sello (ej. año)", items: "Elementos", boton: "Botón",
  icono: "Ícono", valor: "Cifra", enlace: "Enlace (https://, mailto:, tel:)",
};

// Ayudas cortas para quien edita por primera vez.
export const AYUDAS_CAMPO = {
  kicker: "Texto corto en mayúsculas que va encima del título.",
  destacado: "Se pinta con el color de acento al final del título.",
  texto: "Deja una línea en blanco para separar párrafos.",
  puntos: "Cada línea es una viñeta con chulito.",
  etiqueta: "Círculo pequeño arriba a la derecha (ej. el año).",
  items: "Cada elemento es una tarjeta: al pasar el cursor se resalta en color.",
  boton: "Si dejas el enlace vacío, el botón no aparece.",
  imagen: "Sube una foto, pega un enlace o elige una de la galería.",
};

export const paginaNueva = (tipo) => {
  const base = { id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, tipo, titulo: "Nueva página" };
  if (tipo === "tarjetas") return { ...base, items: [{ icono: "escudo", titulo: "Elemento", texto: "Describe aquí el beneficio." }] };
  if (tipo === "cifras") return { ...base, items: [{ valor: "100%", titulo: "Indicador", texto: "" }] };
  if (tipo === "pasos") return { ...base, items: [{ titulo: "Primer paso", texto: "Qué pasa aquí." }] };
  if (tipo === "contacto") return { ...base, fondo: "oscuro", items: [{ icono: "correo", titulo: "Correo", texto: "soporte@econfia.co", enlace: "mailto:soporte@econfia.co" }] };
  if (tipo === "texto_imagen") return { ...base, texto: "Escribe aquí el contenido de la página.", imagen: "/img/brochure/seguridad.jpg" };
  return base;
};

export const BROCHURE_POR_DEFECTO = {
  tema: TEMA_POR_DEFECTO,
  paginas: [
    {
      id: "portada", tipo: "portada", kicker: "Brochure corporativo",
      titulo: "Decisiones seguras con", destacado: "información verificada",
      subtitulo: "Verificación de antecedentes, listas restrictivas y estudios de seguridad en una sola plataforma.",
      imagen: "/img/brochure/escudo.jpg", etiqueta: "2026",
    },
    {
      id: "bienvenida", tipo: "texto_imagen", kicker: "Bienvenida", titulo: "Gracias por confiar en Econfia",
      texto: "Sabemos que contratar, vincular un proveedor o aprobar un crédito es una decisión que no admite dudas. Por eso construimos Econfia: para que tengas en minutos la información que necesitas, con evidencia de cada fuente consultada.\n\nEn este brochure te contamos quiénes somos, qué hacemos y cómo te acompañamos.",
      imagen: "/img/brochure/holograma.jpg", posicion_imagen: "abajo", fondo: "claro",
    },
    { id: "indice", tipo: "indice", titulo: "Contenido", imagen: "/img/brochure/datos.jpg" },
    {
      id: "nosotros", tipo: "texto_imagen", kicker: "Quiénes somos", titulo: "Tecnología al servicio de la confianza",
      texto: "Econfia es la plataforma de SCS Soluciones de Confiabilidad para la debida diligencia de personas y empresas. Consultamos fuentes públicas y privadas, nacionales e internacionales, y entregamos un informe claro con su nivel de riesgo.",
      puntos: "Fuentes judiciales, disciplinarias y de policía\nListas restrictivas y sanciones internacionales\nInforme consolidado con evidencia\nAcompañamiento de un equipo experto",
      imagen: "/img/brochure/seguridad.jpg", posicion_imagen: "arriba", fondo: "claro",
    },
    {
      id: "cifras", tipo: "cifras", kicker: "Econfia en cifras", titulo: "Resultados que se miden",
      texto: "Información rápida, completa y con respaldo para cada consulta.",
      items: [
        { valor: "+200", titulo: "Fuentes consultadas", texto: "Nacionales e internacionales" },
        { valor: "≈1,5 min", titulo: "Consulta Fast", texto: "Resultado consolidado" },
        { valor: "24/7", titulo: "Disponibilidad", texto: "Web, API y app móvil" },
        { valor: "100%", titulo: "Con evidencia", texto: "Trazabilidad por fuente" },
      ],
      imagen: "/img/brochure/vr.jpg", fondo: "oscuro",
    },
    {
      id: "productos", tipo: "tarjetas", kicker: "Nuestros productos", titulo: "Una consulta para cada necesidad",
      texto: "Elige la profundidad que tu proceso requiere.",
      items: [
        { icono: "rayo", titulo: "Econfia Fast", texto: "Consulta masiva y veloz en cientos de fuentes, ideal para procesos de alto volumen." },
        { icono: "lupa", titulo: "Econfia Essencial", texto: "Tú eliges las fuentes y recibes evidencia real capturada en el momento." },
        { icono: "escudo", titulo: "Econfia Full", texto: "La revisión más completa, con informe consolidado y mapa de riesgo." },
        { icono: "grafica", titulo: "Credit Report", texto: "Indicadores financieros para decisiones de crédito y vinculación." },
      ],
      fondo: "claro",
    },
    {
      id: "servicios", tipo: "tarjetas", kicker: "Servicios especializados", titulo: "Más allá de la consulta",
      texto: "Complementa la verificación digital con nuestro equipo en campo.",
      items: [
        { icono: "personas", titulo: "Estudios de seguridad", texto: "Visita domiciliaria, verificación de referencias y análisis del candidato." },
        { icono: "huella", titulo: "Polígrafo", texto: "Pruebas de preempleo, rutina y específicas con examinadores certificados." },
        { icono: "documento", titulo: "Contact Search", texto: "Ubicación y validación de datos de contacto." },
        { icono: "api", titulo: "Integración por API", texto: "Conecta Econfia a tu sistema y automatiza tus validaciones." },
      ],
      fondo: "oscuro",
    },
    {
      id: "proceso", tipo: "pasos", kicker: "Cómo funciona", titulo: "Así de fácil empiezas",
      items: [
        { titulo: "Elige tu plan", texto: "Te armamos una propuesta a la medida de tu volumen y presupuesto." },
        { titulo: "Consulta", texto: "Ingresa el documento y Econfia revisa todas las fuentes por ti." },
        { titulo: "Recibe tu informe", texto: "Resultado consolidado, nivel de riesgo y evidencia descargable." },
        { titulo: "Decide con respaldo", texto: "Toma la decisión con información verificada y trazable." },
      ],
      fondo: "claro",
    },
    {
      id: "porque", tipo: "tarjetas", kicker: "Por qué Econfia", titulo: "Confianza que se puede demostrar",
      items: [
        { icono: "candado", titulo: "Protección de datos", texto: "Tratamiento conforme a la Ley 1581 y autorizaciones del titular." },
        { icono: "balanza", titulo: "Cumplimiento", texto: "Apoyo a SARLAFT, SAGRILAFT y debida diligencia." },
        { icono: "documento", titulo: "Evidencia", texto: "Cada fuente queda con fecha, hora y soporte de la consulta." },
        { icono: "alianza", titulo: "Acompañamiento", texto: "Un asesor te guía desde la primera consulta." },
      ],
      fondo: "claro",
    },
    {
      id: "contacto", tipo: "contacto", kicker: "Hablemos", titulo: "Empieza hoy con Econfia",
      texto: "Tu asesor está listo para resolver tus dudas y ajustar la propuesta a lo que necesitas.",
      items: [
        { icono: "telefono", titulo: "WhatsApp", texto: "+57 305 422 6582", enlace: "https://wa.me/573054226582" },
        { icono: "correo", titulo: "Correo", texto: "soporte@econfia.co", enlace: "mailto:soporte@econfia.co" },
        { icono: "mundo", titulo: "Web", texto: "econfia.co", enlace: "https://econfia.co" },
      ],
      boton: { texto: "Escríbenos por WhatsApp", enlace: "https://wa.me/573054226582" },
      imagen: "/img/brochure/lupa.jpg",
    },
  ],
};

export const temaDe = (contenido) => ({ ...TEMA_POR_DEFECTO, ...(contenido?.tema || {}) });

// Variables CSS que usan las páginas (colores editables sin recompilar estilos).
export const variablesTema = (tema) => ({
  "--b-primario": tema.color_primario,
  "--b-oscuro": tema.color_oscuro,
  "--b-acento": tema.color_acento,
  "--b-claro": tema.color_claro,
  "--b-texto": tema.color_texto,
  "--b-fuente": FUENTES[tema.fuente_titulos] || FUENTES.Poppins,
});

// Solo deja pasar enlaces seguros (el backend también lo valida).
export const enlaceSeguro = (url) => {
  const u = String(url || "").trim();
  if (!u || u.startsWith("//")) return "";
  return /^(https?:\/\/|\/|mailto:|tel:)/i.test(u) ? u : "";
};
