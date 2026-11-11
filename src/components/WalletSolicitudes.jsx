import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const headers = () => {
  const h = { Authorization: `Token ${localStorage.getItem("token")}`, "Content-Type": "application/json" };
  // Empresa activa (Fase 5): permite que un MIEMBRO opere sobre la empresa
  // seleccionada. Persona natural no lo tiene y su endpoint lo ignora.
  const empresaId = localStorage.getItem("wallet_empresa_id");
  if (empresaId) h["X-Empresa-Id"] = empresaId;
  return h;
};
const ESTADOS = { pendiente: "Pendiente", autorizada: "Autorizada", rechazada: "Rechazada", cancelada: "Cancelada", revocada: "Revocada", expirada: "Expirada" };
const input = "w-full rounded-lg border border-line/15 bg-surface-2 px-3 py-2 text-content text-sm";
const boton = "rounded-lg bg-brand px-4 py-2 text-white text-sm font-semibold disabled:opacity-50";

// `puedeSolicitar` (solo empresa): el rol tiene el permiso "solicitar" para
// crear y cancelar solicitudes; sin él la sección queda en solo lectura.
export default function WalletSolicitudes({ empresa = false, puedeSolicitar = true, onActualizado }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [disponibles, setDisponibles] = useState({});
  const [correo, setCorreo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [pedidos, setPedidos] = useState([]);
  const [selecciones, setSelecciones] = useState({});
  const [consentimientos, setConsentimientos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const ruta = empresa ? "/api/wallet/empresa/solicitudes/" : "/api/wallet/solicitudes/";

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}${ruta}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "No se pudieron cargar las solicitudes.");
      setSolicitudes(data.solicitudes || []);
      setTipos(data.tipos || []);
      setDisponibles(data.archivos_disponibles || {});
      setError("");
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }, [ruta]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const actualizar = () => cargar();
    window.addEventListener("focus", actualizar);
    return () => window.removeEventListener("focus", actualizar);
  }, [cargar]);

  const enviar = async (url, body, mensajeExito) => {
    setOcupado(true); setError(""); setMensaje("");
    try {
      const res = await fetch(`${API_URL}${url}`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "No se pudo completar la acción.");
      setMensaje(typeof mensajeExito === "function" ? mensajeExito(data) : mensajeExito);
      setSelecciones({}); setConsentimientos({});
      await cargar();
      onActualizado?.();
      return true;
    } catch (e) { setError(e.message); return false; }
    finally { setOcupado(false); }
  };

  const crear = async (event) => {
    event.preventDefault();
    if (!pedidos.length) { setError("Selecciona al menos un documento."); return; }
    if (await enviar(ruta, { correo, motivo, tipos: pedidos }, (d) => `Solicitud ${d.codigo} enviada a la wallet de la persona.`)) {
      setCorreo(""); setMotivo(""); setPedidos([]);
    }
  };

  const autorizar = (event, solicitud) => {
    event.preventDefault();
    if (!consentimientos[solicitud.codigo]) return;
    const elegidos = solicitud.detalles.map((d) => {
      const [origen, id] = (selecciones[d.id] || "").split(":");
      return { detalle_id: d.id, origen, archivo_id: Number(id) };
    });
    enviar(`${ruta}${solicitud.codigo}/responder/`, { decision: "autorizar", selecciones: elegidos }, "Autorización guardada. La empresa ya puede consultar los archivos elegidos.");
  };

  return <section className="rounded-2xl border border-line/15 bg-surface p-6 text-content">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <h2 className="text-lg font-bold">{empresa ? (puedeSolicitar ? "Solicitar documentos" : "Solicitudes de documentos") : "Solicitudes recibidas"}</h2>
      <button type="button" disabled={ocupado || cargando} onClick={() => { cargar(); onActualizado?.(); }} className="text-sm text-brand disabled:opacity-50">Actualizar solicitudes</button>
    </div>
    <p className="text-sm text-muted mb-4">{empresa
      ? "Pide documentos a una persona registrada. Tiene 7 días para responder; si autoriza, tendrás 7 días de acceso a los archivos elegidos."
      : "Revisa qué empresa solicita tus documentos y para qué. Solo se compartirán los archivos que selecciones, durante 7 días."}</p>
    {empresa && puedeSolicitar && <form onSubmit={crear} className="space-y-3 mb-6">
      <div><label htmlFor="solicitud-correo" className="text-sm">Correo de la persona</label>
        <input id="solicitud-correo" type="email" required maxLength={254} value={correo} onChange={(e) => setCorreo(e.target.value)} className={input} /></div>
      <div><label htmlFor="solicitud-motivo" className="text-sm">Motivo de la solicitud</label>
        <textarea id="solicitud-motivo" required maxLength={500} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={input} /></div>
      <fieldset><legend className="text-sm mb-2">Documentos requeridos</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {tipos.map((t) => <label key={t.valor} className="flex gap-2 items-center text-sm">
            <input type="checkbox" checked={pedidos.includes(t.valor)} onChange={() => setPedidos((prev) => prev.includes(t.valor) ? prev.filter((x) => x !== t.valor) : [...prev, t.valor])} />{t.label}
          </label>)}
        </div>
      </fieldset>
      <button className={boton} disabled={ocupado || cargando || !pedidos.length}>Enviar solicitud</button>
    </form>}
    {error && <p role="alert" className="text-sm text-red-400 mb-3">{error}</p>}
    {mensaje && <p role="status" className="text-sm text-emerald-400 mb-3">{mensaje}</p>}
    {cargando && <p className="text-sm text-muted">Actualizando solicitudes…</p>}
    {!cargando && !solicitudes.length && <p className="text-sm text-muted">{empresa ? "Aún no has enviado solicitudes." : "No tienes solicitudes recibidas."}</p>}
    <div className="space-y-4">
      {solicitudes.map((s) => <article key={s.codigo} className="rounded-xl border border-line/15 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 justify-between">
          <h3 className="font-semibold">{s.codigo} · {empresa ? s.destinatario : s.empresa}</h3>
          <span className="text-sm text-muted">{ESTADOS[s.estado] || s.estado}</span>
        </div>
        <p className="text-sm break-words">{s.motivo}</p>
        <p className="text-xs text-muted">Responder hasta: {new Date(s.vence).toLocaleString()}{s.acceso_hasta && ` · Acceso hasta: ${new Date(s.acceso_hasta).toLocaleString()}`}</p>
        {!empresa && s.estado === "pendiente" ? <form onSubmit={(e) => autorizar(e, s)} className="space-y-3">
          {s.detalles.map((d) => <div key={d.id}>
            <label htmlFor={`seleccion-${d.id}`} className="text-sm">{d.label}</label>
            <select id={`seleccion-${d.id}`} required className={input} value={selecciones[d.id] || ""}
              onChange={(e) => { setSelecciones((prev) => ({ ...prev, [d.id]: e.target.value })); setConsentimientos((prev) => ({ ...prev, [s.codigo]: false })); }}>
              <option value="">Selecciona un archivo de tu wallet</option>
              {(disponibles[d.tipo] || []).map((a) => <option key={`${a.origen}:${a.id}`} value={`${a.origen}:${a.id}`}>{a.nombre}</option>)}
            </select>
            {!disponibles[d.tipo]?.length && <p className="text-xs text-muted mt-1">Carga el archivo en la sección correspondiente de tu wallet y pulsa “Actualizar solicitudes”.</p>}
          </div>)}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={!!consentimientos[s.codigo]} onChange={(e) => setConsentimientos((prev) => ({ ...prev, [s.codigo]: e.target.checked }))} />
            Autorizo a {s.empresa} a consultar mi nombre y los archivos seleccionados (incluido el reverso de la cédula si existe) durante 7 días, para el motivo indicado.
          </label>
          <p className="text-xs text-muted">Puedes revocar el acceso. La revocación impide nuevas descargas; no elimina copias que la empresa ya haya descargado.</p>
          <div className="flex flex-wrap gap-3">
            <button className={boton} disabled={ocupado || !consentimientos[s.codigo] || s.detalles.some((d) => !selecciones[d.id])}>Autorizar archivos</button>
            <button type="button" disabled={ocupado} className="text-sm text-red-400 disabled:opacity-50"
              onClick={() => enviar(`${ruta}${s.codigo}/responder/`, { decision: "rechazar" }, "Solicitud rechazada.")}>Rechazar solicitud</button>
          </div>
        </form> : <ul className="text-sm text-muted space-y-1">{s.detalles.map((d) => <li key={d.id}>{d.label}{d.nombre_original && ` · ${d.nombre_original}`}</li>)}</ul>}
        {empresa && puedeSolicitar && s.estado === "pendiente" && <button type="button" disabled={ocupado} className="text-sm text-red-400"
          onClick={() => enviar(`${ruta}${s.codigo}/cancelar/`, {}, "Solicitud cancelada.")}>Cancelar solicitud</button>}
        {!empresa && s.estado === "autorizada" && <button type="button" disabled={ocupado} className="text-sm text-red-400"
          onClick={() => enviar(`${ruta}${s.codigo}/revocar/`, {}, "Acceso revocado.")}>Revocar acceso</button>}
      </article>)}
    </div>
  </section>;
}
