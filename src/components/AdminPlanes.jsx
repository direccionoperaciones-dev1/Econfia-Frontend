import React, { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import Toast from "./Toast";
import AjusteIPCPanel from "./AjusteIPCPanel";

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
  periodicidad: "mensual", consultas_incluidas: "", activo: true, ajuste_ipc: true,
};
const defaultExpiry = () => {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().slice(0, 10);
};
const newItem = () => ({
  plan: "", tarifa_origen: "", cantidad: "1", precio_unitario: "", precio_paquete: "",
  descuento_volumen_porcentaje: "0", precio_consulta_adicional: "", descuento_porcentaje: "0",
  usuarios: "", disponibilidad: "", beneficios: "", plan_descripcion: "",
});
const newProposal = () => ({
  cliente_nombre: "", cliente_empresa: "", cliente_email: "",
  moneda: "COP", descuento_porcentaje: "0",
  valida_hasta: defaultExpiry(), observaciones: "",
  items: [newItem()],
});
const itemSubtotal = (item) => item.precio_paquete === "" ? Number(item.precio_unitario || 0) * Number(item.cantidad || 0) : Number(item.precio_paquete || 0);
const itemTotal = (item) => itemSubtotal(item) * (1 - Number(item.descuento_porcentaje || 0) / 100);
const ACCEPT_ADJUNTOS = "image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm,video/quicktime";
const fileSize = (bytes) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const fileIcon = (tipo) => tipo === "video" ? "🎬" : tipo === "pdf" ? "📄" : "🖼️";
const fileType = (file) => file.type.startsWith("video/") ? "video" : file.type === "application/pdf" ? "pdf" : "imagen";
const emptyRate = () => ({
  cantidad: "", precio_unitario: "", precio_paquete: "",
  descuento_porcentaje: "0", precio_consulta_adicional: "", activo: true,
});
const inputClass = "w-full rounded-xl border border-line/20 bg-surface px-3 py-2.5 text-sm text-content outline-none transition placeholder:text-muted/60 focus:border-brand/60";
const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.13em] text-muted";
const money = (value, currency = "COP") => new Intl.NumberFormat("es-CO", {
  style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
}).format(Number(value || 0));
const convertCurrency = (value, source, target, trm) => {
  const amount = Number(value || 0);
  const rate = Number(trm?.valor || 0);
  if (!amount || source === target) return amount;
  if (!rate) return amount;
  if (source === "COP" && target === "USD") return amount / rate;
  if (source === "USD" && target === "COP") return amount * rate;
  return amount;
};
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
  const [proposalFiles, setProposalFiles] = useState([]); // adjuntos nuevos (imagen / PDF / video)
  const [existingFiles, setExistingFiles] = useState([]); // adjuntos ya guardados (al editar)
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
  const [trm, setTrm] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState("COP");
  const [rateCurrency, setRateCurrency] = useState("COP");

  const api = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      // No fijar Content-Type cuando el body es FormData: el navegador agrega el boundary.
      headers: { ...authHeaders, ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    if (!response.ok) throw new Error(await parseError(response, "No fue posible completar la operación."));
    return response.status === 204 ? null : response.json();
  };
  const loadData = async () => {
    setLoading(true);
    try {
      const [plansData, proposalsData, trmData] = await Promise.all([
        api("/api/planes/"), api("/api/propuestas/"), api("/api/trm/").catch(() => null),
      ]);
      setPlanes(Array.isArray(plansData) ? plansData : plansData.results || []);
      setPropuestas(Array.isArray(proposalsData) ? proposalsData : proposalsData.results || []);
      if (trmData) setTrm(trmData);
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
      ajuste_ipc: plan.ajuste_ipc ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changePlanCurrency = (currency) => {
    const source = planForm.moneda;
    setPlanForm((current) => ({
      ...current,
      moneda: currency,
      costo: String(Math.round(convertCurrency(current.costo, source, currency, trm))),
      precio: String(Math.round(convertCurrency(current.precio, source, currency, trm))),
    }));
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
    setRateCurrency(displayCurrency === plan.moneda || trm ? displayCurrency : plan.moneda);
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
  const updateRateMoney = (index, field, value) => updateRate(
    index,
    field,
    value === "" ? "" : String(Math.round(convertCurrency(value, rateCurrency, selectedPlan?.moneda || "COP", trm) * 100) / 100),
  );
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

  const updateItem = (index, changes) => setProposalForm((current) => ({
    ...current, items: current.items.map((item, i) => i === index ? { ...item, ...changes } : item),
  }));
  const chooseItemPlan = (index, planId) => {
    const plan = planes.find((p) => String(p.id) === String(planId));
    updateItem(index, {
      plan: planId, tarifa_origen: "", cantidad: "1",
      precio_unitario: plan ? String(Math.round(convertCurrency(plan.precio || 0, plan.moneda, proposalForm.moneda, trm))) : "",
      precio_paquete: "", descuento_volumen_porcentaje: "0", precio_consulta_adicional: "",
      plan_descripcion: plan?.descripcion || "",
    });
  };
  const chooseItemRate = (index, rateId) => {
    const item = proposalForm.items[index];
    const plan = planes.find((p) => String(p.id) === String(item.plan));
    const rate = (plan?.tarifas || []).find((r) => String(r.id) === String(rateId));
    const conv = (v) => String(convertCurrency(v, plan?.moneda, proposalForm.moneda, trm));
    updateItem(index, rate ? {
      tarifa_origen: rateId, cantidad: String(rate.cantidad),
      precio_unitario: conv(rate.precio_unitario), precio_paquete: conv(rate.precio_paquete),
      descuento_volumen_porcentaje: String(rate.descuento_porcentaje || 0),
      precio_consulta_adicional: rate.precio_consulta_adicional == null ? "" : conv(rate.precio_consulta_adicional),
    } : { tarifa_origen: "", precio_paquete: "", descuento_volumen_porcentaje: "0", precio_consulta_adicional: "" });
  };
  const addItem = () => setProposalForm((current) => ({ ...current, items: [...current.items, newItem()] }));
  const removeItem = (index) => setProposalForm((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }));
  const changeProposalCurrency = (currency) => {
    const source = proposalForm.moneda;
    const conv = (v) => v === "" ? "" : String(convertCurrency(v, source, currency, trm));
    setProposalForm((current) => ({
      ...current, moneda: currency,
      items: current.items.map((item) => ({
        ...item, precio_unitario: conv(item.precio_unitario), precio_paquete: conv(item.precio_paquete),
        precio_consulta_adicional: conv(item.precio_consulta_adicional),
      })),
    }));
  };
  const resetProposal = () => { setProposalForm(newProposal()); setEditingProposalId(null); setProposalFiles([]); setExistingFiles([]); };
  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (existingFiles.length + proposalFiles.length + files.length > 15) {
      setToast({ type: "error", message: "Máximo 15 archivos por propuesta." }); return;
    }
    setProposalFiles((current) => [...current, ...files]);
  };
  const deleteExistingFile = async (file) => {
    if (!window.confirm(`¿Quitar «${file.titulo || file.nombre}» de la propuesta?`)) return;
    try {
      await api(`/api/propuestas/${editingProposalId}/adjuntos/${file.id}/`, { method: "DELETE" });
      setExistingFiles((current) => current.filter((f) => f.id !== file.id));
      await loadData();
    } catch (error) { setToast({ type: "error", message: error.message }); }
  };
  const saveProposal = async (event) => {
    event.preventDefault();
    if (proposalForm.items.some((item) => !item.plan)) { setToast({ type: "error", message: "Selecciona el plan de cada línea." }); return; }
    setSaving(true);
    const numberOrNull = (v) => v === "" || v == null ? null : Number(v);
    const payload = {
      cliente_nombre: proposalForm.cliente_nombre, cliente_empresa: proposalForm.cliente_empresa,
      cliente_email: proposalForm.cliente_email, moneda: proposalForm.moneda,
      descuento_porcentaje: Number(proposalForm.descuento_porcentaje || 0),
      valida_hasta: proposalForm.valida_hasta, observaciones: proposalForm.observaciones,
      items: proposalForm.items.map((item) => ({
        plan: Number(item.plan), tarifa_origen: item.tarifa_origen ? Number(item.tarifa_origen) : null,
        cantidad: Number(item.cantidad || 1), precio_unitario: Number(item.precio_unitario || 0),
        precio_paquete: numberOrNull(item.precio_paquete),
        descuento_volumen_porcentaje: Number(item.descuento_volumen_porcentaje || 0),
        precio_consulta_adicional: numberOrNull(item.precio_consulta_adicional),
        descuento_porcentaje: Number(item.descuento_porcentaje || 0),
        usuarios: numberOrNull(item.usuarios), disponibilidad: item.disponibilidad,
        beneficios: item.beneficios, plan_descripcion: item.plan_descripcion,
      })),
    };
    try {
      const url = editingProposalId ? `/api/propuestas/${editingProposalId}/` : "/api/propuestas/";
      const saved = await api(url, { method: editingProposalId ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (proposalFiles.length) {
        const fd = new FormData();
        proposalFiles.forEach((file) => fd.append("archivos", file));
        try { await api(`/api/propuestas/${saved.id}/adjuntos/`, { method: "POST", body: fd }); }
        catch (error) {
          // La propuesta queda guardada: se pasa a modo edición para reintentar solo los archivos.
          setToast({ type: "error", message: `La propuesta se guardó, pero los archivos no: ${error.message}` });
          setEditingProposalId(saved.id); setExistingFiles(saved.adjuntos || []);
          await loadData(); return;
        }
      }
      setToast({ type: "success", message: editingProposalId ? "Propuesta actualizada." : "Propuesta guardada como borrador." });
      resetProposal(); await loadData();
    } catch (error) { setToast({ type: "error", message: error.message }); }
    finally { setSaving(false); }
  };
  const editProposal = (proposal) => {
    setEditingProposalId(proposal.id);
    const str = (v) => v == null ? "" : String(v);
    const items = (proposal.items || []).map((item) => ({
      plan: str(item.plan), tarifa_origen: str(item.tarifa_origen), cantidad: str(item.cantidad),
      precio_unitario: str(item.precio_unitario), precio_paquete: str(item.precio_paquete),
      descuento_volumen_porcentaje: str(item.descuento_volumen_porcentaje || 0),
      precio_consulta_adicional: str(item.precio_consulta_adicional),
      descuento_porcentaje: str(item.descuento_porcentaje || 0), usuarios: str(item.usuarios),
      disponibilidad: item.disponibilidad || "", beneficios: item.beneficios || "", plan_descripcion: item.plan_descripcion || "",
    }));
    setProposalForm({
      cliente_nombre: proposal.cliente_nombre, cliente_empresa: proposal.cliente_empresa || "",
      cliente_email: proposal.cliente_email, moneda: proposal.moneda || "COP",
      descuento_porcentaje: String(proposal.descuento_porcentaje), valida_hasta: proposal.valida_hasta,
      observaciones: proposal.observaciones || "", items: items.length ? items : [newItem()],
    });
    setProposalFiles([]); setExistingFiles(proposal.adjuntos || []);
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
  const proposalSubtotal = proposalForm.items.reduce((sum, item) => sum + itemTotal(item), 0);
  const proposalTotal = proposalSubtotal * (1 - Number(proposalForm.descuento_porcentaje || 0) / 100);

  return (
    <section className="relative min-h-screen bg-transparent px-3 py-4 pb-28 sm:px-5 md:py-6">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-5 rounded-[26px] border border-line/15 bg-surface/90 px-5 py-5 shadow-xl shadow-black/5 backdrop-blur-xl md:px-7">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand">Centro comercial administrativo</div>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><h2 className="text-3xl font-black tracking-tight text-content md:text-4xl">Planes y propuestas</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Administra costos, precios y condiciones comerciales; prepara propuestas y envíalas al cliente desde el mismo lugar.</p></div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1 rounded-2xl border border-line/15 bg-surface-2/80 p-1.5">
                {['COP', 'USD'].map((currency) => <button key={currency} type="button" disabled={currency === 'USD' && !trm} onClick={() => setDisplayCurrency(currency)} className={`rounded-xl px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${displayCurrency === currency ? "bg-emerald-500 text-white shadow" : "text-muted hover:text-content"}`}>{currency}</button>)}
                {trm && <div className="hidden px-2 text-[10px] leading-4 text-muted lg:block"><span className="font-bold text-content">TRM {money(trm.valor, 'COP')}</span><br />{new Date(`${trm.fecha}T00:00:00`).toLocaleDateString('es-CO')}</div>}
              </div>
              <div className="flex gap-2 rounded-2xl bg-surface-2/80 p-1.5">
                <button onClick={() => setTab("planes")} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "planes" ? "bg-brand text-white shadow" : "text-muted hover:text-content"}`}>Planes ({planes.length})</button>
                <button onClick={() => setTab("propuestas")} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${tab === "propuestas" ? "bg-brand text-white shadow" : "text-muted hover:text-content"}`}>Propuestas ({propuestas.length})</button>
              </div>
            </div>
          </div>
        </header>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {tab === "planes" ? <>
          <form onSubmit={savePlan} className="mb-5 rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg md:p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-content">{editId ? "Editar plan" : "Nuevo plan"}</h3>{editId && <button type="button" onClick={resetPlan} className="text-sm font-bold text-muted hover:text-content">Cancelar edición</button>}</div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Plan"><select className={inputClass} value={planForm.nombre} onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })} disabled={Boolean(editId)}>{PLAN_NAMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Costo interno"><MoneyInput value={planForm.costo} currency={planForm.moneda} onChange={(value) => setPlanForm({ ...planForm, costo: value })} required /></Field>
              <Field label="Precio comercial"><MoneyInput value={planForm.precio} currency={planForm.moneda} onChange={(value) => setPlanForm({ ...planForm, precio: value })} required /></Field>
              <Field label="Moneda"><select className={inputClass} value={planForm.moneda} onChange={(e) => changePlanCurrency(e.target.value)}><option value="COP">COP — Peso colombiano</option><option value="USD" disabled={!trm}>USD — Dólar estadounidense</option></select></Field>
              <Field label="Periodicidad"><select className={inputClass} value={planForm.periodicidad} onChange={(e) => setPlanForm({ ...planForm, periodicidad: e.target.value })}>{PERIODICIDADES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Consultas incluidas"><input className={inputClass} type="number" min="0" placeholder="Sin cupo fijo" value={planForm.consultas_incluidas} onChange={(e) => setPlanForm({ ...planForm, consultas_incluidas: e.target.value })} /></Field>
              <div className="md:col-span-2"><Field label="Descripción"><input className={inputClass} value={planForm.descripcion} onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })} placeholder="Alcance y beneficios del plan" /></Field></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-content"><input type="checkbox" className="h-4 w-4 accent-brand" checked={planForm.activo} onChange={(e) => setPlanForm({ ...planForm, activo: e.target.checked })} />Disponible para propuestas</label>
              <label className="flex items-center gap-2 text-sm font-semibold text-content" title="El precio comercial y las tarifas suben automáticamente con el ajuste IPC anual"><input type="checkbox" className="h-4 w-4 accent-brand" checked={planForm.ajuste_ipc} onChange={(e) => setPlanForm({ ...planForm, ajuste_ipc: e.target.checked })} />Sube con el IPC anual</label>
              <button disabled={saving} className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-60">{saving ? "Guardando…" : editId ? "Actualizar plan" : "Crear plan"}</button>
            </div>
          </form>
          <AjusteIPCPanel api={api} planes={planes} onApplied={loadData} notify={setToast} />
          <PlansTable loading={loading} planes={planes} displayCurrency={displayCurrency} trm={trm} onEdit={editPlan} onRates={openRates} onAssign={openAssign} onDelete={deletePlan} />
        </> : <>
          <form onSubmit={saveProposal} className="mb-5 rounded-[24px] border border-line/15 bg-surface/90 p-5 shadow-lg md:p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-content">{editingProposalId ? `Editar propuesta #${editingProposalId}` : "Nueva propuesta"}</h3>{editingProposalId && <button type="button" onClick={resetProposal} className="text-sm font-bold text-muted hover:text-content">Cancelar edición</button>}</div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Nombre del cliente"><input className={inputClass} value={proposalForm.cliente_nombre} onChange={(e) => setProposalForm({ ...proposalForm, cliente_nombre: e.target.value })} required /></Field>
              <Field label="Empresa"><input className={inputClass} value={proposalForm.cliente_empresa} onChange={(e) => setProposalForm({ ...proposalForm, cliente_empresa: e.target.value })} /></Field>
              <Field label="Correo"><input className={inputClass} type="email" value={proposalForm.cliente_email} onChange={(e) => setProposalForm({ ...proposalForm, cliente_email: e.target.value })} required /></Field>
              <Field label="Moneda de la propuesta"><select className={inputClass} value={proposalForm.moneda} onChange={(e) => changeProposalCurrency(e.target.value)}><option value="COP">COP — Peso colombiano</option><option value="USD" disabled={!trm}>USD — Dólar con TRM</option></select></Field>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <div><div className="text-sm font-black text-content">Planes de la propuesta</div><div className="text-xs text-muted">Agrega uno o varios planes, cada uno con sus condiciones.</div></div>
              <button type="button" onClick={addItem} disabled={proposalForm.items.length >= 20} className="rounded-xl border border-brand/25 bg-brand/10 px-4 py-2 text-sm font-black text-brand transition hover:bg-brand/15 disabled:opacity-50">+ Agregar plan</button>
            </div>
            <div className="mt-3 space-y-3">
              {proposalForm.items.map((item, index) => <ProposalItemCard key={index} index={index} item={item} canRemove={proposalForm.items.length > 1} plans={activePlans} allPlans={planes} currency={proposalForm.moneda} trm={trm} onChange={(changes) => updateItem(index, changes)} onPlan={(planId) => chooseItemPlan(index, planId)} onRate={(rateId) => chooseItemRate(index, rateId)} onRemove={() => removeItem(index)} />)}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Descuento comercial adicional %"><input className={inputClass} type="number" min="0" max="100" step="0.01" value={proposalForm.descuento_porcentaje} onChange={(e) => setProposalForm({ ...proposalForm, descuento_porcentaje: e.target.value })} /></Field>
              <Field label="Válida hasta"><input className={inputClass} type="date" value={proposalForm.valida_hasta} onChange={(e) => setProposalForm({ ...proposalForm, valida_hasta: e.target.value })} required /></Field>
              <div className="md:col-span-2"><Field label="Observaciones"><textarea className={`${inputClass} min-h-20 resize-y`} value={proposalForm.observaciones} onChange={(e) => setProposalForm({ ...proposalForm, observaciones: e.target.value })} placeholder="Condiciones especiales, alcance o notas para el cliente" /></Field></div>
              <div className="md:col-span-2 lg:col-span-3">
                <span className={labelClass}>Imágenes, PDF y videos (se ven en la presentación del cliente)</span>
                <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }} className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand/25 bg-brand/[0.03] px-4 py-5 text-center transition hover:border-brand/50 hover:bg-brand/[0.06]">
                  <span className="text-2xl">📎</span>
                  <span className="mt-1 text-sm font-bold text-content">Arrastra archivos o haz clic para elegir</span>
                  <span className="text-xs text-muted">Imagen hasta 10 MB · PDF hasta 25 MB · Video MP4/WEBM/MOV hasta 90 MB · máx. 15</span>
                  <input type="file" multiple accept={ACCEPT_ADJUNTOS} className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
                {(existingFiles.length > 0 || proposalFiles.length > 0) && <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {existingFiles.map((file) => <div key={`e-${file.id}`} className="flex items-center gap-3 rounded-xl border border-line/15 bg-surface-2/60 px-3 py-2 text-sm">
                    <span className="text-lg">{fileIcon(file.tipo)}</span>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-semibold text-content hover:text-brand">{file.titulo || file.nombre}</a>
                    <span className="text-[10px] text-muted">{fileSize(file.tamano)}</span>
                    <button type="button" onClick={() => deleteExistingFile(file)} className="text-lg font-bold text-red-500" aria-label="Quitar archivo">×</button>
                  </div>)}
                  {proposalFiles.map((file, i) => <div key={`n-${i}`} className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/5 px-3 py-2 text-sm">
                    <span className="text-lg">{fileIcon(fileType(file))}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-content">{file.name}</span>
                    <span className="text-[10px] text-muted">{fileSize(file.size)} · nuevo</span>
                    <button type="button" onClick={() => setProposalFiles((current) => current.filter((_, j) => j !== i))} className="text-lg font-bold text-red-500" aria-label="Quitar archivo">×</button>
                  </div>)}
                </div>}
              </div>
              <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Total propuesto</div><div className="mt-1 text-2xl font-black text-brand">{money(proposalTotal, proposalForm.moneda)}</div><div className="mt-1 text-xs text-muted">{proposalForm.items.length} plan(es){Number(proposalForm.descuento_porcentaje) > 0 ? ` · −${proposalForm.descuento_porcentaje}% adicional` : ""}</div>{proposalForm.moneda === 'USD' && trm && <div className="mt-1 text-[10px] text-muted">Convertido con TRM {money(trm.valor, 'COP')} del {new Date(`${trm.fecha}T00:00:00`).toLocaleDateString('es-CO')}</div>}</div>
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
            <div className="mt-4 inline-flex items-center gap-1 rounded-xl border border-line/15 bg-surface-2/70 p-1">
              {['COP', 'USD'].map((currency) => <button key={currency} type="button" disabled={currency === 'USD' && !trm} onClick={() => setRateCurrency(currency)} className={`rounded-lg px-3 py-1.5 text-xs font-black transition disabled:opacity-40 ${rateCurrency === currency ? 'bg-brand text-white' : 'text-muted hover:text-content'}`}>{currency}</button>)}
              {rateCurrency === 'USD' && trm && <span className="px-2 text-[10px] text-muted">TRM {money(trm.valor, 'COP')}</span>}
            </div>
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
                    <td className="px-3 py-3"><MoneyInput className="min-w-[165px]" ariaLabel="Precio unitario" currency={rateCurrency} value={convertCurrency(rate.precio_unitario, selectedPlan?.moneda, rateCurrency, trm)} onChange={(value) => updateRateMoney(index, "precio_unitario", value)} /></td>
                    <td className="px-3 py-3"><MoneyInput className="min-w-[180px] font-bold" ariaLabel="Precio del paquete" currency={rateCurrency} value={convertCurrency(rate.precio_paquete, selectedPlan?.moneda, rateCurrency, trm)} onChange={(value) => updateRateMoney(index, "precio_paquete", value)} /></td>
                    <td className="px-3 py-3"><div className="relative min-w-[105px]"><input aria-label="Ahorro porcentual" className={`${inputClass} pr-8`} type="number" min="0" max="100" step="0.01" value={rate.descuento_porcentaje} onChange={(e) => updateRate(index, "descuento_porcentaje", e.target.value)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">%</span></div></td>
                    <td className="px-3 py-3"><MoneyInput className="min-w-[180px]" ariaLabel="Precio de consulta adicional" currency={rateCurrency} placeholder="No definida" allowEmpty value={rate.precio_consulta_adicional === '' ? '' : convertCurrency(rate.precio_consulta_adicional, selectedPlan?.moneda, rateCurrency, trm)} onChange={(value) => updateRateMoney(index, "precio_consulta_adicional", value)} /></td>
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

function MoneyInput({ value, onChange, currency = "COP", className = "", placeholder = "0", ariaLabel, allowEmpty = false, required = false }) {
  const numericValue = value === "" ? "" : Math.round(Number(value || 0));
  const formatted = numericValue === "" ? "" : Number(numericValue).toLocaleString("es-CO", { maximumFractionDigits: 0 });
  const handleChange = (event) => {
    const digits = event.target.value.replace(/[^0-9]/g, "");
    onChange(digits === "" && allowEmpty ? "" : digits || "0");
  };
  return <div className={`relative ${className}`}>
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-brand">$</span>
    <input aria-label={ariaLabel} className={`${inputClass} pl-7 pr-12 font-semibold`} type="text" inputMode="numeric" value={formatted} onChange={handleChange} placeholder={placeholder} required={required} />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted">{currency}</span>
  </div>;
}

function PlansTable({ loading, planes, displayCurrency, trm, onEdit, onRates, onAssign, onDelete }) {
  return <div className="overflow-hidden rounded-[24px] border border-line/15 bg-surface/90 shadow-lg"><div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-sm text-content">
    <thead className="bg-surface-2/80 text-[10px] uppercase tracking-[0.16em] text-muted"><tr><th className="px-5 py-3">Plan</th><th className="px-3 py-3">Costo interno</th><th className="px-3 py-3">Valor unitario</th><th className="px-3 py-3">Valor paquete</th><th className="px-3 py-3">Margen</th><th className="px-3 py-3">Condiciones</th><th className="px-3 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
    <tbody>{loading ? <tr><td colSpan="8" className="px-5 py-12 text-center text-muted">Cargando planes…</td></tr> : planes.length === 0 ? <tr><td colSpan="8" className="px-5 py-12 text-center text-muted">Aún no hay planes.</td></tr> : planes.map((plan) => {
      const reference = tariffReference(plan);
      const commercialPriceBase = reference ? Number(reference.precio_paquete) : Number(plan.precio || 0);
      const internalCostBase = Number(plan.costo || 0);
      const commercialPrice = convertCurrency(commercialPriceBase, plan.moneda, displayCurrency, trm);
      const unitPrice = reference ? convertCurrency(reference.precio_unitario, plan.moneda, displayCurrency, trm) : 0;
      const internalCost = convertCurrency(internalCostBase, plan.moneda, displayCurrency, trm);
      const hasInternalCost = internalCost > 0;
      const margin = commercialPrice - internalCost;
      return <tr key={plan.id} className="border-t border-line/10 hover:bg-brand/[0.04]">
      <td className="px-5 py-4"><div className="font-black">{plan.nombre_display || plan.nombre}</div><div className="mt-1 max-w-xs text-xs text-muted">{plan.descripcion || "Sin descripción"}</div></td>
      <td className="px-3 py-4">{hasInternalCost ? <span className="text-muted">{money(internalCost, displayCurrency)}</span> : <span className="text-xs font-semibold text-amber-500">Sin definir</span>}</td>
      <td className="px-3 py-4">{reference ? <><div className="font-black">{money(unitPrice, displayCurrency)}</div><div className="mt-1 text-xs text-muted">Por consulta · {displayCurrency}</div></> : <span className="text-xs font-semibold text-muted">Sin tarifa</span>}</td>
      <td className="px-3 py-4"><div className="font-black">{money(commercialPrice, displayCurrency)}</div>{reference && <div className="mt-1 text-xs text-muted">{Number(reference.cantidad).toLocaleString("es-CO")} consultas · {displayCurrency}</div>}</td>
      <td className="px-3 py-4">{hasInternalCost ? <span className={`font-bold ${margin < 0 ? "text-red-500" : "text-emerald-500"}`}>{money(margin, displayCurrency)}</span> : <span className="text-xs font-semibold text-muted">Pendiente</span>}</td>
      <td className="px-3 py-4"><div>{plan.periodicidad_display}</div><div className="text-xs text-muted">{(plan.tarifas || []).length > 0 ? `${plan.tarifas.length} tarifas por volumen` : plan.consultas_incluidas == null ? "Cupo personalizado" : `${plan.consultas_incluidas} consultas`}</div></td>
      <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${plan.activo ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-muted"}`}>{plan.activo ? "Activo" : "Inactivo"}</span></td>
      <td className="px-5 py-4"><div className="flex justify-end gap-2"><Action onClick={() => onRates(plan)} tone="green">Tarifas</Action><Action onClick={() => onEdit(plan)} tone="brand">Editar</Action><Action onClick={() => onAssign(plan)} tone="violet">Asignar</Action><Action onClick={() => onDelete(plan)} tone="red">Eliminar</Action></div></td>
    </tr>;})}</tbody>
  </table></div></div>;
}

function ProposalItemCard({ index, item, canRemove, plans, allPlans, currency, trm, onChange, onPlan, onRate, onRemove }) {
  const plan = allPlans.find((p) => String(p.id) === String(item.plan));
  const resetRate = { tarifa_origen: "", precio_paquete: "", descuento_volumen_porcentaje: "0", precio_consulta_adicional: "" };
  return <div className="rounded-2xl border border-line/15 bg-surface-2/40 p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-black text-white">{index + 1}</span><span className="text-sm font-black text-content">{plan ? (plan.nombre_display || plan.nombre) : "Nuevo plan"}</span></div>
      <div className="flex items-center gap-3"><span className="text-sm font-black text-brand">{money(itemTotal(item), currency)}</span>{canRemove && <button type="button" onClick={onRemove} className="rounded-lg border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600">Quitar</button>}</div>
    </div>
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <Field label="Plan"><select className={inputClass} value={item.plan} onChange={(e) => onPlan(e.target.value)} required><option value="">Selecciona un plan</option>{plans.map((p) => <option key={p.id} value={p.id}>{p.nombre_display || p.nombre}</option>)}</select></Field>
      <Field label="Tarifa por volumen"><select className={inputClass} value={item.tarifa_origen} onChange={(e) => onRate(e.target.value)} disabled={!plan}><option value="">Precio personalizado</option>{(plan?.tarifas || []).filter((r) => r.activo).map((r) => <option key={r.id} value={r.id}>{r.cantidad.toLocaleString("es-CO")} consultas · {money(convertCurrency(r.precio_paquete, plan.moneda, currency, trm), currency)}</option>)}</select></Field>
      <Field label="Cantidad de consultas"><input className={inputClass} type="number" min="1" value={item.cantidad} onChange={(e) => onChange({ cantidad: e.target.value, ...resetRate })} required /></Field>
      <Field label="Precio por consulta"><MoneyInput value={item.precio_unitario} currency={currency} onChange={(value) => onChange({ precio_unitario: value, ...resetRate })} required /></Field>
      <Field label="Descuento del plan %"><input className={inputClass} type="number" min="0" max="100" step="0.01" value={item.descuento_porcentaje} onChange={(e) => onChange({ descuento_porcentaje: e.target.value })} /></Field>
      <Field label="Usuarios incluidos"><input className={inputClass} type="number" min="1" placeholder="Sin límite definido" value={item.usuarios} onChange={(e) => onChange({ usuarios: e.target.value })} /></Field>
      <div className="md:col-span-2"><Field label="Disponibilidad"><input className={inputClass} maxLength={160} placeholder="Ej. 24/7 · Lun–Vie 7:00–19:00 · Soporte en 2 h" value={item.disponibilidad} onChange={(e) => onChange({ disponibilidad: e.target.value })} /></Field></div>
      <div className="md:col-span-2"><Field label="Descripción para el cliente"><textarea className={`${inputClass} min-h-16 resize-y`} value={item.plan_descripcion} onChange={(e) => onChange({ plan_descripcion: e.target.value })} placeholder="Alcance del plan" /></Field></div>
      <div className="md:col-span-2"><Field label="Beneficios (uno por línea)"><textarea className={`${inputClass} min-h-16 resize-y`} value={item.beneficios} onChange={(e) => onChange({ beneficios: e.target.value })} placeholder={"Resultados en menos de 2 minutos\nInforme PDF descargable\nSoporte prioritario"} /></Field></div>
    </div>
    {(Number(item.descuento_volumen_porcentaje) > 0 || item.precio_consulta_adicional !== "") && <div className="mt-2 text-xs text-muted">{Number(item.descuento_volumen_porcentaje) > 0 && <span className="font-semibold text-emerald-600">Incluye {item.descuento_volumen_porcentaje}% de ahorro por volumen. </span>}{item.precio_consulta_adicional !== "" && <span>Consulta adicional: {money(item.precio_consulta_adicional, currency)}</span>}</div>}
  </div>;
}

function ProposalsTable({ loading, propuestas, sendingId, onSend, onEdit, onDelete, onStatus }) {
  return <div className="overflow-hidden rounded-[24px] border border-line/15 bg-surface/90 shadow-lg"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm text-content">
    <thead className="bg-surface-2/80 text-[10px] uppercase tracking-[0.16em] text-muted"><tr><th className="px-5 py-3">Propuesta</th><th className="px-3 py-3">Cliente</th><th className="px-3 py-3">Plan</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Vigencia</th><th className="px-3 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
    <tbody>{loading ? <tr><td colSpan="7" className="px-5 py-12 text-center text-muted">Cargando propuestas…</td></tr> : propuestas.length === 0 ? <tr><td colSpan="7" className="px-5 py-12 text-center text-muted">Aún no hay propuestas comerciales.</td></tr> : propuestas.map((proposal) => <tr key={proposal.id} className="border-t border-line/10 hover:bg-brand/[0.04]">
      <td className="px-5 py-4"><div className="font-black">#{proposal.id}</div><div className="text-xs text-muted">{new Date(proposal.creada).toLocaleDateString("es-CO")}</div></td>
      <td className="px-3 py-4"><div className="font-bold">{proposal.cliente_nombre}</div><div className="text-xs text-muted">{proposal.cliente_email}</div>{proposal.cliente_empresa && <div className="text-xs text-muted">{proposal.cliente_empresa}</div>}</td>
      <td className="px-3 py-4">{(proposal.items || []).length ? proposal.items.map((item) => <div key={item.id} className="text-xs"><span className="font-semibold text-content">{item.plan_nombre}</span> <span className="text-muted">× {Number(item.cantidad).toLocaleString("es-CO")}</span></div>) : <div className="font-semibold">{proposal.plan_nombre}</div>}{(proposal.adjuntos || []).length > 0 && <div className="mt-1 text-[10px] text-muted">📎 {proposal.adjuntos.length} archivo(s)</div>}</td><td className="px-3 py-4 font-black text-brand">{money(proposal.total, proposal.moneda)}</td><td className="px-3 py-4">{new Date(`${proposal.valida_hasta}T00:00:00`).toLocaleDateString("es-CO")}</td>
      <td className="px-3 py-4"><select className="rounded-lg border border-line/20 bg-surface px-2 py-1.5 text-xs font-bold text-content" value={proposal.estado} onChange={(e) => onStatus(proposal, e.target.value)}>{ESTADOS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{proposal.fecha_envio && <div className="mt-1 text-[10px] text-muted">Enviada {new Date(proposal.fecha_envio).toLocaleString("es-CO")}</div>}<div className={`mt-1 text-[10px] font-semibold ${proposal.vistas ? "text-emerald-600" : "text-muted"}`} title={proposal.vista_ultima ? `Última vez: ${new Date(proposal.vista_ultima).toLocaleString("es-CO")}` : ""}>👁 {proposal.vistas ? `Abierta ${proposal.vistas} ${proposal.vistas === 1 ? "vez" : "veces"}` : "Sin abrir"}</div></td>
      <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => onSend(proposal)} disabled={sendingId === proposal.id} className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white disabled:opacity-60">{sendingId === proposal.id ? "Enviando…" : proposal.estado === "enviada" ? "Reenviar" : "Enviar"}</button>{proposal.enlace_publico && <a href={`${proposal.enlace_publico}?preview=1`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 font-semibold text-violet-600">Ver</a>}<Action onClick={() => onEdit(proposal)} tone="brand">Editar</Action><Action onClick={() => onDelete(proposal)} tone="red">Eliminar</Action></div></td>
    </tr>)}</tbody>
  </table></div></div>;
}

function Action({ children, onClick, tone }) {
  const colors = tone === "red" ? "border-red-400/25 bg-red-500/10 text-red-600" : tone === "violet" ? "border-violet-400/25 bg-violet-500/10 text-violet-600" : tone === "green" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-600" : "border-brand/25 bg-brand/10 text-brand";
  return <button onClick={onClick} className={`rounded-lg border px-3 py-1.5 font-semibold ${colors}`}>{children}</button>;
}
