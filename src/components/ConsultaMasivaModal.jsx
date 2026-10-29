/**
 * ConsultaMasivaModal — Modal reutilizable para consultas en lote.
 *
 * Props:
 *   isOpen        {boolean}  — muestra/oculta el modal
 *   onClose       {function} — callback al cerrar
 *   tipoConsulta  {string}   — "ecorefull" | "econfiafast" | "essential" | etc.
 *   onSuccess     {function} — callback opcional al terminar con éxito
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Terminos from "./Terminos";
import ModalSeleccionFuentes from "./ModalSeleccionFuentes";

const TIPOS_DOC = ["CC", "TI", "CE", "PPT", "PEP", "NIT"];
const MAX_MANUAL = 5;
const FILA_VACIA = () => ({ tipo_doc: "CC", cedula: "" });

export default function ConsultaMasivaModal({
  isOpen,
  onClose,
  tipoConsulta = "ecorefull",
  onSuccess,
}) {
  const [modo, setModo] = useState("manual"); // "manual" | "archivo"
  const [filas, setFilas] = useState([FILA_VACIA()]);
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [openTerminos, setOpenTerminos] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [showSeleccionFuentes, setShowSeleccionFuentes] = useState(false);
  const [fuentesSeleccionadas, setFuentesSeleccionadas] = useState([]);
  const [pendienteEnviar, setPendienteEnviar] = useState(null); // Guarda datos pendientes de envío
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  // ── Manejo de filas ──────────────────────────────────────────────────────
  const agregarFila = () => {
    if (filas.length < MAX_MANUAL) {
      setFilas([...filas, FILA_VACIA()]);
    }
  };

  const eliminarFila = (idx) => {
    if (filas.length === 1) return;
    setFilas(filas.filter((_, i) => i !== idx));
  };

  const actualizarFila = (idx, campo, valor) => {
    const nuevas = [...filas];
    nuevas[idx] = { ...nuevas[idx], [campo]: valor };
    setFilas(nuevas);
  };

  // ── Descarga de plantilla Excel ────────────────────────────────────────────
  const descargarPlantilla = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/plantilla-masivo/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo descargar la plantilla");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "plantilla_consulta_masiva.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Error al descargar la plantilla: " + e.message);
    }
  };

  // Tipos de consulta que requieren selección de fuentes
  const REQUIERE_FUENTES = ["essencial", "essencial-express", "essencial_express"];

  // ── Envío ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validar que acepte términos y consentimiento
    if (!acepta) {
      setError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }
    if (!consentimiento) {
      setError("Debes confirmar que cuentas con el consentimiento del titular.");
      return;
    }

    // Preparar datos para envío
    let cedulas;
    if (modo === "manual") {
      cedulas = filas.filter((f) => f.cedula.trim() !== "");
      if (cedulas.length === 0) {
        setError("Ingresa al menos una cédula.");
        return;
      }
    } else {
      if (!archivo) {
        setError("Selecciona un archivo Excel (.xlsx) antes de continuar.");
        return;
      }
    }

    const datosPendientes = {
      modo,
      cedulas: modo === "manual" ? cedulas : null,
      archivo: modo === "archivo" ? archivo : null,
    };

    // Solo essencial y essencial-express piden selección de fuentes
    if (REQUIERE_FUENTES.includes(tipoConsulta)) {
      setPendienteEnviar(datosPendientes);
      setShowSeleccionFuentes(true);
    } else {
      // Para ecorefull, econfiafast, basic-elemnt, etc. → enviar directo sin fuentes
      await enviarConsulta(datosPendientes, []);
    }
  };

  // ── Lógica de envío reutilizable ─────────────────────────────────────────
  const enviarConsulta = async (datosPendientes, fuentes) => {
    setError(null);
    setResultado(null);
    setLoading(true);
    setFuentesSeleccionadas(fuentes);

    const token = localStorage.getItem("token");

    try {
      let res;

      if (datosPendientes.modo === "manual") {
        res = await fetch(`${API_URL}/api/consultar-masivo/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            cedulas: datosPendientes.cedulas,
            tipo_consulta: tipoConsulta,
            alcance: "todas",
            lista_nombres: fuentes,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", datosPendientes.archivo);
        formData.append("tipo_consulta", tipoConsulta);
        formData.append("alcance", "todas");
        formData.append("lista_nombres", JSON.stringify(fuentes));
        res = await fetch(`${API_URL}/api/consultar-masivo/`, {
          method: "POST",
          headers: { Authorization: `Token ${token}` },
          body: formData,
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }

      setResultado(data);
      if (onSuccess) onSuccess(data);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setPendienteEnviar(null);
    }
  };

  // ── Callback cuando usuario confirma fuentes (solo essencial) ─────────────
  const handleFuentesSeleccionadas = async (fuentes) => {
    if (!pendienteEnviar) return;
    setShowSeleccionFuentes(false);
    await enviarConsulta(pendienteEnviar, fuentes);
  };

  // ── Reset al cerrar ──────────────────────────────────────────────────────
  const handleClose = () => {
    setFilas([FILA_VACIA()]);
    setArchivo(null);
    setError(null);
    setResultado(null);
    setModo("manual");
    setAcepta(false);
    setConsentimiento(false);
    setFuentesSeleccionadas([]);
    setPendienteEnviar(null);
    onClose();
  };

  const irAlDashboard = () => {
    handleClose();
    navigate("/d3b7f1e9");
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-slate-900/98 to-blue-950/98 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-brand/20 w-full max-w-lg">

        {/* ── Cabecera ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white">Consulta Masiva</h2>
            <p className="text-xs text-white/50 mt-0.5">
              Procesa múltiples documentos de forma simultánea
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/40 hover:text-white text-xl font-bold transition-colors leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex gap-2">
            {[
              { id: "manual", label: `Ingreso Manual (máx. ${MAX_MANUAL})` },
              { id: "archivo", label: "Cargar Archivo Excel" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setModo(id); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  modo === id
                    ? "bg-brand/20 border border-brand/40 text-brand"
                    : "bg-white/5 border border-white/10 text-white/55 hover:text-white/80 hover:bg-white/8"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Modo: Ingreso Manual ──────────────────────────────────────── */}
          {modo === "manual" && (
            <div className="space-y-2">
              {/* Encabezados de columna */}
              <div className="grid grid-cols-[90px_1fr_32px] gap-2 px-0.5">
                <span className="text-xs text-white/40 font-semibold">Tipo Doc</span>
                <span className="text-xs text-white/40 font-semibold">Número de Documento</span>
                <span />
              </div>

              {filas.map((fila, idx) => (
                <div key={idx} className="grid grid-cols-[90px_1fr_32px] gap-2 items-center">
                  {/* Tipo documento */}
                  <select
                    value={fila.tipo_doc}
                    onChange={(e) => actualizarFila(idx, "tipo_doc", e.target.value)}
                    className="w-full px-2 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-brand/50 appearance-none cursor-pointer"
                  >
                    {TIPOS_DOC.map((t) => (
                      <option key={t} value={t} className="bg-slate-900 text-white">
                        {t}
                      </option>
                    ))}
                  </select>

                  {/* Número de documento */}
                  <input
                    type="text"
                    value={fila.cedula}
                    onChange={(e) => actualizarFila(idx, "cedula", e.target.value)}
                    placeholder={`Documento ${idx + 1}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-brand/50 focus:bg-white/8 transition-all"
                  />

                  {/* Botón eliminar fila */}
                  <button
                    onClick={() => eliminarFila(idx)}
                    disabled={filas.length === 1}
                    title="Eliminar fila"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Agregar fila */}
              {filas.length < MAX_MANUAL && (
                <button
                  onClick={agregarFila}
                  className="w-full py-2 rounded-lg border border-dashed border-white/20 text-white/45 hover:text-white/75 hover:border-white/35 text-xs transition-all"
                >
                  + Agregar documento ({filas.length}/{MAX_MANUAL})
                </button>
              )}
            </div>
          )}

          {/* ── Modo: Archivo Excel ─────────────────────────────────────────── */}
          {modo === "archivo" && (
            <div className="space-y-3">
              {/* Paso 1: descargar plantilla */}
              <div className="bg-brand-2/8 border border-brand-2/20 rounded-xl p-3 space-y-2">
                <p className="text-xs text-blue-200 leading-relaxed">
                  <span className="font-semibold">Paso 1:</span> Descarga la plantilla Excel, llena las cédulas y guarda.
                </p>
                <button
                  onClick={descargarPlantilla}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-brand-2 hover:to-brand text-white text-xs font-semibold transition-all"
                >
                  Descargar Plantilla Excel
                </button>
              </div>

              {/* Paso 2: subir archivo */}
              <div>
                <label className="block text-xs text-white/55 mb-1.5 font-semibold">
                  Paso 2: Cargar archivo Excel (.xlsx) completado (máx. 50 cédulas)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setArchivo(e.target.files[0] || null)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white/80 text-xs cursor-pointer
                             file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0
                             file:bg-brand/20 file:text-brand file:text-xs file:cursor-pointer
                             hover:border-white/25 transition-all"
                />
                {archivo && (
                  <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                    <span>✓</span> {archivo.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5 text-red-300 text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* ── Términos y Consentimiento ─────────────────────────────────── */}
          <div className="space-y-2 pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
                className="accent-brand w-4 h-4 cursor-pointer mt-0.5 flex-shrink-0"
              />
              <span className="text-xs text-white/80 group-hover:text-white/100 transition-colors leading-relaxed">
                Acepto los{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenTerminos(true);
                  }}
                  className="text-brand hover:text-brand underline font-medium"
                >
                  términos y condiciones
                </button>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={consentimiento}
                onChange={(e) => setConsentimiento(e.target.checked)}
                className="accent-brand w-4 h-4 cursor-pointer mt-0.5 flex-shrink-0"
              />
              <span className="text-xs text-white/80 group-hover:text-white/100 transition-colors leading-relaxed">
                Declaro bajo mi responsabilidad que cuento con la autorización previa del titular de los datos personales objeto de consulta o con un fundamento legal válido que me habilita para realizarla, y que utilizaré la información exclusivamente para finalidades legítimas y autorizadas
              </span>
            </label>

            <Terminos isOpen={openTerminos} onClose={() => setOpenTerminos(false)} />
          </div>

          {/* ── Resultado exitoso ─────────────────────────────────────────── */}
          {resultado && (
            <div className="bg-green-500/10 border border-green-500/25 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-green-300 text-sm font-semibold">
                {resultado.procesadas} consulta{resultado.procesadas !== 1 ? "s" : ""} enviada{resultado.procesadas !== 1 ? "s" : ""} a procesamiento
              </p>
              {resultado.errores > 0 && (
                <p className="text-yellow-300 text-xs">
                  {resultado.errores} cédula{resultado.errores !== 1 ? "s" : ""} con error
                  {resultado.detalle_errores?.length > 0 && (
                    <span className="ml-1 opacity-75">
                      ({resultado.detalle_errores.map((e) => e.cedula).join(", ")})
                    </span>
                  )}
                </p>
              )}
              <p className="text-white/45 text-xs">
                Puedes seguir el progreso de cada consulta en el Dashboard.
              </p>
            </div>
          )}

          {/* ── Botones de acción ─────────────────────────────────────────── */}
          {!resultado ? (
            <button
              onClick={handleSubmit}
              disabled={loading || !acepta || !consentimiento}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                loading || !acepta || !consentimiento
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-gradient-to-r from-brand to-brand-2 text-white hover:from-brand hover:to-brand-2 hover:shadow-lg hover:shadow-brand/40 transform hover:scale-[1.01]"
              }`}
            >
              {loading ? "Procesando consultas..." : "Iniciar Consultas"}
            </button>
          ) : (
            <button
              onClick={irAlDashboard}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 transition-all hover:shadow-lg hover:shadow-green-500/30"
            >
              Ver resultados en Dashboard
            </button>
          )}

        </div>
      </div>

      {/* ── Modal: Selección de Fuentes ───────────────────────────────── */}
      <ModalSeleccionFuentes
        isOpen={showSeleccionFuentes}
        onClose={() => setShowSeleccionFuentes(false)}
        onConfirm={handleFuentesSeleccionadas}
        title="Selecciona las fuentes a consultar"
        loading={loading}
      />
    </div>,
    document.body
  );
}
