// src/components/AvisoTratamientoDatos.jsx
// Aviso claro de tratamiento de datos (habeas data, Ley 1581/2012) para colocar
// en los formularios de consulta. Reusable: se agrega cerca de los checkboxes de
// consentimiento. BORRADOR del texto — revisar con el área legal.
import { ShieldCheck, FileDown } from "lucide-react";
import { descargarPlantillaConsentimiento } from "../pdf/plantillaConsentimiento";

export default function AvisoTratamientoDatos({ className = "" }) {
  return (
    <div
      className={`rounded-lg border border-line/15 bg-surface-2/50 px-3 py-2 text-[11px] leading-relaxed text-muted ${className}`}
    >
      <div className="flex items-start gap-2">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand" />
        <p>
          Al consultar, declaras que cuentas con la autorización del titular y
          autorizas a ECONFIA el tratamiento de los datos conforme a la{" "}
          <a
            href="/politica-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
          >
            Política de Privacidad
          </a>{" "}
          y la Ley 1581 de 2012 (Habeas Data). Consulta también la{" "}
          <a
            href="/politica-cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand underline underline-offset-2 hover:opacity-80"
          >
            Política de Cookies
          </a>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={descargarPlantillaConsentimiento}
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-brand/30 bg-brand/5 px-2.5 py-1 font-semibold text-brand transition hover:bg-brand/15"
        title="Descargar plantilla de consentimiento informado (sugerida)"
      >
        <FileDown size={12} />
        Descargar plantilla de consentimiento
      </button>
    </div>
  );
}
