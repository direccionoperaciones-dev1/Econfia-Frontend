import { useState, useEffect, useCallback } from "react";
import Toast from "../components/Toast";

/**
 * Panel del dueño de la empresa (Perfil.es_admin_organizacion).
 * - Crear / listar usuarios hijos
 * - Repartir bolsa de consultas (recargar / quitar) desde el pool
 * - Configurar límites por usuario (planes, límite diario, horario)
 * - Ver el informe de auditoría (consultas, descargas, logins por usuario)
 */
export default function GestionEmpresa() {
  const API = process.env.REACT_APP_API_URL;
  const authH = useCallback(() => {
    const t = localStorage.getItem("token");
    return { "Content-Type": "application/json", Authorization: `Token ${t}` };
  }, []);

  const [tab, setTab] = useState("usuarios");
  const [info, setInfo] = useState(null);       // { empresa, pool_consultas, max_usuarios, usuarios_usados, usuarios:[] }
  const [audit, setAudit] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  // formulario crear usuario
  const [nuevo, setNuevo] = useState({ username: "", password: "", email: "", first_name: "", last_name: "", bolsa_inicial: 0 });

  const fetchUsuarios = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/empresa/usuarios/`, { headers: authH() });
      if (!r.ok) throw new Error((await r.json()).error || "No se pudo cargar");
      setInfo(await r.json());
    } catch (e) { setToast({ type: "error", message: e.message }); }
  }, [API, authH]);

  const fetchAuditoria = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/empresa/auditoria/?dias=30`, { headers: authH() });
      if (r.ok) setAudit(await r.json());
    } catch (e) { /* noop */ }
  }, [API, authH]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);
  useEffect(() => { if (tab === "auditoria") fetchAuditoria(); }, [tab, fetchAuditoria]);

  // planes de la empresa = los del dueño (es_admin)
  const planesEmpresa = (info?.usuarios || []).find((u) => u.es_admin)?.planes || [];

  const crearUsuario = async () => {
    if (!nuevo.username || !nuevo.password) {
      setToast({ type: "error", message: "Usuario y contraseña son obligatorios." });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/empresa/usuarios/`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ ...nuevo, bolsa_inicial: Number(nuevo.bolsa_inicial) || 0 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo crear");
      setToast({ type: "success", message: "Usuario creado." });
      setNuevo({ username: "", password: "", email: "", first_name: "", last_name: "", bolsa_inicial: 0 });
      fetchUsuarios();
    } catch (e) { setToast({ type: "error", message: e.message }); }
    finally { setBusy(false); }
  };

  const cambiarBolsa = async (perfilId, accion) => {
    const cant = Number(window.prompt(`¿Cuántas consultas querés ${accion}?`, "10"));
    if (!cant || cant <= 0) return;
    try {
      const r = await fetch(`${API}/api/empresa/usuarios/${perfilId}/bolsa/`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ accion, cantidad: cant }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setToast({ type: "success", message: "Bolsa actualizada." });
      fetchUsuarios();
    } catch (e) { setToast({ type: "error", message: e.message }); }
  };

  const guardarConfig = async (u, patch) => {
    try {
      const r = await fetch(`${API}/api/empresa/usuarios/${u.perfil_id}/config/`, {
        method: "PATCH", headers: authH(), body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setToast({ type: "success", message: "Configuración guardada." });
      fetchUsuarios();
    } catch (e) { setToast({ type: "error", message: e.message }); }
  };

  const topeTxt = info?.max_usuarios == null ? "∞" : info.max_usuarios;
  const sinCupo = info?.max_usuarios != null && info.usuarios_usados >= info.max_usuarios;

  return (
    <section className="min-h-screen px-4 py-6 max-w-6xl mx-auto text-content">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black">Gestión de la empresa {info?.empresa ? `· ${info.empresa}` : ""}</h1>
          <p className="text-sm text-muted">Administra los usuarios de tu empresa y su consumo.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/30 text-brand font-semibold">
            Pool: {info?.pool_infinito ? "∞" : (info?.pool_consultas ?? "—")} consultas
          </span>
          <span className={`px-3 py-1.5 rounded-lg border font-semibold ${sinCupo ? "bg-red-500/10 border-red-500/40 text-red-400" : "bg-surface-2/60 border-line/20"}`}>
            Usuarios: {info?.usuarios_usados ?? "—"} / {topeTxt}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {["usuarios", "auditoria"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-brand text-white" : "bg-surface-2/60 text-muted hover:text-content"}`}>
            {t === "usuarios" ? "Usuarios" : "Informe / Auditoría"}
          </button>
        ))}
      </div>

      {tab === "usuarios" && (
        <>
          {/* Crear usuario */}
          <div className="rounded-xl border border-line/20 bg-surface/70 p-4 mb-5">
            <h2 className="font-bold mb-3">Crear usuario</h2>
            {sinCupo && <p className="text-xs text-red-400 mb-2">Llegaste al tope de usuarios. Contacta a Econfia para ampliarlo.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[["username", "Usuario *"], ["password", "Contraseña *"], ["email", "Email"], ["first_name", "Nombre"], ["last_name", "Apellido"], ["bolsa_inicial", "Bolsa inicial"]].map(([k, label]) => (
                <input key={k} type={k === "password" ? "password" : (k === "bolsa_inicial" ? "number" : "text")}
                  placeholder={label} value={nuevo[k]}
                  onChange={(e) => setNuevo((n) => ({ ...n, [k]: e.target.value }))}
                  className="px-3 py-2 rounded-lg bg-surface-2/70 border border-line/20 text-sm focus:outline-none focus:border-brand/50" />
              ))}
            </div>
            <button onClick={crearUsuario} disabled={busy || sinCupo}
              className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 text-white text-sm font-semibold disabled:opacity-50">
              {busy ? "Creando..." : "Crear usuario"}
            </button>
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-2">
            {(info?.usuarios || []).filter((u) => !u.es_admin).map((u) => (
              <UsuarioRow key={u.perfil_id} u={u} planesEmpresa={planesEmpresa}
                onBolsa={cambiarBolsa} onConfig={guardarConfig} />
            ))}
            {info && (info.usuarios || []).filter((u) => !u.es_admin).length === 0 && (
              <p className="text-sm text-muted">Aún no creaste usuarios.</p>
            )}
          </div>
        </>
      )}

      {tab === "auditoria" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-line/20 bg-surface/70 p-4">
            <h2 className="font-bold mb-3">Resumen por usuario (últimos 30 días)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted text-left"><tr>
                  <th className="py-2">Usuario</th><th>Bolsa</th><th>Consultas</th><th>Descargas PDF</th><th>Logins</th>
                </tr></thead>
                <tbody>
                  {(audit?.resumen_por_usuario || []).map((r) => (
                    <tr key={r.perfil_id} className="border-t border-line/10">
                      <td className="py-2 font-medium">{r.username}{r.es_admin ? " (dueño)" : ""}</td>
                      <td>{r.bolsa}</td><td>{r.consultas}</td><td>{r.descargas_pdf}</td><td>{r.logins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-line/20 bg-surface/70 p-4">
            <h2 className="font-bold mb-3">Eventos recientes</h2>
            <div className="max-h-96 overflow-y-auto text-xs space-y-1">
              {(audit?.eventos_recientes || []).map((e, i) => (
                <div key={i} className="flex flex-wrap gap-2 border-b border-line/10 py-1.5">
                  <span className="text-muted">{new Date(e.fecha).toLocaleString()}</span>
                  <span className="font-semibold">{e.usuario}</span>
                  <span className="px-1.5 rounded bg-brand/10 text-brand">{e.accion}</span>
                  {e.canal && <span className="text-muted">{e.canal}</span>}
                  {e.ip && <span className="text-muted">{e.ip}</span>}
                </div>
              ))}
              {audit && (audit.eventos_recientes || []).length === 0 && <p className="text-muted">Sin eventos.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function UsuarioRow({ u, planesEmpresa, onBolsa, onConfig }) {
  const [abierto, setAbierto] = useState(false);
  const [limite, setLimite] = useState(u.limite_consultas_dia ?? "");
  const [hi, setHi] = useState(u.hora_inicio ?? "");
  const [hf, setHf] = useState(u.hora_fin ?? "");
  const [planes, setPlanes] = useState((u.planes || []).map((p) => p.id));

  const togglePlan = (id) => setPlanes((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <div className="rounded-xl border border-line/20 bg-surface-2/40">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div>
          <span className="font-semibold">{u.username}</span>
          <span className="text-muted text-sm"> · bolsa {u.consultas_infinitas ? "∞" : u.bolsa}</span>
          {u.limite_consultas_dia && <span className="text-xs text-muted"> · {u.limite_consultas_dia}/día</span>}
          {u.hora_inicio && <span className="text-xs text-muted"> · {u.hora_inicio}–{u.hora_fin}</span>}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onBolsa(u.perfil_id, "recargar")} className="px-2.5 py-1 rounded text-xs bg-brand/15 text-brand font-semibold">+ Bolsa</button>
          <button onClick={() => onBolsa(u.perfil_id, "quitar")} className="px-2.5 py-1 rounded text-xs bg-surface/70 border border-line/20">− Bolsa</button>
          <button onClick={() => setAbierto((v) => !v)} className="px-2.5 py-1 rounded text-xs bg-surface/70 border border-line/20">{abierto ? "Cerrar" : "Config"}</button>
        </div>
      </div>
      {abierto && (
        <div className="px-4 pb-4 border-t border-line/10 pt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Límite por día (vacío = sin límite)</span>
            <input type="number" value={limite} onChange={(e) => setLimite(e.target.value)}
              className="px-2 py-1.5 rounded bg-surface-2/70 border border-line/20" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Hora inicio</span>
            <input type="time" value={hi} onChange={(e) => setHi(e.target.value)}
              className="px-2 py-1.5 rounded bg-surface-2/70 border border-line/20" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Hora fin</span>
            <input type="time" value={hf} onChange={(e) => setHf(e.target.value)}
              className="px-2 py-1.5 rounded bg-surface-2/70 border border-line/20" />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Planes permitidos</span>
            <div className="flex flex-wrap gap-1">
              {planesEmpresa.map((p) => (
                <button key={p.id} onClick={() => togglePlan(p.id)}
                  className={`px-2 py-0.5 rounded text-[11px] border ${planes.includes(p.id) ? "bg-brand text-white border-brand" : "text-muted border-line/30"}`}>
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-4">
            <button
              onClick={() => onConfig(u, {
                planes,
                limite_consultas_dia: limite === "" ? null : Number(limite),
                hora_inicio: hi || null, hora_fin: hf || null,
              })}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand to-brand-2 text-white text-sm font-semibold">
              Guardar configuración
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
