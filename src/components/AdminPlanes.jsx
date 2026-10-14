import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import Toast from "./Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const PLAN_NAMES = [
  ["essential", "Essential"], ["contratista", "Contratista"],
  ["ecorefull", "E-corefull"], ["empresa", "Empresa"],
  ["inmuebles-snr", "Econfia Asset Search"], ["basic-element", "Basic Element"],
  ["econfiafast", "EconfiaFast"], ["essencial-express", "Essencial Express"],
  ["consolidado-riesgo", "Econfia Integrity 360"],
  ["validacion-titulos", "Validación de títulos universitarios"],
  ["econfia-titulos", "Econfia Títulos"], ["e-identidad", "E-Identidad"],
  ["experian", "Econfia Adjudicator"], ["wallet", "Econfia Wallet"],
];
const PERIODICIDADES = [
  ["unica", "Pago único"], ["mensual", "Mensual"],
  ["trimestral", "Trimestral"], ["semestral", "Semestral"],
  ["anual", "Anual"], ["personalizada", "Personalizada"],
];
const ESTADOS = [
  ["borrador", "Borrador"], ["enviada", "Enviada"],
  ["aceptada", "Aceptada"], ["rechazada", "Rechazada"], ["vencida", "Vencida"],
];
const emptyPlan = {
  nombre: "essential", descripcion: "", costo: "0", precio: "0", moneda: "COP",
  periodicidad: "mensual", consultas_incluidas: "", activo: true,
};
const defaultExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().slice(0, 10);
};
const newProposal = () => ({
  plan: "", cliente_nombre: "", cliente_empresa: "", cliente_email: "",
  tarifa_origen: "", cantidad: "1", precio_unitario: "", precio_paquete: "",
  descuento_volumen_porcentaje: "0", precio_consulta_adicional: "",
  descuento_porcentaje: "0",
  valida_hasta: defaultExpiry(), observaciones: "",
});
const emptyRate = () => ({
  cantidad: "", precio_unitario: "", precio_paquete: "",
  descuento_porcentaje: "0", precio_consulta_adicional: "", activo: true,
});
const inputClass = "w-full rounded-xl border border-line/20 bg-surface px-3 py-2.5 text-sm text-content outline-none transition placeholder:text-muted/60 focus:border-brand/60";
const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.13em] text-muted";
const money = (value, currency = "COP") => new Intl.NumberFormat("es-CO", {
  style: "currency", currency, maximumFractionDigits: currency === "COP" ? 0 : 2,
}).format(Number(value || 0));
const tariffReference = (plan) => (plan.tarifas || [])
  .filter((rate) => rate.activo)
  .sort((a, b) => Number(a.cantidad) - Number(b.cantidad))[0] || null;
const parseError = async (response, fallback) => {
  try {
    const body = await response.json();
    if (body.detail) return body.detail;
    const first = Object.values(body || {})[0];
    return Array.isArray(first) ? first[0] : typeof first === "string" ? first : fallback;
  } catch { return fallback; }
};

