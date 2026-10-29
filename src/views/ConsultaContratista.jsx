import LogoOrganizacion from "../components/LogoOrganizacion";
import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import CardDni from "../components/CardDni";
import Terminos from "../components/Terminos";
import AvisoTratamientoDatos from "../components/AvisoTratamientoDatos";
import ConsultaMasivaModal from "../components/ConsultaMasivaModal";


// Lista de profesiones alineada con backend (PROFESION_BOT_MAP)
const PROFESIONES = [
  "Ingeniero/a",
  "Profesional afin a la ingeniería",
  "Tecnólogo/a en áreas de ingeniería",
  "Técnico profesional en áreas de ingeniería",
  "Abogado/a",
  "Médico/a",
  "Enfermero/a",
  "Odontólogo/a",
  "Psicólogo/a",
  "Bacteriólogo/a",
  "Fisioterapeuta",
  "Terapeuta ocupacional",
  "Instrumentador/a quirúrgico/a",
  "Nutricionista dietista",
  "Fonoaudiólogo/a",
  "Químico/a farmacéutico/a",
  "Optómetra",
  "Terapeuta respiratorio/a",
  "Regente de farmacia",
  "Auxiliar en salud",
  "Arquitecto/a",
  "Profesional auxiliar de arquitectura",
  "Tecnólogo/a en arquitectura",
  "Técnico profesional delineante de arquitectura",
  "Técnico profesional en diseño arquitectónico",
  "Técnico profesional en decoración de interiores",
  "Técnico profesional en dibujo arquitectónico",
  "Contador/a público/a",
  "Administrador/a ambiental",
  "Administrador/a del medio ambiente",
  "Administrador/a ambiental y de los recursos naturales",
  "Administrador/a de empresas",
  "Administrador/a",
  "Administración de empresas",
  "Químico/a",
  "Biólogo/a",
  "Economista",
];

const isValidEmail = (s) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

