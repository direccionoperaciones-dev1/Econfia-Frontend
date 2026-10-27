import { useState, useEffect } from "react";
import LogoOrganizacion from "../components/LogoOrganizacion";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import CardDni from "../components/CardDni";
import Terminos from "../components/Terminos";
import AvisoTratamientoDatos from "../components/AvisoTratamientoDatos";
import ConsultaMasivaModal from "../components/ConsultaMasivaModal";
import LotesFuentes from "../components/LotesFuentes";

// El cliente pidió administrar el modo únicamente desde el control global.
// Se conserva el selector por fuente detrás de esta bandera para poder
// reactivarlo sin recuperar lógica eliminada.
const MOSTRAR_SELECTOR_MODO_POR_FUENTE = false;

function ModalConsultaMedida({ isOpen, onClose, data, onSuccess, puedeUsarLotes }) {
  const [fuentes, setFuentes] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [modos, setModos] = useState({}); // { [clave]: 'captura' | 'sin_captura' }
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(""); // filtro de texto
  const [toast, setToast] = useState(null); // NUEVO: para mostrar errores
  const [panelMin, setPanelMin] = useState(false); // panel de seleccionadas minimizado
  const API_URL = process.env.REACT_APP_API_URL;

  // Nombre amigable de una fuente a partir de su "nombre" técnico
  const nombreToDisplay = (nombre) => {
    const f = fuentes.find((x) => x.nombre === nombre);
    return f?.nombre_pila || f?.nombre || nombre;
  };

  // --- Modo por fuente: con evidencia (captura) o sin evidencia (sin_captura) ---
  const dispoDe = (nombre) => fuentes.find((x) => x.nombre === nombre) || {};
  const modoDefault = (nombre) => {
    const f = dispoDe(nombre);
    if (f.disponible_captura) return "captura"; // por defecto CON evidencia
    if (f.disponible_sin_captura) return "sin_captura";
    return "captura";
  };
  const modoDe = (nombre) => modos[nombre] || modoDefault(nombre);
  const setModo = (nombre, modo) => setModos((prev) => ({ ...prev, [nombre]: modo }));
  // Aplica un modo a todas las fuentes seleccionadas que lo soporten
  const setModoTodas = (modo) =>
    setModos((prev) => {
      const next = { ...prev };
      seleccionadas.forEach((n) => {
        const f = dispoDe(n);
        if (modo === "captura" && f.disponible_captura) next[n] = "captura";
        if (modo === "sin_captura" && f.disponible_sin_captura) next[n] = "sin_captura";
      });
      return next;
    });
  const todasEnModo = (modo) => seleccionadas.length > 0 && seleccionadas.every((nombre) => modoDe(nombre) === modo);

  // Cargar catálogo de fuentes (con disponibilidad por modo) al abrir modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchFuentes = async () => {
      try {
        const token = localStorage.getItem("token"); // Obtener token
        const res = await fetch(`${API_URL}/api/essencial/catalogo-fuentes/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`, // Cabecera de autorización
          },
        });
        const json = await res.json();
        const items = Array.isArray(json?.fuentes) ? json.fuentes : [];
        // Mapear al shape que usa el modal + disponibilidad de modos
        setFuentes(
          items.map((f) => ({
            id: f.clave,
            nombre: f.clave,
            nombre_pila: f.nombre,
            disponible_captura: !!f.disponible_captura,
            disponible_sin_captura: !!f.disponible_sin_captura,
          }))
        );
      } catch (err) {
        console.error("Error cargando fuentes:", err);
        setFuentes([]);
      }
    };

    fetchFuentes();
  }, [isOpen, API_URL]);

  const FUENTES_EDUCATIVAS = new Set([
    "biologia_consulta", "biologia_validacion_certificados",
    "colpsic_validar_documento", "colpsic_verificacion_tarjetas",
    "cnb_carnet_afiliacion", "cnb_consulta_matriculados",
    "conalpe_certificado", "conalpe_consulta_inscritos",
    "conaltel_consulta_matriculados",
    "conpucol_certificados", "conpucol_verificacion_colegiados",
    "conte_consulta_matricula", "conte_consulta_vigencia",
    "copnia_certificado",
    "cp_certificado_busqueda", "cp_validar_certificado", "cp_validar_matricula",
    "cpaa_generar_certificado",
    "cpae_certificado", "cpae_verify_certification", "cpae_verify_licensure",
    "cpip_verif_matricula",
    "cpiq_certificado_vigencia", "cpiq_validacion_certificado_vigencia",
    "cpiq_validacion_matricula", "cpiq_validacion_tarjeta",
    "cpnaa_certificado_vigencia", "cpnaa_matricula_arquitecto",
    "cpnt_consulta_licencia", "cpnt_vigencia_externa_form", "cpnt_vigenciapdf",
    "cpqcol_antecedentes", "cpqcol_verificar",
    "cndj_antecedentes_disciplinarios",
    "rama_abogado_certificado",
    "rethus", "rethus_identificacion",
    "pruebas_icfes",
    "tnem_certificados",
    "sideap_comprobante",
    "mintransporte_capacitaciones",
    "colelectro_directorio",
    "cpae_certificado", "cpnaa_certificado_vigencia",
  ]);

  // Filtrado local por nombre / nombre_pila (excluyendo colegios/universidades)
  const filteredFuentes = fuentes.filter((f) => {
    if (FUENTES_EDUCATIVAS.has(f?.nombre)) return false;
    const texto = `${f?.nombre ?? ""} ${f?.nombre_pila ?? ""}`.toLowerCase();
    return texto.includes(query.toLowerCase());
  });

  const handleCheckbox = (nombre) => {
    setSeleccionadas((prev) => {
      if (prev.includes(nombre)) {
        return prev.filter((n) => n !== nombre);
      }
      // Al seleccionar, fijar el modo por defecto si no tiene uno
      setModos((m) => (m[nombre] ? m : { ...m, [nombre]: modoDefault(nombre) }));
      return [...prev, nombre];
    });
  };

  const handleConsultar = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Obtener token
      const bodyPayload = {
        cedula: data.cedula,
        tipo_doc: data.tipo_doc,
        tipo_consulta: "essencial",
        lista_nombres: seleccionadas,
        // Cada fuente con su modo elegido: con evidencia (captura) o sin evidencia.
        // Solo se envían las claves presentes en el catálogo (evita rechazos del backend).
        fuentes_configuracion: seleccionadas
          .filter((n) => fuentes.some((f) => f.nombre === n))
          .map((n) => ({ clave: n, modo: modoDe(n) })),
      };
      if (data.fecha_expedicion) {
        bodyPayload.fecha_expedicion = data.fecha_expedicion;
      }
      const res = await fetch(`${API_URL}/api/consultar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });
      const result = await res.json();
      if (!res.ok) {
        setToast({
          type: "error",
          message: result.error || `Error HTTP: ${res.status}`,
        });
        return;
      }
      // Notifica al padre para mostrar resultados y redirigir
      if (onSuccess) onSuccess(result.datos || result);
      onClose();
    } catch (err) {
      console.error("Error consultando:", err);
      setToast({ type: "error", message: "Ocurrió un error en la consulta" });
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar/deseleccionar todas las fuentes (máximo 45)
  const allSelected = filteredFuentes.length > 0 && filteredFuentes.every(f => seleccionadas.includes(f.nombre));
  const handleToggleAll = () => {
    if (allSelected) {
      setSeleccionadas([]);
    } else {
      setSeleccionadas(filteredFuentes.map(f => f.nombre));
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          sound="/sounds/error-011-352286.mp3"
        />
      )}
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl border border-line/15 rounded-[20px] shadow-2xl shadow-brand/20 max-w-3xl w-full mx-4 p-6 text-content max-h-[92vh] flex flex-col">
          {/* Glow effect */}
          <div className="absolute inset-0 opacity-50 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted hover:text-danger text-xl font-bold transition-colors z-10"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="relative z-10 flex flex-col min-h-0 flex-1">
            <div className="text-center mb-4 flex-shrink-0">
              <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-2">
                <span className="text-brand text-xs font-medium">Personaliza tu consulta</span>
              </div>
              <h2 className="text-2xl font-black text-content">
                Consulta a la Medida
              </h2>
            </div>

            {/* Zona central: todo scrollea junto (filtro + lotes + seleccionadas + lista) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">

            {/* Filtro */}
            <div className="mb-3 flex flex-col md:flex-row md:items-center md:gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar fuentes por nombre..."
                className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-sm focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={handleToggleAll}
                className={`mt-2 md:mt-0 md:ml-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border border-brand/40 ${
                  allSelected
                    ? "bg-brand text-white hover:opacity-90"
                    : "bg-brand/10 text-brand hover:bg-brand/20"
                }`}
              >
                {allSelected ? "Deseleccionar todas" : "Seleccionar todas"}
              </button>
            </div>

            {/* Lotes de fuentes guardados (solo si el admin lo habilitó) */}
            <LotesFuentes
              modulo="essencial"
              enabled={puedeUsarLotes}
              fuentes={fuentes}
              seleccionadas={seleccionadas}
              setSeleccionadas={setSeleccionadas}
              onToast={setToast}
            />

            {/* Panel colapsable de fuentes seleccionadas */}
            <div className="mb-3 rounded-xl border border-brand/20 bg-brand/5">
              <button
                type="button"
                onClick={() => setPanelMin((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-left"
              >
                <span className="text-brand font-semibold text-sm flex items-center gap-2">
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand/20 text-brand text-xs font-bold">
                    {seleccionadas.length}
                  </span>
                  Fuentes seleccionadas
                </span>
                <span className="flex items-center gap-3">
                  {seleccionadas.length > 0 && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSeleccionadas([]);
                      }}
                      className="text-[11px] text-muted hover:text-danger transition-colors"
                    >
                      Limpiar
                    </span>
                  )}
                  <svg
                    className={`w-4 h-4 text-brand transition-transform duration-300 ${panelMin ? "" : "rotate-180"}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {!panelMin && (
                <div className="px-3 pb-3">
                  {seleccionadas.length === 0 ? (
                    <p className="text-xs text-muted">Aún no has seleccionado fuentes.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                      {seleccionadas.map((nombre) => (
                        <span
                          key={nombre}
                          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 text-brand text-[11px] font-semibold"
                        >
                          <span className="truncate max-w-[220px]">{nombreToDisplay(nombre)}</span>
                          <button
                            type="button"
                            onClick={() => handleCheckbox(nombre)}
                            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-500/50 text-brand hover:text-white transition-colors text-[10px]"
                            aria-label={`Quitar ${nombreToDisplay(nombre)}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Control global de evidencia para todas las seleccionadas */}
            {seleccionadas.length > 0 && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-surface-2/50 border border-line/15 px-3 py-2">
                <span className="text-[11px] text-muted">Aplicar a todas las seleccionadas:</span>
                <div className="inline-flex items-center rounded-full bg-surface/70 border border-line/20 p-0.5">
                  <button
                    type="button"
                    onClick={() => setModoTodas("captura")}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                      todasEnModo("captura") ? "bg-brand text-white shadow-sm shadow-brand/30" : "text-content hover:bg-brand/15"
                    }`}
                  >
                    Todas con evidencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoTodas("sin_captura")}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
                      todasEnModo("sin_captura") ? "bg-brand text-white shadow-sm shadow-brand/30" : "text-content hover:bg-brand/15"
                    }`}
                  >
                    Todas sin evidencia
                  </button>
                </div>
              </div>
            )}

            {/* Lista de fuentes (altura natural; el scroll lo maneja la zona central) */}
            <div className="space-y-2 mb-2">
              {filteredFuentes.length > 0 ? (
                filteredFuentes.map((fuente) => {
                  const isDisabled = false;
                  return (
                  <label
                    key={fuente.id}
                    className={`flex items-center gap-3 bg-surface-2/60 hover:bg-brand/10 p-3 rounded-lg border border-line/15 transition-all hover:shadow-md hover:shadow-brand/10 group ${
                      isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={`accent-brand w-4 h-4 ${
                        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                      checked={seleccionadas.includes(fuente.nombre)}
                      onChange={() => handleCheckbox(fuente.nombre)}
                      disabled={isDisabled}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-content group-hover:text-brand transition-colors truncate">{fuente.nombre_pila || fuente.nombre}</span>
                    </div>
                    {/* Toggle por fuente: con evidencia / sin evidencia (segmentado) */}
                    {MOSTRAR_SELECTOR_MODO_POR_FUENTE && seleccionadas.includes(fuente.nombre) && (
                      <div
                        className="flex items-center ml-auto flex-shrink-0"
                        onClick={(e) => e.preventDefault()}
                      >
                        <div className="inline-flex items-center rounded-full bg-surface/70 border border-line/20 p-0.5 shadow-inner">
                          <button
                            type="button"
                            title={fuente.disponible_captura ? "Incluye captura/evidencia en el PDF" : "No disponible con evidencia"}
                            disabled={!fuente.disponible_captura}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModo(fuente.nombre, "captura"); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                              modoDe(fuente.nombre) === "captura"
                                ? "bg-brand text-white shadow-sm shadow-brand/40"
                                : "text-muted hover:text-content"
                            } ${!fuente.disponible_captura ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                            Evidencia
                          </button>
                          <button
                            type="button"
                            title={fuente.disponible_sin_captura ? "Más rápido, sin captura" : "No disponible sin evidencia"}
                            disabled={!fuente.disponible_sin_captura}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModo(fuente.nombre, "sin_captura"); }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                              modoDe(fuente.nombre) === "sin_captura"
                                ? "bg-brand text-white shadow-sm shadow-brand/40"
                                : "text-muted hover:text-content"
                            } ${!fuente.disponible_sin_captura ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                            Sin
                          </button>
                        </div>
                      </div>
                    )}
                  </label>
                  );
                })
              ) : (
                <p className="text-muted text-center py-4">
                  {fuentes.length === 0
                    ? "No hay fuentes disponibles."
                    : "No hay coincidencias con el filtro."}
                </p>
              )}
            </div>

            </div>{/* fin zona central scrolleable */}

            {/* Footer fijo: botón consultar siempre visible */}
            <div className="flex-shrink-0 pt-3 border-t border-line/15">
              <button
                onClick={handleConsultar}
                disabled={loading || seleccionadas.length === 0}
                className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  loading || seleccionadas.length === 0
                    ? "bg-surface-2/70 text-muted cursor-not-allowed"
                    : "bg-gradient-to-r from-brand to-brand-2 text-white hover:from-brand hover:to-brand-2 hover:shadow-lg hover:shadow-brand/50"
                }`}
              >
                {loading
                  ? "Consultando..."
                  : seleccionadas.length === 0
                  ? "Selecciona o aplica un lote para consultar"
                  : `Consultar ${seleccionadas.length} fuente${seleccionadas.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ===============
   Página: Consulta
   =============== */
export default function ConsultaMedida() {
  const [puedeUsarMasivas, setPuedeUsarMasivas] = useState(false);
  const [puedeUsarLotes, setPuedeUsarLotes] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const API = process.env.REACT_APP_API_URL;
    fetch(`${API}/api/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const ids = data.perfil?.planes_masivas_ids || [];
        const planes = data.perfil?.planes || [];
        const planActual = planes.find((p) => p.nombre === "essential");
        setPuedeUsarMasivas(planActual ? ids.includes(planActual.id) : false);
        setPuedeUsarLotes(!!data.perfil?.puede_usar_lotes);
      })
      .catch(() => {});
  }, []);
  const [tipoDoc, setTipoDoc] = useState("");
  const [cedula, setCedula] = useState("");
  const [fechaExpedicion, setFechaExpedicion] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState(null);
  const [toast, setToast] = useState(null);
  const [showResultados, setShowResultados] = useState(false);
  const [showHorarioAviso, setShowHorarioAviso] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;
  const [showConsultaMedida, setShowConsultaMedida] = useState(false);
  const [showMasiva, setShowMasiva] = useState(false);
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 11 && hour < 22) {
      setShowHorarioAviso(true);

      const timeout = setTimeout(() => setShowHorarioAviso(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación manual de campos requeridos
    if (!tipoDoc) {
      setToast({ type: "error", message: "Selecciona el tipo de documento." });
      return;
    }
    if (!cedula) {
      setToast({ type: "error", message: "Ingresa el número de documento." });
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
    setDatos(null);
    setShowResultados(false);

    const bodyData = {
      tipo_doc: tipoDoc,
      cedula,
      tipo_consulta: "essential",
    };

    if (fechaExpedicion) {
      bodyData.fecha_expedicion = fechaExpedicion;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/consultar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      console.log("Respuesta API:", data);

      if (!res.ok) {
        setToast({
          type: "error",
          message: data.error || `Error HTTP: ${res.status}`,
        });
        return;
      }

      setDatos(data.datos || data);
      setShowResultados(true);
      setTimeout(() => navigate("/d3b7f1e9"), 10000);
    } catch (error) {
      console.error("Error en la consulta:", error);
      setToast({ type: "error", message: "Ocurrió un error en la consulta" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal de carga */}
      {loading &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
            {/* Video de fondo */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            >
              <source src="/videos/load.mp4" type="video/mp4" />
              Tu navegador no soporta videos.
            </video>

            {/* Música */}
            <audio autoPlay loop>
              <source src="/sounds/suspend-sound-113941.mp3" type="audio/mp3" />
              Tu navegador no soporta audio.
            </audio>

            {/* Contenido del modal */}
            <div className="relative bg-white/10 border border-white/30 rounded-2xl p-10 shadow-2xl text-center max-w-md w-full mx-4 backdrop-blur-md">
              {/* Icono cargando */}
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-brand mx-auto mb-6"></div>

              {/* Texto animado */}
              <p className="text-white text-lg font-semibold animate-pulse">
                Cargando datos del candidato para la consulta...
              </p>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de resultados */}
      {!loading &&
        showResultados &&
        datos &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
            <div className="p-8 shadow-2xl max-w-2xl w-full mx-4 text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Consulta enviada
              </h2>
              <p className="text-white/80 mb-6">
                La consulta ha sido enviada a procesamiento y en unos segundos
                estará lista.
              </p>

              <CardDni data={datos} />
            </div>
          </div>,
          document.body
        )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          sound="/sounds/error-011-352286.mp3"
        />
      )}

      {/* Formulario con fondo elegante */}
      <section className="relative min-h-screen flex items-start justify-center pt-3 pb-32 md:pb-36 overflow-hidden bg-transparent">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-5xl w-full px-4 relative z-10">
          <div className="text-center md:text-left space-y-5">
            <div>
              <div className="inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-3 items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
                <span className="text-brand text-xs font-medium">Consulta Personalizada</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-content leading-tight tracking-tight">
                Econfia Essential
              </h1>
            </div>

            <p className="text-sm text-muted leading-relaxed">
              Seleccione el tipo de documento e ingrese el número. Luego elija las fuentes específicas que desea consultar.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand flex-shrink-0" />
                <span className="text-xs text-content/85">Personaliza completamente tu búsqueda.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-2 flex-shrink-0" />
                <span className="text-xs text-content/85">Selecciona solo las fuentes que necesitas.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-xs text-content/85">Resultados precisos y eficientes.</span>
              </div>
            </div>

            <p className="text-[10px] text-red-400/70 leading-snug pt-2">
              Al realizar esta consulta, declara y certifica que cuenta con la autorización válida y expresa del titular del documento objeto de verificación.
            </p>
          </div>

          <div className="relative w-full max-w-sm mx-auto">
            <div className="relative w-full bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-brand/10 p-6 group">
              {/* Glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <LogoOrganizacion className="h-16 w-16 object-contain" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                {/* Inputs */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-content/80">Tipo de documento *</label>
                    <select
                      required
                      value={tipoDoc}
                      onChange={(e) => setTipoDoc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content text-xs focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm appearance-none cursor-pointer"
                    >
                      <option className="bg-surface text-content" value="">
                        Seleccione tipo de documento
                      </option>
                      <option className="bg-surface text-content" value="CC">
                        Cédula de Ciudadanía (CC)
                      </option>
                      <option className="bg-surface text-content" value="TI">
                        Tarjeta de Identidad (TI)
                      </option>
                      <option className="bg-surface text-content" value="CE">
                        Cédula de Extranjería (CE)
                      </option>
                      <option className="bg-surface text-content" value="PPT">
                        Permiso de Protección Temporal (PPT)
                      </option>
                      <option className="bg-surface text-content" value="PEP">
                        Permiso Especial de Permanencia (PEP)
                      </option>
                      <option className="bg-surface text-content" value="NIT">
                        NIT
                      </option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-content/80">Número de documento *</label>
                    <input
                      required
                      type="text"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Ingrese número de documento"
                      className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-content/80">Fecha de expedición (Opcional)</label>
                    <input
                      type="date"
                      value={fechaExpedicion}
                      onChange={(e) => setFechaExpedicion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content text-xs focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-1 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acepta}
                      onChange={(e) => setAcepta(e.target.checked)}
                      className="accent-brand w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-content/85 group-hover:text-content transition-colors">
                      Acepto los{" "}
                        <Terminos
                          inline
                          triggerClassName="text-brand hover:text-brand underline underline-offset-4 font-medium transition-colors"
                        />
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={consentimiento}
                      onChange={(e) => setConsentimiento(e.target.checked)}
                      className="accent-brand w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-content/85 group-hover:text-content transition-colors">
                      Confirmo consentimiento del titular
                    </span>
                  </label>
                </div>
                <AvisoTratamientoDatos className="mt-1" />


                {/* Botón: Consulta a la Medida */}
                {/** Botón: Consulta a la Medida (solo habilitado si todos los campos requeridos están completos) */}
                <button
                  type="button"
                  onClick={() => {
                    setDatos({
                      tipo_doc: tipoDoc,
                      cedula,
                      fecha_expedicion: fechaExpedicion || null,
                    });
                    setShowConsultaMedida(true);
                  }}
                  disabled={
                    !tipoDoc || !cedula || !acepta || !consentimiento
                  }
                  className={`mt-3 w-full px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-300
                    ${
                      !tipoDoc || !cedula || !acepta || !consentimiento
                        ? "bg-surface-2/70 text-muted cursor-not-allowed"
                        : "bg-gradient-to-r from-brand to-brand-2 text-white hover:from-brand hover:to-brand-2 hover:shadow-lg hover:shadow-brand/50 transform hover:scale-105"
                    }`}
                >
                  Consulta a la medida
                </button>

                {/* Botón consulta masiva — solo si el admin lo habilitó */}
                {puedeUsarMasivas && (
                  <button
                    type="button"
                    onClick={() => setShowMasiva(true)}
                    className="mt-1.5 w-full px-4 py-2 rounded-lg font-semibold text-xs border border-brand/40 text-brand hover:bg-brand/15 hover:border-brand/60 transition-all duration-300"
                  >
                    Consulta Masiva (hasta 50 documentos)
                  </button>
                )}
                </form>
              </div>
            </div>
            {/* Nota de privacidad */}
            <p className="text-[10px] text-muted text-center mt-2">
              Cumplimiento normativo y uso responsable de la información.
            </p>
          </div>
        </div>
      </section>

      {/* Modal: Consulta a la Medida */}
      <ModalConsultaMedida
        isOpen={showConsultaMedida}
        onClose={() => setShowConsultaMedida(false)}
        data={datos}
        puedeUsarLotes={puedeUsarLotes}
        onSuccess={(datosConsulta) => {
          setDatos(datosConsulta);
          setShowResultados(true);
          setTimeout(() => navigate("/d3b7f1e9"), 2000);
        }}
      />

      {/* Modal: Consulta Masiva */}
      <ConsultaMasivaModal
        isOpen={showMasiva}
        onClose={() => setShowMasiva(false)}
        tipoConsulta="essencial"
      />
    </>
  );
}
