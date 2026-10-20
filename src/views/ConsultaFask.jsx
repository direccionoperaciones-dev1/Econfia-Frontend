import { useState, useEffect } from "react";
import LogoOrganizacion from "../components/LogoOrganizacion";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import CardDni from "../components/CardDni";
import Terminos from "../components/Terminos";
import { FaCogs } from "react-icons/fa";
import ConsultaMasivaModal from "../components/ConsultaMasivaModal";
import ModalSeleccionFuentes from "../components/ModalSeleccionFuentes";


export default function ConsultaBasicElemnt() {
  const [puedeUsarMasivas, setPuedeUsarMasivas] = useState(false);
  const [puedeSeleccionar, setPuedeSeleccionar] = useState(false);
  const [showSeleccion, setShowSeleccion] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const API = process.env.REACT_APP_API_URL;
    fetch(`${API}/api/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const ids = data.perfil?.planes_masivas_ids || [];
        const planes = data.perfil?.planes || [];
        const planActual = planes.find((p) => p.nombre === "econfiafast");
        setPuedeUsarMasivas(planActual ? ids.includes(planActual.id) : false);
        setPuedeSeleccionar(Boolean(data.perfil?.fast_seleccion_fuentes));
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
  const [showMasiva, setShowMasiva] = useState(false);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

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
      tipo_consulta: "econfiafast",
    };
    if (fechaExpedicion) {
      bodyData.fecha_expedicion = fechaExpedicion;
    }
    // Selección de fuentes (solo si el admin la habilitó para este usuario).
    if (puedeSeleccionar && seleccionadas.length > 0) {
      bodyData.lista_nombres = seleccionadas;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/econfia_fask/consulta/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();
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
      setToast({ type: "error", message: "Ocurrió un error en la consulta" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-start justify-center pt-3 pb-32 md:pb-36 overflow-hidden bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-5xl w-full px-4 relative z-10">
        <div className="text-center md:text-left space-y-5">
          <div>
            <div className="inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-3 items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
              <span className="text-brand text-xs font-medium">Consulta Especial</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-content leading-tight tracking-tight">
              Econfia Fast
            </h1>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Consultas rápidas y precisas diseñadas para validaciones instantáneas. Obtén la información que necesitas sin comprometer la calidad ni la seguridad.
          </p>
        </div>
        <div className="relative w-full max-w-sm mx-auto">
          <div className="relative w-full bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-brand/10 p-6 group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />
            <div className="relative z-10">
              <LogoOrganizacion className="mb-4" size={60} />
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
                <button
                  type="submit"
                  disabled={!tipoDoc || !cedula || !acepta || !consentimiento || loading}
                  className={`mt-3 w-full px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-300
                    ${!tipoDoc || !cedula || !acepta || !consentimiento || loading
                      ? "bg-surface-2/70 text-muted cursor-not-allowed"
                      : "bg-gradient-to-r from-brand to-brand-2 text-white hover:from-brand hover:to-brand-2 hover:shadow-lg hover:shadow-brand/50 transform hover:scale-105"
                    }`}
                >
                  {loading ? "Consultando..." : "Consultar EconfiaFast"}
                </button>

                {/* Selección de fuentes — solo si el admin lo habilitó */}
                {puedeSeleccionar && (
                  <button
                    type="button"
                    onClick={() => setShowSeleccion(true)}
                    className="mt-1.5 w-full px-4 py-2 rounded-lg font-semibold text-xs border border-brand-2/40 text-brand-2 hover:bg-brand-2/15 hover:border-brand-2/60 transition-all duration-300"
                  >
                    {seleccionadas.length > 0
                      ? `Fuentes seleccionadas: ${seleccionadas.length} (cambiar)`
                      : "Seleccionar fuentes (opcional)"}
                  </button>
                )}

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
        </div>
      </div>
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          sound="/sounds/error-011-352286.mp3"
        />
      )}
      {/* Modal de resultados */}
      {!loading && showResultados && datos && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="p-8 shadow-2xl max-w-2xl w-full mx-4 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Consulta enviada</h2>
            <p className="text-white/80 mb-6">La consulta ha sido enviada a procesamiento y en unos segundos estará lista.</p>
            <CardDni data={datos} />
          </div>
        </div>,
        document.body
      )}
      {/* Modal: Consulta Masiva */}
      <ConsultaMasivaModal
        isOpen={showMasiva}
        onClose={() => setShowMasiva(false)}
        tipoConsulta="econfiafast"
      />
      {/* Modal: Selección de fuentes para Fast */}
      <ModalSeleccionFuentes
        isOpen={showSeleccion}
        onClose={() => setShowSeleccion(false)}
        onConfirm={(nombres) => {
          setSeleccionadas(nombres);
          setShowSeleccion(false);
        }}
        title="Selecciona las fuentes para Econfia Fast"
      />
    </section>
  );
}