export default function ConsultaContratista() {
  const [puedeUsarMasivas, setPuedeUsarMasivas] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const API = process.env.REACT_APP_API_URL;
    fetch(`${API}/api/profile/`, { headers: { Authorization: `Token ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const ids = data.perfil?.planes_masivas_ids || [];
        const planes = data.perfil?.planes || [];
        const planActual = planes.find((p) => p.nombre === "contratista");
        setPuedeUsarMasivas(planActual ? ids.includes(planActual.id) : false);
      })
      .catch(() => {});
  }, []);
  const [tipoDoc, setTipoDoc] = useState("");
  const [cedula, setCedula] = useState("");
  const [fechaExpedicion, setFechaExpedicion] = useState("");
  const [profesion, setProfesion] = useState("");
  const [profesionSeleccionada, setProfesionSeleccionada] = useState(null); // { nombre, entidad_reguladora }
  const [profesionesSeleccionadas, setProfesionesSeleccionadas] = useState([]); // array de { nombre, entidad_reguladora, bot_names }
  const [profesionFocus, setProfesionFocus] = useState(false);
  const [profesionInput, setProfesionInput] = useState("");
  const profesionRef = useRef(null);
    // Filtrar profesiones según lo que escribe el usuario
    const profesionesFiltradas = useMemo(() => {
      if (!profesionInput) return PROFESIONES;
      return PROFESIONES.filter((p) =>
        p.toLowerCase().includes(profesionInput.toLowerCase())
      );
    }, [profesionInput]);
  const [fondoPension, setFondoPension] = useState("");
  const [email, setEmail] = useState("");
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [nitEmpresa, setNitEmpresa] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  // Estado para el modal de Términos
  const [profesionSugerencias, setProfesionSugerencias] = useState([]);
  const profesionSugerenciasOrdenadas = useMemo(() => {
    const q = String(profesion || "").trim().toLowerCase();
    const list = Array.isArray(profesionSugerencias) ? [...profesionSugerencias] : [];
    if (!q) return list;
    const score = (item) => {
      const name = String(item?.nombre || "").toLowerCase();
      if (!name) return 999;
      if (name.startsWith(q)) return 0;
      if (name.includes(q)) return 1;
      return 2;
    };
    return list.sort((a, b) => score(a) - score(b));
  }, [profesion, profesionSugerencias]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [profesionLoading, setProfesionLoading] = useState(false);
  const [profesionBotPreview, setProfesionBotPreview] = useState([]);

  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState(null);
  const [toast, setToast] = useState(null);
  const [showResultados, setShowResultados] = useState(false);
  const [showHorarioAviso, setShowHorarioAviso] = useState(false);
  const [showMasiva, setShowMasiva] = useState(false);

  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 11 && hour < 22) {
      setShowHorarioAviso(true);
      const timeout = setTimeout(() => setShowHorarioAviso(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, []);

  // ✅ Habilita botón solo si TODO está correcto
    // Autocompletado de profesión
    useEffect(() => {
      if (!profesion || profesion.length < 2) {
        setProfesionSugerencias([]);
        setShowSugerencias(false);
        return;
      }
      setProfesionLoading(true);
      fetch(`${API_URL}/api/autocomplete_profesiones/?q=${encodeURIComponent(profesion)}`)
        .then((res) => res.json())
        .then((data) => {
          setProfesionSugerencias(data.profesiones || []);
          setShowSugerencias((data.profesiones || []).length > 0);
        })
        .catch(() => setProfesionSugerencias([]))
        .finally(() => setProfesionLoading(false));
    }, [profesion, API_URL]);
  const canSubmit = useMemo(() => {
    return (
      tipoDoc &&
      String(cedula || "").trim().length > 0 &&
      (profesionesSeleccionadas.length > 0 || profesion) &&
      isValidEmail(email) &&
      acepta &&
      consentimiento
    );
  }, [tipoDoc, cedula, profesion, profesionesSeleccionadas.length, email, acepta, consentimiento]);

  const handleConsultarContratista = async (e) => {
    e.preventDefault();

    // Validaciones de seguridad (además del disabled)
    if (!tipoDoc) {
      setToast({ type: "error", message: "Selecciona el tipo de documento." });
      return;
    }
    if (!String(cedula || "").trim()) {
      setToast({ type: "error", message: "Ingresa el número de documento." });
      return;
    }
    if (profesionesSeleccionadas.length === 0 && !profesion) {
      setToast({ type: "error", message: "Selecciona al menos una profesión." });
      return;
    }
    if (!isValidEmail(email)) {
      setToast({ type: "error", message: "Ingresa un correo válido." });
      return;
    }
    if (!acepta) {
      setToast({
        type: "error",
        message: "Debes aceptar los términos y condiciones.",
      });
      return;
    }
    if (!consentimiento) {
      setToast({
        type: "error",
        message: "Debes confirmar el consentimiento del titular.",
      });
      return;
    }

    setLoading(true);
    setDatos(null);
    setShowResultados(false);

    // Normaliza la profesión para que coincida con el backend
    function normalizarProfesion(prof) {
       if (!prof) return "";
       let p = prof.toLowerCase();
       // Elimina tildes
       p = p.replace(/[áàäâ]/g, "a")
         .replace(/[éèëê]/g, "e")
         .replace(/[íìïî]/g, "i")
         .replace(/[óòöô]/g, "o")
         .replace(/[úùüû]/g, "u");
       // Normaliza todos los casos de /a, /o, /a/o, /o/a al masculino
       // Ejemplo: "enfermero/a" -> "enfermero", "ingeniero/a" -> "ingeniero"
       p = p.replace(/([a-z]+)\/(a|o)(?:\/o|\/a)?\b/g, "$1o");
       // Para casos compuestos: químico/a farmacéutico/a -> quimico farmacéutico
       // Reemplaza todos los "palabra/a" o "palabra/o" por "palabrao" y luego corrige duplicados
       p = p.replace(/([a-z]+)\/a/g, "$1o");
       p = p.replace(/([a-z]+)\/o/g, "$1o");
       // Corrige duplicados tipo "enfermeroo" -> "enfermero"
       p = p.replace(/([a-z]+)oo\b/g, "$1o");
       // Corrige casos como "quimico farmacéutico" (ya normalizado)
       // Elimina conectores ' y ' y dobles espacios
       p = p.replace(/\s+y\s+/g, " ");
       // Elimina caracteres especiales y dobles espacios
       p = p.replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
       // Log para depuración
       console.log("[NORMALIZAR] Profesión original:", prof, "| Normalizada:", p);
       return p;
    }

    const profesionNormalizada = normalizarProfesion(profesion);
    // Log antes de enviar la consulta
    console.log("[ENVIAR] Profesión normalizada enviada:", profesionNormalizada);
    const selectedProfLabel = (profesionSeleccionada?.nombre || profesionSeleccionada?.label || profesion || "").trim();
    const selectedList = profesionesSeleccionadas.length
      ? profesionesSeleccionadas.map((p) => p?.nombre).filter(Boolean)
      : (selectedProfLabel ? [selectedProfLabel] : []);
    const bodyData = {
      tipo_doc: tipoDoc,
      cedula: String(cedula).trim(),
      fecha_expedicion: fechaExpedicion || undefined,
      // Migrado al estilo de Titulos: enviar la profesión elegida como catálogo.
      // Mantiene compatibilidad con backend: `profesiones` + fallback `profesion`.
      profesiones: selectedList.length ? selectedList : undefined,
      profesion: selectedList[0] || (selectedProfLabel ? selectedProfLabel : profesionNormalizada),
      // Ejecutar SIEMPRE los bots predeterminados además de los de cada
      // profesión, incluso cuando el contratista tiene varias profesiones.
      solo_profesion: false,
      fondo_pension: fondoPension || undefined,
      email: String(email).trim().toLowerCase(),
      empresa: nombreEmpresa.trim(),
      nit: (() => { const n = nitEmpresa.trim(); return n && !n.includes("-") ? `${n}-0` : n; })(),
      tipo_consulta: "contratista",
    };

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
      {/* Loader claro tipo frosted-glass */}
      {loading &&
        createPortal(
          <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-md">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center w-full max-w-sm">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-brand-2 mx-auto mb-4" />
              <p className="text-slate-700 font-medium">
                Procesando tu consulta…
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Esto tomará solo unos segundos
              </p>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de resultados claro */}
      {!loading &&
        showResultados &&
        datos &&
        createPortal(
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Consulta enviada
              </h2>
              <p className="text-white/60 mb-6">
                Estamos preparando tus resultados. Te redirigiremos
                automáticamente.
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

      {/* Home - Tema oscuro con hero + formulario elegante */}
      <section className="relative min-h-screen flex items-start justify-center pt-3 pb-32 md:pb-36 overflow-hidden bg-transparent">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="max-w-5xl mx-auto px-4 w-full relative z-10">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Hero copy (izquierda) */}
            <div className="text-center md:text-left space-y-5">
              <div>
                <div className="inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-3 items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                  </span>
                  <span className="text-brand text-xs font-medium">
                    Consulta Contratista
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-content leading-tight tracking-tight">
                  Econfia Contratista
                </h1>
              </div>

              <p className="text-sm text-muted leading-relaxed">
                Verifica experiencia profesional y antecedentes de forma segura y
                veloz. Una experiencia clara, minimalista y centrada en la
                confiabilidad.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand flex-shrink-0" />
                  <span className="text-xs text-content/85">
                    Interfaz moderna y accesible, optimizada para velocidad.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-2 flex-shrink-0" />
                  <span className="text-xs text-content/85">
                    Resultados consistentes con tu flujo actual.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <span className="text-xs text-content/85">
                    Privacidad respetada en cada paso.
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta del formulario (derecha) */}
            <div className="relative w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto">
              <div className="relative w-full bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-brand/10 p-5 md:p-6 group">
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <LogoOrganizacion className="h-16 w-16 object-contain" />
                  </div>

                  {/* Formulario */}
                  <form
                    onSubmit={handleConsultarContratista}
                    className="space-y-2"
                  >
                    {/* Fila 1: Tipo doc + Número doc */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-content/80">Tipo doc *</label>
                        <select
                          required
                          value={tipoDoc}
                          onChange={(e) => setTipoDoc(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-surface-2/70 border border-line/15 text-content text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm appearance-none cursor-pointer"
                        >
                          <option className="bg-surface text-content" value="">Seleccione</option>
                          <option className="bg-surface text-content" value="CC">CC</option>
                          <option className="bg-surface text-content" value="TI">TI</option>
                          <option className="bg-surface text-content" value="CE">CE</option>
                          <option className="bg-surface text-content" value="PPT">PPT</option>
                          <option className="bg-surface text-content" value="PEP">PEP</option>
                          <option className="bg-surface text-content" value="NIT">NIT</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-content/80">N° documento *</label>
                        <input
                          required
                          type="text"
                          value={cedula}
                          onChange={(e) => setCedula(e.target.value)}
                          placeholder="Número de documento"
                          className="w-full px-2 py-1.5 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm"
                        />
                      </div>
                    </div>

                    {/* Fila 2: Fecha expedición + Fondo de pensión */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-content/80">Fecha expedición</label>
                        <input
                          type="date"
                          value={fechaExpedicion}
                          onChange={(e) => setFechaExpedicion(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-surface-2/70 border border-line/15 text-content text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-content/80">Fondo de pensión</label>
                        <select
                          value={fondoPension}
                          onChange={(e) => setFondoPension(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-surface-2/70 border border-line/15 text-content text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm appearance-none cursor-pointer"
                        >
                          <option className="bg-surface text-content" value="">Todos los fondos</option>
                          <option className="bg-surface text-content" value="porvenir">Porvenir</option>
                          <option className="bg-surface text-content" value="colpensiones">Colpensiones</option>
                          <option className="bg-surface text-content" value="proteccion">Protección</option>
                          <option className="bg-surface text-content" value="colfondos">Colfondos</option>
                          <option className="bg-surface text-content" value="skandia">Skandia</option>
                        </select>
                      </div>
                    </div>

                    {/* Profesión — ancho completo por el autocomplete */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-content/80">
                        Profesión * <span className="font-normal text-muted">(si tiene más de una, agréguela)</span>
                      </label>

                      {profesionesSeleccionadas.length > 0 && (
                        <div className="mb-1 flex flex-wrap gap-1.5">
                          {profesionesSeleccionadas.map((p) => (
                            <span
                              key={p.nombre}
                              className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-2 py-1 text-[11px] text-brand"
                              title={p.entidad_reguladora || p.nombre}
                            >
                              <span className="max-w-[200px] truncate">{p.nombre}</span>
                              <button
                                type="button"
                                className="rounded-full border border-line/15 bg-surface-2/70 px-2 py-0.5 text-[10px] text-muted hover:bg-danger/10 hover:text-danger"
                                onClick={() => setProfesionesSeleccionadas((prev) => prev.filter((x) => x.nombre !== p.nombre))}
                              >
                                Quitar
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <input
                        required={profesionesSeleccionadas.length === 0}
                        type="text"
                        value={profesion}
                        onChange={(e) => { setProfesion(e.target.value); setProfesionSeleccionada(null); setShowSugerencias(true); }}
                        placeholder="Escribe tu profesión"
                        autoComplete="off"
                        className="w-full px-3 py-1.5 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
                        onFocus={() => setShowSugerencias(profesionSugerencias.length > 0)}
                        onBlur={() => setTimeout(() => setShowSugerencias(false), 150)}
                      />
                      {showSugerencias && (
                        <div style={{ position: "relative" }}>
                          <ul
                            style={{ position: "absolute", top: "100%", left: 0, width: "100%", marginTop: "4px", zIndex: 30 }}
                            className="bg-surface border border-brand/20 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                          >
                            {profesionLoading && <li className="px-3 py-2 text-xs text-muted">Cargando...</li>}
                            {!profesionLoading && profesionSugerenciasOrdenadas.length === 0 && (
                              <li className="px-3 py-2 text-xs text-muted">Sin coincidencias. Escribe la profesión completa.</li>
                            )}
                            {profesionSugerenciasOrdenadas.map((sug) => (
                              <li
                                key={sug.nombre}
                                className="px-3 py-2 text-xs text-content hover:bg-brand/10 cursor-pointer"
                                onMouseDown={() => {
                                  setProfesion("");
                                  setProfesionSeleccionada(sug);
                                  setProfesionBotPreview(Array.isArray(sug.bot_names) ? sug.bot_names : []);
                                  setProfesionesSeleccionadas((prev) => {
                                    const exists = prev.some((p) => p.nombre === sug.nombre);
                                    return exists ? prev : [...prev, sug];
                                  });
                                  setShowSugerencias(false);
                                }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-content">{sug.nombre}</div>
                                    {sug.entidad_reguladora && <div className="truncate text-[11px] text-muted">{sug.entidad_reguladora}</div>}
                                  </div>
                                  <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] text-brand">Seleccionar</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Correo — ancho completo */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-content/80">Correo electrónico *</label>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                        className={`w-full px-3 py-1.5 rounded-lg bg-surface-2/70 text-content text-xs placeholder:text-muted/70 border transition-all backdrop-blur-sm focus:outline-none focus:shadow-lg focus:shadow-brand/10 ${email && !isValidEmail(email) ? "border-red-400/50 focus:border-red-400 focus:ring-1 focus:ring-red-400/30" : "border-line/15 focus:border-brand/50 focus:bg-surface"}`}
                      />
                      {email && !isValidEmail(email) && <span className="text-xs text-red-400">Formato de correo no válido</span>}
                    </div>

                    {/* Fila 3: Nombre empresa + NIT */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-content/80">Nombre Entidad *</label>
                        <input
                          required
                          type="text"
                          value={nombreEmpresa}
                          onChange={(e) => setNombreEmpresa(e.target.value)}
                          placeholder="Razón social"
                          className="w-full px-2 py-1.5 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-content/80">NIT Entidad *</label>
                        <input
                          required
                          type="text"
                          value={nitEmpresa}
                          onChange={(e) => setNitEmpresa(e.target.value)}
                          placeholder="830512262-1"
                          className="w-full px-2 py-1.5 rounded-lg bg-surface-2/70 border border-line/15 text-content placeholder:text-muted/70 text-xs focus:outline-none focus:border-brand/50 focus:bg-surface transition-all backdrop-blur-sm"
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
                          Declaro bajo mi responsabilidad que cuento con la autorización previa del titular de los datos personales objeto de consulta o con un fundamento legal válido que me habilita para realizarla, y que utilizaré la información exclusivamente para finalidades legítimas y autorizadas
                        </span>
                      </label>
                    </div>
                <AvisoTratamientoDatos className="mt-1" />

                    {/* Botón */}
                    <button
                      type="submit"
                      disabled={!canSubmit || loading}
                      className={`w-full mt-3 px-6 py-2 rounded-lg font-semibold text-xs transition-all duration-300
                          ${
                            !canSubmit || loading
                              ? "bg-surface-2/70 text-muted cursor-not-allowed"
                              : "bg-gradient-to-r from-brand to-brand-2 text-white hover:from-brand hover:to-brand-2 hover:shadow-lg hover:shadow-brand/50 transform hover:scale-105"
                          }
                        `}
                    >
                      {loading ? "Procesando..." : "Consultar Contratista"}
                    </button>

                    {/* Botón consulta masiva — solo si el admin lo habilitó */}
                    {puedeUsarMasivas && (
                      <button
                        type="button"
                        onClick={() => setShowMasiva(true)}
                        className="mt-1.5 w-full px-6 py-2 rounded-lg font-semibold text-xs border border-brand/40 text-brand hover:bg-brand/15 hover:border-brand/60 transition-all duration-300"
                      >
                        Consulta Masiva (hasta 50 documentos)
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Nota de privacidad pequeña */}
              <p className="text-[10px] text-muted text-center mt-2">
                Al continuar, certificas contar con autorización válida y cumplir la
                normatividad vigente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Consulta Masiva */}
      <ConsultaMasivaModal
        isOpen={showMasiva}
        onClose={() => setShowMasiva(false)}
        tipoConsulta="ecorefull"
      />
    </>
  );
}
