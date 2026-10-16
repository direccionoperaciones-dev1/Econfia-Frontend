// src/views/ConsultaSlide.jsx
// Muestra los RESULTADOS como un INFORME elegante (estilo AML/HUD oscuro), a
// pantalla completa, armado por nosotros con los datos reales (NO es el PDF).
// Incluye QR y link de verificación. El otro slide (resultados individuales) NO se toca.
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { buildInformeHtml } from "./informeHtml";

const API_URL = process.env.REACT_APP_API_URL;

const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

const ConsultaSlide = ({ consultaId, consulta: consultaProp }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [html, setHtml] = useState("");

  // QR (endpoint backend) + link público de verificación.
  const qrUrl = `${API_URL}/api/qr/${consultaId}/`;
  const verifyUrl = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/econfia/resumen-consulta/${consultaId}/`;
  }, [consultaId]);

  useEffect(() => {
    if (!consultaId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json", Authorization: `Token ${token}` };

        const [consultaRes, riesgoRes, resultadosRes, burbujaRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/consultas/${consultaId}/`, { headers }),
          fetch(`${API_URL}/api/calcular_riesgo/${consultaId}/`, { headers }),
          fetch(`${API_URL}/api/resultados/${consultaId}/`, { headers }),
          fetch(`${API_URL}/api/burbuja-riesgo/${consultaId}/`, { headers }),
        ]);

        const okJson = async (settled) => {
          if (settled.status !== "fulfilled" || !settled.value.ok) return null;
          try { return await settled.value.json(); } catch { return null; }
        };

        const consulta = (await okJson(consultaRes)) || consultaProp || {};
        const riesgo = await okJson(riesgoRes);
        const resultadosData = await okJson(resultadosRes);
        const resultados = Array.isArray(resultadosData)
          ? resultadosData
          : (resultadosData?.resultados || []);

        // Diagrama de burbujas (PNG con auth) → data URL para embeberlo en el iframe.
        let burbujaUrl = "";
        if (burbujaRes.status === "fulfilled" && burbujaRes.value.ok) {
          try { burbujaUrl = await blobToDataURL(await burbujaRes.value.blob()); } catch { /* opcional */ }
        }

        setHtml(buildInformeHtml({ consulta, riesgo, resultados, apiUrl: API_URL, qrUrl, verifyUrl, burbujaUrl }));
      } catch (err) {
        setError(err.message || "Error cargando el informe");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultaId, consultaProp?.tipo_consulta]);

  return (
    <div className="relative w-full h-full min-h-[72vh] bg-[#050914]">
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="w-full h-full grid place-items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <AlertTriangle size={18} /> {error}
          </div>
        </div>
      ) : (
        <iframe
          title="Informe de resultados"
          srcDoc={html}
          className="w-full h-full"
          style={{ border: 0, display: "block", minHeight: "72vh" }}
        />
      )}
    </div>
  );
};

function Loader() {
  return (
    <div className="w-full h-full min-h-[72vh] grid place-items-center bg-[#050914]">
      <div className="flex flex-col items-center gap-3 text-cyan-200/80">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        <span className="text-sm font-mono tracking-wider">Armando informe…</span>
      </div>
    </div>
  );
}

export default ConsultaSlide;
