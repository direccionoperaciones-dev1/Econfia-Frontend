import TablaResultados from "../components/TablaResultados";
import CargandoResultados from "../components/CargandoResultados";
import LiveQueryModal from "../components/LiveQueryModal";
import DetalleResultados from "../components/DetalleResultados";
import ExperianDetalleResultados from "../components/ExperianDetalleResultados";
import HdcDetalleResultados from "../components/HdcDetalleResultados";
import ReconocerDetalleResultados from "../components/ReconocerDetalleResultados";
import EmpresaDetalleResultados from "../components/EmpresaDetalleResultados";
import { AssetSearchResultados } from "./ConsultaInmueblesSNR";
import EIdentidadLoteModal from "../components/EIdentidadLoteModal";
import ModalDescargaIndividual from "../modals/ModalDescargaIndividual";
import ConsultaSlide from "../components/ConsultaSlide";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { ArrowLeft, FileDown, FileText, Images, Eye } from "lucide-react";
import {
  isExperianConsulta,
  normalizeExperianConsulta,
  isHdcConsulta,
  normalizeHdcConsulta,
  isReconocerConsulta,
  normalizeReconocerConsulta,
  isAssetSearchConsulta,
  normalizeAssetSearchConsulta,
  isEmpresaConsulta,
  normalizeEmpresaConsulta,
  isConsolidadoConsulta,
  normalizeConsolidadoConsulta,
} from "../utils/experian";
import { ConsolidadoDetalle } from "./ConsultaConsolidadoRiesgo";
import { useTheme } from "../context/ThemeContext";

const EXPERIAN_PDF_THEME_OPTIONS = ["claro", "oscuro"];

/** "#06b6d4" -> "rgba(6,182,212,0.1)" para usar el color de marca en
 * lugares que necesitan un string rgba (CSS global de swiper, no soporta
 * tokens CSS ni clases Tailwind). */
function hexARgba(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function readStoredExperianPdfTheme() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const theme = user?.perfil?.tema_pdf_experian;
    return EXPERIAN_PDF_THEME_OPTIONS.includes(theme) ? theme : "claro";
  } catch (_error) {
    return "claro";
  }
}

function writeStoredExperianPdfTheme(theme) {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const nextUser = {
      ...user,
      perfil: {
        ...(user?.perfil || {}),
        tema_pdf_experian: theme,
      },
    };
    localStorage.setItem("user", JSON.stringify(nextUser));
  } catch (_error) {
    // Si localStorage falla no bloqueamos la preferencia del backend.
  }
}

