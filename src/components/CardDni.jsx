import imagenDNIF from "../assets/imagenDNIF.png";
import imagenDNIM from "../assets/imagenDNIM.png";
import huellaEidentidad from "../assets/eidentidad-fingerprint-light.png";

function formatDate(value) {
  if (!value) return "No disponible";

  // Las fechas "YYYY-MM-DD" (sin hora) las interpreta JS como medianoche UTC,
  // y al mostrarlas en hora de Colombia (UTC-5) retroceden un dia. Para evitarlo
  // se arman los componentes a mano, como fecha LOCAL.
  const soloFecha = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha;
    const local = new Date(Number(anio), Number(mes) - 1, Number(dia));
    return local.toLocaleDateString("es-CO");
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-CO");
}

// Para la fecha de NACIMIENTO se muestra solo el año: muchas fuentes solo traen
// el año real y rellenan el día/mes con "01-01", lo que confunde al usuario.
function soloAnio(value) {
  if (!value) return "No disponible";
  const m = String(value).match(/(\d{4})/);
  return m ? m[1] : "No disponible";
}

function getInitials(nombre, apellido) {
  return `${String(nombre || "").trim().charAt(0)}${String(apellido || "").trim().charAt(0)}`
    .trim()
    .toUpperCase() || "ID";
}

function resolveGenderPortrait(sexo) {
  const normalized = String(sexo || "").trim().toLowerCase();
  if (["f", "femenino", "female", "mujer"].includes(normalized)) {
    return imagenDNIF;
  }
  if (["m", "masculino", "male", "hombre"].includes(normalized)) {
    return imagenDNIM;
  }
  return null;
}

