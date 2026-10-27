// src/components/CookieBanner.jsx
// Banner de consentimiento de cookies (Ley 1581/2012 + buenas prácticas).
// - Aparece una sola vez (guarda la elección en localStorage).
// - Por defecto respeta la opción MÁS PRIVADA: hasta que el usuario elija, no se
//   activan cookies no esenciales. "Rechazar" deja solo las esenciales.
// - Enlace a la Política de Cookies.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "econfia_cookie_consent";

export function getCookieConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY); // "all" | "essential" | null
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar solo si el usuario todavía no eligió.
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const guardar = (valor) => {
    try {
      localStorage.setItem(STORAGE_KEY, valor);
      localStorage.setItem(STORAGE_KEY + "_fecha", new Date().toISOString());
    } catch {
      /* navegación privada / storage bloqueado: igual ocultamos el banner */
    }
    // Avisar al resto de la app por si quiere reaccionar (cargar analytics, etc.)
    try {
      window.dispatchEvent(new CustomEvent("econfia-cookie-consent", { detail: valor }));
    } catch { /* noop */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-3 sm:px-4 sm:pb-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,15,30,0.98))] p-4 shadow-[0_20px_60px_rgba(2,12,27,0.6)] backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-slate-200">
            Usamos <strong className="text-white">cookies esenciales</strong> para que la
            plataforma funcione y, con tu permiso, cookies de análisis para mejorar el
            servicio. Puedes aceptarlas todas o seguir solo con las esenciales. Conoce más
            en nuestra{" "}
            <Link
              to="/politica-cookies"
              className="font-semibold text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
            >
              Política de Cookies
            </Link>
            .
          </p>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => guardar("essential")}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
            >
              Solo esenciales
            </button>
            <button
              type="button"
              onClick={() => guardar("all")}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:opacity-90"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