/** --- BOTONES FLOTANTES (portal) --- */
function FloatingActionsPortal({
  apiUrl,
  consultaId,
  consultaTipo,
  consultaSource,
  experianPdfTheme,
  savingExperianPdfTheme,
  onChangeExperianPdfTheme,
  onBack,
  onOpenIndividual, // abre tu ModalDescargaIndividual
  onVerPdf, // lleva al slide del informe tipo PDF
  pdfReady = true, // corefull: el PDF se genera async; el botón se habilita cuando está listo
}) {
  const [el, setEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false); // NUEVO: loading para descarga
  const menuRef = useRef(null);

  useEffect(() => {
    const node = document.createElement("div");
    node.id = "econfia-resultados-actions";
    document.body.appendChild(node);
    setEl(node);
    return () => document.body.removeChild(node);
  }, []);

  // cerrar al hacer click fuera o con ESC
  useEffect(() => {
    const handleClick = (e) => {
      if (open && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const goBack = () => (typeof onBack === "function" ? onBack() : window.history.back());

  const tipoConsultaNormalizado = (consultaTipo || "").toLowerCase();
  const isEconfiafast = tipoConsultaNormalizado === "econfiafast";
  const isExperian = consultaSource === "experian" || tipoConsultaNormalizado === "experian";
  // SOLO corefull (ecorefull) pre-genera el PDF en segundo plano, así que SOLO
  // ahí se bloquea la descarga hasta que esté listo. Las demás (essencial, basic,
  // single-source…) generan el PDF on-demand al clic → NO se bloquean.
  const isCorefull = tipoConsultaNormalizado === "ecorefull";
  const pdfBloqueado = isCorefull && !pdfReady;

  const downloadPdf = async (tipo) => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");

      if (isExperian) {
        const url = `${apiUrl}/api/experian/consultas/${consultaId}/pdf/`;
        const res = await fetch(url, {
          method: "GET",
          headers: token ? { Authorization: `Token ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(`Error al descargar PDF de Econfia Adjudicator: ${res.status}`);
        }

        const blob = await res.blob();
        const disposition = res.headers.get("content-disposition") || "";
        const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
        const filename = match?.[1]
          ? decodeURIComponent(match[1])
          : `econfia_adjudicator_${consultaId}.pdf`;

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);
        setOpen(false);
        return;
      }

      if (tipo === 3 && isEconfiafast) {
        const url = `${apiUrl}/api/descargar_pdf_fast/${consultaId}/`;
        const res = await fetch(url, {
          method: "GET",
          headers: token ? { Authorization: `Token ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(`Error al descargar PDF FAST: ${res.status}`);
        }

        const blob = await res.blob();
        const disposition = res.headers.get("content-disposition") || "";
        const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
        const filename = match?.[1]
          ? decodeURIComponent(match[1])
          : `resumen_fast_${consultaId}.pdf`;

        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);
        setOpen(false);
        return;
      }

      let url;
      // Solo para el PDF resumen (tipo === 3)
      if (tipo === 3) {
        url = `${apiUrl}/api/generar_consolidado_full/${consultaId}/3/`;
      } else {
        url = `${apiUrl}/api/generar_consolidado_full/${consultaId}/${tipo}/`;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      setOpen(false);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      alert("No se pudo descargar el PDF solicitado");
    } finally {
      setDownloading(false);
    }
  };

  if (!el) return null;

  return createPortal(
    <div className="fixed top-3 left-3 right-3 z-[10000]">
      {/* Título centrado en la barra */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="hidden sm:block text-content font-bold text-sm md:text-base">
          Detalles de Resultados
        </span>
      </div>
      <div className="relative flex items-center gap-2">
        {/* Regresar */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/90 hover:bg-surface-2/90
                     text-content border border-line/20 backdrop-blur-xl shadow-lg shadow-black/10 transition-all hover:border-brand/30 group"
          title="Regresar"
        >
          <ArrowLeft size={16} className="group-hover:text-brand transition-colors" />
          <span className="text-xs sm:text-sm font-semibold">Regresar</span>
        </button>

        {isExperian ? (
          <>
            <div className="flex items-center rounded-lg border border-white/15 bg-slate-900/85 p-1 backdrop-blur-xl shadow-lg shadow-black/20">
              {EXPERIAN_PDF_THEME_OPTIONS.map((theme) => {
                const isActive = experianPdfTheme === theme;
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => onChangeExperianPdfTheme?.(theme)}
                    disabled={savingExperianPdfTheme}
                    className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                      isActive
                        ? "bg-brand/20 text-brand"
                        : "text-slate-300 hover:text-white"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {theme}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => downloadPdf(3)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 hover:opacity-90
                         text-white border border-white/20 backdrop-blur-xl shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Descargar PDF Econfia Adjudicator"
              disabled={downloading || savingExperianPdfTheme}
            >
              {downloading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-brand rounded-full animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              <span className="text-xs sm:text-sm font-semibold">PDF</span>
            </button>
          </>
        ) : (
          <div className="relative" ref={menuRef}>
            {/* Acciones separadas y explícitas: abrir el informe o descargarlo. */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onVerPdf?.()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 hover:opacity-90
                           text-white border border-white/20 backdrop-blur-xl shadow-lg shadow-brand/30 transition-all hover:shadow-brand/50"
                title="Abrir informe PDF"
              >
                <Eye size={16} />
                <span className="text-xs sm:text-sm font-semibold">Ver informe</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/90 hover:bg-surface-2/90
                           text-content border border-line/20 backdrop-blur-xl shadow-lg shadow-black/10 transition-all hover:border-brand/40 disabled:opacity-60 disabled:cursor-not-allowed"
                title={pdfBloqueado ? "El PDF se está generando, espera unos segundos…" : "Mostrar opciones para descargar el PDF"}
                aria-label="Descargar informe PDF"
                aria-haspopup="menu"
                aria-expanded={open}
                disabled={downloading || pdfBloqueado}
              >
                {downloading || pdfBloqueado ? (
                  <span className="inline-block w-4 h-4 border-2 border-content/30 border-t-brand rounded-full animate-spin" />
                ) : (
                  <FileDown size={16} className="text-brand" />
                )}
                <span className="text-xs sm:text-sm font-semibold">
                  {pdfBloqueado ? "Generando PDF…" : "Descargar"}
                </span>
              </button>
            </div>

            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg overflow-hidden border border-white/20
                              bg-gradient-to-br from-slate-900/95 via-blue-900/40 to-slate-900/95 backdrop-blur-xl shadow-2xl shadow-brand/20 animate-in fade-in duration-200">
                {isEconfiafast ? (
                <button
                  onClick={() => downloadPdf(3)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-brand-2/20 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={downloading}
                >
                  <Images size={16} className="group-hover:text-brand-2 transition-colors" />
                  <span className="group-hover:text-brand-2">Descargar PDF</span>
                  {downloading && <span className="ml-2 w-4 h-4 border-2 border-white border-t-brand rounded-full animate-spin" />}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => downloadPdf(1)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-brand/20 transition-all border-b border-white/10 group disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={downloading}
                  >
                    <FileText size={16} className="group-hover:text-brand transition-colors" />
                    <span className="group-hover:text-brand">Descargar PDF Completo</span>
                    {downloading && <span className="ml-2 w-4 h-4 border-2 border-white border-t-brand rounded-full animate-spin" />}
                  </button>
                  <button
                    onClick={() => downloadPdf(3)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-brand-2/20 transition-all border-b border-white/10 group disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={downloading}
                  >
                    <Images size={16} className="group-hover:text-brand-2 transition-colors" />
                    <span className="group-hover:text-brand-2">Descargar PDF Resumen</span>
                    {downloading && <span className="ml-2 w-4 h-4 border-2 border-white border-t-brand rounded-full animate-spin" />}
                  </button>
                  <button
                    onClick={() => { setOpen(false); onOpenIndividual?.(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white hover:bg-purple-500/20 transition-all group"
                  >
                    <FileText size={16} className="group-hover:text-purple-400 transition-colors" />
                    <span className="group-hover:text-purple-300">Descarga individual</span>
                  </button>
                </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    el
  );
}

function normalizeCoreConsulta(item) {
  return {
    ...item,
    source: "consulta",
    row_id: `consulta-${item.id}`,
  };
}

function isBlankIdentityValue(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return !normalized || ["none", "null", "undefined", "nan", "sin nombre"].includes(normalized);
}

function hasDisplayableCoreIdentity(item) {
  const source = String(item?.source || "consulta").toLowerCase();
  if (source !== "consulta") return true;

  const type = String(item?.tipo_consulta || item?.tipo || "").toLowerCase();
  if (type !== "ecorefull") return true;

  const name = String(item?.nombre || "").trim();
  if (!name) return false;

  const parts = name.split(/\s+/).filter(Boolean);
  return !parts.every(isBlankIdentityValue);
}

function ExportBatchModal({
  isOpen,
  format = "excel",
  totalCount = 0,
  initialCount = 0,
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  const [requestedCount, setRequestedCount] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const safeInitial = Math.max(1, Math.min(totalCount || 1, initialCount || totalCount || 1));
    setRequestedCount(String(safeInitial));
  }, [isOpen, totalCount, initialCount, format]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const normalizedCount = Math.max(
    1,
    Math.min(totalCount || 1, Number.parseInt(requestedCount, 10) || 1)
  );
  const formatLabel = format === "pdf" ? "PDF" : "Excel";
  const quickOptions = Array.from(
    new Set([25, 50, 100, totalCount].filter((value) => value > 0 && value <= totalCount))
  );

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand/20 bg-gradient-to-br from-slate-900/95 via-blue-950/75 to-slate-900/95 shadow-[0_20px_60px_rgba(2,8,23,0.55)] overflow-hidden">
        <div className="border-b border-brand/15 px-5 py-4">
          <div className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            Configuracion de exportacion
          </div>
          <h3 className="mt-3 text-lg font-bold text-white">
            Tamaño del lote de exportación
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Define el volumen de registros completados que se incluirá en el archivo {formatLabel} con los filtros actuales.
            Se priorizan las consultas más
             recientes.
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Registros disponibles
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div className="text-3xl font-black text-brand">{totalCount}</div>
              <div className="text-right text-xs text-slate-400">
                Archivo objetivo
                <div className="mt-1 text-sm font-semibold text-white">{formatLabel}</div>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Cantidad a incluir
            </span>
            <input
              type="number"
              min="1"
              max={totalCount}
              value={requestedCount}
              onChange={(event) => setRequestedCount(event.target.value)}
              className="w-full rounded-xl border border-brand/20 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Lotes sugeridos
            </div>
            <div className="flex flex-wrap gap-2">
              {quickOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRequestedCount(String(option))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    normalizedCount === option
                      ? "border-brand/60 bg-brand/20 text-brand"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-brand/30 hover:text-brand"
                  }`}
                >
                  {option === totalCount ? `Todo (${option})` : option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(normalizedCount)}
            disabled={isSubmitting || totalCount <= 0}
            className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-gradient-to-r from-brand/30 to-brand-2/30 px-4 py-2 text-sm font-semibold text-white transition hover:from-brand/40 hover:to-brand-2/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting && (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/25 border-t-white animate-spin" />
            )}
            {isSubmitting ? `Generando ${formatLabel}...` : `Generar ${formatLabel}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Resultados() {
  const location = useLocation();
  const { organizacion } = useTheme();
  const marcaPrincipal = organizacion?.color_acento || null;
  const swiperNavColor = marcaPrincipal || "#06b6d4";
  const swiperNavColorRgba = marcaPrincipal
    ? hexARgba(marcaPrincipal, 0.1)
    : "rgba(6, 182, 212, 0.1)";
  const swiperNavColorRgbaHover = marcaPrincipal
    ? hexARgba(marcaPrincipal, 0.2)
    : "rgba(6, 182, 212, 0.2)";
  const swiperNavBorderRgba = marcaPrincipal
    ? hexARgba(marcaPrincipal, 0.3)
    : "rgba(6, 182, 212, 0.3)";
  const swiperNavBorderRgbaHover = marcaPrincipal
    ? hexARgba(marcaPrincipal, 0.5)
    : "rgba(6, 182, 212, 0.5)";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultaSeleccionada, setConsultaSeleccionada] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("econfia-resultados-detalle", { detail: Boolean(consultaSeleccionada) })
    );
    return () => {
      window.dispatchEvent(new CustomEvent("econfia-resultados-detalle", { detail: false }));
    };
  }, [consultaSeleccionada]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ estado: "", fecha: "" });
  // Página del historial elevada aquí para conservarla al volver del detalle.
  const [paginaHistorial, setPaginaHistorial] = useState(1);
  const [showModalIndividual, setShowModalIndividual] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportModal, setExportModal] = useState({ open: false, format: "excel" });
  const [liveConsultaId, setLiveConsultaId] = useState(null);
  const [experianPdfTheme, setExperianPdfTheme] = useState(readStoredExperianPdfTheme);
  const [savingExperianPdfTheme, setSavingExperianPdfTheme] = useState(false);
  const handledOpenEmpresaRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  // Limpiar liveConsultaId cuando la consulta deje de estar en proceso
  useEffect(() => {
    if (!liveConsultaId) return;
    const sigueEnProceso = data.some(
      (item) => item.id === liveConsultaId && item.source !== "experian" && (item.estado || "").toLowerCase() === "en_proceso"
    );
    if (!sigueEnProceso) {
      setLiveConsultaId(null);
    }
  }, [data, liveConsultaId]);

  useEffect(() => {
    let cancelled = false;

    async function syncExperianPdfTheme() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/api/profile/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        if (!response.ok) return;

        const data = await response.json();
        const nextTheme = data?.perfil?.tema_pdf_experian;
        if (!cancelled && EXPERIAN_PDF_THEME_OPTIONS.includes(nextTheme)) {
          setExperianPdfTheme(nextTheme);
          writeStoredExperianPdfTheme(nextTheme);
        }
      } catch (_error) {
        // Si falla, seguimos con la preferencia local.
      }
    }

    syncExperianPdfTheme();
    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  // ---- Obtener todas las consultas ----
  const fetchResultados = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      };

      const [consultasRes, experianRes, hdcRes, reconocerRes, assetSearchRes, empresaRes, consolidadoRes] = await Promise.all([
        fetch(`${API_URL}/api/consultas/`, { headers }),
        fetch(`${API_URL}/api/experian/consultas/`, { headers }),
        fetch(`${API_URL}/api/hdc/consultas/`, { headers }),
        fetch(`${API_URL}/api/reconocer/consultas/`, { headers }),
        fetch(`${API_URL}/api/inmuebles-snr/historial/?limit=100`, { headers }),
        fetch(`${API_URL}/api/historial-empresas-rues/?limit=80`, { headers }),
        fetch(`${API_URL}/api/consolidado-riesgo/consultas/?limit=100`, { headers }),
      ]);

      if (!consultasRes.ok) throw new Error(`Error HTTP: ${consultasRes.status}`);

      const consultasJson = await consultasRes.json();
      let experianRows = [];
      let hdcRows = [];
      let reconocerRows = [];
      let assetSearchRows = [];
      let empresaRows = [];

      if (experianRes.ok) {
        const experianJson = await experianRes.json();
        experianRows = (experianJson?.consultas || []).map(normalizeExperianConsulta);
      }
      if (hdcRes.ok) {
        const hdcJson = await hdcRes.json();
        hdcRows = (hdcJson?.consultas || []).map(normalizeHdcConsulta);
      }
      if (reconocerRes.ok) {
        const reconocerJson = await reconocerRes.json();
        reconocerRows = (reconocerJson?.consultas || []).map(normalizeReconocerConsulta);
      }
      if (assetSearchRes.ok) {
        const assetSearchJson = await assetSearchRes.json();
        assetSearchRows = (assetSearchJson?.consultas || []).map(normalizeAssetSearchConsulta);
      }
      if (empresaRes.ok) {
        const empresaJson = await empresaRes.json();
        empresaRows = (empresaJson?.empresas || []).map(normalizeEmpresaConsulta);
      }
      let consolidadoRows = [];
      if (consolidadoRes.ok) {
        const consolidadoJson = await consolidadoRes.json();
        consolidadoRows = (consolidadoJson?.consultas || []).map(normalizeConsolidadoConsulta);
      }

      const mergedRows = [
        ...(Array.isArray(consultasJson) ? consultasJson : []).map(normalizeCoreConsulta),
        ...experianRows,
        ...hdcRows,
        ...reconocerRows,
        ...assetSearchRows,
        ...empresaRows,
        ...consolidadoRows,
      ].filter(hasDisplayableCoreIdentity).sort((left, right) => {
        const leftTime = left.fecha ? new Date(left.fecha).getTime() : 0;
        const rightTime = right.fecha ? new Date(right.fecha).getTime() : 0;
        return rightTime - leftTime;
      });

      // Consecutivo POR USUARIO: la más antigua es la #1 y la más reciente la #N.
      // Es estable (al agregar una nueva, las anteriores conservan su número) y
      // evita mostrar el ID global de la base de datos, que confunde al usuario.
      const totalConsultas = mergedRows.length;
      setData(
        mergedRows.map((row, index) => ({
          ...row,
          numero_usuario: totalConsultas - index,
        }))
      );
    } catch (error) {
      console.error("Error al obtener resultados:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Cargar consultas periódicamente ----
  useEffect(() => {
    fetchResultados();
    const interval = setInterval(fetchResultados, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const targetNit = String(location.state?.openEmpresaNit || "").trim();
    const marker = `${targetNit}-${location.state?.openEmpresaAt || ""}`;
    if (!targetNit || handledOpenEmpresaRef.current === marker || !data.length) return;

    const empresaRow = data.find((item) => {
      const source = String(item.source || "").toLowerCase();
      const nit = String(item.nit || item.cedula || "").trim();
      return source === "empresa-rues" && nit === targetNit;
    });

    if (empresaRow) {
      handledOpenEmpresaRef.current = marker;
      setConsultaSeleccionada(empresaRow);
    }
  }, [data, location.state]);

  if (loading) return <CargandoResultados />;

  // ---- Filtrar datos ----
  const filteredData = data.filter((item) => {
    const matchSearch =
      search === "" ||
      item.numero_usuario?.toString().includes(search) ||
      item.id.toString().includes(search) ||
      item.row_id?.toString().includes(search) ||
      item.cedula?.toString().includes(search) ||
      item.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      item.estado?.toLowerCase().includes(search.toLowerCase());

    const matchEstado =
      filters.estado === "" || item.estado === filters.estado;

    const matchFecha =
      filters.fecha === "" || item.fecha?.startsWith(filters.fecha);

    return matchSearch && matchEstado && matchFecha;
  });
  const exportableData = [...filteredData]
    .filter((item) => {
      const source = item.source || "consulta";
      const estado = (item.estado || "").toLowerCase();
      return ["consulta", "experian", "hdc", "reconocer", "inmuebles-snr"].includes(source)
        && ["completado", "sin_resultados"].includes(estado);
    })
    .sort((left, right) => {
      const leftTime = left.fecha ? new Date(left.fecha).getTime() : 0;
      const rightTime = right.fecha ? new Date(right.fecha).getTime() : 0;
      return rightTime - leftTime;
    });

  const openExportModal = (format) => {
    if (!exportableData.length) return;
    setExportModal({ open: true, format });
  };

  const closeExportModal = () => {
    if (exportingExcel || exportingPdf) return;
    setExportModal((prev) => ({ ...prev, open: false }));
  };

  const downloadExport = async (format, consultaRefs) => {
    if (!consultaRefs.length) return false;

    const isPdf = format === "pdf";
    const setExporting = isPdf ? setExportingPdf : setExportingExcel;
    const endpoint = isPdf ? "exportar-pdf" : "exportar-excel";
    const defaultExtension = isPdf ? "pdf" : "xlsx";
    const exportLabel = isPdf ? "PDF" : "Excel";

    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/consultas/${endpoint}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          consulta_refs: consultaRefs,
        }),
      });

      if (!res.ok) {
        let message = `No se pudo generar el informe ${exportLabel}.`;
        try {
          const errorData = await res.json();
          message = errorData?.detail || errorData?.error || message;
        } catch (_error) {
          // Si el backend no respondio JSON, dejamos el mensaje por defecto.
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
      const filename = match?.[1]
        ? decodeURIComponent(match[1])
        : `control_informes_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${defaultExtension}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error(`Error al exportar el informe ${exportLabel}:`, error);
      alert(error.message || `No se pudo generar el informe ${exportLabel}.`);
      return false;
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmExport = async (requestedCount) => {
    const selectedRefs = exportableData
      .slice(0, requestedCount)
      .map((item) => ({ source: item.source || "consulta", id: item.id }));

    const wasSuccessful = await downloadExport(exportModal.format, selectedRefs);
    if (wasSuccessful) {
      setExportModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleExportExcel = async () => {
    if (!exportableData.length) return;

    setExportingExcel(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/consultas/exportar-excel/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          consulta_refs: exportableData.map((item) => ({
            source: item.source || "consulta",
            id: item.id,
          })),
        }),
      });

      if (!res.ok) {
        let message = "No se pudo generar el informe Excel.";
        try {
          const errorData = await res.json();
          message = errorData?.detail || errorData?.error || message;
        } catch (_error) {
          // Si el backend no respondió JSON, dejamos el mensaje por defecto.
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
      const filename = match?.[1]
        ? decodeURIComponent(match[1])
        : `control_informes_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar el informe Excel:", error);
      alert(error.message || "No se pudo generar el informe Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    if (!exportableData.length) return;

    setExportingPdf(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/consultas/exportar-pdf/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          consulta_refs: exportableData.map((item) => ({
            source: item.source || "consulta",
            id: item.id,
          })),
        }),
      });

      if (!res.ok) {
        let message = "No se pudo generar el informe PDF.";
        try {
          const errorData = await res.json();
          message = errorData?.detail || errorData?.error || message;
        } catch (_error) {
          // Si el backend no respondió JSON, dejamos el mensaje por defecto.
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
      const filename = match?.[1]
        ? decodeURIComponent(match[1])
        : `control_informes_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.pdf`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar el informe PDF:", error);
      alert(error.message || "No se pudo generar el informe PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  void handleExportExcel;
  void handleExportPdf;

  const handleExperianPdfThemeChange = async (theme) => {
    if (!EXPERIAN_PDF_THEME_OPTIONS.includes(theme) || theme === experianPdfTheme || savingExperianPdfTheme) {
      return;
    }

    const previousTheme = experianPdfTheme;
    setExperianPdfTheme(theme);
    setSavingExperianPdfTheme(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/experian/preferences/pdf-theme/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ tema_pdf_experian: theme }),
      });

      if (!response.ok) {
        let message = "No se pudo guardar la preferencia del PDF de Econfia Adjudicator.";
        try {
          const data = await response.json();
          message = data?.detail || data?.error || message;
        } catch (_error) {
          // dejamos el mensaje por defecto
        }
        throw new Error(message);
      }

      const data = await response.json();
      const savedTheme = data?.tema_pdf_experian || theme;
      setExperianPdfTheme(savedTheme);
      writeStoredExperianPdfTheme(savedTheme);
    } catch (error) {
      console.error("Error al guardar tema PDF Econfia Adjudicator:", error);
      setExperianPdfTheme(previousTheme);
      alert(error.message || "No se pudo guardar la preferencia del PDF de Econfia Adjudicator.");
    } finally {
      setSavingExperianPdfTheme(false);
    }
  };

  const descargarProductoPdf = async (kind, id) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = kind === "inmuebles-snr"
        ? `${API_URL}/api/inmuebles-snr/${id}/pdf/`
        : `${API_URL}/api/${kind}/consultas/${id}/pdf/`;
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Error al descargar PDF: ${res.status}`);
      const blob = await res.blob();
      // Usar el nombre que envía el backend (econfia-adjudicator / econfia-credit-report / reconocer);
      // solo si no viene, caemos a un nombre legible por producto.
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i);
      const fallbackPorKind = {
        experian: `econfia-adjudicator_${id}.pdf`,
        hdc: `econfia-credit-report_${id}.pdf`,
        reconocer: `econfia-contact-search_${id}.pdf`,
        "inmuebles-snr": `econfia-asset-search_${id}.pdf`,
      };
      const filename = match?.[1]
        ? decodeURIComponent(match[1])
        : (fallbackPorKind[kind] || `${kind}_${id}.pdf`);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      alert(error.message || "No se pudo descargar el PDF.");
    }
  };

  const consultaActual = consultaSeleccionada || null;
  const consultaTipoActual =
    consultaActual?.tipo_consulta ||
    consultaActual?.tipo ||
    (consultaActual?.es_econfiafask ? "econfiafask" : "");
  const isExperianActual = isExperianConsulta(consultaActual);
  const isHdcActual = isHdcConsulta(consultaActual);
  const isReconocerActual = isReconocerConsulta(consultaActual);
  const isAssetSearchActual = isAssetSearchConsulta(consultaActual);
  const isEmpresaActual = isEmpresaConsulta(consultaActual);
  const isConsolidadoActual = isConsolidadoConsulta(consultaActual);

  return (
    <section className="relative min-h-screen py-4 md:py-6 pb-32 md:pb-36 overflow-hidden bg-transparent">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-brand/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-brand-2/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Modal lote para e-identidad */}
      {consultaSeleccionada && consultaTipoActual === "e-identidad" && (
        <EIdentidadLoteModal
          consultaciones={data.filter((c) => (c.tipo_consulta || c.tipo || "") === "e-identidad")}
          initialId={consultaSeleccionada.id}
          onClose={() => setConsultaSeleccionada(null)}
        />
      )}

      <div className="w-full px-4 relative z-10">
        {!consultaSeleccionada || consultaTipoActual === "e-identidad" ? (
          <div className="w-full max-w-7xl mx-auto">
            {/* Título */}
            <div className="mb-3 md:mb-4">
              <div className="inline-block px-2 py-0.5 rounded-full bg-brand/15 border border-brand/30 mb-2">
                <span className="text-brand text-[10px] md:text-xs font-medium">Panel de resultados</span>
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-content">
                Resultados de Consultas
              </h1>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center mb-3 md:mb-4 gap-2 md:gap-3">
              <input
                type="text"
                placeholder="Buscar por ID, Cédula, Nombre o Estado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-1/2 px-3 py-1.5 md:py-2 rounded-lg bg-surface/90 border border-line/20 text-sm text-content placeholder-muted focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={filters.estado}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, estado: e.target.value }))
                  }
                  className="w-full sm:w-auto px-3 py-1.5 md:py-2 rounded-lg bg-surface/90 border border-line/20 text-sm text-content focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm appearance-none cursor-pointer"
                >
                  <option className="bg-surface text-content" value="">Todos los estados</option>
                  <option className="bg-surface text-content" value="en_proceso">En proceso</option>
                  <option className="bg-surface text-content" value="finalizado">Finalizado</option>
                  <option className="bg-surface text-content" value="error">Error</option>
                </select>

                <input
                  type="date"
                  value={filters.fecha}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, fecha: e.target.value }))
                  }
                  className="w-full sm:w-auto px-3 py-1.5 md:py-2 rounded-lg bg-surface/90 border border-line/20 text-sm text-content focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Tabla de resultados */}
            <TablaResultados
              data={filteredData}
              pagina={paginaHistorial}
              setPagina={setPaginaHistorial}
              onVerResultados={setConsultaSeleccionada}
              onOpenLive={setLiveConsultaId}
              onExportExcel={() => openExportModal("excel")}
              onExportPdf={() => openExportModal("pdf")}
              exportingExcel={exportingExcel}
              exportingPdf={exportingPdf}
              exportDisabled={!exportableData.length}
              exportCount={exportableData.length}
            />
                {/* Modal de fuentes en vivo */}
      <LiveQueryModal
        consultaId={liveConsultaId}
        onClose={() => {
          setLiveConsultaId(null);
        }}
        onFinished={() => {
          setLiveConsultaId(null);
        }}
      />
          </div>
        ) : consultaTipoActual !== "e-identidad" ? (
        <div className="w-full max-w-7xl mx-auto min-h-[78vh] xl:min-h-[82vh] h-[calc(100vh-10rem)] max-h-[calc(100vh-5rem)]">
          {!isHdcActual && !isReconocerActual && !isExperianActual && !isAssetSearchActual && !isEmpresaActual && !isConsolidadoActual && (
            <FloatingActionsPortal
              apiUrl={API_URL}
              consultaId={consultaSeleccionada.id}
              consultaTipo={consultaTipoActual}
              consultaSource={consultaActual?.source}
              experianPdfTheme={experianPdfTheme}
              savingExperianPdfTheme={savingExperianPdfTheme}
              onChangeExperianPdfTheme={handleExperianPdfThemeChange}
              onBack={() => setConsultaSeleccionada(null)}
              onOpenIndividual={() => setShowModalIndividual(true)}
              onVerPdf={() => swiperRef.current?.slideTo(1)}
              pdfReady={
                !!(
                  (data.find((r) => r.id === consultaSeleccionada?.id) ||
                    consultaSeleccionada)?.pdf_generado
                )
              }
            />
          )}
          {isConsolidadoActual ? (
            <div className="h-full min-h-0 overflow-y-auto pt-2">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsultaSeleccionada(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface/90 px-4 py-2 text-sm font-semibold text-content shadow-lg shadow-black/5 backdrop-blur-xl transition hover:border-brand/30 hover:bg-surface-2/90 hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" /> Regresar
                </button>
              </div>
              <ConsolidadoDetalle consultaId={consultaSeleccionada.id} />
            </div>
          ) : isAssetSearchActual ? (
            <div className="h-full min-h-0 overflow-y-auto pt-2">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsultaSeleccionada(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface/90 px-4 py-2 text-sm font-semibold text-content shadow-lg shadow-black/5 backdrop-blur-xl transition hover:border-brand/30 hover:bg-surface-2/90 hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" /> Regresar
                </button>
              </div>
              <AssetSearchResultados
                consulta={consultaSeleccionada}
                onPdf={() => descargarProductoPdf("inmuebles-snr", consultaSeleccionada.id)}
              />
            </div>
          ) : isHdcActual ? (
            <div className="h-full min-h-0 overflow-y-auto pt-2">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsultaSeleccionada(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface/90 px-4 py-2 text-sm font-semibold text-content shadow-lg shadow-black/5 backdrop-blur-xl transition hover:border-brand/30 hover:bg-surface-2/90 hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" /> Regresar
                </button>
                <button
                  type="button"
                  onClick={() => descargarProductoPdf("hdc", consultaSeleccionada.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <FileText className="h-4 w-4" /> Descargar PDF
                </button>
              </div>
              <HdcDetalleResultados consultaId={consultaSeleccionada.id} />
            </div>
          ) : isReconocerActual ? (
            <div className="h-full min-h-0 overflow-y-auto pt-2">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsultaSeleccionada(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface/90 px-4 py-2 text-sm font-semibold text-content shadow-lg shadow-black/5 backdrop-blur-xl transition hover:border-brand/30 hover:bg-surface-2/90 hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" /> Regresar
                </button>
                <button
                  type="button"
                  onClick={() => descargarProductoPdf("reconocer", consultaSeleccionada.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <FileText className="h-4 w-4" /> Descargar PDF
                </button>
              </div>
              <ReconocerDetalleResultados consultaId={consultaSeleccionada.id} />
            </div>
          ) : isEmpresaActual ? (
            <div className="h-full min-h-0 overflow-y-auto pt-2">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsultaSeleccionada(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface/90 px-4 py-2 text-sm font-semibold text-content shadow-lg shadow-black/5 backdrop-blur-xl transition hover:border-brand/30 hover:bg-surface-2/90 hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" /> Regresar
                </button>
              </div>
              <EmpresaDetalleResultados
                empresa={consultaSeleccionada}
                onDownloadPdf={async (nit) => {
                  if (!nit) return;
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${API_URL}/api/descargar-pdf-empresa/${nit}/`, {
                      headers: token ? { Authorization: `Token ${token}` } : {},
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || `Error al descargar PDF: ${res.status}`);
                    }
                    const blob = await res.blob();
                    const link = document.createElement("a");
                    link.href = window.URL.createObjectURL(blob);
                    link.download = `empresa_rues_${nit}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(link.href);
                  } catch (error) {
                    alert(error.message || "No se pudo descargar el informe empresarial.");
                  }
                }}
              />
            </div>
          ) : isExperianActual ? (
            <div className="h-full min-h-0 overflow-y-auto pt-2">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsultaSeleccionada(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface/90 px-4 py-2 text-sm font-semibold text-content shadow-lg shadow-black/5 backdrop-blur-xl transition hover:border-brand/30 hover:bg-surface-2/90 hover:text-brand"
                >
                  <ArrowLeft className="h-4 w-4" /> Regresar
                </button>
                <div className="flex items-center rounded-lg border border-line/20 bg-surface/90 p-1 shadow-lg shadow-black/5 backdrop-blur-xl">
                  {EXPERIAN_PDF_THEME_OPTIONS.map((theme) => {
                    const isActive = experianPdfTheme === theme;
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => handleExperianPdfThemeChange(theme)}
                        disabled={savingExperianPdfTheme}
                        className={`rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                          isActive
                            ? "bg-brand/20 text-brand"
                            : "text-muted hover:text-content"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {theme}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => descargarProductoPdf("experian", consultaSeleccionada.id)}
                  disabled={savingExperianPdfTheme}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileText className="h-4 w-4" /> Descargar PDF
                </button>
              </div>
              <ExperianDetalleResultados consultaId={consultaSeleccionada.id} />
            </div>
          ) : (
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            pagination={false}
            navigation
            onSwiper={(s) => (swiperRef.current = s)}
            className="h-full min-h-0 swiper-custom-nav"
          >
          <style jsx global>{`
            .swiper-custom-nav .swiper-button-next,
            .swiper-custom-nav .swiper-button-prev {
              display: none;
            }
            @media (min-width: 768px) {
              .swiper-custom-nav .swiper-button-next,
              .swiper-custom-nav .swiper-button-prev {
                display: flex;
                color: ${swiperNavColor};
                background: ${swiperNavColorRgba};
                backdrop-filter: blur(10px);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid ${swiperNavBorderRgba};
                transition: all 0.3s;
                left: 4px;
                right: auto;
              }
              .swiper-custom-nav .swiper-button-next {
                left: auto;
                right: 4px;
              }
            }
            .swiper-custom-nav .swiper-button-next:hover,
            .swiper-custom-nav .swiper-button-prev:hover {
              background: ${swiperNavColorRgbaHover};
              border-color: ${swiperNavBorderRgbaHover};
              transform: scale(1.1);
            }
            .swiper-custom-nav .swiper-button-next::after,
            .swiper-custom-nav .swiper-button-prev::after {
              font-size: 14px;
              font-weight: bold;
            }
          `}</style>

            {/* Slide 2: Detalles con botones abajo */}
            <SwiperSlide className="flex flex-col min-h-0 h-full">
              {/* 🔹 Detalle primero */}
              <div className="flex-1 min-h-0">
                <DetalleResultados consultaId={consultaSeleccionada.id} consulta={consultaSeleccionada} />
              </div>

            </SwiperSlide>

            <SwiperSlide className="flex flex-row h-full min-h-0">
            <ConsultaSlide consultaId={consultaSeleccionada.id} consulta={consultaSeleccionada} />
            </SwiperSlide>
            {/* Slide 3 */}
          </Swiper>
          )}

          {/* Modal fuera del Swiper */}
          <ModalDescargaIndividual
            isOpen={showModalIndividual && !isExperianActual && !isAssetSearchActual}
            onClose={() => setShowModalIndividual(false)}
            data={{ consultaId: consultaSeleccionada?.id }}
          />
        </div>
        ) : null}
      </div>
      <ExportBatchModal
        isOpen={exportModal.open}
        format={exportModal.format}
        totalCount={exportableData.length}
        initialCount={Math.min(exportableData.length, 50)}
        isSubmitting={exportingExcel || exportingPdf}
        onClose={closeExportModal}
        onConfirm={handleConfirmExport}
      />
    </section>
  );
}
