// DetalleResultados.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RefreshCw,
  Eye,
  Download,
  X,
  Database,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Globe2,
  Search,
  Users,
  CircleHelp,
  FileText,
  Target,
  ListChecks,
  TriangleAlert,
} from "lucide-react";
import { jsPDF } from "jspdf";
import AnalisisInteligente from "./AnalisisInteligente";
import { describirFuente, cargarDescripcionesFuente } from "../utils/fuentesCatalogo";
import { useTheme } from "../context/ThemeContext";

/**
 * Ícono ⓘ con popover elegante (estilo Econfia) que explica, al pasar el
 * cursor, qué hace la fuente y qué implica un hallazgo. Datos de describirFuente.
 */
function InfoFuente({ item, className = "" }) {
  const info = describirFuente(item);
  const ref = useRef(null);
  const popoverRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState(() => new Set());
  const [pos, setPos] = useState({ top: 0, left: 0, width: 820, arriba: false });

  const WIDTH = 820;
  const cancelarOcultado = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const mostrar = () => {
    cancelarOcultado();
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      const width = Math.min(WIDTH, window.innerWidth - 24);
      const leftIdeal = r.left + r.width / 2 - width / 2;
      const left = Math.max(12, Math.min(leftIdeal, window.innerWidth - width - 12));
      const espacioAbajo = window.innerHeight - r.bottom;
      const arriba = espacioAbajo < 430 && r.top > espacioAbajo;
      setPos({
        top: arriba ? r.top - 10 : r.bottom + 10,
        left,
        width,
        arriba,
      });
    }
    setOpen(true);
  };
  const ocultar = () => {
    cancelarOcultado();
    setOpen(false);
  };
  const programarOcultado = () => {
    cancelarOcultado();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => () => cancelarOcultado(), []);

  useEffect(() => {
    if (!open) return undefined;
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        setOpen(false);
      }
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [open]);

  const secciones = [
    { key: "naturaleza", label: "Naturaleza de la fuente", icon: FileText },
    { key: "por_que_existe", label: "Por qué existe", icon: Target },
    { key: "que_informacion", label: "Qué información arroja", icon: ListChecks },
  ].filter((seccion) => info[seccion.key]);

  const alternarSeccion = (key) => {
    setSeccionesExpandidas((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(key)) siguientes.delete(key);
      else siguientes.add(key);
      return siguientes;
    });
  };

  const textoExpandible = (key, texto, className = "text-content/85") => {
    const contenido = String(texto || "").trim();
    const expandida = seccionesExpandidas.has(key);
    const requiereExpansion = contenido.length > 180 || contenido.split("\n").length > 3;
    return (
      <>
        <p
          className={`mt-1 whitespace-pre-line text-[12px] leading-relaxed ${className} ${
            requiereExpansion && !expandida ? "line-clamp-3" : ""
          }`}
        >
          {contenido}
        </p>
        {requiereExpansion && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              alternarSeccion(key);
            }}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand transition-colors hover:text-brand/75 focus:outline-none focus-visible:underline"
            aria-expanded={expandida}
          >
            {expandida ? "Ver menos" : "Ver más"}
            <span aria-hidden="true">{expandida ? "↑" : "↓"}</span>
          </button>
        )}
      </>
    );
  };

  return (
    <span className={`relative inline-flex align-middle ${className}`}>
      <button
        type="button"
        ref={ref}
        onMouseEnter={mostrar}
        onMouseLeave={programarOcultado}
        onFocus={mostrar}
        onBlur={programarOcultado}
        onClick={(e) => { e.stopPropagation(); open ? ocultar() : mostrar(); }}
        className="group/help inline-flex h-6 w-6 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-brand shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/60 hover:bg-brand/20 hover:shadow-[0_6px_18px_rgba(34,211,238,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        aria-label="¿Qué hace esta fuente?"
        aria-expanded={open}
      >
        <CircleHelp size={15} strokeWidth={2.2} className="transition-transform duration-200 group-hover/help:rotate-12" />
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={`Información sobre ${info.titulo}`}
            onMouseEnter={cancelarOcultado}
            onMouseLeave={programarOcultado}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
              transform: pos.arriba ? "translateY(-100%)" : "none",
            }}
            className="max-h-[calc(100vh-24px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-brand/30 bg-[#091321]/[0.98] text-left shadow-[0_24px_70px_rgba(2,8,23,0.72),0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-2xl [scrollbar-width:thin] [scrollbar-color:rgba(34,211,238,.35)_transparent]"
          >
            <div className="relative border-b border-brand/15 bg-gradient-to-r from-brand/15 via-brand/5 to-transparent px-5 py-4">
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand to-brand-2" />
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
                  <FileText size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-brand/70">Acerca de la fuente</p>
                  <h4 className="mt-1 text-sm font-extrabold leading-snug text-content">{info.titulo}</h4>
                  {info.resumen && (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-content/65">{info.resumen}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
              {secciones.length > 0 ? (
                secciones.map(({ key, label, icon: Icon }) => (
                  <section key={key} className="grid grid-cols-[30px_1fr] items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-brand/90">
                      <Icon size={14} />
                    </span>
                    <div>
                      <h5 className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand/85">{label}</h5>
                      {textoExpandible(key, info[key])}
                    </div>
                  </section>
                ))
              ) : (
                <section className="col-span-full grid grid-cols-[30px_1fr] gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-brand/90">
                    <FileText size={14} />
                  </span>
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand/85">Especificación</h5>
                    {textoExpandible("desc", info.desc)}
                  </div>
                </section>
              )}

            {info.hallazgo && (
                <section className="rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-orange-500/[0.06] p-3.5">
                  <div className="flex items-center gap-2 text-amber-200">
                    <TriangleAlert size={15} />
                    <h5 className="text-[10px] font-extrabold uppercase tracking-[0.12em]">Si hay hallazgo</h5>
                  </div>
                  {textoExpandible("hallazgo", info.hallazgo, "text-amber-100/80")}
                </section>
            )}
            </div>

            <div className="border-t border-white/[0.06] bg-white/[0.02] px-5 py-2.5 text-[9px] uppercase tracking-[0.16em] text-muted/70">
              Información configurada para esta fuente
            </div>
          </div>,
          document.body
        )}
    </span>
  );
}

