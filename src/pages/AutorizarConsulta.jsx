// src/pages/AutorizarConsulta.jsx
// Página PÚBLICA donde el titular de un documento acepta o rechaza que se
// consulte su información. Le llega el enlace por SMS y correo cuando alguien
// pide una consulta desde la app móvil; la consulta solo se ejecuta si acepta
// (Ley 1581 de 2012 · directriz 5.1.1 de Apple). El token del enlace es el acceso.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL;

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
};

function Fila({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <span className="break-words text-sm font-semibold text-slate-100 sm:text-right">{value || "—"}</span>
    </div>
  );
}

const ESTADOS = {
  aprobada: { icono: CheckCircle2, color: "text-emerald-300", texto: "Autorizaste esta consulta." },
  rechazada: { icono: XCircle, color: "text-rose-300", texto: "Rechazaste esta consulta. No se realizará." },
  vencida: { icono: Clock, color: "text-amber-300", texto: "Esta solicitud venció sin respuesta. No se realizó ninguna consulta." },
  error: { icono: ShieldAlert, color: "text-amber-300", texto: "Autorizaste la consulta, pero no se pudo ejecutar. El solicitante puede pedirla de nuevo." },
};

export default function AutorizarConsulta() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState("");
  const [leido, setLeido] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/autorizaciones-titular/publica/${encodeURIComponent(token)}/`);
        const json = await res.json();
        if (!vivo) return;
        if (!res.ok) setError(json.error || "La solicitud no existe.");
        else setData(json);
      } catch {
        if (vivo) setError("No se pudo cargar la solicitud. Intenta más tarde.");
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, [token]);

  const responder = async (decision) => {
    setEnviando(decision);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/autorizaciones-titular/publica/${encodeURIComponent(token)}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const json = await res.json();
      if (json.estado) setData(json);
      if (!res.ok) setError(json.error || "No se pudo registrar tu respuesta.");
    } catch {
      setError("No se pudo registrar tu respuesta. Intenta de nuevo.");
    } finally {
      setEnviando("");
    }
  };

  const final = data && ESTADOS[data.estado];
  const Icono = final?.icono;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_32%),linear-gradient(180deg,#0b1220,#070d1a)] px-4 py-10 text-slate-200">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="text-cyan-300" size={26} />
          <div>
            <h1 className="text-xl font-black text-white">Autorización de consulta</h1>
            <p className="text-sm text-slate-400">Tú decides si se puede verificar tu documento.</p>
          </div>
        </div>

        {cargando && <p className="text-sm text-slate-400">Cargando la solicitud…</p>}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
            <ShieldAlert size={18} /> {error}
          </div>
        )}

        {data && (
          <div className="overflow-hidden rounded-[22px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,15,30,0.96))] shadow-[0_24px_60px_rgba(2,12,27,0.5)]">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-base leading-relaxed text-slate-100">
                <b className="text-white">{data.solicitante}</b> solicita tu autorización para verificar tu
                documento mediante el servicio <b className="text-white">{data.producto}</b> de Econfia.
              </p>
            </div>
            <div className="px-6 py-2">
              <Fila label="Quién solicita" value={data.solicitante} />
              <Fila label="Servicio" value={data.producto} />
              <Fila label="Documento" value={`${data.tipo_doc || ""} ${data.documento}`.trim()} />
              <Fila label="Fecha de la solicitud" value={fmt(data.creada)} />
              <Fila label="Vence" value={fmt(data.expira)} />
            </div>

            {data.estado === "pendiente" ? (
              <div className="border-t border-white/10 px-6 py-5">
                <p className="mb-3 text-sm text-slate-300">
                  Si aceptas, Econfia consultará fuentes públicas y de acceso autorizado (antecedentes,
                  listas restrictivas y registros) asociadas a tu documento, y entregará el resultado
                  a quien lo solicitó. Si rechazas, no se realizará ninguna consulta.
                </p>
                <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={leido}
                    onChange={(e) => setLeido(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-cyan-400"
                  />
                  <span>
                    Leí la{" "}
                    <a href="/politica-privacidad" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">
                      política de tratamiento de datos
                    </a>{" "}
                    y entiendo para qué se usará mi información (Ley 1581 de 2012).
                  </span>
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={!leido || !!enviando}
                    onClick={() => responder("aceptar")}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                  >
                    {enviando === "aceptar" ? "Registrando…" : "Autorizo la consulta"}
                  </button>
                  <button
                    type="button"
                    disabled={!!enviando}
                    onClick={() => responder("rechazar")}
                    className="flex-1 rounded-xl border border-rose-400/40 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    {enviando === "rechazar" ? "Registrando…" : "No autorizo"}
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-slate-500">
                  Si no reconoces esta solicitud, recházala. Tu respuesta queda registrada con fecha y hora.
                </p>
              </div>
            ) : final ? (
              <div className={`flex items-center gap-2 border-t border-white/10 px-6 py-5 font-bold ${final.color}`}>
                <Icono size={20} /> {final.texto}
                {data.respondida ? <span className="ml-auto text-xs font-normal text-slate-400">{fmt(data.respondida)}</span> : null}
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">← Ir a Econfia</Link>
        </div>
      </div>
    </div>
  );
}
