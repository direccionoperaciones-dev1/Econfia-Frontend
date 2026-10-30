import { useMemo, useState } from "react";
import LogoOrganizacion from "../components/LogoOrganizacion";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import Terminos from "../components/Terminos";
import AvisoTratamientoDatos from "../components/AvisoTratamientoDatos";
import Toast from "../components/Toast";
import {
  EXPERIAN_DOCUMENT_OPTIONS,
  getExperianSubjectField,
} from "../utils/experian";
import TextoAutorizacion from "../components/TextoAutorizacion";

function buildAuthorizedName() {
  try {
    const raw = JSON.parse(localStorage.getItem("user") || "{}");
    const fromNames = [raw.first_name, raw.last_name].filter(Boolean).join(" ").trim();
    const fromPerfil = [raw?.perfil?.nombre, raw?.perfil?.apellido].filter(Boolean).join(" ").trim();
    return fromNames || fromPerfil || raw.username || "Usuario Econfia";
  } catch (_error) {
    return "Usuario Econfia";
  }
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ConsultaExperian() {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL;

  const [tipoIdentificacion, setTipoIdentificacion] = useState("");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("");
  const [apellidoRazonSocial, setApellidoRazonSocial] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [resultado, setResultado] = useState(null);

  const fieldConfig = useMemo(
    () => getExperianSubjectField(tipoIdentificacion),
    [tipoIdentificacion]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!tipoIdentificacion) {
      setToast({ type: "error", message: "Selecciona el tipo de documento." });
      return;
    }
    if (!numeroIdentificacion.trim()) {
      setToast({ type: "error", message: "Ingresa el número de documento." });
      return;
    }
    if (!apellidoRazonSocial.trim()) {
      setToast({ type: "error", message: `Ingresa ${fieldConfig.label.toLowerCase()}.` });
      return;
    }
    if (!acepta) {
      setToast({ type: "error", message: "Debes aceptar los términos y condiciones." });
      return;
    }
    if (!consentimiento) {
      setToast({ type: "error", message: "Debes confirmar el consentimiento del titular." });
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        tipoIdentificacion,
        numeroIdentificacion: numeroIdentificacion.trim(),
        apellidoRazonSocial: apellidoRazonSocial.trim(),
        forzarConsulta: false,
        autorizacion: {
          nombre_autorizado: buildAuthorizedName(),
          tipo_identificacion: tipoIdentificacion,
          numero_identificacion: numeroIdentificacion.trim(),
          fecha_autorizacion: todayIsoDate(),
          autorizado: true,
        },
      };

      const response = await fetch(`${API_URL}/api/experian/consultar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setToast({
          type: "error",
          message: data.error || `Error HTTP: ${response.status}`,
        });
        return;
      }

      setResultado(data.consulta || data);
      setTimeout(() => navigate("/d3b7f1e9"), 1200);
    } catch (_error) {
      setToast({ type: "error", message: "Ocurrió un error al consultar Econfia Adjudicator." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="relative w-full max-w-md rounded-2xl border border-brand/20 bg-slate-950/85 p-10 text-center shadow-2xl shadow-brand/20 backdrop-blur-md">
              <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-t-4 border-brand" />
              <p className="animate-pulse text-lg font-semibold text-white">
                Consultando Econfia Adjudicator...
              </p>
            </div>
          </div>,
          document.body
        )}

      {!loading &&
        resultado &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-xl rounded-3xl border border-brand/20 bg-slate-950/88 p-8 text-center shadow-[0_20px_80px_rgba(8,145,178,0.22)] backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-content">
                Consulta Econfia Adjudicator completada
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                El resultado ya quedó almacenado y te enviaremos al panel de resultados para revisar el detalle.
              </p>
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

      <section className="relative min-h-screen overflow-hidden bg-transparent pb-32 pt-3">
        <div className="absolute right-20 top-20 h-72 w-72 animate-pulse rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-20 left-20 h-96 w-96 animate-pulse rounded-full bg-brand-2/10 blur-3xl" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 items-center gap-6 px-4 md:grid-cols-2">
          <div className="space-y-5 text-center md:text-left">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-gradient-to-r from-brand/20 to-brand-2/20 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                <span className="text-xs font-medium text-brand">Econfia Adjudicator</span>
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-content md:text-4xl">
                Econfia Adjudicator
              </h1>
            </div>

            <p className="text-sm leading-relaxed text-muted">
              Consulta perfil crediticio y validación en una sola operación. Si seleccionas NIT, el sistema lo tratará como persona jurídica; los demás documentos se procesan como persona natural.
            </p>

            <ul className="space-y-2 text-xs text-content/80">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Score, viabilidad y alertas relevantes</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Detección automática de PN o PJ según el documento</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" />Detalle completo disponible luego en el panel de resultados</li>
            </ul>

            <p className="pt-4 text-xs leading-6 text-red-300/85">
              Al realizar esta consulta, declara y certifica que cuenta con la autorización válida y expresa del titular del documento o de la empresa consultada.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="group relative w-full rounded-[20px] border border-line/15 bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 p-6 shadow-2xl shadow-brand/10 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-center">
                  <LogoOrganizacion className="h-16 w-16 object-contain" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-content/80">Tipo de documento *</label>
                    <select
                      required
                      value={tipoIdentificacion}
                      onChange={(event) => setTipoIdentificacion(event.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-lg border border-line/15 bg-surface-2/70 px-3 py-2 text-xs text-content backdrop-blur-sm transition-all focus:border-brand/50 focus:bg-surface focus:outline-none"
                    >
                      <option className="bg-surface text-content" value="">Seleccione tipo de documento</option>
                      {EXPERIAN_DOCUMENT_OPTIONS.map((option) => (
                        <option key={option.value} className="bg-surface text-content" value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-content/80">Número de documento *</label>
                    <input
                      required
                      type="text"
                      value={numeroIdentificacion}
                      onChange={(event) => setNumeroIdentificacion(event.target.value)}
                      placeholder="Ingrese número de documento"
                      className="w-full rounded-lg border border-line/15 bg-surface-2/70 px-3 py-2 text-xs text-content placeholder:text-muted/70 backdrop-blur-sm transition-all focus:border-brand/50 focus:bg-surface focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-content/80">{fieldConfig.label} *</label>
                    <input
                      required
                      type="text"
                      value={apellidoRazonSocial}
                      onChange={(event) => setApellidoRazonSocial(event.target.value)}
                      placeholder={fieldConfig.placeholder}
                      className="w-full rounded-lg border border-line/15 bg-surface-2/70 px-3 py-2 text-xs text-content placeholder:text-muted/70 backdrop-blur-sm transition-all focus:border-brand/50 focus:bg-surface focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="group flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={acepta}
                        onChange={(event) => setAcepta(event.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-brand"
                      />
                      <span className="text-xs text-content/85 transition-colors group-hover:text-content">
                        Acepto los{" "}
                        <Terminos
                          inline
                          triggerClassName="font-medium text-brand underline underline-offset-4 transition-colors hover:text-brand"
                        />
                      </span>
                    </label>
                    <label className="group flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={consentimiento}
                        onChange={(event) => setConsentimiento(event.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-brand"
                      />
                      <span className="text-xs text-content/85 transition-colors group-hover:text-content">
                        <TextoAutorizacion />
                      </span>
                    </label>
                  </div>
                <AvisoTratamientoDatos className="mt-1" />

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !tipoIdentificacion ||
                      !numeroIdentificacion.trim() ||
                      !apellidoRazonSocial.trim() ||
                      !acepta ||
                      !consentimiento
                    }
                    className={`mt-2 w-full rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                      loading ||
                      !tipoIdentificacion ||
                      !numeroIdentificacion.trim() ||
                      !apellidoRazonSocial.trim() ||
                      !acepta ||
                      !consentimiento
                        ? "cursor-not-allowed bg-surface-2/70 text-muted"
                        : "transform bg-gradient-to-r from-brand to-brand-2 text-white hover:scale-105 hover:opacity-90 hover:shadow-lg hover:shadow-brand/50"
                    }`}
                  >
                    Consultar Econfia Adjudicator
                  </button>
                </form>

                <p className="mt-6 text-center text-[11px] leading-5 text-muted">
                  Cumplimiento normativo y uso responsable de la información.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
