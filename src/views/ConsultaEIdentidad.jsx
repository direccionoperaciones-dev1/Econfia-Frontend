import { useState } from "react";
import LogoOrganizacion from "../components/LogoOrganizacion";
import { createPortal } from "react-dom";
import Toast from "../components/Toast";
import Terminos from "../components/Terminos";
import AvisoTratamientoDatos from "../components/AvisoTratamientoDatos";
import ConsultaMasivaModal from "../components/ConsultaMasivaModal";

const CAMPO_LABEL = {
  nombre:                  "Nombre",
  apellido:                "Apellido",
  tipo_doc:                "Tipo de documento",
  cedula:                  "Número de documento",
  fecha_nacimiento:        "Fecha de nacimiento",
  fecha_expedicion:        "Fecha de expedición",
  tipo_persona:            "Tipo de persona",
  sexo:                    "Sexo",
  estatura:                "Estatura",
  estado_cedula:           "Estado cédula",
  departamento_expedicion: "Departamento de expedición",
  municipio_expedicion:    "Municipio de expedición",
};

function Badge({ value }) {
  if (!value) return <span className="text-muted text-xs italic">No disponible</span>;
  const upper = String(value).toUpperCase();
  const color =
    upper === "VIGENTE"   ? "bg-green-500/20 text-green-300 border-green-500/30" :
    upper === "CANCELADO" ? "bg-red-500/20 text-red-300 border-red-500/30"       :
                            "bg-surface-2/70 text-muted border-line/15";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {value}
    </span>
  );
}

function ResultadoCard({ datos, onClose }) {
  const campos = Object.entries(CAMPO_LABEL);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 border border-line/15 rounded-2xl shadow-2xl shadow-brand/10 p-6 text-content">
        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-content font-bold text-base leading-tight">Datos del ciudadano</h2>
            <p className="text-muted text-[11px]">E-Identidad · Consulta completada</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-muted hover:text-content transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid de datos */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {campos.map(([key, label]) => {
            const val = datos?.[key];
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted uppercase tracking-wider font-medium">{label}</span>
                {key === "estado_cedula" ? (
                  <Badge value={val} />
                ) : (
                  <span className="text-[12px] text-content/85 font-medium">
                    {val || <span className="text-muted italic text-[11px]">No disponible</span>}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 text-white text-xs font-semibold hover:opacity-90 transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function ConsultaEIdentidad() {
  const [tipoDoc, setTipoDoc]             = useState("CC");
  const [cedula, setCedula]               = useState("");
  const [acepta, setAcepta]               = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [datos, setDatos]                 = useState(null);
  const [toast, setToast]                 = useState(null);
  const [showMasiva, setShowMasiva]       = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoDoc) return setToast({ type: "error", message: "Selecciona el tipo de documento." });
    if (!cedula)  return setToast({ type: "error", message: "Ingresa el número de documento." });
    if (!acepta)  return setToast({ type: "error", message: "Debes aceptar los términos y condiciones." });
    if (!consentimiento) return setToast({ type: "error", message: "Debes confirmar el consentimiento del titular." });

    setLoading(true);
    setDatos(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/e-identidad/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ cedula, tipo_doc: tipoDoc }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: data.error || `Error HTTP: ${res.status}` });
        return;
      }
      setDatos(data.datos || data);
    } catch {
      setToast({ type: "error", message: "Ocurrió un error en la consulta." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-start justify-center pt-3 pb-32 overflow-hidden bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-5xl w-full px-4 relative z-10">
        {/* Descripción */}
        <div className="text-center md:text-left space-y-5">
          <div>
            <div className="inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-3 items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
              </span>
              <span className="text-brand text-xs font-medium">Identidad instantánea</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-content leading-tight tracking-tight">
              E-Identidad
            </h1>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Obtén los datos biográficos del ciudadano de forma inmediata desde Certicámara.
            Sin bots, sin esperas. Solo nombre, documento, estado de cédula y datos de expedición.
          </p>
          <ul className="space-y-2 text-xs text-content/80">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Nombre y apellido</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Estado de la cédula (Vigente / Cancelado)</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Departamento y municipio de expedición</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand" />Fecha de expedición del documento</li>
          </ul>
        </div>

        {/* Formulario */}
        <div className="relative w-full max-w-sm mx-auto">
          <div className="relative w-full bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-brand/10 p-6 group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <LogoOrganizacion className="h-16 w-16 object-contain" />
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Tipo de documento */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-content/80">Tipo de documento *</label>
                  <select
                    required
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm appearance-none cursor-pointer"
                  >
                    <option className="bg-surface text-content" value="CC">Cédula de Ciudadanía (CC)</option>
                    <option className="bg-surface text-content" value="TI">Tarjeta de Identidad (TI)</option>
                    <option className="bg-surface text-content" value="CE">Cédula de Extranjería (CE)</option>
                    <option className="bg-surface text-content" value="PPT">Permiso de Protección Temporal (PPT)</option>
                    <option className="bg-surface text-content" value="PEP">Permiso Especial de Permanencia (PEP)</option>
                  </select>
                </div>

                {/* Número de documento */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-content/80">Número de documento *</label>
                  <input
                    required
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ingrese número de documento"
                    className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm"
                  />
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

                <button
                  type="submit"
                  disabled={!tipoDoc || !cedula || !acepta || !consentimiento || loading}
                  className={`mt-2 w-full px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-300
                    ${!tipoDoc || !cedula || !acepta || !consentimiento || loading
                      ? "bg-surface-2/70 text-muted cursor-not-allowed"
                      : "bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90 hover:shadow-lg hover:shadow-brand/50 transform hover:scale-105"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Consultando...
                    </span>
                  ) : "Consultar E-Identidad"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowMasiva(true)}
                  className="w-full px-4 py-2 rounded-lg font-semibold text-xs border border-brand/40 text-brand hover:bg-brand/15 hover:border-brand/60 transition-all duration-300"
                >
                  Consulta Masiva (hasta 50 documentos)
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Modal resultado individual */}
      {!loading && datos && (
        <ResultadoCard datos={datos} onClose={() => setDatos(null)} />
      )}

      {/* Modal consulta masiva */}
      <ConsultaMasivaModal
        isOpen={showMasiva}
        onClose={() => setShowMasiva(false)}
        tipoConsulta="e-identidad"
      />
    </section>
  );
}
