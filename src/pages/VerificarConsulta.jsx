// src/pages/VerificarConsulta.jsx
// Verificación PÚBLICA de una consulta por su código de rastreo. Muestra los
// datos de auditoría (quién, cuándo, desde qué IP, sobre qué documento y si se
// afirmó el consentimiento del titular). El código actúa como token de acceso.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Search, CheckCircle2, XCircle } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL;

function Fila({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
      <span className="break-words text-sm font-semibold text-slate-100 sm:text-right">
        {value || "—"}
      </span>
    </div>
  );
}

export default function VerificarConsulta() {
  const { codigo: codigoParam } = useParams();
  const [codigo, setCodigo] = useState(codigoParam || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const buscar = async (code) => {
    const c = (code || "").trim();
    if (!c) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`${API_URL}/api/consulta/rastreo/${encodeURIComponent(c)}/`);
      const json = await res.json();
      if (!res.ok || !json.valido) {
        setError(json.detail || "No se encontró una consulta con ese código.");
      } else {
        setData(json);
      }
    } catch {
      setError("No se pudo verificar el código. Intenta más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigoParam) buscar(codigoParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoParam]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_32%),linear-gradient(180deg,#0b1220,#070d1a)] px-4 py-10 text-slate-200">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="text-cyan-300" size={26} />
          <div>
            <h1 className="text-xl font-black text-white">Verificación de consulta</h1>
            <p className="text-sm text-slate-400">
              Valida el código de rastreo de una consulta realizada en ECONFIA.
            </p>
          </div>
        </div>

        {/* Buscador */}
        <form
          onSubmit={(e) => { e.preventDefault(); buscar(codigo); }}
          className="mb-6 flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ingresa el código (ej. EC-A1B2C3D4E5)"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:opacity-90 disabled:opacity-60"
          >
            <Search size={16} />
            {loading ? "Verificando…" : "Verificar"}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
            <ShieldAlert size={18} /> {error}
          </div>
        )}

        {data && (
          <div className="overflow-hidden rounded-[22px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,15,30,0.96))] shadow-[0_24px_60px_rgba(2,12,27,0.5)]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-emerald-500/10 px-6 py-4">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 size={18} /> Consulta verificada
              </div>
              <span className="font-mono text-sm font-bold text-white">{data.codigo}</span>
            </div>
            <div className="px-6 py-2">
              <Fila label="Fecha" value={data.fecha} />
              <Fila label="Hora" value={data.hora} />
              <Fila label="Tipo de consulta" value={data.tipo_consulta} />
              <Fila label="Usuario que consultó" value={data.usuario} />
              <Fila label="Empresa" value={data.empresa} />
              <Fila label="NIT" value={data.nit} />
              <Fila label="Documento consultado" value={data.documento_consultado} />
              <Fila label="IP de la consulta" value={data.ip_consulta} />
              <Fila label="Canal" value={data.canal} />
              <div className="flex items-center justify-between py-3">
                <span className="text-xs uppercase tracking-wider text-slate-400">
                  Consentimiento afirmado
                </span>
                {data.consentimiento_afirmado ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-300">
                    <CheckCircle2 size={14} /> Sí{data.consentimiento_fecha ? ` · ${data.consentimiento_fecha}` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-300">
                    <XCircle size={14} /> No registrado
                  </span>
                )}
              </div>
            </div>
            <div className="border-t border-white/10 px-6 py-3 text-[11px] text-slate-500">
              El usuario declaró contar con la autorización del titular al realizar esta
              consulta, conforme a la Ley 1581 de 2012 (Habeas Data).
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
