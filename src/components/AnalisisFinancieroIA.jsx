// AnalisisFinancieroIA.jsx
// Análisis inteligente del comportamiento financiero (Adjudicator / Credit Report).
// El backend solo envía a la IA indicadores (score, %, conteos, patrón de pago),
// nunca montos, cuentas, tarjetas ni datos personales. Queda guardado: se genera
// una sola vez por consulta.
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { MarkdownSimple } from "./AnalisisInteligente";

const API_URL = process.env.REACT_APP_API_URL;
const RUTAS = { adjudicator: "experian", credit_report: "hdc" };

export default function AnalisisFinancieroIA({ producto, consultaId }) {
  const [estado, setEstado] = useState({ cargando: true, texto: "", modo: "", aviso: "" });

  useEffect(() => {
    if (!consultaId || !RUTAS[producto]) return undefined;
    let cancelado = false;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_URL}/api/${RUTAS[producto]}/consultas/${consultaId}/analisis/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const json = await resp.json();
        if (!cancelado) {
          setEstado({ cargando: false, texto: resp.ok ? json.texto || "" : "", modo: json.modo || "", aviso: json.aviso || "" });
        }
      } catch {
        if (!cancelado) setEstado({ cargando: false, texto: "", modo: "", aviso: "" });
      }
    })();
    return () => { cancelado = true; };
  }, [producto, consultaId]);

  if (!estado.cargando && !estado.texto) return null;

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-brand/20 bg-surface/90 p-5 shadow-xl shadow-black/5 backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/[0.06] blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/25 bg-brand/[0.08] text-brand">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="text-base font-bold text-content">Análisis inteligente del comportamiento financiero</h3>
        <span className="rounded-full border border-brand/25 bg-brand/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand">
          {estado.cargando ? "Analizando…" : estado.modo === "ia" ? "IA · anonimizado" : "Resumen automático"}
        </span>
      </div>
      <div className="relative mt-3">
        {estado.cargando ? (
          <div className="space-y-2">
            {[90, 75, 82].map((w) => (
              <div key={w} className="h-3 animate-pulse rounded bg-line/20" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <MarkdownSimple texto={estado.texto} />
        )}
      </div>
      {estado.aviso && <p className="relative mt-3 text-[11px] leading-5 text-muted">{estado.aviso}</p>}
    </section>
  );
}
