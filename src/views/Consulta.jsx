import { useState, useEffect } from "react";
import FormLogo from "../components/FormLogo";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import CardDni from "../components/CardDni";
import Terminos from "../components/Terminos";
import AvisoTratamientoDatos from "../components/AvisoTratamientoDatos";
import ConsultaMasivaModal from "../components/ConsultaMasivaModal";


function ModalConsultaMedida({ isOpen, onClose, data }) {
  const [fuentes, setFuentes] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(""); // filtro de texto
  const [toast, setToast] = useState(null); // NUEVO: para mostrar errores
  const API_URL = process.env.REACT_APP_API_URL;

  // Cargar fuentes al abrir modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchFuentes = async () => {
      try {
        const token = localStorage.getItem("token"); // Obtener token
        const res = await fetch(`${API_URL}/api/fuentes/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`, // Cabecera de autorización
          },
        });
        const json = await res.json();
        setFuentes(Array.isArray(json) ? json : []); // seguridad
      } catch (err) {
        console.error("Error cargando fuentes:", err);
        setFuentes([]);
      }
    };

    fetchFuentes();
  }, [isOpen, API_URL]);

  // Filtrado local por nombre / nombre_pila
  const filteredFuentes = fuentes.filter((f) => {
    const texto = `${f?.nombre ?? ""} ${f?.nombre_pila ?? ""}`.toLowerCase();
    return texto.includes(query.toLowerCase());
  });

  const handleCheckbox = (nombre) => {
    setSeleccionadas((prev) =>
      prev.includes(nombre) ? prev.filter((n) => n !== nombre) : [...prev, nombre]
    );
  };

  const handleConsultar = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Obtener token
      const res = await fetch(`${API_URL}/api/consultar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Cabecera de autorización
        },
        body: JSON.stringify({
          cedula: data.cedula,
          tipo_doc: data.tipo_doc,
          tipo_consulta: "ecorefull",
          lista_nombres: seleccionadas,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setToast({
          type: "error",
          message: result.error || `Error HTTP: ${res.status}`,
        });
        return;
      }
      onClose(); // Cierra el modal o maneja resultados
    } catch (err) {
      console.error("Error consultando:", err);
      setToast({ type: "error", message: "Ocurrió un error en la consulta" });
    } finally {
      setLoading(false);
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
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl border border-line/15 rounded-2xl shadow-2xl shadow-brand/20 max-w-2xl w-full p-6 relative text-content">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted hover:text-brand text-2xl font-bold transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold text-content mb-4 text-center">
            Consulta a la Medida
          </h2>

          {/* Filtro */}
          <div className="mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar fuente..."
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-sm focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
            />
            <p className="text-xs text-muted mt-1">
              {filteredFuentes.length} fuente{filteredFuentes.length === 1 ? "" : "s"} encontrada{filteredFuentes.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Lista de fuentes */}
          <div className="max-h-64 overflow-y-auto space-y-2 mb-4 pr-2">
            {filteredFuentes.length > 0 ? (
              filteredFuentes.map((fuente) => (
                <label
                  key={fuente.id}
                  className="flex items-center gap-3 bg-surface-2/60 hover:bg-brand/10 p-3 rounded-lg border border-line/15 hover:border-brand/30 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    className="accent-brand w-4 h-4 cursor-pointer"
                    checked={seleccionadas.includes(fuente.nombre)}
                    onChange={() => handleCheckbox(fuente.nombre)}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-content">{fuente.nombre_pila || fuente.nombre}</span>
                    {fuente.nombre && (
                      <span className="text-xs text-muted">{fuente.nombre}</span>
                    )}
                  </div>
                </label>
              ))
            ) : (
              <p className="text-muted text-center text-sm py-4">
                {fuentes.length === 0
                  ? "No hay fuentes disponibles."
                  : "No hay coincidencias con el filtro."}
              </p>
            )}
          </div>

          {/* Botón consultar */}
          <button
            onClick={handleConsultar}
            disabled={loading || seleccionadas.length === 0}
            className={`w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
              loading || seleccionadas.length === 0
                ? "bg-surface-2/70 text-muted cursor-not-allowed"
                : "bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90 hover:shadow-lg hover:shadow-brand/50 transform hover:scale-105"
            }`}
          >
            {loading ? "Consultando..." : "Consultar Fuentes"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ===============
   Página: Consulta
   =============== */
export default function Consulta() {
  const [puedeUsarMasivas, setPuedeUsarMasivas] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const API = process.env.REACT_APP_API_URL;
    fetch(`${API}/api/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const ids = data.perfil?.planes_masivas_ids || [];
        const planes = data.perfil?.planes || [];
        const planActual = planes.find((p) => p.nombre === "ecorefull");
        setPuedeUsarMasivas(planActual ? ids.includes(planActual.id) : false);
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
  const [alcance, setAlcance] = useState("todas");

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
      tipo_consulta: "ecorefull",
    };

    if (fechaExpedicion) {
      bodyData.fecha_expedicion = fechaExpedicion;
    }
    bodyData.alcance = alcance;

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

      {/* Formulario */}
      <div className="min-h-screen flex items-start justify-center px-4 pt-3 pb-32 md:pb-36 relative overflow-hidden bg-transparent">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-5xl w-full relative z-10">
          {/* Lado izquierdo: Información */}
          <div className="text-center md:text-left space-y-5">
            <div>
              <div className="inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-3 items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                </span>
                <span className="text-brand text-xs font-medium">Consulta Completa</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-content leading-tight tracking-tight">
                Econfia Core Full
              </h1>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              Verifica antecedentes de manera rápida, segura y confiable.
            </p>
            <div className="bg-gradient-to-r from-brand/10 to-brand-2/10 border border-brand/20 rounded-lg p-3 shadow-sm shadow-black/5">
              <p className="text-xs text-content/85 leading-relaxed">
                <span className="text-brand font-semibold">Declaración:</span> Al realizar esta consulta, declara y certifica que cuenta con la autorización válida del titular.
              </p>
            </div>
          </div>

          {/* Lado derecho: Formulario */}
          <div className="relative w-full max-w-sm mx-auto">
            <div className="relative w-full bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-brand/10 p-6 group">
              {/* Glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />

              <div className="relative z-10">
                <FormLogo />
                <div className="mb-4 text-center">
                  <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-2 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                    </span>
                    <span className="text-brand text-xs font-medium">Verificación segura</span>
                  </div>
                  <h2 className="text-xl font-bold text-content">Verificar Ahora</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                  {/* Select Tipo de Documento */}
                  <div>
                    <label className="text-xs font-semibold text-content/80 mb-1 block">Tipo de Documento *</label>
                    <select
                      required
                      value={tipoDoc}
                      onChange={(e) => setTipoDoc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm appearance-none cursor-pointer"
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

                  {/* Input Cédula */}
                  <div>
                    <label className="text-xs font-semibold text-content/80 mb-1 block">Número de Documento *</label>
                    <input
                      required
                      type="text"
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Ej: 1234567890"
                      className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
                    />
                  </div>

                  {/* Input Fecha */}
                  <div>
                    <label className="text-xs font-semibold text-content/80 mb-1 block">Fecha de Expedición (Opcional)</label>
                    <input
                      type="date"
                      value={fechaExpedicion}
                      onChange={(e) => setFechaExpedicion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content text-xs focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
                    />
                  </div>

                  {/* Alcance de búsqueda */}
                  <div>
                    <label className="text-xs font-semibold text-content/80 mb-1 block">Alcance de Búsqueda</label>
                    <div className="flex gap-4">
                      {[
                        { value: "todas", label: "Todas" },
                        { value: "nacional", label: "Nacional" },
                        { value: "internacional", label: "Internacional" },
                      ].map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-1.5 cursor-pointer group">
                          <input
                            type="radio"
                            name="alcance"
                            value={value}
                            checked={alcance === value}
                            onChange={() => setAlcance(value)}
                            className="accent-brand w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-xs text-content/85 group-hover:text-content transition-colors">{label}</span>
                        </label>
                      ))}
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
                        Confirmo tener consentimiento del titular
                      </span>
                    </label>
                  </div>
                  <AvisoTratamientoDatos className="mt-1" />

                  {/* Botón principal */}
                  <button
                    type="submit"
                    disabled={!tipoDoc || !cedula || !acepta || !consentimiento || loading}
                    className={`w-full mt-3 px-6 py-2 rounded-lg font-semibold text-xs transition-all duration-300 ${
                      !tipoDoc || !cedula || !acepta || !consentimiento || loading
                        ? "bg-surface-2/70 text-muted cursor-not-allowed"
                        : "bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90 hover:shadow-lg hover:shadow-brand/50 transform hover:scale-105"
                    }`}
                  >
                    {loading ? "Procesando..." : "Consultar Ahora"}
                  </button>

                  {/* Botón consulta masiva — solo si el admin lo habilitó */}
                  {puedeUsarMasivas && (
                    <button
                      type="button"
                      onClick={() => setShowMasiva(true)}
                      className="w-full mt-1.5 px-6 py-2 rounded-lg font-semibold text-xs border border-brand/40 text-brand hover:bg-brand/15 hover:border-brand/60 transition-all duration-300"
                    >
                      Consulta Masiva (hasta 50 documentos)
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Consulta a la Medida */}
      <ModalConsultaMedida
        isOpen={showConsultaMedida}
        onClose={() => setShowConsultaMedida(false)}
        data={datos}
      />

      {/* Modal: Consulta Masiva */}
      <ConsultaMasivaModal
        isOpen={showMasiva}
        onClose={() => setShowMasiva(false)}
        tipoConsulta="ecorefull"
      />
    </>
  );
}