export default function DetalleResultados({ consultaId, consulta = null }) {
  const { organizacion } = useTheme();
  // Si la Organizacion tiene marca propia, el estado "Sin Clasificar" del
  // anillo de score usa su color de acento en vez del cyan fijo del tema.
  const marcaPrincipal = organizacion?.color_acento || null;
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("analisis"); // "analisis" | "resultados"
  const [resultadoModal, setResultadoModal] = useState(null);
  const [procesosModal, setProcesosModal] = useState(null);
  const [garantiasModal, setGarantiasModal] = useState(null);
  const [socialPage, setSocialPage] = useState(1);
  const [modalAnimating, setModalAnimating] = useState(false);
  const [modalOrigin, setModalOrigin] = useState({ x: 0, y: 0 });
  const [modalVector, setModalVector] = useState({ x: 0, y: 0 });

  const modalCardRef = useRef(null);
  const closeTimerRef = useRef(null);
  const openRafRef = useRef(null);
  const openRaf2Ref = useRef(null);
  const isMountedRef = useRef(true);
  const MODAL_ANIMATION_MS = 300;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Carga (una vez) las descripciones de fuente editables desde la BD.
  useEffect(() => {
    cargarDescripcionesFuente().then(() => {
      if (isMountedRef.current) setDetalle((prev) => (Array.isArray(prev) ? [...prev] : prev));
    });
  }, []);

  

  // Ids marcados localmente como "revalidando" tras click en offline
  const [pendingRevalIds, setPendingRevalIds] = useState(() => new Set());

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    fuente: "",
    tipo_fuente: "",
    estado: "",
    score: "",
  });
  const [pagina, setPagina] = useState(1);
  const [inputPage, setInputPage] = useState("");
  const porPagina = 6;

  const API_URL = process.env.REACT_APP_API_URL;

  const buildMediaUrl = (rawPath) =>
    `${API_URL}/media/${(rawPath || "").replace(/^.*?media[\\/]/, "")}`;

  // ---------- Helpers descarga ----------
  const blobToDataURL = async (blob) => {
    const mime = blob.type.toLowerCase();
    if (!mime.includes("webp")) {
      return await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
    }
    const tmpUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = tmpUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(tmpUrl);
    return canvas.toDataURL("image/jpeg", 0.95);
  };

  const downloadEvidenceAsPdf = async (archivo, nombreBase = "evidencia") => {
    const url = buildMediaUrl(archivo);
    const token = localStorage.getItem("token");

    const res = await fetch(url, {
      headers: token ? { Authorization: `Token ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`No se pudo obtener el archivo (${res.status})`);

    const blob = await res.blob();
    const mime = blob.type.toLowerCase();

    if (mime.includes("pdf")) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${nombreBase}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      return;
    }

    if (mime.startsWith("image/")) {
      const dataUrl = await blobToDataURL(blob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      const isLandscape = img.width > img.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? "l" : "p",
        unit: "pt",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxW / w, maxH / h);
      w *= ratio;
      h *= ratio;

      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;
      const imgType = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(dataUrl, imgType, x, y, w, h);
      pdf.save(`${nombreBase}.pdf`);
      return;
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombreBase}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const hasEvidenceFile = (archivo) => {
    if (typeof archivo !== "string") return false;
    return archivo.trim().length > 0;
  };

  const getNumericScore = (scoreValue) => {
    const parsed = Number(scoreValue);
    return Number.isFinite(parsed) ? parsed : null;
  };

  // Fuentes INFORMATIVAS / complementarias: encontrar un registro aquí NO es una
  // alerta negativa. Ej: RUES (registro mercantil/empresarial) — tener matrícula
  // es solo un dato complementario, no un antecedente. No deben pintarse en rojo.
  const esFuenteInformativa = (item) => {
    const txt = `${item?.fuente || ""} ${item?.fuente_nombre || ""} ${item?.tipo_fuente || ""}`.toLowerCase();
    return (
      txt.includes("rues") ||
      txt.includes("registro único empresarial") ||
      txt.includes("registro unico empresarial")
    );
  };

  const isPositiveResult = (item) => {
    // Las fuentes informativas (RUES, etc.) nunca son "alerta": se muestran neutras.
    if (esFuenteInformativa(item)) return false;
    const numericScore = getNumericScore(item?.score);
    if (numericScore !== null) return numericScore >= 3;
    const estado = (item?.estado || "").toLowerCase();
    return estado === "validado" || estado === "completado";
  };

  const normalizeMensaje = (mensaje) => {
    if (mensaje == null) return "Sin mensaje disponible.";
    if (typeof mensaje !== "string") {
      try {
        return JSON.stringify(mensaje, null, 2);
      } catch {
        return String(mensaje);
      }
    }

    const cleaned = mensaje.trim();
    if (!cleaned) return "Sin mensaje disponible.";

    const looksLikeJson = cleaned.startsWith("{") || cleaned.startsWith("[");
    if (looksLikeJson) {
      try {
        const parsed = JSON.parse(cleaned);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return cleaned;
      }
    }

    return cleaned;
  };

  const isSocialSearchResult = (item) => {
    // RUES se llama "Registro Único Empresarial y Social": la palabra "social"
    // hacía que esta función lo confundiera con la Búsqueda Social (OSINT) y le
    // pintara la plantilla equivocada. Las fuentes informativas nunca son OSINT.
    if (esFuenteInformativa(item)) return false;
    const fuente = `${item?.fuente || ""} ${item?.fuente_nombre || ""}`.toLowerCase();
    const mensaje = normalizeMensaje(item?.mensaje).toLowerCase();
    return (
      // Identificadores específicos de la Búsqueda Social, NO el genérico "social".
      fuente.includes("social_search") ||
      fuente.includes("búsqueda social") ||
      fuente.includes("busqueda social") ||
      fuente.includes("contact search") ||
      mensaje.includes("búsqueda social") ||
      mensaje.includes("busqueda social") ||
      mensaje.includes("búsqueda web por nombre") ||
      mensaje.includes("busqueda web por nombre")
    );
  };

  const parseSocialSearchMessage = (mensaje) => {
    const text = normalizeMensaje(mensaje);
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    const titleLine = lines.find((line) => /b[uú]squeda (?:social|web por nombre)/i.test(line)) || "";
    const nameFromTitle = titleLine.match(/b[uú]squeda (?:social|web por nombre):\s*(.+)$/i)?.[1]?.trim();
    const nameFromText = text.match(/para ['"]([^'"]+)['"]/i)?.[1]?.trim();
    const score = Number(text.match(/score de similitud:\s*(\d+)/i)?.[1] || text.match(/score=(\d+)/i)?.[1] || 0);
    const total = Number(text.match(/total de (?:perfiles|resultados):\s*(\d+)/i)?.[1] || 0);
    const networksLine = lines.find((line) => /redes encontradas:/i.test(line)) || "";
    const networks = networksLine
      .replace(/^.*redes encontradas:\s*/i, "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const resultBlocks = text
      .split(/\n(?=\d+\.\s)/)
      .filter((block) => /^\d+\.\s/.test(block.trim()));

    const results = resultBlocks.map((block) => {
      const blockLines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const first = blockLines[0] || "";
      const networkMatch = first.match(/\[(.*?)\]/);
      const title = first
        .replace(/^\d+\.\s*/, "")
        .replace(/^[^[]*\[/, "[")
        .replace(/\[[^\]]+\]\s*/, "")
        .trim();
      const url = block.match(/URL:\s*(https?:\/\/\S+)/i)?.[1] || "";
      let network = networkMatch?.[1]?.trim() || "Web";
      if (network.toLowerCase() === "web" && url) {
        try {
          network = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          network = "Web";
        }
      }
      const itemScore = Number(block.match(/Score:\s*(\d+)/i)?.[1] || block.match(/score=(\d+)/i)?.[1] || 0);
      const detail = block.match(/Detalle:\s*(.+)/i)?.[1]?.trim() || block.match(/Fragmento:\s*(.+)/i)?.[1]?.trim() || "";

      return {
        network,
        title,
        url,
        score: itemScore,
        detail,
      };
    });

    return {
      name: nameFromTitle || nameFromText || "Persona consultada",
      score,
      total: total || results.length,
      networks,
      results,
      hasRelevant: /se detectaron|resultados web relevantes|coincidencias web/i.test(text),
      rawText: text,
    };
  };

  const getNetworkStyle = (network = "Web") => {
    const normalized = network.toLowerCase();
    if (normalized.includes("linkedin")) return "border-sky-400/30 bg-sky-500/10 text-sky-200";
    if (normalized.includes("instagram")) return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200";
    if (normalized.includes("facebook")) return "border-blue-400/30 bg-blue-500/10 text-blue-200";
    if (normalized.includes("tiktok")) return "border-teal-400/30 bg-teal-500/10 text-teal-200";
    if (normalized.includes("youtube")) return "border-red-400/30 bg-red-500/10 text-red-200";
    return "border-slate-400/30 bg-muted/10 text-content";
  };

  const toTitleCase = (value) => {
    if (!value) return "Sin estado";
    const txt = String(value).trim();
    if (!txt) return "Sin estado";
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  };

  const getModalVisualState = (item) => {
    const rawScore = getNumericScore(item?.score);
    const alerta = isPositiveResult(item);

    let normalizedScore;
    if (rawScore === null) {
      normalizedScore = alerta ? 3 : 1;
    } else {
      normalizedScore = Math.min(5, Math.max(0, rawScore));
    }

    const circumference = 2 * Math.PI * 45;
    const dashOffset = circumference * (1 - normalizedScore / 5);

    if (normalizedScore >= 4) {
      return {
        scoreText: rawScore !== null ? String(rawScore) : "N/A",
        statusLabel: "Riesgo Alto",
        ringColor: "#fb7185",
        dotClass: "bg-rose-400",
        scoreTone: "text-rose-300",
        statusTone: "text-rose-300 border-rose-400/30 bg-rose-500/10",
        bannerTone:
          "border-rose-400/30 bg-gradient-to-r from-rose-500/12 to-red-500/12",
        bannerTitle: "Análisis completado",
        bannerText: "Resultado con alerta",
        badgeGlow: "shadow-[0_0_12px_rgba(251,113,133,0.55)]",
        dashOffset,
      };
    }

    if (normalizedScore >= 3 || alerta) {
      return {
        scoreText: rawScore !== null ? String(rawScore) : "N/A",
        statusLabel: "Riesgo Medio",
        ringColor: "#f59e0b",
        dotClass: "bg-amber-400",
        scoreTone: "text-amber-300",
        statusTone: "text-amber-300 border-amber-400/30 bg-amber-500/10",
        bannerTone:
          "border-amber-400/30 bg-gradient-to-r from-amber-500/12 to-orange-500/12",
        bannerTitle: "Análisis completado",
        bannerText: "Requiere revisión adicional",
        badgeGlow: "shadow-[0_0_12px_rgba(245,158,11,0.55)]",
        dashOffset,
      };
    }

    if (normalizedScore > 0) {
      return {
        scoreText: rawScore !== null ? String(rawScore) : "N/A",
        statusLabel: "Riesgo Mínimo",
        ringColor: "#10b981",
        dotClass: "bg-emerald-400",
        scoreTone: "text-emerald-300",
        statusTone: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
        bannerTone:
          "border-emerald-400/30 bg-gradient-to-r from-emerald-500/12 to-brand/12",
        bannerTitle: "Análisis completado",
        bannerText: "Sin hallazgo relevante",
        badgeGlow: "shadow-[0_0_12px_rgba(16,185,129,0.55)]",
        dashOffset,
      };
    }

    return {
      scoreText: rawScore !== null ? String(rawScore) : "N/A",
      statusLabel: "Sin Clasificar",
      ringColor: marcaPrincipal || "#38bdf8",
      dotClass: "bg-brand",
      scoreTone: "text-brand",
      statusTone: "text-brand border-brand/30 bg-brand/10",
      bannerTone:
        "border-brand/30 bg-gradient-to-r from-brand/12 to-brand-2/12",
      bannerTitle: "Análisis completado",
      bannerText: "Información parcial disponible",
      badgeGlow: "shadow-[0_0_12px_rgba(56,189,248,0.55)]",
      dashOffset,
    };
  };

  const renderSocialSearchDetail = (item) => {
    const parsed = parseSocialSearchMessage(item?.mensaje);
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil((parsed.results?.length || 0) / pageSize));
    const safePage = Math.min(totalPages, Math.max(1, socialPage));
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, parsed.results.length);
    const pageResults = parsed.results.slice(startIdx, endIdx);
    const exactMatches = parsed.results.filter((result) => result.score >= 80).length;
    const mediumMatches = parsed.results.filter((result) => result.score >= 40 && result.score < 80).length;
    const websiteCount = new Set(
      parsed.results
        .map((result) => {
          try {
            return result.url ? new URL(result.url).hostname.replace(/^www\./, "") : "";
          } catch {
            return "";
          }
        })
        .filter(Boolean)
    ).size;

    return (
      <section className="space-y-5">
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 via-content/[0.03] to-emerald-500/10 p-5 sm:p-6 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-44 bg-brand/5 skew-x-12 translate-x-10 pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-brand">
                <Search size={13} />
                Búsqueda OSINT
              </div>
              <h4 className="mt-4 text-2xl sm:text-3xl font-black text-content leading-tight">
                {parsed.name}
              </h4>
              <p className="mt-3 text-sm text-muted max-w-2xl">
                Resultados públicos encontrados en Google por similitud de nombre. Requieren revisión manual antes de asociarlos a una identidad.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-line/10 bg-surface-2/70 p-3">
                <p className="text-[9px] uppercase tracking-widest text-muted">Similitud</p>
                <p className="text-2xl font-black text-emerald-300">{parsed.score || "N/A"}</p>
                <p className="text-[10px] text-muted">sobre 100</p>
              </div>
              <div className="rounded-xl border border-line/10 bg-surface-2/70 p-3">
                <p className="text-[9px] uppercase tracking-widest text-muted">Resultados</p>
                <p className="text-2xl font-black text-content">{parsed.total}</p>
                <p className="text-[10px] text-muted">encontrados</p>
              </div>
              <div className="rounded-xl border border-line/10 bg-surface-2/70 p-3">
                <p className="text-[9px] uppercase tracking-widest text-muted">Estado</p>
                <p className="text-sm font-black text-amber-200 leading-tight">Revisión</p>
                <p className="text-[10px] text-muted">manual</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-[10px] uppercase tracking-widest text-emerald-200/70">Alta coincidencia</p>
            <p className="text-2xl font-black text-emerald-200">{exactMatches}</p>
          </div>
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-[10px] uppercase tracking-widest text-amber-200/70">Coincidencia media</p>
            <p className="text-2xl font-black text-amber-200">{mediumMatches}</p>
          </div>
          <div className="rounded-xl border border-slate-400/20 bg-content/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted">Sitios web</p>
            <p className="text-2xl font-black text-content">{websiteCount || "N/A"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <Users size={18} className="mt-0.5 text-amber-200" />
            <div>
              <p className="text-sm font-bold text-amber-100">Validación requerida</p>
              <p className="mt-1 text-xs sm:text-sm text-amber-50/75">
                El resultado no confirma identidad por sí solo. Debe compararse con nombre completo, ubicación u otra evidencia documental.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Resultados encontrados
            </h4>
            <span className="text-[9px] text-content/30 font-mono">
              CODE: RES_{item.id || "N/A"}
            </span>
          </div>

          {pageResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {pageResults.map((result, index) => {
                const scoreTone =
                  result.score >= 80
                    ? "text-emerald-200 bg-emerald-500/10 border-emerald-400/20"
                    : result.score >= 40
                    ? "text-amber-200 bg-amber-500/10 border-amber-400/20"
                    : "text-content bg-content/[0.03] border-line/10";

                return (
                  <article
                    key={`${result.url || result.title}-${startIdx + index}`}
                    className="rounded-2xl border border-line/10 bg-surface-2/70 p-4 hover:border-brand/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="rounded-full bg-content/10 px-2.5 py-1 text-[10px] font-bold text-content">
                            #{startIdx + index + 1}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getNetworkStyle(result.network)}`}>
                            {result.network}
                          </span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${scoreTone}`}>
                            Score {result.score}/100
                          </span>
                        </div>
                        <h5 className="text-base sm:text-lg font-bold text-content leading-snug">
                          {result.title || "Resultado sin título"}
                        </h5>
                        {result.detail && (
                          <p className="mt-2 text-sm text-muted leading-relaxed">
                            {result.detail}
                          </p>
                        )}
                      </div>

                      {result.url ? (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-brand/25 bg-brand/10 px-3 py-2 text-xs font-bold text-brand hover:bg-brand/15 transition-colors"
                        >
                          Abrir
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <Globe2 size={18} className="text-muted" />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-line/10 bg-surface-2/70 p-5 text-sm text-muted">
              No hay resultados web estructurados para mostrar. El detalle original queda disponible en el registro técnico.
            </div>
          )}

          {parsed.results.length > pageSize && (
            <div className="mt-4 rounded-2xl border border-line/10 bg-surface-2/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-muted">
                Mostrando <span className="font-bold text-content">{startIdx + 1}</span> a{" "}
                <span className="font-bold text-content">{endIdx}</span> de{" "}
                <span className="font-bold text-content">{parsed.results.length}</span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <button
                  onClick={() => setSocialPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                    safePage <= 1
                      ? "border-line/10 bg-content/5 text-content/30 cursor-not-allowed"
                      : "border-brand/25 bg-brand/10 text-brand hover:bg-brand/15"
                  }`}
                >
                  Anterior
                </button>

                <div className="px-3 py-2 rounded-lg border border-line/10 bg-content/[0.03] text-xs font-bold text-content">
                  Página {safePage}/{totalPages}
                </div>

                <button
                  onClick={() => setSocialPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
                    safePage >= totalPages
                      ? "border-line/10 bg-content/5 text-content/30 cursor-not-allowed"
                      : "border-brand/25 bg-brand/10 text-brand hover:bg-brand/15"
                  }`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const openResultadoModal = (item, event) => {
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    const fallbackX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    const fallbackY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

    setModalOrigin(
      rect
        ? {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          }
        : { x: fallbackX, y: fallbackY }
    );

    setSocialPage(1);
    setResultadoModal(item);
  };

  const closeResultadoModal = () => {
    setModalAnimating(false);

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      setResultadoModal(null);
      closeTimerRef.current = null;
    }, MODAL_ANIMATION_MS);
  };
  // --------------------------------------

  useEffect(() => {
    setPagina(1);
  }, [search, filters]);

  // 🔄 Obtener resultados
  const fetchDetalle = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/resultados/${consultaId}/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const json = await res.json();
      if (!isMountedRef.current) return;
      setDetalle(json);

      // Reconciliar overlay local con lo que venga del backend
      setPendingRevalIds((prev) => {
        const next = new Set(prev);
        for (const it of json) {
          const est = (it.estado || "").toLowerCase();
          if (next.has(it.id)) {
            if (est !== "offline" && est !== "revalidando") {
              next.delete(it.id);
            }
            if (est === "revalidando") {
              next.delete(it.id);
            }
          }
        }
        return next;
      });
    } catch (error) {
      console.error("Error al obtener detalle:", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // 📌 Al montar + refresco automático cada 5s
  useEffect(() => {
    fetchDetalle();
    const interval = setInterval(fetchDetalle, 5000);
    return () => clearInterval(interval);
  }, [consultaId]);

  useEffect(() => {
    if (!resultadoModal) {
      setModalAnimating(false);
      setModalVector({ x: 0, y: 0 });
      return;
    }

    setModalAnimating(false);

    openRafRef.current = requestAnimationFrame(() => {
      const modalEl = modalCardRef.current;

      if (modalEl) {
        const rect = modalEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setModalVector({
          x: modalOrigin.x - centerX,
          y: modalOrigin.y - centerY,
        });
      } else {
        setModalVector({ x: 0, y: 0 });
      }

      openRaf2Ref.current = requestAnimationFrame(() => {
        setModalAnimating(true);
      });
    });

    return () => {
      if (openRafRef.current) {
        cancelAnimationFrame(openRafRef.current);
      }
      if (openRaf2Ref.current) {
        cancelAnimationFrame(openRaf2Ref.current);
      }
    };
  }, [resultadoModal, modalOrigin.x, modalOrigin.y]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      if (openRafRef.current) {
        cancelAnimationFrame(openRafRef.current);
      }
      if (openRaf2Ref.current) {
        cancelAnimationFrame(openRaf2Ref.current);
      }
    };
  }, []);

  // 🚀 Reintentar consulta (offline → revalidando UI inmediata)
  const reintentarConsulta = async (id) => {
    try {
      // Marcar localmente como "revalidando" para que NO parpadee a offline
      setPendingRevalIds((prev) => new Set(prev).add(id));

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/relanzar_bot/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      if (!res.ok) throw new Error("Error al relanzar bot");
      await res.json();

      // No quitamos el overlay aquí: lo quitará fetchDetalle cuando el backend cambie de estado
      // (a "revalidando" o a un estado final).
      // Forzamos un refresh ahora para acelerar el reflejo visual.
      fetchDetalle();
    } catch (err) {
      console.error("❌ Error:", err);
      // Si falló el POST, devolvemos el id a su estado normal
      setPendingRevalIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-brand animate-spin shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
        <p className="text-muted text-sm font-semibold">Cargando detalles...</p>
      </div>
    );
  }

  // 🔍 Filtros
  const datosFiltrados = detalle.filter((item) => {
    const globalMatch = Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes((search || "").toLowerCase());

    const filtersMatch =
      (filters.fuente === "" ||
        (item.fuente || "").toLowerCase().includes(filters.fuente.toLowerCase())) &&
      (filters.tipo_fuente === "" ||
        (item.tipo_fuente || "")
          .toLowerCase()
          .includes(filters.tipo_fuente.toLowerCase())) &&
      (filters.estado === "" ||
        (item.estado || "").toLowerCase().includes(filters.estado.toLowerCase())) &&
      (filters.score === "" ||
        String(item.score || "")
          .toLowerCase()
          .includes(filters.score.toLowerCase()));

    return globalMatch && filtersMatch;
  });

  // 🎓 En consultas de Contratista, las fuentes de profesión (colegios/consejos
  // reguladores) van primero para que la verificación profesional quede arriba.
  const esContratista = (consulta?.tipo_consulta || consulta?.tipo || "")
    .toLowerCase()
    .includes("contratista");

  const esFuenteProfesion = (item) => {
    const tipo = (item?.tipo_fuente || "").toLowerCase();
    if (tipo.includes("colegio") || tipo.includes("regulador") || tipo.includes("profesion")) {
      return true;
    }
    const de = item?.datos_extra && typeof item.datos_extra === "object" ? item.datos_extra : {};
    return Boolean(
      de.profesion ||
        (Array.isArray(de.profesiones_detectadas) && de.profesiones_detectadas.length)
    );
  };

  // Partición estable: profesión primero (y dentro de ellas, las que sí
  // detectaron profesión arriba), conservando el orden original en cada grupo.
  const datosOrdenados = esContratista
    ? [
        ...datosFiltrados.filter((i) => esFuenteProfesion(i) && (Number(i.score) || 0) > 0),
        ...datosFiltrados.filter((i) => esFuenteProfesion(i) && !((Number(i.score) || 0) > 0)),
        ...datosFiltrados.filter((i) => !esFuenteProfesion(i)),
      ]
    : datosFiltrados;

  // 📑 Paginación
  const totalPaginas = Math.ceil(datosOrdenados.length / porPagina);
  const startIndex = (pagina - 1) * porPagina;
  const datosPagina = datosOrdenados.slice(startIndex, startIndex + porPagina);

  const getPages = () => {
    let pages = [];
    let start = Math.max(1, pagina - 2);
    let end = Math.min(totalPaginas, pagina + 2);

    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPaginas) pages.push("...", totalPaginas);

    return pages;
  };

  // 🎛️ Estado UI con badges elegantes
  const EstadoCell = ({ item }) => {
    const estadoRaw = item.estado || "";
    const estado = estadoRaw.toLowerCase();
    const showRevalidandoUI =
      estado === "revalidando" || pendingRevalIds.has(item.id);

    if (showRevalidandoUI) {
      return (
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-surface-2/20 to-surface-2/20 border border-line/30 text-muted font-semibold text-xs"
          title="Revalidando..."
        >
          <RefreshCw size={14} className="animate-spin" />
          Revalidando
        </span>
      );
    }

    if (estado === "offline") {
      return (
        <button
          onClick={() => reintentarConsulta(item.id)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 hover:border-amber-400/50 text-amber-300 hover:text-amber-200 font-semibold text-xs transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          title="Reintentar"
        >
          <RefreshCw size={14} />
          Offline
        </button>
      );
    }

    // Accept 'Validado', 'Validada' (any case)
    if (["validado", "validada"].includes(estado)) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-semibold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Validado
        </span>
      );
    }

    if (estado === "error") {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 text-red-400 font-semibold text-xs shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Error
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-surface-2/50 border border-slate-700/50 text-muted text-xs font-medium">
        {item.estado || "—"}
      </span>
    );
  };

  const renderEvidenceActions = (item, compact = false) => {
    // Las consultas FAST no deben mostrar capturas: aunque alguna fuente haya
    // guardado un archivo, aquí se ignora y se cae en "Ver detalle".
    const esFast = (item.tipo_consulta || "").toLowerCase().trim() === "econfiafast";
    if (!esFast && hasEvidenceFile(item.archivo)) {
      return (
        <div className={`flex items-center ${compact ? "justify-start" : "justify-center"} gap-1.5`}>
          <a
            href={buildMediaUrl(item.archivo)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white
                       bg-gradient-to-r from-brand to-brand-2
                       hover:from-brand hover:to-brand-2
                       shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]
                       transition-all duration-300
                       hover:scale-110 active:scale-95"
            title="Ver evidencia"
            aria-label="Ver evidencia"
          >
            <Eye size={14} />
          </a>
          <button
            onClick={() =>
              downloadEvidenceAsPdf(
                item.archivo,
                `${(item.fuente || "evidencia")
                  .replace(/\s+/g, "_")
                  .toLowerCase()}_${consultaId}_${item.id}`
              )
            }
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white
                       bg-gradient-to-r from-brand to-brand-2 
                       hover:from-brand hover:to-brand-2
                       shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]
                       transition-all duration-300
                       hover:scale-110 active:scale-95"
            title="Descargar como PDF"
            aria-label="Descargar como PDF"
          >
            <Download size={14} />
          </button>
        </div>
      );
    }

    if (item.mensaje || item.score != null) {
      if (isPositiveResult(item)) {
        return (
          <button
            onClick={(e) => openResultadoModal(item, e)}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-content
                       bg-gradient-to-r from-red-500/80 to-rose-500/80
                       hover:from-red-400 hover:to-rose-400
                       shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.45)]
                       transition-all duration-300
                       hover:scale-105 active:scale-95 text-xs font-semibold"
            title="Ver resultado con alerta"
            aria-label="Ver resultado con alerta"
          >
            Ver resultado
          </button>
        );
      }

      return (
        <button
          onClick={(e) => openResultadoModal(item, e)}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-muted
                     bg-gradient-to-r from-surface-2/50 to-surface-2/50
                     hover:from-surface-2/60 hover:to-surface-2/60
                     border border-line/30
                     transition-all duration-300
                     hover:scale-105 active:scale-95 text-xs font-semibold"
          title="Ver detalle"
          aria-label="Ver detalle"
        >
          Ver detalle
        </button>
      );
    }

    return <span className="text-muted text-xs italic">Sin archivo</span>;
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-4 md:px-12 pt-12 sm:pt-12 md:pt-10 lg:pt-10 pb-3 md:pb-4 h-full min-h-0 flex flex-col">

      {/* Pestañas Análisis / Resultados */}
      <div className="mb-2 md:mb-3 flex items-center gap-1.5 rounded-xl border border-brand/15 bg-surface/40 p-1 backdrop-blur-md self-start">
        {[
          { key: "analisis", label: "Análisis" },
          { key: "resultados", label: "Resultados" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
              tab === t.key
                ? "bg-gradient-to-r from-brand to-brand-2 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-muted hover:text-brand"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analisis" ? (
        <div className="min-h-0 flex-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <AnalisisInteligente
            detalle={detalle}
            consulta={consulta}
            consultaId={consultaId}
            onVerHallazgo={(item, e) => openResultadoModal(item, e)}
            onIrAResultados={() => setTab("resultados")}
          />
        </div>
      ) : (
      <>
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-1.5 md:gap-2 mb-2 md:mb-2.5">
        {/* Fila 1: búsqueda principal */}
        <input
          type="text"
          placeholder="🔍 Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-surface-2 backdrop-blur-md border border-line/20 text-sm text-content placeholder-muted focus:outline-none focus:border-brand/40 focus:bg-surface transition-all"
        />
        {/* Fila 2: filtros secundarios */}
        <div className="flex flex-wrap gap-1.5">
          <input
            type="text"
            placeholder="Fuente"
            value={filters.fuente}
            onChange={(e) => setFilters({ ...filters, fuente: e.target.value })}
            className="flex-1 min-w-[80px] px-2 py-1.5 rounded-lg bg-surface-2 backdrop-blur-md border border-line/20 text-xs text-content placeholder-muted focus:outline-none focus:border-brand/40 focus:bg-surface transition-all"
          />
          <input
            type="text"
            placeholder="Tipo"
            value={filters.tipo_fuente}
            onChange={(e) => setFilters({ ...filters, tipo_fuente: e.target.value })}
            className="flex-1 min-w-[60px] px-2 py-1.5 rounded-lg bg-surface-2 backdrop-blur-md border border-line/20 text-xs text-content placeholder-muted focus:outline-none focus:border-brand/40 focus:bg-surface transition-all"
          />
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            className="flex-1 min-w-[90px] px-2 py-1.5 rounded-lg bg-surface-2 backdrop-blur-md border border-line/20 text-xs text-content focus:outline-none focus:border-brand/40 focus:bg-surface transition-all appearance-none cursor-pointer"
          >
            <option className="bg-surface" value="">Todos</option>
            <option className="bg-surface" value="validado">Validado</option>
            <option className="bg-surface" value="offline">Offline</option>
            <option className="bg-surface" value="error">Error</option>
            <option className="bg-surface" value="revalidando">Revalidando</option>
          </select>
          <input
            type="text"
            placeholder="Score"
            value={filters.score}
            onChange={(e) => setFilters({ ...filters, score: e.target.value })}
            className="w-14 sm:w-16 px-2 py-1.5 rounded-lg bg-surface-2 backdrop-blur-md border border-line/20 text-xs text-content placeholder-muted focus:outline-none focus:border-brand/40 focus:bg-surface transition-all"
          />
          <button
            onClick={() =>
              setFilters({ fuente: "", tipo_fuente: "", estado: "", score: "" })
            }
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-content text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Contenedor con scroll para la tabla */}
      <div className="min-h-0 flex-1 overflow-auto backdrop-blur-xl bg-gradient-to-br from-surface/50 via-surface/30 to-surface/50 border border-brand/20 shadow-[0_8px_32px_rgba(6,182,212,0.15)] rounded-xl md:rounded-2xl mb-3 md:mb-4">
        {datosPagina.length > 0 ? (
          <>
            <div className="grid gap-3 p-3 sm:p-4 xl:hidden">
              {datosPagina.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-brand/15 bg-[linear-gradient(135deg,rgba(15,23,42,.88),rgba(17,24,39,.82))] p-4 shadow-[0_12px_30px_rgba(2,8,23,0.2)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand mb-1">Fuente</div>
                      <h3 className="text-sm font-bold text-content leading-snug break-words">
                        {item.fuente}
                        <InfoFuente item={item} className="ml-1.5" />
                      </h3>
                      <p className="mt-1 text-[11px] text-brand/70 leading-snug break-words">
                        {describirFuente(item).titulo}
                      </p>
                      <p className="mt-1 text-[11px] text-muted leading-relaxed break-words">
                        {describirFuente(item).desc}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center justify-center min-w-[2.2rem] px-2 py-1 rounded-lg bg-gradient-to-r from-surface-2/60 to-surface/60 border border-brand/20 text-brand font-bold text-sm">
                        {item.score}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand/90 mb-1">Tipo</div>
                      <p className="text-sm text-muted leading-snug break-words">{item.tipo_fuente}</p>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand/90 mb-1">Estado</div>
                      <EstadoCell item={item} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand/90 mb-2">Evidencia</div>
                    {renderEvidenceActions(item, true)}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden xl:block">
              <table className="table-fixed text-left text-sm min-w-[860px] lg:min-w-0 w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-surface-2/50 to-surface/50 border-b border-brand/20">
                    <th className="w-[38%] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Fuente</th>
                    <th className="w-[26%] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Tipo</th>
                    <th className="w-[14%] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Estado</th>
                    <th className="w-[8%] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider">Score</th>
                    <th className="w-[14%] px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-brand uppercase tracking-wider text-center">Evidencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand/10">
                  {datosPagina.map((item) => (
                    <tr
                      key={item.id}
                      className="group hover:bg-gradient-to-r hover:from-brand/5 hover:to-brand-2/5 transition-all duration-300"
                    >
                      <td className="px-2 md:px-3 py-1.5 md:py-2 pr-3">
                        <span className="inline-flex items-center gap-1 text-content font-semibold text-xs md:text-sm leading-snug break-words">
                          {item.fuente}
                          <InfoFuente item={item} />
                        </span>
                        <span className="block mt-0.5 text-[11px] text-brand/70 leading-snug break-words">
                          {describirFuente(item).titulo}
                        </span>
                      </td>
                      <td className="px-2 md:px-3 py-1.5 md:py-2 text-muted text-xs md:text-sm leading-snug break-words pr-3">{item.tipo_fuente}</td>
                      <td className="px-2 md:px-3 py-1.5 md:py-2">
                        <EstadoCell item={item} />
                      </td>
                      <td className="px-2 md:px-3 py-1.5 md:py-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 md:py-1 rounded-lg bg-gradient-to-r from-surface-2/50 to-surface/50 border border-brand/20 text-brand font-bold text-xs md:text-sm">
                          {item.score}
                        </span>
                      </td>
                      <td className="px-2 md:px-3 py-1.5 md:py-2">
                        {renderEvidenceActions(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-surface-2/50 to-surface/50 border border-brand/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-muted text-sm italic">No se encontraron resultados</p>
            </div>
          </div>
        )}
      </div>

      {/* 📑 Paginación */}
      <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 pb-1">
        <button
          onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
          disabled={pagina === 1}
          className="px-2 sm:px-3 py-1.5 bg-gradient-to-r from-brand/20 to-brand-2/20 hover:from-brand/30 hover:to-brand-2/30 border border-brand/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-brand font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden xs:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {getPages().map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-1 text-muted text-xs leading-none">...</span>
            ) : (
              <button
                key={i}
                onClick={() => setPagina(p)}
                className={`min-w-[1.75rem] sm:min-w-[2.25rem] h-7 sm:h-9 px-1.5 rounded-lg font-semibold transition-all duration-300 text-xs sm:text-sm leading-none flex items-center justify-center ${
                  p === pagina
                    ? "bg-gradient-to-r from-brand to-brand-2 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                    : "bg-gradient-to-r from-surface-2/50 to-surface/50 border border-brand/20 text-muted hover:border-brand/40 hover:text-brand"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => setPagina((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={pagina === totalPaginas || totalPaginas === 0}
          className="px-2 sm:px-3 py-1.5 bg-gradient-to-r from-brand/20 to-brand-2/20 hover:from-brand/30 hover:to-brand-2/30 border border-brand/30 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-brand font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm"
        >
          <span className="hidden xs:inline">Siguiente</span>
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Ir a página — solo en sm+ */}
        <div className="hidden sm:flex items-center gap-2 ml-2">
          <input
            type="number"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            placeholder="Pág."
            className="w-14 sm:w-16 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gradient-to-br from-surface/50 to-surface-2/50 border border-brand/20 text-center text-content placeholder-muted focus:outline-none focus:border-brand/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all text-xs sm:text-sm"
          />
          <button
            onClick={() => {
              const num = parseInt(inputPage, 10);
              if (num >= 1 && num <= totalPaginas) {
                setPagina(num);
                setInputPage("");
              }
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-brand to-brand-2 hover:from-brand hover:to-brand-2 text-white rounded-lg font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:scale-105 text-xs sm:text-sm"
          >
            Ir
          </button>
        </div>
      </div>
      </>
      )}

      {resultadoModal &&
        (() => {
          const visual = getModalVisualState(resultadoModal);

          return createPortal(
            <div
              className={`fixed inset-0 z-[12000] overflow-y-auto p-4 sm:p-8 bg-[radial-gradient(circle_at_center,#0f172a_0%,#020617_100%)] transition-opacity duration-300 ease-out ${
                modalAnimating ? "opacity-100" : "opacity-0"
              }`}
              onClick={closeResultadoModal}
            >
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(0deg,transparent_24%,rgba(59,130,246,0.05)_25%,rgba(59,130,246,0.05)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.05)_75%,rgba(59,130,246,0.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.05)_25%,rgba(59,130,246,0.05)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.05)_75%,rgba(59,130,246,0.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px] opacity-40" />
              <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full blur-[100px] bg-brand/10 animate-pulse" />
              <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[100px] bg-emerald-500/10 animate-pulse" />

              <div
                ref={modalCardRef}
                className={`relative mx-auto w-full max-w-4xl rounded-[2rem] overflow-hidden backdrop-blur-xl bg-content/[0.03] border border-line/10 shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)] transform-gpu will-change-transform transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  modalAnimating ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  transform: modalAnimating
                    ? "translate3d(0,0,0) scale(1)"
                    : `translate3d(${modalVector.x}px, ${modalVector.y}px, 0) scale(0.08)`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />

                <header className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-line/5 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-brand">
                      Security Audit
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-content tracking-tight">
                      Análisis de Integridad de Datos - Resultado
                    </h3>
                  </div>
                  <button
                    onClick={closeResultadoModal}
                    className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-content bg-content/5 hover:bg-content/10 rounded-xl transition-all duration-300 border border-line/5"
                    aria-label="Cerrar modal"
                  >
                    <span>Cerrar</span>
                    <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </header>

                <main className="p-6 sm:p-8 space-y-7 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-5 flex justify-center">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-line/5 animate-[spin_8s_linear_infinite]" />
                        <div className="absolute inset-2 rounded-full border border-dashed border-brand/20" />

                        {(() => {
                          const radius = 45;
                          const circumference = 2 * Math.PI * radius;
                          const arc = circumference * 0.22;
                          const gap = circumference - arc;

                          return (
                            <div className="w-full h-full">
                              <svg className="w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r={radius}
                                  fill="none"
                                  stroke="rgba(255,255,255,0.08)"
                                  strokeWidth="6"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r={radius}
                                  fill="none"
                                  stroke={visual.ringColor}
                                  strokeWidth="5"
                                  opacity="0.05"
                                  className="transition-colors duration-500"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r={radius}
                                  fill="none"
                                  stroke={visual.ringColor}
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeDasharray={`${arc} ${gap}`}
                                  className="transition-colors duration-500"
                                  transform="rotate(-90 50 50)"
                                >
                                  <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="-90 50 50"
                                    to="270 50 50"
                                    dur="1.5s"
                                    repeatCount="indefinite"
                                  />
                                </circle>
                              </svg>
                            </div>
                          );
                        })()}

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            Score
                          </span>
                          <span className={`text-6xl font-black text-content ${visual.badgeGlow}`}>
                            {visual.scoreText}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${visual.scoreTone}`}>
                            {visual.statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-7 space-y-4">
                      <div className="p-5 rounded-2xl bg-content/[0.03] border border-line/10 hover:border-brand/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                            Estado de Validación
                          </span>
                          <span className={`h-2.5 w-2.5 rounded-full ${visual.dotClass} ${visual.badgeGlow}`} />
                        </div>
                        <p className="text-2xl font-semibold text-content capitalize">
                          {toTitleCase(resultadoModal.estado)}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-content/[0.03] border border-line/10 hover:border-line/20 transition-all duration-300">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-2">
                          Fuente de Datos
                        </span>
                        <div className="flex items-center gap-3">
                          <Database size={18} className="text-brand" />
                          <p className="text-content font-medium leading-snug">
                            {resultadoModal.fuente || "Sin fuente"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="relative">
                    <div className="absolute -inset-0.5 rounded-2xl blur opacity-40 bg-gradient-to-r from-brand/20 to-emerald-400/20" />
                    <div
                      className={`relative border rounded-2xl p-5 sm:p-6 overflow-hidden ${visual.bannerTone}`}
                    >
                      <div className="absolute right-0 top-0 h-full w-1/3 bg-content/5 skew-x-12 translate-x-10 pointer-events-none" />
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-content/10 flex items-center justify-center border border-line/20">
                          {isPositiveResult(resultadoModal) ? (
                            <ShieldAlert size={28} className="text-rose-300" />
                          ) : (
                            <ShieldCheck size={28} className="text-emerald-300" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1">
                            {visual.bannerTitle}
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-content">
                            {visual.bannerText}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {isSocialSearchResult(resultadoModal) ? (
                    renderSocialSearchDetail(resultadoModal)
                  ) : (
                    <section className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted">
                          Detalle Técnico del Registro
                        </h4>
                        <span className="text-[9px] text-content/30 font-mono">
                          CODE: RES_{resultadoModal.id || "N/A"}
                        </span>
                      </div>

                      <div className="w-full p-5 rounded-2xl bg-surface-2/80 border border-line/10 font-mono relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand/40" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pl-3">
                          <div className="text-xs">
                            <p className="text-muted uppercase tracking-wider mb-1">Tipo</p>
                            <p className="text-content font-semibold">
                              {resultadoModal.tipo_fuente || "Sin categoría"}
                            </p>
                          </div>
                          <div className="text-xs sm:text-right">
                            <p className="text-muted uppercase tracking-wider mb-1">Score registrado</p>
                            <p className={`font-bold ${visual.scoreTone}`}>
                              {resultadoModal.score ?? "N/A"}
                            </p>
                          </div>
                        </div>

                        <pre className="pl-3 text-xs md:text-sm text-brand/90 whitespace-pre-wrap break-words max-h-[32vh] overflow-auto leading-relaxed">
                          {normalizeMensaje(resultadoModal.mensaje)}
                        </pre>
                      </div>
                    </section>
                  )}

                  {/* Garantías Mobiliarias — lista de garantías */}
                  {resultadoModal.datos_extra?.procesos?.length > 0 &&
                  (resultadoModal.fuente_nombre || "").includes("garantias_mobiliarias") ? (
                    <section className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 px-1">
                        Garantías Registradas ({resultadoModal.datos_extra.procesos.length})
                      </h4>
                      {resultadoModal.datos_extra.procesos.map((proc, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-3">
                          <div className="space-y-0.5">
                            <p className="text-amber-300 font-mono text-xs font-bold">{proc.radicado || "Sin folio"}</p>
                            <p className="text-muted text-[11px]">Acreedor: {proc.despacho || "—"}</p>
                            <p className="text-muted text-[10px]">{proc.fecha_radicacion || ""}{proc.ultima_actuacion ? ` · ${proc.ultima_actuacion}` : ""}</p>
                          </div>
                          <button
                            onClick={() => setGarantiasModal(proc)}
                            className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
                          >
                            Ver garantía
                          </button>
                        </div>
                      ))}
                    </section>
                  ) : resultadoModal.datos_extra?.procesos?.length > 0 ? (
                    /* Procesos Rama Judicial — lista compacta con botón Ver */
                    <section className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">
                        Procesos encontrados ({resultadoModal.datos_extra.procesos.length})
                      </h4>
                      {resultadoModal.datos_extra.procesos.map((proc, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-brand/20 bg-surface-2/80 px-4 py-3">
                          <div className="space-y-0.5">
                            <p className="text-brand font-mono text-xs font-bold">{proc.radicado || "Sin radicado"}</p>
                            <p className="text-muted text-[11px]">{proc.despacho || "—"}</p>
                            <p className="text-muted text-[10px]">{proc.fecha_radicacion || ""}{proc.ultima_actuacion ? ` · Últ. act: ${proc.ultima_actuacion}` : ""}</p>
                          </div>
                          <button
                            onClick={() => setProcesosModal(proc)}
                            className="ml-3 flex-shrink-0 px-3 py-1.5 rounded-lg bg-brand/20 hover:bg-brand/30 border border-brand/30 text-brand text-xs font-semibold transition-all"
                          >
                            Ver detalle
                          </button>
                        </div>
                      ))}
                    </section>
                  ) : null}

                  {/* Módulo de Mediación Policía (MMP) — detalle de cada mediación (informativo) */}
                  {resultadoModal.datos_extra?.mediaciones?.length > 0 ? (
                    <section className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-sky-400 px-1">
                        Mediaciones policiales ({resultadoModal.datos_extra.mediaciones.length}) · informativo, no es un antecedente
                      </h4>
                      {resultadoModal.datos_extra.mediaciones.map((m, i) => (
                        <div key={i} className="rounded-xl border border-sky-500/25 bg-sky-950/10 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-mono text-xs font-bold text-sky-300">{m.codigo || "Sin código"}</p>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${String(m.rol).startsWith("Invitado") ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                              {m.rol}
                            </span>
                          </div>
                          <div className="mt-2 grid gap-1 text-[11px] text-muted sm:grid-cols-2">
                            <p><span className="font-semibold text-content/80">Solicitantes:</span> {m.solicitantes || "—"}</p>
                            <p><span className="font-semibold text-content/80">Invitados:</span> {m.invitados || "—"}</p>
                            <p><span className="font-semibold text-content/80">Lugar:</span> {[m.municipio, m.departamento].filter(Boolean).join(" · ") || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </section>
                  ) : null}

                  {/* SECOP Integrado — contratación pública (informativo, sin riesgo) */}
                  {resultadoModal.datos_extra?.contratos?.length > 0 ? (
                    <section className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 px-1">
                        Contratación Pública · SECOP ({resultadoModal.datos_extra.contratos.length})
                      </h4>
                      {resultadoModal.datos_extra.contratos.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-content text-xs font-semibold leading-snug">
                              {c.nombre_de_la_entidad || "Entidad no especificada"}
                            </p>
                            {c.origen ? (
                              <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-brand/15 border border-brand/30 text-brand text-[9px] font-bold uppercase tracking-wide">
                                {c.origen}
                              </span>
                            ) : null}
                          </div>
                          {c.nom_raz_social_contratista ? (
                            <p className="text-muted text-[11px] mt-1">
                              {c.nom_raz_social_contratista}
                            </p>
                          ) : null}
                          {c.valor_contrato && c.valor_contrato !== "N/A" ? (
                            <p className="text-emerald-300 font-bold text-base mt-1">
                              ${c.valor_contrato}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-muted text-[10px]">
                            {c.fecha_de_firma_del_contrato && c.fecha_de_firma_del_contrato !== "N/A" ? (
                              <span>Firma: {c.fecha_de_firma_del_contrato}</span>
                            ) : null}
                            {c.numero_del_contrato && c.numero_del_contrato !== "N/A" ? (
                              <span>Contrato: {c.numero_del_contrato}</span>
                            ) : null}
                            {c.numero_de_proceso && c.numero_de_proceso !== "N/A" ? (
                              <span>Proceso: {c.numero_de_proceso}</span>
                            ) : null}
                          </div>
                          {c.url_contrato ? (
                            <a
                              href={c.url_contrato}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
                            >
                              Ver contrato ↗
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </section>
                  ) : null}
                </main>

                <footer className="px-6 sm:px-8 py-4 bg-content/5 border-t border-line/5 flex items-center justify-between relative z-10">
                  <div className="flex gap-2">
                    <span className="w-1 h-3 bg-brand/60 rounded-full" />
                    <span className="w-1 h-3 bg-brand/35 rounded-full" />
                    <span className="w-1 h-3 bg-brand/15 rounded-full" />
                  </div>
                  <p className="text-[10px] text-muted uppercase tracking-[0.22em] font-medium italic opacity-80">
                    Engineered for Integrity
                  </p>
                </footer>
              </div>
            </div>,
            document.body
          );
        })()}

      {/* ===== MODAL: Detalle de Garantía Mobiliaria ===== */}
      {garantiasModal && createPortal(
        <div className="fixed inset-0 z-[13000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setGarantiasModal(null)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-auto rounded-3xl bg-gradient-to-br from-amber-950/90 via-surface to-surface border border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.15)]">

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface/90 border-b border-amber-500/20 backdrop-blur">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1">Registro de Garantías Mobiliarias</p>
                <p className="text-amber-300 font-mono font-bold text-sm tracking-wider">{garantiasModal.radicado}</p>
              </div>
              <button
                onClick={() => setGarantiasModal(null)}
                className="w-8 h-8 rounded-full bg-content/10 hover:bg-amber-500/20 flex items-center justify-center text-content transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Tarjetas resumen */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-surface-2/80 border border-amber-500/15 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/60 block mb-1">Folio Electrónico</span>
                  <span className="text-amber-200 font-mono font-bold text-sm">{garantiasModal.radicado || "—"}</span>
                </div>
                <div className="rounded-2xl bg-surface-2/80 border border-amber-500/15 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/60 block mb-1">Acreedor Principal</span>
                  <span className="text-content font-semibold text-sm">{garantiasModal.despacho || "—"}</span>
                </div>
                <div className="rounded-2xl bg-surface-2/80 border border-amber-500/15 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/60 block mb-1">Fecha de Inscripción</span>
                  <span className="text-content text-sm">{garantiasModal.fecha_radicacion || "—"}</span>
                </div>
                <div className="rounded-2xl bg-surface-2/80 border border-amber-500/15 p-4">
                  <span className="text-[10px] uppercase tracking-wider text-amber-400/60 block mb-1">Tipo de Formulario</span>
                  <span className="text-content text-sm">{garantiasModal.ultima_actuacion || "—"}</span>
                </div>
              </div>

              {/* Datos completos del proceso */}
              {garantiasModal.datos_proceso && Object.keys(garantiasModal.datos_proceso).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-bold mb-2">Datos del Registro</p>
                  <div className="rounded-2xl bg-surface-2/80 border border-amber-500/15 divide-y divide-white/5 overflow-hidden">
                    {Object.entries(garantiasModal.datos_proceso)
                      .filter(([, v]) => v && String(v).trim())
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-3 px-4 py-2.5 text-xs hover:bg-amber-500/5 transition-colors">
                          <span className="text-amber-300/60 min-w-[200px] shrink-0">{k}</span>
                          <span className="text-content/90 break-words">{v}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Partes involucradas */}
              {garantiasModal.sujetos_procesales && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-bold mb-2">Partes Involucradas</p>
                  <pre className="rounded-2xl bg-surface-2/80 border border-amber-500/15 p-4 text-xs text-amber-100/75 whitespace-pre-wrap leading-relaxed font-mono">
                    {garantiasModal.sujetos_procesales}
                  </pre>
                </div>
              )}

              {/* Historial de operaciones (si existe) */}
              {garantiasModal.actuaciones?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-bold mb-2">
                    Historial de Operaciones ({garantiasModal.actuaciones.length})
                  </p>
                  <div className="rounded-2xl bg-surface-2/80 border border-amber-500/15 divide-y divide-white/5">
                    {garantiasModal.actuaciones.map((a, j) => (
                      <div key={j} className="px-4 py-3 space-y-1">
                        <div className="flex gap-3 text-xs">
                          <span className="text-amber-300/60 min-w-[90px]">{a.fecha}</span>
                          <span className="text-content font-medium">{a.actuacion}</span>
                        </div>
                        {a.anotacion && (
                          <p className="text-amber-100/60 text-xs pl-[102px] italic">{a.anotacion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-amber-500/15 bg-surface-2/60 flex items-center justify-between">
              <span className="text-[10px] text-amber-400/40 uppercase tracking-widest font-mono">RGM · Confecámaras</span>
              <span className="text-[10px] text-muted uppercase tracking-widest">Consulta Oficial</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== MODAL INDEPENDIENTE: Detalle de proceso ===== */}
      {procesosModal && createPortal(
        <div className="fixed inset-0 z-[13000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProcesosModal(null)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto rounded-3xl bg-gradient-to-br from-surface via-surface-2 to-surface border border-brand/30 shadow-[0_0_60px_rgba(6,182,212,0.2)]">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface/90 border-b border-line/10 backdrop-blur">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted mb-1">Detalle del Proceso</p>
                <p className="text-brand font-mono font-bold text-sm">{procesosModal.radicado}</p>
              </div>
              <button onClick={() => setProcesosModal(null)} className="w-8 h-8 rounded-full bg-content/10 hover:bg-content/20 flex items-center justify-center text-content transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Info básica */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted block mb-0.5">Fecha radicación</span><span className="text-content">{procesosModal.fecha_radicacion || "—"}</span></div>
                <div><span className="text-muted block mb-0.5">Última actuación</span><span className="text-content">{procesosModal.ultima_actuacion || "—"}</span></div>
                <div className="col-span-2"><span className="text-muted block mb-0.5">Despacho</span><span className="text-content">{procesosModal.despacho || "—"}</span></div>
              </div>

              {/* Datos del proceso */}
              {procesosModal.datos_proceso && Object.keys(procesosModal.datos_proceso).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-bold mb-2">Datos del Proceso</p>
                  <div className="rounded-xl bg-surface-2/80 border border-line/10 p-4 space-y-2">
                    {Object.entries(procesosModal.datos_proceso).map(([k, v]) => (
                      <div key={k} className="flex gap-2 text-xs">
                        <span className="text-muted min-w-[180px]">{k}:</span>
                        <span className="text-content">{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sujetos procesales */}
              {procesosModal.sujetos_procesales && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-bold mb-2">Sujetos Procesales</p>
                  <pre className="rounded-xl bg-surface-2/80 border border-line/10 p-4 text-xs text-brand/80 whitespace-pre-wrap">{procesosModal.sujetos_procesales}</pre>
                </div>
              )}

              {/* Actuaciones */}
              {procesosModal.actuaciones?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-bold mb-2">
                    Actuaciones ({procesosModal.actuaciones.length})
                  </p>
                  <div className="rounded-xl bg-surface-2/80 border border-line/10 divide-y divide-white/5">
                    {procesosModal.actuaciones.map((a, j) => (
                      <div key={j} className="px-4 py-3 space-y-1">
                        <div className="flex gap-3 text-xs">
                          <span className="text-muted min-w-[90px]">{a.fecha}</span>
                          <span className="text-content font-medium">{a.actuacion}</span>
                        </div>
                        {a.anotacion && (
                          <p className="text-brand/70 text-xs pl-[102px] italic">{a.anotacion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
