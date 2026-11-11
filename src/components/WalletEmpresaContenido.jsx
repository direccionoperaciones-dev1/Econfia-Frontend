export const GRUPOS_EMPRESA = [
  ["identidad", "Identidad"], ["representacion", "Representación"],
  ["financiero", "Financiero"], ["legal", "Legal"],
  ["certificaciones", "Certificaciones"], ["otros", "Otros"],
];

export function DatosEmpresaCompartidos({ empresa, publico = false }) {
  if (!empresa) return null;
  const muted = publico ? "text-slate-400" : "text-muted";
  return (
    <div>
      {empresa.logo_url && <img src={empresa.logo_url} alt="Logo de la empresa" className="w-20 h-20 object-contain rounded-xl bg-white mb-3" />}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {[
          ["Razón social", empresa.razon_social], ["Nombre comercial", empresa.nombre_comercial],
          ["NIT", empresa.nit], ["Dígito de verificación", empresa.digito_verificacion],
          ["Tipo de organización", empresa.tipo_organizacion], ["Matrícula mercantil", empresa.matricula_mercantil],
          ["CIIU", empresa.ciiu], ["Actividad económica", empresa.actividad_economica],
          ["Tamaño", empresa.tamano_label || empresa.tamano], ["Sector", empresa.sector],
          ["Fecha de constitución", empresa.fecha_constitucion], ["Ciudad", empresa.ciudad],
          ["Dirección", empresa.direccion], ["Teléfono", empresa.telefono], ["Correo", empresa.correo],
        ].filter(([, value]) => value != null && value !== "").map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className={`text-xs ${muted}`}>{label}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DocumentosEmpresa({ documentos = [], onEliminar, publico = false, verArchivo = true }) {
  const muted = publico ? "text-slate-400" : "text-muted";
  const border = publico ? "border-white/10" : "border-line/15";
  if (!documentos.length) return <p className={`text-sm ${muted}`}>Sin documentos.</p>;
  return <div className="space-y-5">
    {GRUPOS_EMPRESA.map(([grupo, label]) => {
      const items = documentos.filter((d) => (d.grupo || "otros") === grupo);
      if (!items.length) return null;
      return <section key={grupo}>
        <h3 className={`text-sm font-semibold mb-2 ${muted}`}>{label} ({items.length})</h3>
        <ul className="space-y-2">
          {items.map((d, i) => <li key={d.id || i} className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${border}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold break-words">{d.tipo_label}</p>
              <p className={`text-xs break-all ${muted}`}>{d.nombre_original}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className={d.estado_verificacion === "verificado" ? "text-emerald-400" : d.estado_verificacion === "rechazado" ? "text-red-400" : muted}>{d.estado_label}</span>
              {verArchivo && d.archivo_url && <a href={d.archivo_url} target="_blank" rel="noreferrer" className="text-emerald-400 underline">Ver documento</a>}
              {onEliminar && <button type="button" onClick={() => onEliminar(d.id)} className="text-red-400">Eliminar</button>}
            </div>
          </li>)}
        </ul>
      </section>;
    })}
  </div>;
}