export default function CardDni({ data }) {
  const apellido = data?.last_name || data?.apellido || "No registrado";
  const nombre = data?.first_name || data?.nombre || "No registrado";
  const cedula = data?.document || data?.cedula || "Sin NUIP";
  const sexo = data?.gender || data?.sexo || "No definido";
  const fechaNacimiento = data?.birth_date || data?.fecha_nacimiento || "";
  // Solo mostramos estos campos cuando hay dato real (si no, no se renderizan).
  const haySexo = Boolean((data?.gender || data?.sexo || "").trim());
  const anioNacimiento = soloAnio(fechaNacimiento);
  const hayAnioNac = Boolean(fechaNacimiento) && anioNacimiento !== "No disponible";
  const tipoDoc = data?.doc_type || data?.tipo_doc || "";
  const fechaExpedicion = data?.fecha_expedicion || "";
  const documentoLabel = tipoDoc === "CC" ? "Cedula de ciudadania" : tipoDoc || "Documento";
  const logoEconfia = "/1-e9a7e544.ico";
  const portraitFallback = resolveGenderPortrait(sexo);

  return (
    <div className="relative w-full max-w-full sm:max-w-[36rem] overflow-hidden rounded-[16px] sm:rounded-[20px] border border-cyan-200/25 bg-[linear-gradient(180deg,#e7edf4_0%,#f5f7fa_44%,#dce4ee_100%)] shadow-[0_20px_48px_rgba(2,12,27,0.38)]">
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.11),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_24%)]" />
      <div className="absolute inset-x-0 top-0 h-10 bg-[linear-gradient(90deg,#0f2e4f_0%,#123c67_26%,#1c5d8f_52%,#0f436d_76%,#0b2f4d_100%)] opacity-90" />
      {/* Marca de agua — franja azul superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 overflow-hidden">
        <svg
          viewBox="0 0 576 40"
          aria-hidden="true"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="wm-fade-h" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="white" stopOpacity="0"   />
              <stop offset="12%"  stopColor="white" stopOpacity="0.55"/>
              <stop offset="50%"  stopColor="white" stopOpacity="0.65"/>
              <stop offset="88%"  stopColor="white" stopOpacity="0.55"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"   />
            </linearGradient>
            <linearGradient id="wm-fade-v" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="white" stopOpacity="1" />
              <stop offset="60%"  stopColor="white" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="wm-mask">
              <rect width="576" height="40" fill="url(#wm-fade-h)" />
            </mask>
          </defs>
          {/* Líneas diagonales — 45° */}
          <g mask="url(#wm-mask)" stroke="url(#wm-fade-v)" strokeWidth="1.6">
            {Array.from({ length: 28 }).map((_, i) => {
              const x = i * 22 - 10;
              return <line key={i} x1={x} y1="0" x2={x + 46} y2="40" />;
            })}
          </g>
          {/* Línea horizontal borde inferior */}
          <line x1="0" y1="39.2" x2="576" y2="39.2" stroke="rgba(255,255,255,0.30)" strokeWidth="0.8" />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          viewBox="0 0 900 520"
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
          preserveAspectRatio="none"
        >
          <g fill="none" strokeLinecap="round">
            <path d="M-40 345C68 285 138 283 220 318c77 33 146 40 233 1 95-42 170-37 260 4 77 35 136 30 247-28" stroke="#6ea6d9" strokeWidth="2.1" />
            <path d="M-20 360C84 301 150 300 229 334c77 33 144 40 229 1 94-43 169-40 258 2 78 36 140 33 248-24" stroke="#7cb2e3" strokeWidth="1.8" />
            <path d="M0 375c100-58 164-59 241-25 75 33 140 39 224 0 93-43 168-40 257 0 78 35 142 34 248-20" stroke="#7db0d8" strokeWidth="1.6" />
            <path d="M20 390c96-57 158-58 232-24 74 34 138 39 220 0 92-43 166-41 254 0 79 36 144 35 247-16" stroke="#88b8e2" strokeWidth="1.4" />
            <path d="M40 405c92-56 153-57 224-23 73 35 135 40 216 1 91-44 164-42 250 0 79 37 146 37 246-12" stroke="#9ec5ea" strokeWidth="1.2" />
            <path d="M-55 205c86-37 145-39 210-12 60 25 118 31 183 0 72-34 130-30 198 0 62 28 118 25 204-11 73-31 140-31 215 0" stroke="#8ebbe2" strokeWidth="1.2" />
            <path d="M-40 218c84-36 142-37 205-11 59 24 115 30 178 0 71-34 129-31 196 0 61 27 118 25 202-10 73-30 140-30 214 0" stroke="#9fc7ea" strokeWidth="1" />
            <path d="M-20 230c81-35 137-36 197-10 58 25 112 30 174 0 70-33 127-31 194 0 61 28 118 26 200-8 71-30 138-30 211 0" stroke="#b4d3ef" strokeWidth="0.9" />
            <ellipse cx="440" cy="262" rx="172" ry="126" stroke="#8db8de" strokeWidth="1.2" />
            <ellipse cx="440" cy="262" rx="154" ry="112" stroke="#a9cae6" strokeWidth="1" />
            <ellipse cx="440" cy="262" rx="136" ry="99" stroke="#bdd8ee" strokeWidth="0.9" />
          </g>
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <img
          src={logoEconfia}
          alt=""
          aria-hidden="true"
          className="h-52 w-52 select-none object-contain opacity-[0.1] sm:h-60 sm:w-60"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-8 h-24 opacity-30 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_58%)]" />

      <div className="relative z-10 p-3 pt-[3.1rem] sm:p-4 sm:pt-[3.35rem] md:p-5 md:pt-[3.5rem]">
        <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-400/15 pb-2.5">
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.34em] text-slate-500">
              Republica de Colombia
            </p>
            <h2 className="mt-1 text-[1rem] sm:text-[1.25rem] font-black uppercase tracking-tight text-slate-800 md:text-[1.4rem] leading-tight">
              {documentoLabel}
            </h2>
            <p className="mt-0.5 text-[9px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Validacion de Identidad
            </p>
            <p className="mt-0.5 text-[9px] sm:text-[8px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Datos Consultados Registraduria Nacional (ANI)</p>
          </div>

          <div className="shrink-0 rounded-[8px] sm:rounded-[10px] border border-cyan-100/35 bg-white/60 px-2 py-1 sm:px-2.5 sm:py-1.5 text-right shadow-sm">
            <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-400">NUIP</p>
            <p className="mt-0.5 whitespace-nowrap font-mono text-[11px] sm:text-[13px] font-black tracking-[0.08em] text-slate-800 md:text-[14px]">
              {cedula}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-[100px_1fr] sm:grid-cols-[132px_1fr]">
          <div className="space-y-2">
            <div className="relative flex h-28 sm:h-36 items-center justify-center overflow-hidden rounded-[8px] sm:rounded-[10px] border border-slate-400/40 bg-[linear-gradient(180deg,#d0d8e3_0%,#eef2f6_100%)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]">
              {data?.foto ? (
                <img
                  src={data.foto}
                  alt={`${nombre} ${apellido}`}
                  className="h-full w-full object-cover"
                />
              ) : portraitFallback ? (
                <img
                  src={portraitFallback}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover opacity-90"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_55%)] text-slate-500">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white/40 text-lg font-bold">
                    {getInitials(nombre, apellido)}
                  </div>
                  <span className="mt-2.5 text-[10px] uppercase tracking-[0.25em]">Foto</span>
                </div>
              )}
            </div>

            <div className="rounded-[8px] sm:rounded-[10px] border border-cyan-100/35 bg-white/45 px-2 py-1.5 sm:px-3 sm:py-2">
              <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Fecha de expedicion
              </p>
              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-[13px] font-bold text-slate-700">
                {formatDate(fechaExpedicion)}
              </p>
            </div>

            {/* Huella dactilar (imagen e-identidad) + escaner */}
            <div className="relative flex justify-center overflow-hidden rounded-[10px] border border-cyan-300/25 bg-[rgba(6,30,60,0.55)] px-3 py-2.5">
              <img
                src={huellaEidentidad}
                alt=""
                aria-hidden="true"
                className="h-20 w-20 select-none object-contain opacity-95"
                style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.55))" }}
              />
              {/* Linea de escaneo */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1 h-[2px] rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.95), rgba(103,232,249,1), rgba(6,182,212,0.95), transparent)",
                  boxShadow: "0 0 10px 3px rgba(6,182,212,0.7), 0 0 20px 4px rgba(34,211,238,0.3)",
                  animation: "scanLine 2s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          <div className="grid content-start gap-2">
            <div className="grid gap-1.5 sm:gap-2.5 rounded-[10px] sm:rounded-[12px] bg-white/30 p-2 sm:p-3 grid-cols-[80px_1fr] sm:grid-cols-[104px_1fr] sm:p-3.5">
              <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wide text-slate-700">Apellidos</p>
              <p className="border-b border-slate-300/65 pb-1 text-[11px] sm:text-[13px] font-medium uppercase tracking-wide text-slate-800 sm:text-sm truncate">
                {apellido}
              </p>

              <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wide text-slate-700">Nombres</p>
              <p className="border-b border-slate-300/65 pb-1 text-[11px] sm:text-[13px] font-medium uppercase tracking-wide text-slate-800 sm:text-sm truncate">
                {nombre}
              </p>

              {haySexo && (
                <>
                  <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wide text-slate-700">Sexo</p>
                  <p className="border-b border-slate-300/65 pb-1 text-[11px] sm:text-[13px] font-medium uppercase tracking-wide text-slate-800 sm:text-sm">
                    {sexo}
                  </p>
                </>
              )}

              {hayAnioNac && (
                <>
                  <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wide text-slate-700">Año nac.</p>
                  <p className="border-b border-slate-300/65 pb-1 text-[11px] sm:text-[13px] font-medium uppercase tracking-wide text-slate-800 sm:text-sm">
                    {anioNacimiento}
                  </p>
                </>
              )}
            </div>

            <div className="rounded-[10px] sm:rounded-[12px] border border-cyan-200/25 bg-[linear-gradient(90deg,rgba(15,47,77,0.09),rgba(255,255,255,0.16),rgba(24,93,143,0.12))] px-2.5 py-2 sm:px-4 sm:py-3">
              <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Identificacion valida para consulta
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600 leading-tight">
                  Titular Registrado ANI
                </span>
                <span className="shrink-0 rounded-full border border-cyan-200/30 bg-white/50 px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.22em] text-slate-700">
                  Econfia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
