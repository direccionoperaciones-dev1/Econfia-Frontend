import React, { useEffect, useState } from "react";

// Vincula el número de WhatsApp del usuario para consultar por chat.
// Vincular exige dos pruebas: el código se genera aquí (sesión iniciada) y se
// envía por WhatsApp DESDE el número a vincular (prueba de que es suyo).

const API_URL = process.env.REACT_APP_API_URL;

export default function WhatsAppVinculoCard() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Token ${token}`, "Content-Type": "application/json" };
  const [estado, setEstado] = useState(null);
  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState(null); // { codigo, mensaje, link, expira_minutos }
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      const r = await fetch(`${API_URL}/api/whatsapp/vinculo/`, { headers });
      if (r.ok) setEstado(await r.json());
    } catch { /* la tarjeta es opcional: si falla, no bloquea el perfil */ }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, []);

  // Mientras hay un código pendiente, revisa cada 5 s si ya se vinculó.
  useEffect(() => {
    if (!codigo || estado?.vinculado) return undefined;
    const t = setInterval(async () => {
      const r = await fetch(`${API_URL}/api/whatsapp/vinculo/`, { headers });
      if (r.ok) {
        const data = await r.json();
        setEstado(data);
        if (data.vinculado) setCodigo(null);
      }
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, estado?.vinculado]);

  const generar = async (e) => {
    e.preventDefault(); setCargando(true); setError("");
    try {
      const r = await fetch(`${API_URL}/api/whatsapp/vinculo/`, { method: "POST", headers, body: JSON.stringify({ telefono }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "No fue posible generar el código.");
      setCodigo(data); setEstado(data);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  };

  const desvincular = async () => {
    if (!window.confirm("¿Quitar este número? Ya no podrás consultar por WhatsApp desde él.")) return;
    const r = await fetch(`${API_URL}/api/whatsapp/vinculo/`, { method: "DELETE", headers });
    if (r.ok) { setEstado(await r.json()); setCodigo(null); }
  };

  if (!estado) return null;

  return (
    <div className="rounded-[20px] border border-line/15 bg-surface/90 p-4 shadow-2xl shadow-brand/10 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-content md:text-xl">💬 Consultas por WhatsApp</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Consulta EconfiaFast, Essencial o Full escribiendo el documento por WhatsApp. Cada consulta pide
            confirmar que cuentas con la autorización del titular y queda registrada con su código de rastreo.
          </p>
        </div>
        {estado.vinculado && (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500">Vinculado ✔ {estado.telefono}</span>
        )}
      </div>

      {!estado.configurado && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-300">
          El canal de WhatsApp aún no está activo en la plataforma. Puedes dejar tu número listo.
        </p>
      )}

      {estado.vinculado ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/15 bg-surface-2/60 px-4 py-3 text-sm text-content">
          <span>Escribe <b>MENU</b> al WhatsApp de Econfia{estado.numero_negocio ? ` (+${estado.numero_negocio})` : ""} para empezar. Atajo: <b>FAST CC 1234567890</b></span>
          <button type="button" onClick={desvincular} className="rounded-xl px-3 py-1.5 text-xs font-bold text-muted hover:text-red-500">Desvincular</button>
        </div>
      ) : codigo ? (
        <div className="mt-4 rounded-2xl border border-brand/30 bg-brand/5 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Envía este mensaje desde tu WhatsApp</div>
          <div className="mt-1 text-3xl font-black tracking-widest text-brand">{codigo.mensaje}</div>
          <p className="mt-1 text-xs text-muted">El código vence en {codigo.expira_minutos} minutos. Debe enviarse desde el número {estado.telefono}.</p>
          {codigo.link && (
            <a href={codigo.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-600">
              Abrir WhatsApp con el mensaje listo
            </a>
          )}
          <p className="mt-3 text-xs text-muted">Esperando confirmación… esta tarjeta se actualiza sola.</p>
        </div>
      ) : (
        <form onSubmit={generar} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="w-full rounded-xl border border-line/20 bg-surface px-3 py-2.5 text-sm text-content outline-none placeholder:text-muted/60 focus:border-brand/60 sm:max-w-xs"
            placeholder="Tu celular, ej. 300 123 4567" inputMode="tel" required
            value={telefono} onChange={(e) => setTelefono(e.target.value)}
          />
          <button disabled={cargando} className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-60">
            {cargando ? "Generando…" : "Vincular número"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
