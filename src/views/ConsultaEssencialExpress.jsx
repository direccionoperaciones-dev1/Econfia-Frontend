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
import TextoAutorizacion from "../components/TextoAutorizacion";


function ModalEssencialExpress({ isOpen, onClose, data, onSuccess, puedeUsarLotes }) {
  const [fuentes, setFuentes] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!isOpen) return;
    const fetchFuentes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/fuentes/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });
        const json = await res.json();
        setFuentes(Array.isArray(json) ? json : []);
      } catch (err) {
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
  ]);

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
      return [...prev, nombre];
    });
  };

  const handleConsultar = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const bodyPayload = {
        cedula: data.cedula,
        tipo_doc: data.tipo_doc,
        lista_nombres: seleccionadas,
        tipo_consulta: "essencial-express",
      };
      if (data.fecha_expedicion) {
        bodyPayload.fecha_expedicion = data.fecha_expedicion;
      }
      // Cambia el endpoint aquí
      const res = await fetch(`${API_URL}/api/consultar-sin-captura-express/`, {
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
      if (onSuccess) onSuccess(result.datos || result);
      onClose();
    } catch (err) {
      setToast({ type: "error", message: "Ocurrió un error en la consulta" });
    } finally {
      setLoading(false);
    }
  };

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
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl border border-line/15 rounded-[20px] shadow-2xl shadow-brand/20 max-w-3xl w-full mx-4 p-6 text-content max-h-[92vh] flex flex-col">
          <div className="absolute inset-0 opacity-50 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted hover:text-danger text-xl font-bold transition-colors z-10"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="relative z-10 flex flex-col min-h-0 flex-1">
            <div className="text-center mb-4">
              <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-2">
                <span className="text-brand text-xs font-medium">Personaliza tu consulta Express</span>
              </div>
              <h2 className="text-2xl font-black text-content">
                Econfia Essential Express
              </h2>
            </div>
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
              modulo="essencial-express"
              enabled={puedeUsarLotes}
              fuentes={fuentes}
              seleccionadas={seleccionadas}
              setSeleccionadas={setSeleccionadas}
              onToast={setToast}
            />

            {/* Contador de fuentes seleccionadas */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-brand font-semibold text-sm">
                {`Fuentes seleccionadas: ${seleccionadas.length}`}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
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
                    <div className="flex flex-col">
                      <span className="font-medium text-content group-hover:text-brand transition-colors">{fuente.nombre_pila || fuente.nombre}</span>
                    </div>
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
            {/* Footer fijo: botón consultar siempre visible */}
            <div className="flex-shrink-0 pt-3 border-t border-line/15">
              <button
                onClick={handleConsultar}
                disabled={loading || seleccionadas.length === 0}
                className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  loading || seleccionadas.length === 0
                    ? "bg-surface-2/70 text-muted cursor-not-allowed"
                    : "bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90 hover:shadow-lg hover:shadow-brand/50"
                }`}
              >
                {loading
                  ? "Consultando..."
                  : seleccionadas.length === 0
                  ? "Selecciona o aplica un lote para consultar"
                  : `Consultar Express ${seleccionadas.length} fuente${seleccionadas.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function ConsultaEssencialExpress() {
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
        const planActual = planes.find((p) => p.nombre === "essencial-express");
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
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;
  const [showEssencialExpress, setShowEssencialExpress] = useState(false);
  const [showMasiva, setShowMasiva] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    };
    if (fechaExpedicion) {
      bodyData.fecha_expedicion = fechaExpedicion;
    }
    setDatos(bodyData);
    setShowEssencialExpress(true);
    setLoading(false);
  };

  return (
    <>
      {loading &&
        createPortal(
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
              <source src="/videos/load.mp4" type="video/mp4" />
              Tu navegador no soporta videos.
            </video>
            <audio autoPlay loop>
              <source src="/sounds/suspend-sound-113941.mp3" type="audio/mp3" />
              Tu navegador no soporta audio.
            </audio>
            <div className="relative bg-white/10 border border-white/30 rounded-2xl p-10 shadow-2xl text-center max-w-md w-full mx-4 backdrop-blur-md">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-brand mx-auto mb-6"></div>
              <p className="text-white text-lg font-semibold animate-pulse">
                Cargando datos del candidato para la consulta...
              </p>
            </div>
          </div>,
          document.body
        )}
      {!loading && showResultados && datos && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="p-8 shadow-2xl max-w-2xl w-full mx-4 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Consulta enviada
            </h2>
            <p className="text-white/80 mb-6">
              La consulta ha sido enviada a procesamiento y en unos segundos estará lista.
            </p>
            <CardDni data={datos} />
          </div>
        </div>,
        document.body
      )}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          sound="/sounds/error-011-352286.mp3"
        />
      )}
      <section className="relative min-h-screen flex items-start justify-center pt-3 pb-32 md:pb-36 overflow-hidden bg-transparent">
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
                <span className="text-brand text-xs font-medium">Consulta Express</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-content leading-tight tracking-tight">
                Econfia Essencial Express
              </h1>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Seleccione el tipo de documento e ingrese el número. Luego elija las fuentes específicas que desea consultar (solo bots sin captura).
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand flex-shrink-0" />
                <span className="text-xs text-content/85">Consulta rápida y eficiente.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-2 flex-shrink-0" />
                <span className="text-xs text-content/85">Solo bots sin captura.</span>
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
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <LogoOrganizacion className="h-16 w-16 object-contain" />
                </div>
                <form onSubmit={handleSubmit} className="space-y-2">
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
                        <option className="bg-surface text-content" value="CC">Cédula de Ciudadanía (CC)</option>
                        <option className="bg-surface text-content" value="TI">Tarjeta de Identidad (TI)</option>
                        <option className="bg-surface text-content" value="CE">Cédula de Extranjería (CE)</option>
                        <option className="bg-surface text-content" value="PPT">Permiso de Protección Temporal (PPT)</option>
                        <option className="bg-surface text-content" value="PEP">Permiso Especial de Permanencia (PEP)</option>
                        <option className="bg-surface text-content" value="NIT">NIT</option>
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
                  <div className="space-y-1 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acepta}
                        onChange={(e) => setAcepta(e.target.checked)}
                        className="accent-brand w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-content/85 group-hover:text-content transition-colors">
                        Acepto los {" "}
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
                        <TextoAutorizacion />
                      </span>
                    </label>
                  </div>
                <AvisoTratamientoDatos className="mt-1" />
                  <button
                    type="submit"
                    disabled={!tipoDoc || !cedula || !acepta || !consentimiento}
                    className={`mt-3 w-full px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${
                      !tipoDoc || !cedula || !acepta || !consentimiento
                        ? "bg-surface-2/70 text-muted cursor-not-allowed"
                        : "bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90 hover:shadow-lg hover:shadow-brand/50 transform hover:scale-105"
                    }`}
                  >
                    Consulta Essencial Express
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
            <p className="text-[10px] text-muted text-center mt-2">
              Cumplimiento normativo y uso responsable de la información.
            </p>
          </div>
        </div>
      </section>
      <ModalEssencialExpress
        isOpen={showEssencialExpress}
        onClose={() => setShowEssencialExpress(false)}
        data={datos}
        puedeUsarLotes={puedeUsarLotes}
        onSuccess={(datosConsulta) => {
          setDatos(datosConsulta);
          setShowResultados(true);
          setTimeout(() => navigate("/d3b7f1e9"), 10000);
        }}
      />

      {/* Modal: Consulta Masiva */}
      <ConsultaMasivaModal
        isOpen={showMasiva}
        onClose={() => setShowMasiva(false)}
        tipoConsulta="essencial-express"
      />
    </>
  );
}