export default function AdminPlanes() {
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => ({ Authorization: `Token ${token}` }), [token]);
  const [tab, setTab] = useState("planes");
  const [planes, setPlanes] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [users, setUsers] = useState([]);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [proposalForm, setProposalForm] = useState(newProposal());
  const [editId, setEditId] = useState(null);
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [rateRows, setRateRows] = useState([]);
  const [savingRates, setSavingRates] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const api = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...authHeaders, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    if (!response.ok) throw new Error(await parseError(response, "No fue posible completar la operación."));
    return response.status === 204 ? null : response.json();
  };
  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, proposalsData] = await Promise.all([api("/api/planes/"), api("/api/propuestas/")]);
      setPlanes(Array.isArray(plansData) ? plansData : plansData.results || []);
      setPropuestas(Array.isArray(proposalsData) ? proposalsData : proposalsData.results || []);
    } catch (error) { setToast({ type: "error", message: error.message }); }
    finally { setLoading(false); }
  };
  // La carga se repite únicamente cuando cambia la sesión autenticada.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [token]);

  const resetPlan = () => { setPlanForm(emptyPlan); setEditId(null); };
  const savePlan = async (event) => {
    event.preventDefault(); setSaving(true);
    const payload = {
      ...planForm, costo: Number(planForm.costo || 0), precio: Number(planForm.precio || 0),
      moneda: planForm.moneda.toUpperCase(),
      consultas_incluidas: planForm.consultas_incluidas === "" ? null : Number(planForm.consultas_incluidas),
    };
    try {
      await api(editId ? `/api/planes/${editId}/` : "/api/planes/", { method: editId ? "PUT" : "POST", body: JSON.stringify(payload) });
      setToast({ type: "success", message: editId ? "Plan actualizado." : "Plan creado." });
      resetPlan(); await loadData();
    } catch (error) { setToast({ type: "error", message: error.message }); }
    finally { setSaving(false); }
  };
  const editPlan = (plan) => {
    setEditId(plan.id);
    setPlanForm({
      nombre: plan.nombre, descripcion: plan.descripcion || "", costo: String(plan.costo || 0),
      precio: String(plan.precio || 0), moneda: plan.moneda || "COP",
      periodicidad: plan.periodicidad || "mensual", consultas_incluidas: plan.consultas_incluidas ?? "", activo: plan.activo,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const deletePlan = async (plan) => {
    if (!window.confirm(`¿Eliminar el plan ${plan.nombre_display || plan.nombre}?`)) return;
    try { await api(`/api/planes/${plan.id}/`, { method: "DELETE" }); setToast({ type: "success", message: "Plan eliminado." }); await loadData(); }
    catch (error) { setToast({ type: "error", message: error.message }); }
  };
  const openAssign = async (plan) => {
    setSelectedPlan(plan); setSelectedUsers([]); setShowAssign(true);
    try { const data = await api("/api/admin/users/"); setUsers(Array.isArray(data) ? data : data.results || []); }
    catch (error) { setToast({ type: "error", message: error.message }); }
  };
  const assignUsers = async () => {
    try {
      await api(`/api/planes/${selectedPlan.id}/asignar-usuarios/`, { method: "POST", body: JSON.stringify({ usuarios: selectedUsers }) });
      setShowAssign(false); setToast({ type: "success", message: "Usuarios asignados al plan." });
    } catch (error) { setToast({ type: "error", message: error.message }); }
  };

  const openRates = (plan) => {
    setSelectedPlan(plan);
    setRateRows((plan.tarifas || []).map((rate) => ({
      ...rate,
      cantidad: String(rate.cantidad),
      precio_unitario: String(rate.precio_unitario),
      precio_paquete: String(rate.precio_paquete),
      descuento_porcentaje: String(rate.descuento_porcentaje || 0),
      precio_consulta_adicional: rate.precio_consulta_adicional == null ? "" : String(rate.precio_consulta_adicional),
    })));
    setShowRates(true);
  };
  const updateRate = (index, field, value) => setRateRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  const saveRates = async () => {
    setSavingRates(true);
    const tarifas = rateRows.map((rate) => ({
      cantidad: Number(rate.cantidad),
      precio_unitario: Number(rate.precio_unitario),
      precio_paquete: Number(rate.precio_paquete),
      descuento_porcentaje: Number(rate.descuento_porcentaje || 0),
      precio_consulta_adicional: rate.precio_consulta_adicional === "" ? null : Number(rate.precio_consulta_adicional),
      activo: rate.activo !== false,
    }));
    try {
      await api(`/api/planes/${selectedPlan.id}/tarifas/`, { method: "PUT", body: JSON.stringify({ tarifas }) });
      setShowRates(false); setToast({ type: "success", message: "Tarifas por volumen actualizadas." }); await loadData();
    } catch (error) { setToast({ type: "error", message: error.message }); }
    finally { setSavingRates(false); }
  };

  const chooseProposalPlan = (planId) => {
    const plan = planes.find((item) => String(item.id) === String(planId));
    setProposalForm((current) => ({
      ...current, plan: planId, tarifa_origen: "", cantidad: "1",
      precio_unitario: plan ? String(plan.precio || 0) : "", precio_paquete: "",
      descuento_volumen_porcentaje: "0", precio_consulta_adicional: "",
    }));
  };
  const chooseProposalRate = (rateId) => {
    const rate = (proposalPlan?.tarifas || []).find((item) => String(item.id) === String(rateId));
    setProposalForm((current) => rate ? ({
      ...current, tarifa_origen: rateId, cantidad: String(rate.cantidad),
      precio_unitario: String(rate.precio_unitario), precio_paquete: String(rate.precio_paquete),
      descuento_volumen_porcentaje: String(rate.descuento_porcentaje || 0),
      precio_consulta_adicional: rate.precio_consulta_adicional == null ? "" : String(rate.precio_consulta_adicional),
    }) : ({ ...current, tarifa_origen: "", precio_paquete: "", descuento_volumen_porcentaje: "0", precio_consulta_adicional: "" }));
  };
  const resetProposal = () => { setProposalForm(newProposal()); setEditingProposalId(null); };
  const saveProposal = async (event) => {
    event.preventDefault(); setSaving(true);
    const payload = {
      ...proposalForm, plan: Number(proposalForm.plan), cantidad: Number(proposalForm.cantidad),
      precio_unitario: Number(proposalForm.precio_unitario), descuento_porcentaje: Number(proposalForm.descuento_porcentaje || 0),
      tarifa_origen: proposalForm.tarifa_origen ? Number(proposalForm.tarifa_origen) : null,
      precio_paquete: proposalForm.precio_paquete === "" ? null : Number(proposalForm.precio_paquete),
      descuento_volumen_porcentaje: Number(proposalForm.descuento_volumen_porcentaje || 0),
      precio_consulta_adicional: proposalForm.precio_consulta_adicional === "" ? null : Number(proposalForm.precio_consulta_adicional),
    };
    try {
      await api(editingProposalId ? `/api/propuestas/${editingProposalId}/` : "/api/propuestas/", { method: editingProposalId ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setToast({ type: "success", message: editingProposalId ? "Propuesta actualizada." : "Propuesta guardada como borrador." });
      resetProposal(); await loadData();
    } catch (error) { setToast({ type: "error", message: error.message }); }
    finally { setSaving(false); }
  };
  const editProposal = (proposal) => {
    setEditingProposalId(proposal.id);
    setProposalForm({
      plan: String(proposal.plan), cliente_nombre: proposal.cliente_nombre, cliente_empresa: proposal.cliente_empresa || "",
      cliente_email: proposal.cliente_email, cantidad: String(proposal.cantidad), precio_unitario: String(proposal.precio_unitario),
      tarifa_origen: proposal.tarifa_origen == null ? "" : String(proposal.tarifa_origen),
      precio_paquete: proposal.precio_paquete == null ? "" : String(proposal.precio_paquete),
      descuento_volumen_porcentaje: String(proposal.descuento_volumen_porcentaje || 0),
      precio_consulta_adicional: proposal.precio_consulta_adicional == null ? "" : String(proposal.precio_consulta_adicional),
      descuento_porcentaje: String(proposal.descuento_porcentaje), valida_hasta: proposal.valida_hasta, observaciones: proposal.observaciones || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const sendProposal = async (proposal) => {
    if (!window.confirm(`¿Enviar la propuesta #${proposal.id} a ${proposal.cliente_email}?`)) return;
    setSendingId(proposal.id);
    try { await api(`/api/propuestas/${proposal.id}/enviar/`, { method: "POST" }); setToast({ type: "success", message: "Propuesta enviada por correo." }); await loadData(); }
    catch (error) { setToast({ type: "error", message: error.message }); }
    finally { setSendingId(null); }
  };
  const changeStatus = async (proposal, estado) => {
    try { await api(`/api/propuestas/${proposal.id}/`, { method: "PATCH", body: JSON.stringify({ estado }) }); await loadData(); }
    catch (error) { setToast({ type: "error", message: error.message }); }
  };
  const deleteProposal = async (proposal) => {
    if (!window.confirm(`¿Eliminar la propuesta #${proposal.id}?`)) return;
    try { await api(`/api/propuestas/${proposal.id}/`, { method: "DELETE" }); setToast({ type: "success", message: "Propuesta eliminada." }); await loadData(); }
    catch (error) { setToast({ type: "error", message: error.message }); }
  };

  const activePlans = planes.filter((plan) => plan.activo);
  const proposalPlan = planes.find((plan) => String(plan.id) === String(proposalForm.plan));
  const proposalSubtotal = proposalForm.precio_paquete === "" ? Number(proposalForm.precio_unitario || 0) * Number(proposalForm.cantidad || 0) : Number(proposalForm.precio_paquete || 0);
  const proposalTotal = proposalSubtotal * (1 - Number(proposalForm.descuento_porcentaje || 0) / 100);

  return (
    <section className="relative min-h-screen bg-transparent px-3 py-4 pb-28 sm:px-5 md:py-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 rounded-[26px] border border-line/15 bg-surface/90 px-5 py-5 shadow-xl shadow-black/5 backdrop-blur-xl md:px-7">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand">Centro comercial administrativo</div>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><h2 className="text-3xl font-black tracking-tight text-content md:text-4xl">Planes y propuestas</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Administra costos, precios y condiciones comerciales; prepara propuestas y envíalas al cliente desde el mismo lugar.</p></div>
            <div className="flex gap-2 rounded-2xl bg-surface-2/80 p-1.5">
              <button onClick={() => setTab("planes")} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "planes" ? "bg-brand text-white shadow" : "text-muted hover:text-content"}`}>Planes ({planes.length})</button>
              <button onClick={() => setTab("propuestas")} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "propuestas" ? "bg-brand text-white shadow" : "text-muted hover:text-content"}`}>Propuestas ({propuestas.length})</button>
            </div>
          </div>
        </header>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {tab === "planes" ? <>
          <form onSubmit={savePlan} className="mb-5 rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg md:p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-content">{editId ? "Editar plan" : "Nuevo plan"}</h3>{editId && <button type="button" onClick={resetPlan} className="text-sm font-bold text-muted hover:text-content">Cancelar edición</button>}</div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Plan"><select className={inputClass} value={planForm.nombre} onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })} disabled={Boolean(editId)}>{PLAN_NAMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Costo interno"><input className={inputClass} type="number" min="0" step="0.01" value={planForm.costo} onChange={(e) => setPlanForm({ ...planForm, costo: e.target.value })} required /></Field>
              <Field label="Precio comercial"><input className={inputClass} type="number" min="0" step="0.01" value={planForm.precio} onChange={(e) => setPlanForm({ ...planForm, precio: e.target.value })} required /></Field>
              <Field label="Moneda"><input className={inputClass} maxLength="3" value={planForm.moneda} onChange={(e) => setPlanForm({ ...planForm, moneda: e.target.value.toUpperCase() })} required /></Field>
              <Field label="Periodicidad"><select className={inputClass} value={planForm.periodicidad} onChange={(e) => setPlanForm({ ...planForm, periodicidad: e.target.value })}>{PERIODICIDADES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Consultas incluidas"><input className={inputClass} type="number" min="0" placeholder="Sin cupo fijo" value={planForm.consultas_incluidas} onChange={(e) => setPlanForm({ ...planForm, consultas_incluidas: e.target.value })} /></Field>
              <div className="md:col-span-2"><Field label="Descripción"><input className={inputClass} value={planForm.descripcion} onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })} placeholder="Alcance y beneficios del plan" /></Field></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-content"><input type="checkbox" className="h-4 w-4 accent-brand" checked={planForm.activo} onChange={(e) => setPlanForm({ ...planForm, activo: e.target.checked })} />Disponible para propuestas</label>
              <button disabled={saving} className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-60">{saving ? "Guardando…" : editId ? "Actualizar plan" : "Crear plan"}</button>
            </div>
          </form>
          <PlansTable loading={loading} planes={planes} onEdit={editPlan} onRates={openRates} onAssign={openAssign} onDelete={deletePlan} />
        </> : <>
          <form onSubmit={saveProposal} className="mb-5 rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg md:p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-content">{editingProposalId ? `Editar propuesta #${editingProposalId}` : "Nueva propuesta"}</h3>{editingProposalId && <button type="button" onClick={resetProposal} className="text-sm font-bold text-muted hover:text-content">Cancelar edición</button>}</div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Plan"><select className={inputClass} value={proposalForm.plan} onChange={(e) => chooseProposalPlan(e.target.value)} required><option value="">Selecciona un plan</option>{activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.nombre_display || plan.nombre}</option>)}</select></Field>
              <Field label="Tarifa por volumen"><select className={inputClass} value={proposalForm.tarifa_origen} onChange={(e) => chooseProposalRate(e.target.value)} disabled={!proposalPlan}><option value="">Precio personalizado</option>{(proposalPlan?.tarifas || []).filter((rate) => rate.activo).map((rate) => <option key={rate.id} value={rate.id}>{rate.cantidad.toLocaleString("es-CO")} consultas · {money(rate.precio_paquete, proposalPlan.moneda)}</option>)}</select></Field>
              <Field label="Nombre del cliente"><input className={inputClass} value={proposalForm.cliente_nombre} onChange={(e) => setProposalForm({ ...proposalForm, cliente_nombre: e.target.value })} required /></Field>
              <Field label="Empresa"><input className={inputClass} value={proposalForm.cliente_empresa} onChange={(e) => setProposalForm({ ...proposalForm, cliente_empresa: e.target.value })} /></Field>
              <Field label="Correo"><input className={inputClass} type="email" value={proposalForm.cliente_email} onChange={(e) => setProposalForm({ ...proposalForm, cliente_email: e.target.value })} required /></Field>
              <Field label="Cantidad"><input className={inputClass} type="number" min="1" value={proposalForm.cantidad} onChange={(e) => setProposalForm({ ...proposalForm, cantidad: e.target.value, tarifa_origen: "", precio_paquete: "", descuento_volumen_porcentaje: "0", precio_consulta_adicional: "" })} required /></Field>
              <Field label="Precio unitario"><input className={inputClass} type="number" min="0" step="0.01" value={proposalForm.precio_unitario} onChange={(e) => setProposalForm({ ...proposalForm, precio_unitario: e.target.value, tarifa_origen: "", precio_paquete: "", descuento_volumen_porcentaje: "0", precio_consulta_adicional: "" })} required /></Field>
              <Field label="Descuento comercial adicional %"><input className={inputClass} type="number" min="0" max="100" step="0.01" value={proposalForm.descuento_porcentaje} onChange={(e) => setProposalForm({ ...proposalForm, descuento_porcentaje: e.target.value })} /></Field>
              <Field label="Válida hasta"><input className={inputClass} type="date" value={proposalForm.valida_hasta} onChange={(e) => setProposalForm({ ...proposalForm, valida_hasta: e.target.value })} required /></Field>
              <div className="md:col-span-2 lg:col-span-3"><Field label="Observaciones"><textarea className={`${inputClass} min-h-20 resize-y`} value={proposalForm.observaciones} onChange={(e) => setProposalForm({ ...proposalForm, observaciones: e.target.value })} placeholder="Condiciones especiales, alcance o notas para el cliente" /></Field></div>
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Total propuesto</div><div className="mt-1 text-2xl font-black text-brand">{money(proposalTotal, proposalPlan?.moneda || "COP")}</div>{Number(proposalForm.descuento_volumen_porcentaje) > 0 && <div className="mt-1 text-xs font-semibold text-emerald-600">Incluye {proposalForm.descuento_volumen_porcentaje}% de ahorro por volumen</div>}{proposalForm.precio_consulta_adicional !== "" && <div className="mt-1 text-xs text-muted">Consulta adicional: {money(proposalForm.precio_consulta_adicional, proposalPlan?.moneda || "COP")}</div>}</div>
            </div>
            <div className="mt-4 flex justify-end"><button disabled={saving} className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-60">{saving ? "Guardando…" : editingProposalId ? "Actualizar propuesta" : "Guardar borrador"}</button></div>
          </form>
          <ProposalsTable loading={loading} propuestas={propuestas} sendingId={sendingId} onSend={sendProposal} onEdit={editProposal} onDelete={deleteProposal} onStatus={changeStatus} />
        </>}
      </div>
      {showAssign && <Modal onClose={() => setShowAssign(false)}>
        <h3 className="mb-4 text-xl font-bold text-content">Asignar usuarios a <span className="text-brand">{selectedPlan?.nombre_display || selectedPlan?.nombre}</span></h3>
        <div className="mb-4 max-h-72 overflow-y-auto rounded-xl border border-line/15 bg-surface-2/70 p-3">
          {users.length === 0 ? <div className="py-6 text-center text-muted">No hay usuarios disponibles.</div> : users.map((user) => <label key={user.id} className="mb-2 flex items-center gap-3 rounded-lg border border-line/15 bg-surface p-2.5"><input type="checkbox" className="h-5 w-5 accent-brand" checked={selectedUsers.includes(user.id)} onChange={(e) => setSelectedUsers(e.target.checked ? [...selectedUsers, user.id] : selectedUsers.filter((id) => id !== user.id))} /><span><span className="block font-semibold text-content">{user.full_name || user.username}</span><span className="text-xs text-muted">{user.email}</span></span></label>)}
        </div>
        <button onClick={assignUsers} disabled={selectedUsers.length === 0} className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 px-4 py-2.5 font-bold text-white disabled:opacity-50">Asignar {selectedUsers.length || ""} usuario(s)</button>
      </Modal>}
      {showRates && <Modal onClose={() => setShowRates(false)} panelClassName="flex w-[min(96vw,1180px)] flex-col overflow-hidden rounded-[28px] border border-line/20 bg-surface text-content">
        <div className="border-b border-line/15 px-5 pb-5 pt-6 sm:px-7">
          <div className="pr-12">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">Configuración comercial</div>
            <h3 className="mt-1 text-2xl font-black tracking-tight">Tarifas de {selectedPlan?.nombre_display || selectedPlan?.nombre}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Precios escalonados según la cantidad de consultas. El ahorro por volumen no modifica el descuento comercial adicional de la propuesta.</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-7">
          {rateRows.length === 0 ? <div className="rounded-2xl border border-dashed border-line/30 bg-surface-2/40 px-6 py-14 text-center"><div className="font-bold text-content">Todavía no hay tarifas</div><div className="mt-1 text-sm text-muted">Agrega el primer rango de consultas para este plan.</div></div> : <div className="overflow-hidden rounded-2xl border border-line/15">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left">
                <thead className="bg-surface-2/90 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                  <tr><th className="px-4 py-3">Consultas</th><th className="px-4 py-3">Precio unitario</th><th className="px-4 py-3">Precio paquete</th><th className="px-4 py-3">Ahorro</th><th className="px-4 py-3">Consulta adicional</th><th className="w-16 px-4 py-3"><span className="sr-only">Acciones</span></th></tr>
                </thead>
                <tbody className="divide-y divide-line/10">
                  {rateRows.map((rate, index) => <tr key={rate.id || `new-${index}`} className="bg-surface transition hover:bg-brand/[0.035]">
                    <td className="px-3 py-3"><input aria-label="Cantidad de consultas" className={`${inputClass} min-w-[120px] font-bold`} type="number" min="1" value={rate.cantidad} onChange={(e) => updateRate(index, "cantidad", e.target.value)} /></td>
                    <td className="px-3 py-3"><input aria-label="Precio unitario" className={`${inputClass} min-w-[150px]`} type="number" min="0" step="0.01" value={rate.precio_unitario} onChange={(e) => updateRate(index, "precio_unitario", e.target.value)} /></td>
                    <td className="px-3 py-3"><input aria-label="Precio del paquete" className={`${inputClass} min-w-[165px] font-bold`} type="number" min="0" step="0.01" value={rate.precio_paquete} onChange={(e) => updateRate(index, "precio_paquete", e.target.value)} /></td>
                    <td className="px-3 py-3"><div className="relative min-w-[105px]"><input aria-label="Ahorro porcentual" className={`${inputClass} pr-8`} type="number" min="0" max="100" step="0.01" value={rate.descuento_porcentaje} onChange={(e) => updateRate(index, "descuento_porcentaje", e.target.value)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">%</span></div></td>
                    <td className="px-3 py-3"><input aria-label="Precio de consulta adicional" className={`${inputClass} min-w-[165px]`} type="number" min="0" step="0.01" placeholder="No definida" value={rate.precio_consulta_adicional} onChange={(e) => updateRate(index, "precio_consulta_adicional", e.target.value)} /></td>
                    <td className="px-3 py-3 text-right"><button type="button" title="Eliminar tarifa" aria-label="Eliminar tarifa" onClick={() => setRateRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/20 bg-red-500/10 text-xl font-bold text-red-500 transition hover:bg-red-500 hover:text-white">×</button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line/15 bg-surface-2/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="text-sm text-muted"><span className="font-black text-content">{rateRows.length}</span> {rateRows.length === 1 ? "tarifa configurada" : "tarifas configuradas"}</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRateRows((rows) => [...rows, emptyRate()])} className="rounded-xl border border-brand/25 bg-brand/10 px-4 py-2.5 text-sm font-black text-brand transition hover:bg-brand/15">+ Agregar tarifa</button>
            <button type="button" onClick={saveRates} disabled={savingRates} className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-brand/20 disabled:opacity-60">{savingRates ? "Guardando…" : "Guardar cambios"}</button>
          </div>
        </div>
      </Modal>}
    </section>
  );
}

function Field({ label, children }) { return <label><span className={labelClass}>{label}</span>{children}</label>; }

function PlansTable({ loading, planes, onEdit, onRates, onAssign, onDelete }) {
  return <div className="overflow-hidden rounded-[24px] border border-line/15 bg-surface/90 shadow-lg"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm text-content">
    <thead className="bg-surface-2/80 text-[10px] uppercase tracking-[0.16em] text-muted"><tr><th className="px-5 py-3">Plan</th><th className="px-3 py-3">Costo interno</th><th className="px-3 py-3">Valor unitario</th><th className="px-3 py-3">Valor paquete</th><th className="px-3 py-3">Margen</th><th className="px-3 py-3">Condiciones</th><th className="px-3 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
    <tbody>{loading ? <tr><td colSpan="8" className="px-5 py-12 text-center text-muted">Cargando planes…</td></tr> : planes.length === 0 ? <tr><td colSpan="8" className="px-5 py-12 text-center text-muted">Aún no hay planes.</td></tr> : planes.map((plan) => {
      const reference = tariffReference(plan);
      const commercialPrice = reference ? Number(reference.precio_paquete) : Number(plan.precio || 0);
      const internalCost = Number(plan.costo || 0);
      const hasInternalCost = internalCost > 0;
      const margin = commercialPrice - internalCost;
      return <tr key={plan.id} className="border-t border-line/10 hover:bg-brand/[0.04]">
      <td className="px-5 py-4"><div className="font-black">{plan.nombre_display || plan.nombre}</div><div className="mt-1 max-w-xs text-xs text-muted">{plan.descripcion || "Sin descripción"}</div></td>
      <td className="px-3 py-4">{hasInternalCost ? <span className="text-muted">{money(internalCost, plan.moneda)}</span> : <span className="text-xs font-semibold text-amber-500">Sin definir</span>}</td>
      <td className="px-3 py-4">{reference ? <><div className="font-black">{money(reference.precio_unitario, plan.moneda)}</div><div className="mt-1 text-xs text-muted">Por consulta</div></> : <span className="text-xs font-semibold text-muted">Sin tarifa</span>}</td>
      <td className="px-3 py-4"><div className="font-black">{money(commercialPrice, plan.moneda)}</div>{reference && <div className="mt-1 text-xs text-muted">{Number(reference.cantidad).toLocaleString("es-CO")} consultas</div>}</td>
      <td className="px-3 py-4">{hasInternalCost ? <span className={`font-bold ${margin < 0 ? "text-red-500" : "text-emerald-500"}`}>{money(margin, plan.moneda)}</span> : <span className="text-xs font-semibold text-muted">Pendiente</span>}</td>
      <td className="px-3 py-4"><div>{plan.periodicidad_display}</div><div className="text-xs text-muted">{(plan.tarifas || []).length > 0 ? `${plan.tarifas.length} tarifas por volumen` : plan.consultas_incluidas == null ? "Cupo personalizado" : `${plan.consultas_incluidas} consultas`}</div></td>
      <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${plan.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-muted"}`}>{plan.activo ? "Activo" : "Inactivo"}</span></td>
      <td className="px-5 py-4"><div className="flex justify-end gap-2"><Action onClick={() => onRates(plan)} tone="green">Tarifas</Action><Action onClick={() => onEdit(plan)} tone="brand">Editar</Action><Action onClick={() => onAssign(plan)} tone="violet">Asignar</Action><Action onClick={() => onDelete(plan)} tone="red">Eliminar</Action></div></td>
    </tr>;})}</tbody>
  </table></div></div>;
}

function ProposalsTable({ loading, propuestas, sendingId, onSend, onEdit, onDelete, onStatus }) {
  return <div className="overflow-hidden rounded-[24px] border border-line/15 bg-surface/90 shadow-lg"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm text-content">
    <thead className="bg-surface-2/80 text-[10px] uppercase tracking-[0.16em] text-muted"><tr><th className="px-5 py-3">Propuesta</th><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Vigencia</th><th className="px-3 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
    <tbody>{loading ? <tr><td colSpan="7" className="px-5 py-12 text-center text-muted">Cargando propuestas…</td></tr> : propuestas.length === 0 ? <tr><td colSpan="7" className="px-5 py-12 text-center text-muted">Aún no hay propuestas comerciales.</td></tr> : propuestas.map((proposal) => <tr key={proposal.id} className="border-t border-line/10 hover:bg-brand/[0.04]">
      <td className="px-5 py-4"><div className="font-black">#{proposal.id}</div><div className="text-xs text-muted">{new Date(proposal.creada).toLocaleDateString("es-CO")}</div></td>
      <td className="px-3 py-4"><div className="font-bold">{proposal.cliente_nombre}</div><div className="text-xs text-muted">{proposal.cliente_email}</div>{proposal.cliente_empresa && <div className="text-xs text-muted">{proposal.cliente_empresa}</div>}</td>
      <td className="px-3 py-4"><div className="font-semibold">{proposal.plan_nombre}</div><div className="text-xs text-muted">{proposal.cantidad} unidad(es)</div></td><td className="px-3 py-4 font-black text-brand">{money(proposal.total, proposal.moneda)}</td><td className="px-3 py-4">{new Date(`${proposal.valida_hasta}T00:00:00`).toLocaleDateString("es-CO")}</td>
      <td className="px-3 py-4"><select className="rounded-lg border border-line/20 bg-surface px-2 py-1.5 text-xs font-bold text-content" value={proposal.estado} onChange={(e) => onStatus(proposal, e.target.value)}>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{proposal.fecha_envio && <div className="mt-1 text-[10px] text-muted">Enviada {new Date(proposal.fecha_envio).toLocaleString("es-CO")}</div>}</td>
      <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => onSend(proposal)} disabled={sendingId === proposal.id} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white disabled:opacity-60">{sendingId === proposal.id ? "Enviando…" : proposal.estado === "enviada" ? "Reenviar" : "Enviar"}</button><Action onClick={() => onEdit(proposal)} tone="brand">Editar</Action><Action onClick={() => onDelete(proposal)} tone="red">Eliminar</Action></div></td>
    </tr>)}</tbody>
  </table></div></div>;
}

function Action({ children, onClick, tone }) {
  const colors = tone === "red" ? "border-red-400/25 bg-red-500/10 text-red-600" : tone === "violet" ? "border-violet-400/25 bg-violet-500/10 text-violet-600" : tone === "green" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-600" : "border-brand/25 bg-brand/10 text-brand";
  return <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 font-semibold ${colors}`}>{children}</button>;
}
