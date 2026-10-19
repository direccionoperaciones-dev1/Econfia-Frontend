import React, { useEffect, useState } from "react";
import Toast from "./Toast";
import { generarInformeAdminPDF, generarInformeAdminIndividualPDF } from "../pdf/InformeAdminPDFV2";
import AdminSoporte from "../views/AdminSoporte";
import soporteService from "../services/soporteService";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ─── Iconos inline ────────────────────────────────────────────────
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" />
  </svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const SpinIcon = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9.197 4.803A9.956 9.956 0 0112 21c2.21 0 4.267-.72 5.925-1.95M21 12c0 1.657-.403 3.22-1.125 4.575" />
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.925-1.95M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─── Botón de acción reutilizable ─────────────────────────────────
// ─── Input reutilizable para modales ──────────────────────────────
const ModalInput = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-brand font-medium tracking-wide">{label}</label>}
    <input
      {...props}
      className="rounded-lg px-3 py-2 border border-slate-600 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:border-brand focus:bg-slate-800 transition text-sm"
    />
  </div>
);

// ─── Badge de estado ───────────────────────────────────────────────
const Badge = ({ children, color }) => {
  const colors = {
    green:  "bg-green-500/12 text-green-700 border-green-500/30 dark:text-green-300",
    red:    "bg-red-500/12 text-red-700 border-red-500/30 dark:text-red-300",
    cyan:   "bg-brand/12 text-brand border-brand/30 dark:text-brand",
    violet: "bg-violet-500/12 text-violet-700 border-violet-500/30 dark:text-violet-300",
    slate:  "bg-surface-2/70 text-muted border-line/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

const ModeButton = ({ children, active, disabled = false, onClick, activeClass }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`rounded-lg border px-2 py-2 text-xs font-bold transition ${
      active
        ? activeClass
        : "border-white/10 bg-white/[0.025] text-white/45 hover:border-white/25 hover:text-white/75"
    } disabled:cursor-not-allowed disabled:opacity-20`}
  >
    {children}
  </button>
);

// ─── Modal oscuro elegante (reemplaza el Modal blanco en esta vista) ──
const Sheet = ({ children, onClose, title, subtitle, icon, wide = false }) => (
  <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
    <div
      className={`relative flex max-h-[90vh] w-full ${wide ? "max-w-5xl" : "max-w-md"} flex-col overflow-hidden rounded-[24px] border border-brand/25 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950 shadow-2xl shadow-brand/15`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative flex items-center gap-3 border-b border-white/10 px-5 py-4">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand/30 bg-brand/15 text-lg">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-white/45">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      <div className="relative overflow-y-auto px-5 py-5">{children}</div>
    </div>
  </div>
);

const formatPlanName = (name = "") => name ? name.charAt(0).toUpperCase() + name.slice(1) : "Sin plan";

const getRoleSummary = (user) => {
  if (user.is_superuser) return "Superusuario";
  if (user.is_staff) return "Staff";
  return "Usuario";
};


const AdminUsuarios = () => {
  const [filter, setFilter]     = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;
  const [orderAsc, setOrderAsc] = useState(true);
  const [users, setUsers]       = useState([]);
  const [planes, setPlanes]     = useState([]);
  const [toast, setToast]       = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [generandoPDFUserId, setGenerandoPDFUserId] = useState(null);

  // Modales
  const [showModal, setShowModal]           = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [selectedPlanes, setSelectedPlanes] = useState([]);
  const [editUserData, setEditUserData]     = useState({ username: "", email: "", first_name: "", last_name: "", password: "" });
  const [showPassword, setShowPassword]     = useState(false);

  // Configuración personalizada de fuentes por usuario (Basic Element)
  const [showFuentesModal, setShowFuentesModal] = useState(false);
  const [fuentesUser, setFuentesUser] = useState(null);
  const [fuentesCatalogo, setFuentesCatalogo] = useState([]);
  const [fuentesPersonalizada, setFuentesPersonalizada] = useState(false);
  const [fuentesSearch, setFuentesSearch] = useState("");
  const [fuentesLoading, setFuentesLoading] = useState(false);
  const [fuentesSaving, setFuentesSaving] = useState(false);

  // White-label (Organizacion)
  const [organizaciones, setOrganizaciones]       = useState([]);
  const [showOrgModal, setShowOrgModal]           = useState(false);
  const [orgUser, setOrgUser]                     = useState(null);
  const [selectedOrgId, setSelectedOrgId]         = useState("");
  const [orgEsAdmin, setOrgEsAdmin]               = useState(false);
  const [guardandoOrg, setGuardandoOrg]           = useState(false);
  const [showNuevaOrgForm, setShowNuevaOrgForm]   = useState(false);
  const [nuevaOrg, setNuevaOrg]                   = useState({ nombre: "", slug: "", color_acento: "#10b981", color_secundario: "", nombre_wallet: "", max_usuarios: "", pool_consultas: "", pool_infinito: false, max_dispositivos: "" });
  const [nuevaOrgLogo, setNuevaOrgLogo]           = useState(null);
  const [nuevaOrgLogoPreview, setNuevaOrgLogoPreview] = useState("");
  const [creandoOrg, setCreandoOrg]               = useState(false);
  // Config multi-empresa de una organización YA existente (editable desde "Marca")
  const [orgConfig, setOrgConfig]                 = useState({ max_usuarios: "", pool_consultas: "", pool_infinito: false, max_dispositivos: "" });
  const [orgConfigSaving, setOrgConfigSaving]     = useState(false);

  // Consultas realizadas
  const [showConsultasRealizadasModal, setShowConsultasRealizadasModal] = useState(false);
  const [consultasRealizadas, setConsultasRealizadas]           = useState([]);
  const [consultasRealizadasTotal, setConsultasRealizadasTotal] = useState(0);
  const [consultasRealizadasPage, setConsultasRealizadasPage]   = useState(1);
  const [consultasRealizadasLoading, setConsultasRealizadasLoading] = useState(false);
  const [consultasRealizadasUser, setConsultasRealizadasUser]   = useState(null);

  // Asignar consultas
  const [showConsultasModal, setShowConsultasModal] = useState(false);
  const [consultasValue, setConsultasValue]         = useState(0);
  const [consultasInfinitas, setConsultasInfinitas] = useState(false);

  // Consultas masivas
  const [showMasivasModal, setShowMasivasModal]   = useState(false);
  const [masivasUser, setMasivasUser]             = useState(null);
  const [masivasPlanId, setMasivasPlanId]         = useState("");

  // Soporte técnico
  const [showSoporteModal, setShowSoporteModal] = useState(false);
  const [ticketsSoporteActivos, setTicketsSoporteActivos] = useState(0);
  const [loadingSoporte, setLoadingSoporte] = useState(false);

  // Modal único de gestión de usuario (datos + todas las acciones)
  const [gestionUser, setGestionUser] = useState(null);

  const token = localStorage.getItem("token");

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/`, { headers: { Authorization: `Token ${token}` } });
      const data = await res.json();
      setUsers(data);
      setCurrentPage(1);
    } catch {
      setToast({ type: "error", message: "Error al cargar usuarios" });
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const fetchSoporteActivos = async () => {
    if (!token) return;
    setLoadingSoporte(true);
    try {
      const tickets = await soporteService.obtenerTicketsAbiertos();
      setTicketsSoporteActivos(Array.isArray(tickets) ? tickets.length : 0);
    } catch {
      setTicketsSoporteActivos(0);
    } finally {
      setLoadingSoporte(false);
    }
  };

  useEffect(() => { fetchSoporteActivos(); }, [token]);

  const handleOpenSoporteModal = async () => {
    await fetchSoporteActivos();
    setShowSoporteModal(true);
  };

  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const res = await fetch(`${API_URL}/api/planes/`, { headers: { Authorization: `Token ${token}` } });
        setPlanes(await res.json());
      } catch {}
    };
    fetchPlanes();
  }, [token]);

  const fetchOrganizaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/organizaciones/`, { headers: { Authorization: `Token ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setOrganizaciones(Array.isArray(data) ? data : data.results || []);
    } catch {}
  };

  useEffect(() => {
    fetchOrganizaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Precarga la config multi-empresa cuando se selecciona una organización existente.
  useEffect(() => {
    if (!selectedOrgId) {
      setOrgConfig({ max_usuarios: "", pool_consultas: "", pool_infinito: false, max_dispositivos: "" });
      return;
    }
    const org = organizaciones.find((o) => String(o.id) === String(selectedOrgId));
    if (org) {
      setOrgConfig({
        max_usuarios: org.max_usuarios ?? "",
        pool_consultas: org.pool_consultas ?? "",
        pool_infinito: !!org.pool_infinito,
        max_dispositivos: org.max_dispositivos ?? "",
      });
    }
  }, [selectedOrgId, organizaciones]);

  // ── Ver consultas ─────────────────────────────────────────────
  const fetchConsultasRealizadas = async (userId, page = 1) => {
    setConsultasRealizadasLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/admin/users/${userId}/consultas/?page=${page}`, { headers: { Authorization: `Token ${token}` } });
      const data = await res.json();
      setConsultasRealizadas(data.results || []);
      setConsultasRealizadasTotal(data.total || 0);
      setConsultasRealizadasPage(page);
    } catch {
      setToast({ type: "error", message: "Error al cargar consultas del usuario" });
    } finally {
      setConsultasRealizadasLoading(false);
    }
  };

  const handleVerConsultas = (user) => {
    setConsultasRealizadasUser(user);
    setConsultasRealizadas([]);
    setConsultasRealizadasPage(1);
    setShowConsultasRealizadasModal(true);
    fetchConsultasRealizadas(user.id, 1);
  };

  // ── Asignar consultas ─────────────────────────────────────────
  const fetchAllConsultasByUser = async (userId) => {
    const todas = [];
    let page = 1;

    while (true) {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/consultas/?page=${page}`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      const resultados = data.results || [];
      todas.push(...resultados);
      if (todas.length >= (data.total || 0) || resultados.length === 0) break;
      page += 1;
    }

    return todas;
  };

  const handleGenerateIndividualPDF = async (user) => {
    setGenerandoPDFUserId(user.id);
    try {
      const adminName = localStorage.getItem("username") || "Administrador";
      const consultas = await fetchAllConsultasByUser(user.id);
      await generarInformeAdminIndividualPDF(user, adminName, consultas, user.perfil?.organizacion);
    } catch {
      setToast({ type: "error", message: "No se pudo generar el informe individual" });
    } finally {
      setGenerandoPDFUserId(null);
    }
  };

  const handleOpenConsultasModal = (user) => {
    setSelectedUser(user);
    setConsultasValue(user.perfil?.consultas_infinitas ? 0 : (user.perfil?.consultas_disponibles || 0));
    setConsultasInfinitas(!!user.perfil?.consultas_infinitas);
    setShowConsultasModal(true);
  };

  const handleSaveConsultas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/perfiles/${selectedUser.perfil.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ consultas_disponibles: consultasValue, consultas_infinitas: consultasInfinitas }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, perfil: { ...u.perfil, consultas_disponibles: consultasValue, consultas_infinitas: consultasInfinitas } }
          : u
      ));
      setToast({ type: "success", message: "Consultas asignadas" });
      setShowConsultasModal(false);
    } catch {
      setToast({ type: "error", message: "Error al asignar consultas" });
    }
  };

  // ── Editar usuario ────────────────────────────────────────────
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({ username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name, password: "" });
    setShowEditModal(true);
  };

  const handleSaveEditUser = async () => {
    try {
      const dataToSend = { ...editUserData, id: selectedUser.id };
      if (!dataToSend.password) delete dataToSend.password;
      const res = await fetch(`${API_URL}/api/admin/users/`, {
        method: "PUT",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, username: editUserData.username, email: editUserData.email, first_name: editUserData.first_name, last_name: editUserData.last_name }
          : u
      ));
      setToast({ type: "success", message: "Usuario actualizado" });
      setShowEditModal(false);
    } catch {
      setToast({ type: "error", message: "Error al actualizar usuario" });
    }
  };

  // ── Eliminar usuario ──────────────────────────────────────────
  const handleDeleteUser = async (user) => {
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });
      if (res.status !== 204) throw new Error();
      setToast({ type: "success", message: "Usuario eliminado" });
      fetchUsers();
    } catch {
      setToast({ type: "error", message: "Error al eliminar usuario" });
    }
  };

  // ── Editar planes ─────────────────────────────────────────────
  const handleEditPlanes = async (user) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/`, { headers: { Authorization: `Token ${token}` } });
      if (!res.ok) throw new Error();
      const updatedUser = await res.json();
      setSelectedUser(updatedUser);
      setSelectedPlanes((updatedUser.perfil?.planes || []).map((p) => p.id));
      setShowModal(true);
    } catch {
      setToast({ type: "error", message: "No se pudo cargar el usuario actualizado" });
    }
  };

  const handleSavePlanes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/perfiles/${selectedUser.perfil.id}/asignar-planes/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ planes: selectedPlanes }),
      });
      if (!res.ok) throw new Error();
      // Actualizar planes del usuario en el estado local
      const planesAsignados = planes.filter((p) => selectedPlanes.includes(p.id));
      setUsers((prev) => prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, perfil: { ...u.perfil, planes: planesAsignados } }
          : u
      ));
      setToast({ type: "success", message: "Planes actualizados" });
      setShowModal(false);
      setSelectedPlanes([]);
      setSelectedUser(null);
      const userRes = await fetch(`${API_URL}/api/profile/`, { headers: { Authorization: `Token ${token}` } });
      if (userRes.ok) {
        const updatedUser = await userRes.json();
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("user-updated"));
      }
    } catch {
      setToast({ type: "error", message: "Error al guardar planes" });
    }
  };

  // ── Fuentes personalizadas de Basic Element ─────────────────
  const handleOpenFuentes = async (user) => {
    if (!user?.perfil) return;
    setFuentesUser(user);
    setFuentesSearch("");
    setFuentesLoading(true);
    setShowFuentesModal(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/perfiles/${user.perfil.id}/fuentes/?plan=basic-element`,
        { headers: { Authorization: `Token ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo cargar la configuración.");
      setFuentesCatalogo(data.fuentes || []);
      setFuentesPersonalizada(!!data.personalizada);
    } catch (error) {
      setShowFuentesModal(false);
      setToast({ type: "error", message: error.message });
    } finally {
      setFuentesLoading(false);
    }
  };

  const handleFuenteModo = (clave, modo) => {
    setFuentesCatalogo((actual) => actual.map((fuente) =>
      fuente.clave === clave
        ? { ...fuente, modo: fuente.modo === modo ? null : modo }
        : fuente
    ));
  };

  const handleSaveFuentes = async () => {
    const fuentes = fuentesCatalogo
      .filter((fuente) => fuente.modo)
      .map(({ clave, modo }) => ({ clave, modo }));
    if (!fuentes.length) {
      setToast({ type: "error", message: "Selecciona al menos una fuente." });
      return;
    }
    setFuentesSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/perfiles/${fuentesUser.perfil.id}/fuentes/`, {
        method: "PUT",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "basic-element", fuentes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo guardar la configuración.");
      setFuentesCatalogo(data.fuentes || []);
      setFuentesPersonalizada(true);
      setToast({ type: "success", message: `Configuración guardada: ${data.total_seleccionadas} fuentes.` });
    } catch (error) {
      setToast({ type: "error", message: error.message });
    } finally {
      setFuentesSaving(false);
    }
  };

  const handleRestoreFuentes = async () => {
    if (!window.confirm("¿Restaurar las fuentes predeterminadas de Basic Element para este usuario?")) return;
    setFuentesSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/perfiles/${fuentesUser.perfil.id}/fuentes/?plan=basic-element`,
        { method: "DELETE", headers: { Authorization: `Token ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "No se pudo restaurar la configuración.");
      setFuentesCatalogo(data.fuentes || []);
      setFuentesPersonalizada(false);
      setToast({ type: "success", message: "Se restauraron las fuentes predeterminadas del plan." });
    } catch (error) {
      setToast({ type: "error", message: error.message });
    } finally {
      setFuentesSaving(false);
    }
  };

  // ── White-label (Organizacion) ─────────────────────────────────
  const handleAbrirOrganizacion = async (user) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/`, { headers: { Authorization: `Token ${token}` } });
      if (!res.ok) throw new Error();
      const updatedUser = await res.json();
      setOrgUser(updatedUser);
      setSelectedOrgId(updatedUser.perfil?.organizacion ? String(updatedUser.perfil.organizacion.id ?? "") : "");
      setOrgEsAdmin(!!updatedUser.perfil?.es_admin_organizacion);
      setShowNuevaOrgForm(false);
      setShowOrgModal(true);
      fetchOrganizaciones();
    } catch {
      setToast({ type: "error", message: "No se pudo cargar el usuario actualizado" });
    }
  };

  const cerrarOrgModal = () => {
    setShowOrgModal(false);
    setOrgUser(null);
    setShowNuevaOrgForm(false);
    handleSeleccionarLogo(null);
  };

  const handleGuardarOrganizacion = async () => {
    if (!orgUser?.perfil) return;
    setGuardandoOrg(true);
    try {
      const res = await fetch(`${API_URL}/api/perfiles/${orgUser.perfil.id}/asignar-organizacion/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ organizacion_id: selectedOrgId || null, es_admin_organizacion: selectedOrgId ? orgEsAdmin : false }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers((prev) => prev.map((u) =>
        u.id === orgUser.id
          ? { ...u, perfil: { ...u.perfil, organizacion: data.organizacion, es_admin_organizacion: data.es_admin_organizacion } }
          : u
      ));
      setToast({ type: "success", message: selectedOrgId ? "Marca asignada" : "Marca quitada (vuelve a Econfia)" });
      cerrarOrgModal();
    } catch {
      setToast({ type: "error", message: "Error al asignar la organización" });
    } finally {
      setGuardandoOrg(false);
    }
  };

  // Actualiza la config multi-empresa de una organización YA existente (PATCH).
  const handleActualizarEmpresa = async () => {
    if (!selectedOrgId) return;
    setOrgConfigSaving(true);
    try {
      const body = { pool_infinito: !!orgConfig.pool_infinito };
      // max_usuarios vacío => null (sin límite). pool/dispositivos vacíos => no se tocan.
      body.max_usuarios = orgConfig.max_usuarios === "" ? null : Number(orgConfig.max_usuarios);
      if (orgConfig.pool_consultas !== "") body.pool_consultas = Number(orgConfig.pool_consultas);
      if (orgConfig.max_dispositivos !== "") body.max_dispositivos = Number(orgConfig.max_dispositivos);
      const res = await fetch(`${API_URL}/api/organizaciones/${selectedOrgId}/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const primerError = Object.values(data)[0];
        throw new Error(Array.isArray(primerError) ? primerError[0] : "No se pudo actualizar la empresa");
      }
      setOrganizaciones((prev) => prev.map((o) => (String(o.id) === String(selectedOrgId) ? data : o)));
      setToast({ type: "success", message: "Configuración de empresa actualizada" });
    } catch (e) {
      setToast({ type: "error", message: e.message || "Error al actualizar la empresa" });
    } finally {
      setOrgConfigSaving(false);
    }
  };

  const handleSeleccionarLogo = (file) => {
    setNuevaOrgLogo(file || null);
    if (nuevaOrgLogoPreview) URL.revokeObjectURL(nuevaOrgLogoPreview);
    setNuevaOrgLogoPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleCrearOrganizacion = async () => {
    if (!nuevaOrg.nombre.trim() || !nuevaOrg.slug.trim()) {
      setToast({ type: "error", message: "Nombre y slug son obligatorios" });
      return;
    }
    setCreandoOrg(true);
    try {
      const fd = new FormData();
      Object.entries(nuevaOrg).forEach(([key, value]) => {
        // Campos numéricos opcionales: si van vacíos, NO se mandan (el backend
        // usa su default: pool_consultas=0, max_dispositivos=2, max_usuarios=null/sin límite).
        if (["max_usuarios", "pool_consultas", "max_dispositivos"].includes(key) &&
            (value === "" || value === null || value === undefined)) return;
        fd.append(key, value ?? "");
      });
      if (nuevaOrgLogo) fd.append("logo", nuevaOrgLogo);
      const res = await fetch(`${API_URL}/api/organizaciones/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        const primerError = Object.values(data)[0];
        throw new Error(Array.isArray(primerError) ? primerError[0] : "No se pudo crear la organización");
      }
      setOrganizaciones((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setSelectedOrgId(String(data.id));
      setShowNuevaOrgForm(false);
      setNuevaOrg({ nombre: "", slug: "", color_acento: "#10b981", color_secundario: "", nombre_wallet: "", max_usuarios: "", pool_consultas: "", pool_infinito: false, max_dispositivos: "" });
      handleSeleccionarLogo(null);
      setToast({ type: "success", message: "Organización creada" });
    } catch (e) {
      setToast({ type: "error", message: e.message || "Error al crear la organización" });
    } finally {
      setCreandoOrg(false);
    }
  };

  // ── Asignar plan a masivas ────────────────────────────────────
  const handleAsignarPlanMasivas = async (user, planId) => {
    if (!user.perfil || !planId) return;
    const plan = (user.perfil?.planes || []).find((p) => String(p.id) === String(planId));
    if (!plan) return;
    const idsActuales = user.perfil?.planes_masivas_ids || [];
    if (idsActuales.includes(plan.id)) return;
    const nuevosIds = [...idsActuales, plan.id];
    const nuevosPlanes = [...(user.perfil?.planes_masivas || []), plan];
    const usuarioActualizado = { ...user, perfil: { ...user.perfil, planes_masivas_ids: nuevosIds, planes_masivas: nuevosPlanes, consultas_masivas: true } };
    setUsers((prev) => prev.map((u) => u.id === user.id ? usuarioActualizado : u));
    setMasivasUser(usuarioActualizado);
    setMasivasPlanId("");
    try {
      const res = await fetch(`${API_URL}/api/perfiles/${user.perfil.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ planes_masivas_ids: nuevosIds }),
      });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: `Masivas asignadas al plan ${plan.nombre} para ${user.username}` });
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? user : u));
      setMasivasUser(user);
      setToast({ type: "error", message: "Error al asignar masivas al plan" });
    }
  };

  // ── Quitar plan de masivas ────────────────────────────────────
  const handleQuitarPlanMasivas = async (user, planId) => {
    if (!user.perfil) return;
    const nuevosIds = (user.perfil?.planes_masivas_ids || []).filter((id) => id !== planId);
    const nuevosPlanes = (user.perfil?.planes_masivas || []).filter((p) => p.id !== planId);
    const usuarioActualizado = { ...user, perfil: { ...user.perfil, planes_masivas_ids: nuevosIds, planes_masivas: nuevosPlanes, consultas_masivas: nuevosIds.length > 0 } };
    setUsers((prev) => prev.map((u) => u.id === user.id ? usuarioActualizado : u));
    setMasivasUser(usuarioActualizado);
    try {
      const res = await fetch(`${API_URL}/api/perfiles/${user.perfil.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ planes_masivas_ids: nuevosIds }),
      });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: `Plan quitado de masivas para ${user.username}` });
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? user : u));
      setMasivasUser(user);
      setToast({ type: "error", message: "Error al quitar plan de masivas" });
    }
  };

  // ── Desactivar todas las masivas ──────────────────────────────
  const handleDesactivarMasivas = async (user) => {
    if (!user.perfil) return;
    const usuarioActualizado = { ...user, perfil: { ...user.perfil, planes_masivas_ids: [], planes_masivas: [], consultas_masivas: false } };
    setUsers((prev) => prev.map((u) => u.id === user.id ? usuarioActualizado : u));
    setMasivasUser(usuarioActualizado);
    try {
      const res = await fetch(`${API_URL}/api/perfiles/${user.perfil.id}/`, {
        method: "PATCH",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ planes_masivas_ids: [] }),
      });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: `Masivas desactivadas para ${user.username}` });
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? user : u));
      setMasivasUser(user);
      setToast({ type: "error", message: "Error al desactivar masivas" });
    }
  };

  // ── Activar / Desactivar ──────────────────────────────────────
  const handleToggleActive = async (user) => {
    const nuevoEstado = !user.is_active;
    // Actualización optimista
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: nuevoEstado } : u));
    try {
      const endpoint = user.is_active
        ? `${API_URL}/api/usuarios/${user.id}/desactivar/`
        : `${API_URL}/api/usuarios/${user.id}/activar/`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: `Usuario ${nuevoEstado ? "activado" : "desactivado"}` });
    } catch {
      // Revertir si falla
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: user.is_active } : u));
      setToast({ type: "error", message: "Error al cambiar estado del usuario" });
    }
  };

  // ── Datos filtrados y paginados ───────────────────────────────
  const filteredUsers = users
    .filter((u) => {
      if (!filter.trim()) return true;
      const val = filter.trim().toLowerCase();
      return (
        String(u.id).includes(val) ||
        (u.username && u.username.toLowerCase().includes(val)) ||
        (u.email && u.email.toLowerCase().includes(val)) ||
        (u.full_name && u.full_name.toLowerCase().includes(val)) ||
        (u.is_active ? "sí" : "no").includes(val) ||
        (u.is_staff ? "sí" : "no").includes(val) ||
        (u.is_superuser ? "sí" : "no").includes(val) ||
        ((u.perfil?.planes || []).map((p) => p.nombre.toLowerCase()).join(", ").includes(val)) ||
        (u.perfil?.nombre_empresa && u.perfil.nombre_empresa.toLowerCase().includes(val)) ||
        (u.perfil?.nit && u.perfil.nit.toLowerCase().includes(val)) ||
        (u.perfil?.tipo_registro && u.perfil.tipo_registro.toLowerCase().includes(val))
      );
    })
    .slice()
    .sort((a, b) => (orderAsc ? a.id - b.id : b.id - a.id));

  const totalPages  = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const pagedUsers  = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);
  const usuariosActivos = users.filter((u) => u.is_active).length;
  const usuariosEmpresa = users.filter((u) => u.perfil?.tipo_registro === "empresa").length;
  const usuariosConPlanes = users.filter((u) => (u.perfil?.planes || []).length > 0).length;
  const usuariosMasivos = users.filter((u) => u.perfil?.consultas_masivas).length;
  const visibleFrom = filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1;
  const visibleTo = filteredUsers.length === 0 ? 0 : Math.min(currentPage * usersPerPage, filteredUsers.length);

  const estadoColores = {
    completado:    "text-green-400",
    en_proceso:    "text-yellow-400",
    no_encontrado: "text-red-400",
    pendiente:     "text-indigo-400",
  };

  // ── RENDER ─────────────────────────────────────────────────────
  return (
    <section className="min-h-screen px-3 py-4 pb-28 sm:px-5 sm:py-6 sm:pb-32 lg:px-6 lg:pb-36">
      {/* Toast */}
      {toast && (
        <Toast
          {...toast}
          onClose={() => setToast(null)}
          sound={toast.type === "error" ? "/sounds/error-011-352286.mp3" : "/sounds/econfia-bot/econfia-1.wav"}
        />
      )}

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <div className="overflow-hidden rounded-[24px] border border-line/15 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%)] bg-surface/90 px-4 py-4 shadow-2xl shadow-black/5 backdrop-blur-xl sm:px-5 sm:py-5 lg:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand/90">
                Centro administrativo
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-content sm:text-3xl xl:text-4xl">
                Administracion de usuarios
              </h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-muted sm:text-sm sm:leading-6">
                Supervisa cuentas, planes, credito operativo y exportes desde una vista mucho mas comoda para escritorio, tablet y movil.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
              {[
                { label: "Usuarios activos", value: usuariosActivos, icon: "🟢", ring: "border-emerald-400/30", glow: "hover:shadow-emerald-500/20", bg: "from-emerald-500/15", grad: "from-emerald-300 to-teal-200", bar: "from-emerald-400 to-teal-400" },
                { label: "Cuentas empresa", value: usuariosEmpresa, icon: "🏢", ring: "border-violet-400/30", glow: "hover:shadow-violet-500/20", bg: "from-violet-500/15", grad: "from-violet-300 to-purple-200", bar: "from-violet-400 to-purple-400" },
                { label: "Con planes", value: usuariosConPlanes, icon: "📦", ring: "border-sky-400/30", glow: "hover:shadow-sky-500/20", bg: "from-sky-500/15", grad: "from-sky-300 to-brand", bar: "from-sky-400 to-brand" },
                { label: "Masivas activas", value: usuariosMasivos, icon: "⚡", ring: "border-amber-400/30", glow: "hover:shadow-amber-500/20", bg: "from-amber-500/15", grad: "from-amber-300 to-yellow-200", bar: "from-amber-400 to-yellow-400" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`group relative overflow-hidden rounded-2xl border ${item.ring} bg-gradient-to-br ${item.bg} to-surface/70 px-3 py-3 shadow-lg shadow-black/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:px-4 ${item.glow}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{item.label}</div>
                    <span className="text-base leading-none opacity-80">{item.icon}</span>
                  </div>
                  <div className={`mt-2 bg-gradient-to-r ${item.grad} bg-clip-text text-2xl font-black text-transparent sm:text-3xl`}>{item.value}</div>
                  <div className={`mt-2 h-1 w-9 rounded-full bg-gradient-to-r ${item.bar} transition-all duration-300 group-hover:w-14`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-line/15 bg-surface/90 shadow-2xl shadow-black/5 backdrop-blur-xl">
          <div className="border-b border-line/15 bg-surface-2/60 px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full xl:max-w-xl">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand/70">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                    placeholder="Buscar por usuario, email, empresa, NIT o rol..."
                    className="w-full rounded-2xl border border-line/15 bg-surface py-3 pl-10 pr-4 text-sm text-content shadow-inner shadow-black/5 transition placeholder:text-muted/70 focus:border-brand/50 focus:bg-surface focus:outline-none"
                    autoComplete="off"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
                  <button
                    onClick={handleOpenSoporteModal}
                    className="relative inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/12 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 shadow-lg shadow-black/5 transition-all hover:bg-amber-500/20 dark:text-amber-100"
                    title="Ver tickets de soporte técnico"
                  >
                    <span>Tickets</span>
                    <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-slate-950">
                      {loadingSoporte ? "..." : ticketsSoporteActivos}
                    </span>
                    {ticketsSoporteActivos > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setOrderAsc((v) => !v)}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${
                      orderAsc
                        ? "border-brand/30 bg-brand/12 text-brand hover:bg-brand/20"
                        : "border-brand-2/30 bg-brand-2/12 text-brand-2 hover:bg-brand-2/20"
                    }`}
                  >
                    {orderAsc ? "Orden ID asc" : "Orden ID desc"}
                  </button>

                  <button
                    onClick={async () => {
                      setGenerandoPDF(true);
                      try {
                        const adminName = localStorage.getItem("username") || "Administrador";
                        let usersParaPDF = users;
                        try {
                          const resUsers = await fetch(`${API_URL}/api/admin/users/`, { headers: { Authorization: `Token ${token}` } });
                          if (resUsers.ok) usersParaPDF = await resUsers.json();
                        } catch {}
                        const consultasPorUsuario = {};
                        await Promise.all(
                          usersParaPDF.map(async (u) => {
                            try {
                              consultasPorUsuario[u.id] = await fetchAllConsultasByUser(u.id);
                            } catch {
                              consultasPorUsuario[u.id] = [];
                            }
                          })
                        );
                        await generarInformeAdminPDF(usersParaPDF, adminName, consultasPorUsuario);
                      } finally {
                        setGenerandoPDF(false);
                      }
                    }}
                    disabled={generandoPDF}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand via-sky-500 to-brand-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-brand/20 transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
                  >
                    {generandoPDF ? <><SpinIcon /> Generando...</> : <><DownloadIcon /> Informe PDF</>}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="group rounded-2xl border border-line/15 bg-surface/80 px-4 py-3 transition-all hover:border-brand/30 hover:bg-surface">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Resultados visibles
                  </div>
                  <div className="mt-2 text-xl font-bold text-content">{filteredUsers.length}</div>
                </div>
                <div className="group rounded-2xl border border-line/15 bg-surface/80 px-4 py-3 transition-all hover:border-sky-400/30 hover:bg-surface">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Rango mostrado
                  </div>
                  <div className="mt-2 text-xl font-bold text-content">{visibleFrom} - {visibleTo}</div>
                </div>
                <div className="group rounded-2xl border border-line/15 bg-surface/80 px-4 py-3 transition-all hover:border-violet-400/30 hover:bg-surface">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Pagina actual
                  </div>
                  <div className="mt-2 text-xl font-bold text-content">{currentPage} / {totalPages}</div>
                </div>
                <div className="group rounded-2xl border border-line/15 bg-surface/80 px-4 py-3 transition-all hover:border-emerald-400/30 hover:bg-surface">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Cobertura
                  </div>
                  <div className="mt-2 text-sm font-semibold text-brand">
                    {filter.trim() ? "Listado filtrado por busqueda activa" : "Vista completa del padron de usuarios"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="block xl:hidden px-3 py-3 sm:px-4 sm:py-4">
            {pagedUsers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line/20 bg-surface-2/50 px-4 py-14 text-center text-sm text-muted">
                No se encontraron usuarios con ese filtro.
              </div>
            ) : (
              <div className="space-y-4">
                {pagedUsers.map((u) => (
                  <article
                    key={u.id}
                    className="overflow-hidden rounded-[26px] border border-line/15 bg-surface/90 shadow-xl shadow-black/5"
                  >
                    <div className="border-b border-line/10 bg-brand/5 px-4 py-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/12 text-lg font-black uppercase text-brand">
                          {(u.username || "U").slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-content sm:text-lg">{u.username}</h3>
                            <span className="rounded-full border border-line/15 bg-surface-2/70 px-2 py-0.5 text-[11px] font-mono text-muted">#{u.id}</span>
                            {u.is_active ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge>}
                          </div>
                          <p className="mt-1 break-all text-xs text-muted">{u.email || "Sin email registrado"}</p>
                          <p className="mt-1 text-sm text-content/75">{u.full_name || "Sin nombre completo"}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-2xl border border-line/15 bg-surface-2/70 px-3 py-2.5">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Tipo</div>
                          <div className="mt-1 text-sm font-semibold text-content">{u.perfil?.tipo_registro === "empresa" ? "Empresa" : "Natural"}</div>
                        </div>
                        <div className="rounded-2xl border border-line/15 bg-surface-2/70 px-3 py-2.5">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Rol</div>
                          <div className="mt-1 text-sm font-semibold text-content">{getRoleSummary(u)}</div>
                        </div>
                        <div className="rounded-2xl border border-line/15 bg-surface-2/70 px-3 py-2.5">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Planes</div>
                          <div className="mt-1 text-sm font-semibold text-content">{(u.perfil?.planes || []).length}</div>
                        </div>
                        <div className="rounded-2xl border border-line/15 bg-surface-2/70 px-3 py-2.5">
                          <div className="text-[10px] uppercase tracking-[0.18em] text-muted">Creditos</div>
                          <div className="mt-1 text-sm font-semibold text-content">{u.perfil?.consultas_infinitas ? "Ilimitados" : (u.perfil?.consultas_disponibles ?? 0)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4 sm:px-5">
                      {u.perfil?.tipo_registro === "empresa" && (
                        <div className="mb-4 rounded-2xl border border-violet-500/15 bg-violet-500/8 px-4 py-3">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/60">Entidad asociada</div>
                          <div className="mt-1 text-sm font-semibold text-content">{u.perfil.nombre_empresa || "Sin nombre de empresa"}</div>
                          <div className="mt-1 text-xs font-mono text-violet-200/70">{u.perfil.nit ? `NIT ${u.perfil.nit}` : "Sin NIT registrado"}</div>
                        </div>
                      )}

                      {(u.perfil?.planes || []).length > 0 ? (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {u.perfil.planes.map((p) => (
                            <span
                              key={p.id}
                              className="rounded-full border border-brand/15 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
                            >
                              {formatPlanName(p.nombre)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mb-4 rounded-2xl border border-line/15 bg-surface-2/50 px-4 py-3 text-xs text-muted">
                          Este usuario no tiene planes asignados.
                        </div>
                      )}

                      <div className="mb-4 flex flex-wrap gap-2">
                        {u.is_superuser && <Badge color="violet">Super</Badge>}
                        {u.is_staff && !u.is_superuser && <Badge color="cyan">Staff</Badge>}
                        {u.perfil?.consultas_masivas && <Badge color="violet">Masivas activas</Badge>}
                      </div>

                      <button
                        onClick={() => setGestionUser(u)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/15 to-brand-2/15 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-brand transition-all hover:from-brand/30 hover:to-brand-2/30 hover:shadow-lg hover:shadow-brand/20"
                      >
                        ⚙ Gestionar usuario
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="hidden xl:block px-4 py-4">
            <div className="overflow-hidden rounded-[24px] border border-line/15 bg-surface/80">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1320px] text-left text-sm">
                  <thead className="bg-surface-2/80 text-[11px] uppercase tracking-[0.18em] text-muted">
                    <tr className="border-b border-line/15">
                      <th className="px-4 py-4 font-semibold">ID</th>
                      <th className="px-4 py-4 font-semibold">Usuario</th>
                      <th className="px-4 py-4 font-semibold">Email</th>
                      <th className="px-4 py-4 font-semibold">Nombre</th>
                      <th className="px-4 py-4 font-semibold">Tipo</th>
                      <th className="px-4 py-4 font-semibold">Empresa / NIT</th>
                      <th className="px-4 py-4 font-semibold">Estado</th>
                      <th className="px-4 py-4 font-semibold">Roles</th>
                      <th className="px-4 py-4 font-semibold">Planes</th>
                      <th className="px-4 py-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/10">
                    {pagedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-16 text-center text-sm text-muted">
                          No se encontraron usuarios con ese filtro.
                        </td>
                      </tr>
                    ) : (
                      pagedUsers.map((u) => (
                        <tr key={u.id} className="group align-top transition-colors hover:bg-brand/[0.06]">
                          <td className="px-4 py-4">
                            <span className="rounded-full border border-line/15 bg-surface-2/70 px-2.5 py-1 text-xs font-mono text-muted transition-colors group-hover:border-brand/30 group-hover:text-brand">
                              #{u.id}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-sm font-black uppercase text-brand transition-all duration-300 group-hover:border-brand/50 group-hover:bg-brand/20 group-hover:shadow-[0_0_14px_rgba(34,211,238,0.3)]">
                                {(u.username || "U").slice(0, 1)}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-content">{u.username}</div>
                                <div className="mt-1 text-xs text-muted">{getRoleSummary(u)}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="break-all text-xs leading-5 text-muted">{u.email || "Sin email"}</span>
                          </td>

                          <td className="px-4 py-4">
                            <span className="text-xs font-medium text-content/80">{u.full_name || "Sin nombre completo"}</span>
                          </td>

                          <td className="px-4 py-4">
                            {u.perfil?.tipo_registro === "empresa"
                              ? <Badge color="violet">Empresa</Badge>
                              : <Badge color="cyan">Natural</Badge>}
                          </td>

                          <td className="px-4 py-4">
                            {u.perfil?.tipo_registro === "empresa" ? (
                              <div className="max-w-[220px] rounded-2xl border border-violet-400/10 bg-violet-500/[0.06] px-3 py-2">
                                <div className="truncate text-xs font-semibold text-content">{u.perfil.nombre_empresa || "Sin nombre"}</div>
                                <div className="mt-1 text-xs font-mono text-violet-200/70">{u.perfil.nit ? `NIT ${u.perfil.nit}` : "Sin NIT"}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted">No aplica</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {u.is_active ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge>}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex max-w-[180px] flex-wrap gap-1.5">
                              {u.is_superuser && <Badge color="violet">Super</Badge>}
                              {u.is_staff && !u.is_superuser && <Badge color="cyan">Staff</Badge>}
                              {u.perfil?.consultas_masivas && <Badge color="violet">Masivas</Badge>}
                              {!u.is_superuser && !u.is_staff && !u.perfil?.consultas_masivas && (
                                <span className="text-xs text-muted">Sin distintivos</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            {(u.perfil?.planes || []).length > 0 ? (
                              <div className="flex max-w-[220px] flex-wrap gap-1.5">
                                {u.perfil.planes.map((p) => (
                                  <span
                                    key={p.id}
                                    className="rounded-full border border-brand/25 bg-gradient-to-r from-brand/20 to-brand-2/20 px-2.5 py-1 text-xs font-semibold text-brand shadow-sm shadow-brand/10"
                                  >
                                    {formatPlanName(p.nombre)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs italic text-muted">Sin plan</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <button
                              onClick={() => setGestionUser(u)}
                              className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-gradient-to-r from-brand/15 to-brand-2/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-brand transition-all hover:from-brand/30 hover:to-brand-2/30 hover:shadow-lg hover:shadow-brand/20"
                            >
                              ⚙ Gestionar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="border-t border-line/15 bg-surface-2/60 px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted">
                Mostrando <span className="font-semibold text-content/80">{visibleFrom} - {visibleTo}</span> de <span className="font-semibold text-brand">{filteredUsers.length}</span> usuarios.
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-line/15 bg-surface px-3.5 py-2 text-xs font-semibold text-content/70 transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Anterior
                </button>
                <span className="rounded-xl border border-brand/20 bg-brand/10 px-3.5 py-2 text-xs font-bold text-brand">
                  Pagina {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-xl border border-line/15 bg-surface px-3.5 py-2 text-xs font-semibold text-content/70 transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Modal: Gestión de usuario (datos + acciones) ── */}
      {gestionUser && (() => {
        const gu = gestionUser;
        const perfil = gu.perfil || {};
        const planesU = perfil.planes || [];
        const cerrar = () => setGestionUser(null);
        const act = (fn) => { cerrar(); fn(); };
        const credito = (v) => (perfil.consultas_infinitas ? "∞" : (v ?? 0));

        const Dato = ({ label, value, mono }) => (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">{label}</div>
            <div className={`mt-1 text-sm font-medium text-white ${mono ? "font-mono" : ""} break-words`}>{value}</div>
          </div>
        );

        const Accion = ({ icon, label, sub, onClick, tone = "cyan", disabled }) => {
          const tones = {
            cyan:   "border-brand/25 hover:border-brand/50 hover:bg-brand/10 text-brand",
            teal:   "border-teal-400/25 hover:border-teal-400/50 hover:bg-teal-500/10 text-teal-200",
            sky:    "border-sky-400/25 hover:border-sky-400/50 hover:bg-sky-500/10 text-sky-200",
            violet: "border-violet-400/25 hover:border-violet-400/50 hover:bg-violet-500/10 text-violet-200",
            green:  "border-emerald-400/25 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-emerald-200",
            indigo: "border-indigo-400/25 hover:border-indigo-400/50 hover:bg-indigo-500/10 text-indigo-200",
            amber:  "border-amber-400/25 hover:border-amber-400/50 hover:bg-amber-500/10 text-amber-200",
            red:    "border-rose-400/25 hover:border-rose-400/50 hover:bg-rose-500/10 text-rose-200",
            fuchsia:"border-fuchsia-400/25 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10 text-fuchsia-200",
          };
          return (
            <button
              onClick={onClick}
              disabled={disabled}
              className={`flex items-center gap-3 rounded-2xl border bg-white/[0.02] px-3.5 py-3 text-left transition-all disabled:cursor-wait disabled:opacity-50 ${tones[tone]}`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight">{label}</span>
                {sub && <span className="block text-[11px] text-white/40 leading-tight">{sub}</span>}
              </span>
            </button>
          );
        };

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={cerrar}>
            <div
              className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-brand/25 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950 shadow-2xl shadow-brand/15"
              onClick={(e) => e.stopPropagation()}
            >
              {/* glow */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />

              {/* Header */}
              <div className="relative flex shrink-0 items-center gap-4 border-b border-white/10 px-5 py-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/30 bg-brand/15 text-xl font-black uppercase text-brand shadow-lg shadow-brand/20">
                  {(gu.username || "U").slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand/80">Gestión de usuario</p>
                  <h3 className="truncate text-xl font-black text-white">{gu.username}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {gu.is_active ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge>}
                    {gu.is_superuser && <Badge color="violet">Super</Badge>}
                    {gu.is_staff && !gu.is_superuser && <Badge color="cyan">Staff</Badge>}
                    {perfil.consultas_masivas && <Badge color="violet">Masivas</Badge>}
                  </div>
                </div>
                <button
                  onClick={cerrar}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="relative overflow-y-auto px-5 py-5 space-y-5">
                {/* Créditos destacados */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/12 to-transparent px-3 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-brand/80">Disponibles</div>
                    <div className="mt-1 text-2xl font-black text-white">{credito(perfil.consultas_disponibles)}</div>
                  </div>
                  <div className="rounded-2xl border border-brand-2/20 bg-gradient-to-br from-brand-2/12 to-transparent px-3 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-2/80">Cargadas</div>
                    <div className="mt-1 text-2xl font-black text-white">{credito(perfil.consultas_cargadas_total)}</div>
                  </div>
                  <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 to-transparent px-3 py-3 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">Consumidas</div>
                    <div className="mt-1 text-2xl font-black text-white">{perfil.consultas_consumidas ?? 0}</div>
                  </div>
                </div>

                {/* Datos */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Dato label="Email" value={gu.email || "Sin email"} />
                  <Dato label="Nombre completo" value={gu.full_name || "Sin nombre"} />
                  <Dato label="Tipo" value={perfil.tipo_registro === "empresa" ? "Empresa" : "Natural"} />
                  <Dato label="Empresa / NIT" value={perfil.tipo_registro === "empresa" ? `${perfil.nombre_empresa || "Sin nombre"} · ${perfil.nit ? "NIT " + perfil.nit : "Sin NIT"}` : "No aplica"} />
                  <Dato label="Roles" value={getRoleSummary(gu)} />
                  <Dato label="ID" value={`#${gu.id}`} mono />
                </div>

                {/* Planes */}
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Planes activos</div>
                  {planesU.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {planesU.map((p) => (
                        <span key={p.id} className="rounded-full border border-brand/25 bg-gradient-to-r from-brand/20 to-brand-2/20 px-3 py-1 text-xs font-semibold text-brand">
                          {formatPlanName(p.nombre)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs italic text-white/30">Sin planes asignados</span>
                  )}
                </div>

                {/* Acciones */}
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Acciones</div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Accion icon="💳" tone="cyan"   label="Créditos" sub="Aumentar / ajustar saldo" onClick={() => act(() => handleOpenConsultasModal(gu))} />
                    <Accion icon="📊" tone="teal"   label="Ver consultas" sub="Cédulas consultadas" onClick={() => act(() => handleVerConsultas(gu))} />
                    {gu.perfil && <Accion icon="📦" tone="sky" label="Editar planes" sub="Asignar o quitar planes" onClick={() => act(() => handleEditPlanes(gu))} />}
                    {gu.perfil && planesU.some((plan) => plan.nombre === "basic-element") && (
                      <Accion icon="🧩" tone="teal" label="Configurar fuentes" sub="Captura y sin captura" onClick={() => act(() => handleOpenFuentes(gu))} />
                    )}
                    {gu.perfil && <Accion icon="🎨" tone="fuchsia" label={perfil.organizacion ? `Marca: ${perfil.organizacion.nombre}` : "White-label"} sub="Marca blanca del cliente" onClick={() => act(() => handleAbrirOrganizacion(gu))} />}
                    {gu.perfil && <Accion icon="⚡" tone="violet" label={perfil.consultas_masivas ? "Masivas (activas)" : "Masivas"} sub="Consultas masivas" onClick={() => act(() => { setMasivasUser(gu); setMasivasPlanId(""); setShowMasivasModal(true); })} />}
                    <Accion icon="✏️" tone="indigo" label="Editar usuario" sub="Datos de la cuenta" onClick={() => act(() => handleEditUser(gu))} />
                    <Accion icon="📄" tone="green"  label="PDF usuario" sub="Informe individual" disabled={generandoPDFUserId === gu.id} onClick={() => act(() => handleGenerateIndividualPDF(gu))} />
                    <Accion icon={gu.is_active ? "🔌" : "✅"} tone={gu.is_active ? "amber" : "green"} label={gu.is_active ? "Desactivar" : "Activar"} sub="Estado de la cuenta" onClick={() => act(() => handleToggleActive(gu))} />
                    <Accion icon="🗑" tone="red" label="Eliminar" sub="Borrar usuario" onClick={() => act(() => handleDeleteUser(gu))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal: Soporte técnico ── */}
      {showSoporteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-brand/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl shadow-cyan-950/40">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-white">Centro de soporte técnico</h3>
                <p className="mt-1 text-xs text-white/45">
                  Tickets activos: <span className="font-bold text-amber-300">{ticketsSoporteActivos}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSoporteModal(false);
                  fetchSoporteActivos();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar soporte"
              >
                ×
              </button>
            </div>
            <div className="max-h-[calc(88vh-72px)] overflow-y-auto p-5">
              <AdminSoporte embedded />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Consultas Masivas ── */}
      {showMasivasModal && masivasUser && (
        <Sheet
          onClose={() => setShowMasivasModal(false)}
          icon="⚡"
          title="Consultas Masivas"
          subtitle={`Usuario: ${masivasUser.username}`}
        >
          <div className="flex flex-col gap-4">
            {/* Estado actual */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs text-white/50">Estado actual:</span>
              {(masivasUser.perfil?.planes_masivas_ids || []).length > 0
                ? <Badge color="violet">✓ Masivas activas</Badge>
                : <Badge color="slate">Sin acceso</Badge>}
            </div>

            {/* Selector de plan + botón Asignar */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-violet-400 font-medium tracking-wide">
                Asignar masivas a un plan
              </label>
              <div className="flex gap-2">
                <select
                  value={masivasPlanId}
                  onChange={(e) => setMasivasPlanId(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2 border border-slate-600 bg-slate-800/80 text-white focus:outline-none focus:border-violet-500 transition text-sm appearance-none cursor-pointer"
                >
                  <option value="">— Seleccione un plan —</option>
                  {(masivasUser.perfil?.planes || [])
                    .filter((p) => !(masivasUser.perfil?.planes_masivas_ids || []).includes(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1)}
                      </option>
                    ))}
                </select>
                <button
                  disabled={!masivasPlanId}
                  onClick={() => handleAsignarPlanMasivas(masivasUser, masivasPlanId)}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-xs transition whitespace-nowrap"
                >
                  Asignar
                </button>
              </div>
            </div>

            {/* Lista de planes con masivas asignadas */}
            {(masivasUser.perfil?.planes_masivas_ids || []).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-white/40">Planes con masivas activas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(masivasUser.perfil?.planes || [])
                    .filter((p) => (masivasUser.perfil?.planes_masivas_ids || []).includes(p.id))
                    .map((p) => (
                      <span key={p.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-900/40 text-violet-300 border border-violet-700/30 font-medium">
                        {p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1)}
                        <button
                          onClick={() => handleQuitarPlanMasivas(masivasUser, p.id)}
                          className="ml-0.5 text-violet-400 hover:text-red-400 transition font-bold leading-none"
                          title="Quitar"
                        >×</button>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Acciones: Desactivar todo + Cancelar */}
            <div className="flex gap-2 pt-1">
              {(masivasUser.perfil?.planes_masivas_ids || []).length > 0 && (
                <button
                  onClick={() => handleDesactivarMasivas(masivasUser)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition border border-slate-600"
                >
                  Desactivar todas
                </button>
              )}
              <button
                onClick={() => setShowMasivasModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-sm transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {/* ── Modal: Asignar créditos ── */}
      {showConsultasModal && (
        <Sheet
          onClose={() => setShowConsultasModal(false)}
          icon="💳"
          title="Asignar consultas"
          subtitle={`Usuario: ${selectedUser?.username || ""}`}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/55">Número de consultas</label>
              <input
                type="number"
                min={0}
                value={consultasValue}
                onChange={(e) => setConsultasValue(e.target.value === "" ? "" : Number(e.target.value))}
                onBlur={(e) => { if (e.target.value === "") setConsultasValue(0); }}
                disabled={consultasInfinitas}
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-brand/60 focus:bg-slate-900 disabled:opacity-40"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 transition hover:bg-white/[0.06]">
              <input
                type="checkbox"
                checked={consultasInfinitas}
                onChange={(e) => setConsultasInfinitas(e.target.checked)}
                className="h-5 w-5 accent-brand"
              />
              <span className="text-sm font-medium text-white/85">Consultas infinitas (∞)</span>
            </label>
            <button
              onClick={handleSaveConsultas}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110"
            >
              Guardar
            </button>
          </div>
        </Sheet>
      )}

      {/* ── Modal: Editar usuario ── */}
      {showEditModal && (
        <Sheet
          onClose={() => setShowEditModal(false)}
          icon="✏️"
          title="Editar usuario"
          subtitle={`ID: #${selectedUser?.id ?? ""}`}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ModalInput label="Usuario"  name="username"   value={editUserData.username}   onChange={(e) => setEditUserData({ ...editUserData, [e.target.name]: e.target.value })} placeholder="usuario" />
              <ModalInput label="Email"    name="email"      value={editUserData.email}      onChange={(e) => setEditUserData({ ...editUserData, [e.target.name]: e.target.value })} placeholder="email@..." />
              <ModalInput label="Nombre"   name="first_name" value={editUserData.first_name} onChange={(e) => setEditUserData({ ...editUserData, [e.target.name]: e.target.value })} placeholder="Nombre" />
              <ModalInput label="Apellido" name="last_name"  value={editUserData.last_name}  onChange={(e) => setEditUserData({ ...editUserData, [e.target.name]: e.target.value })} placeholder="Apellido" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-brand font-medium tracking-wide">Nueva contraseña <span className="text-white/30">(opcional)</span></label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={editUserData.password}
                  onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-2 pr-10 border border-slate-600 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:border-brand transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <button
              onClick={handleSaveEditUser}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110"
            >
              Guardar cambios
            </button>
          </div>
        </Sheet>
      )}

      {/* ── Modal: Editar planes ── */}
      {showModal && (
        <Sheet
          onClose={() => setShowModal(false)}
          icon="📦"
          title="Editar planes"
          subtitle={`Usuario: ${selectedUser?.username || ""}`}
        >
          <div className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {planes.map((plan) => {
              const on = selectedPlanes.includes(plan.id);
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() =>
                    on
                      ? setSelectedPlanes(selectedPlanes.filter((id) => id !== plan.id))
                      : setSelectedPlanes([...selectedPlanes, plan.id])
                  }
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                    on
                      ? "border-brand/50 bg-brand/15 text-brand"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-black ${
                    on ? "border-brand bg-brand text-slate-900" : "border-white/30 text-transparent"
                  }`}>✓</span>
                  <span className="truncate font-medium">{formatPlanName(plan.nombre)}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSavePlanes}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:brightness-110"
          >
            Guardar cambios
          </button>
        </Sheet>
      )}

      {/* ── Modal: Fuentes personalizadas de Basic Element ── */}
      {showFuentesModal && (
        <Sheet
          onClose={() => setShowFuentesModal(false)}
          icon="🧩"
          title="Configurar fuentes"
          subtitle={`Basic Element · ${fuentesUser?.username || ""}`}
          wide
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge color={fuentesPersonalizada ? "violet" : "cyan"}>
                  {fuentesPersonalizada ? "Configuración personalizada" : "Valores del plan"}
                </Badge>
                <span className="text-xs text-white/45">
                  {fuentesCatalogo.filter((fuente) => fuente.modo).length} fuentes activas
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45">
                Cada fuente puede ejecutarse con evidencia visual, sin captura o quedar deshabilitada únicamente para este usuario.
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"><SearchIcon /></span>
              <input
                value={fuentesSearch}
                onChange={(e) => setFuentesSearch(e.target.value)}
                placeholder="Buscar fuente..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand/50"
              />
            </div>
          </div>

          <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_120px_130px_110px] gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35 md:grid">
            <span>Fuente</span><span className="text-center">Con captura</span><span className="text-center">Sin captura</span><span className="text-center">Desactivada</span>
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {fuentesLoading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-white/50"><SpinIcon /> Cargando catálogo…</div>
            ) : fuentesCatalogo
              .filter((fuente) => {
                const q = fuentesSearch.trim().toLowerCase();
                return !q || fuente.nombre.toLowerCase().includes(q) || fuente.clave.toLowerCase().includes(q);
              })
              .map((fuente) => (
                <div key={fuente.clave} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-3 md:grid-cols-[minmax(0,1fr)_120px_130px_110px] md:items-center">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{fuente.nombre}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/35">
                      <span className="truncate font-mono">{fuente.clave}</span>
                      {fuente.predeterminada && <span className="rounded bg-brand/15 px-1.5 py-0.5 font-bold text-brand">DEL PLAN</span>}
                    </div>
                  </div>
                  <ModeButton
                    active={fuente.modo === "captura"}
                    disabled={!fuente.disponible_captura}
                    onClick={() => handleFuenteModo(fuente.clave, "captura")}
                    activeClass="border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                  >📸 Captura</ModeButton>
                  <ModeButton
                    active={fuente.modo === "sin_captura"}
                    disabled={!fuente.disponible_sin_captura}
                    onClick={() => handleFuenteModo(fuente.clave, "sin_captura")}
                    activeClass="border-violet-400/60 bg-violet-400/15 text-violet-200"
                  >⚡ Sin captura</ModeButton>
                  <ModeButton
                    active={!fuente.modo}
                    onClick={() => setFuentesCatalogo((actual) => actual.map((item) => item.clave === fuente.clave ? { ...item, modo: null } : item))}
                    activeClass="border-red-400/50 bg-red-400/10 text-red-200"
                  >Desactivada</ModeButton>
                </div>
              ))}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-between">
            <button type="button" onClick={handleRestoreFuentes} disabled={fuentesSaving || !fuentesPersonalizada} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/65 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35">Restaurar valores del plan</button>
            <button type="button" onClick={handleSaveFuentes} disabled={fuentesSaving || fuentesLoading} className="rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand/20 disabled:opacity-50">{fuentesSaving ? "Guardando…" : "Guardar configuración"}</button>
          </div>
        </Sheet>
      )}

      {/* ── Modal: White-label (Organizacion) ── */}
      {showOrgModal && (
        <Sheet
          onClose={cerrarOrgModal}
          icon="🎨"
          title="Marca blanca (white-label)"
          subtitle={`Usuario: ${orgUser?.username || ""}`}
        >
          <div className="flex flex-col gap-4">
            <p className="text-xs text-white/45 leading-relaxed">
              Asigne una organización cliente para que este usuario vea la marca (logo, colores, y en
              econfiaWallet el nombre y textos legales) de esa empresa en vez de la marca Econfia por defecto.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-brand font-medium tracking-wide">Organización</label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="rounded-lg px-3 py-2 border border-slate-600 bg-slate-800/80 text-white focus:outline-none focus:border-brand transition text-sm"
              >
                <option value="">Sin organización (marca Econfia por defecto)</option>
                {organizaciones.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.nombre} {org.activa ? "" : "(inactiva)"}
                  </option>
                ))}
              </select>
            </div>

            {selectedOrgId && (() => {
              const orgSel = organizaciones.find((o) => String(o.id) === String(selectedOrgId));
              if (!orgSel) return null;
              return (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <span
                    className="h-8 w-8 shrink-0 rounded-lg border border-white/10"
                    style={{
                      background: `linear-gradient(135deg, ${orgSel.color_acento}, ${orgSel.color_secundario || orgSel.color_acento})`,
                    }}
                  />
                  <div className="min-w-0 text-xs">
                    <div className="font-semibold text-white truncate">{orgSel.nombre_wallet_efectivo}</div>
                    <div className="text-white/40 truncate">{orgSel.perfiles_count} usuario{orgSel.perfiles_count === 1 ? "" : "s"} con esta marca</div>
                  </div>
                </div>
              );
            })()}

            {selectedOrgId && (
              <label className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orgEsAdmin}
                  onChange={(e) => setOrgEsAdmin(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-xs text-white/70 leading-relaxed">
                  <span className="font-semibold text-white">Admin de Entidad</span> — este usuario podrá diseñar, publicar y emitir los{" "}
                  <strong>esquemas de credenciales</strong> de esta organización desde econfiaWallet.
                </span>
              </label>
            )}

            {selectedOrgId && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-brand mb-2">Empresa multi-usuario</p>
                <div className="grid grid-cols-2 gap-3">
                  <ModalInput
                    label="Máx. usuarios"
                    type="number"
                    min="0"
                    value={orgConfig.max_usuarios}
                    onChange={(e) => setOrgConfig((prev) => ({ ...prev, max_usuarios: e.target.value }))}
                    placeholder="Vacío = sin límite"
                  />
                  <ModalInput
                    label="Bolsa (pool consultas)"
                    type="number"
                    min="0"
                    value={orgConfig.pool_consultas}
                    onChange={(e) => setOrgConfig((prev) => ({ ...prev, pool_consultas: e.target.value }))}
                    placeholder="0"
                  />
                  <ModalInput
                    label="Máx. dispositivos / usuario"
                    type="number"
                    min="1"
                    value={orgConfig.max_dispositivos}
                    onChange={(e) => setOrgConfig((prev) => ({ ...prev, max_dispositivos: e.target.value }))}
                    placeholder="2"
                  />
                  <label className="flex items-center gap-2 self-end pb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orgConfig.pool_infinito}
                      onChange={(e) => setOrgConfig((prev) => ({ ...prev, pool_infinito: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-brand focus:ring-brand"
                    />
                    <span className="text-xs text-white/70">Consultas ilimitadas</span>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleActualizarEmpresa}
                  disabled={orgConfigSaving}
                  className="mt-2 w-full rounded-lg border border-brand/30 bg-brand/10 py-2 text-xs font-bold text-brand transition hover:bg-brand/20 disabled:opacity-50"
                >
                  {orgConfigSaving ? "Actualizando…" : "Actualizar empresa"}
                </button>
                <p className="mt-2 text-[11px] text-white/35">
                  El dueño reparte esta bolsa entre sus usuarios, hasta el máximo indicado.
                </p>
              </div>
            )}

            <button
              onClick={handleGuardarOrganizacion}
              disabled={guardandoOrg}
              className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {guardandoOrg ? "Guardando…" : "Guardar asignación"}
            </button>

            <div className="border-t border-white/10 pt-3">
              {!showNuevaOrgForm ? (
                <button
                  type="button"
                  onClick={() => setShowNuevaOrgForm(true)}
                  className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200 transition"
                >
                  + Crear nueva organización
                </button>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/40">Nueva organización</div>
                  <ModalInput
                    label="Nombre"
                    value={nuevaOrg.nombre}
                    onChange={(e) => {
                      const nombre = e.target.value;
                      const slug = nombre.toLowerCase().trim()
                        .normalize("NFD").replace(/[̀-ͯ]/g, "")
                        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                      setNuevaOrg((prev) => ({ ...prev, nombre, slug }));
                    }}
                    placeholder="Certicámara"
                  />
                  <ModalInput
                    label="Slug (URL)"
                    value={nuevaOrg.slug}
                    onChange={(e) => setNuevaOrg((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="certicamara"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-brand font-medium tracking-wide shrink-0">Color principal</label>
                    <input
                      type="color"
                      value={nuevaOrg.color_acento}
                      onChange={(e) => setNuevaOrg((prev) => ({ ...prev, color_acento: e.target.value }))}
                      className="h-9 w-14 rounded-lg border border-slate-600 bg-slate-800/80 cursor-pointer"
                    />
                    <span className="text-xs text-white/50 font-mono">{nuevaOrg.color_acento}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-brand font-medium tracking-wide shrink-0">Color secundario</label>
                    <input
                      type="color"
                      value={nuevaOrg.color_secundario || nuevaOrg.color_acento}
                      onChange={(e) => setNuevaOrg((prev) => ({ ...prev, color_secundario: e.target.value }))}
                      className="h-9 w-14 rounded-lg border border-slate-600 bg-slate-800/80 cursor-pointer"
                    />
                    <span className="text-xs text-white/50 font-mono">
                      {nuevaOrg.color_secundario || "= color principal"}
                    </span>
                    {nuevaOrg.color_secundario && (
                      <button
                        type="button"
                        onClick={() => setNuevaOrg((prev) => ({ ...prev, color_secundario: "" }))}
                        className="text-[11px] text-white/40 hover:text-white/70 transition"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-white/35 -mt-1">
                    Opcional: si la marca tiene dos colores (ej. botones con degradado), defina el secundario. Si
                    lo deja igual al principal, se usa un solo color en toda la app.
                  </p>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-brand font-medium tracking-wide">Logo (opcional)</label>
                    <div className="flex items-center gap-3">
                      {nuevaOrgLogoPreview ? (
                        <img
                          src={nuevaOrgLogoPreview}
                          alt="Vista previa del logo"
                          className="h-12 w-12 rounded-lg border border-slate-600 bg-white/5 object-contain"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/40 text-white/25 text-[10px]">
                          Sin logo
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSeleccionarLogo(e.target.files?.[0] || null)}
                          className="text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-fuchsia-500/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-fuchsia-200 hover:file:bg-fuchsia-500/30 file:cursor-pointer cursor-pointer"
                        />
                        {nuevaOrgLogo && (
                          <button
                            type="button"
                            onClick={() => handleSeleccionarLogo(null)}
                            className="self-start text-[11px] text-white/40 hover:text-white/70 transition"
                          >
                            Quitar logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <ModalInput
                    label="Nombre de Wallet (opcional)"
                    value={nuevaOrg.nombre_wallet}
                    onChange={(e) => setNuevaOrg((prev) => ({ ...prev, nombre_wallet: e.target.value }))}
                    placeholder="CertiWallet (vacío = econfiaWallet)"
                  />

                  {/* ── Multi-empresa: tope de usuarios, bolsa compartida y dispositivos ── */}
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-semibold text-brand mb-2">Empresa multi-usuario</p>
                    <div className="grid grid-cols-2 gap-3">
                      <ModalInput
                        label="Máx. usuarios"
                        type="number"
                        min="0"
                        value={nuevaOrg.max_usuarios}
                        onChange={(e) => setNuevaOrg((prev) => ({ ...prev, max_usuarios: e.target.value }))}
                        placeholder="Vacío = sin límite"
                      />
                      <ModalInput
                        label="Bolsa (pool consultas)"
                        type="number"
                        min="0"
                        value={nuevaOrg.pool_consultas}
                        onChange={(e) => setNuevaOrg((prev) => ({ ...prev, pool_consultas: e.target.value }))}
                        placeholder="0"
                      />
                      <ModalInput
                        label="Máx. dispositivos / usuario"
                        type="number"
                        min="1"
                        value={nuevaOrg.max_dispositivos}
                        onChange={(e) => setNuevaOrg((prev) => ({ ...prev, max_dispositivos: e.target.value }))}
                        placeholder="2"
                      />
                      <label className="flex items-center gap-2 self-end pb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={nuevaOrg.pool_infinito}
                          onChange={(e) => setNuevaOrg((prev) => ({ ...prev, pool_infinito: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-brand focus:ring-brand"
                        />
                        <span className="text-xs text-white/70">Consultas ilimitadas</span>
                      </label>
                    </div>
                    <p className="mt-2 text-[11px] text-white/35">
                      El dueño (perfil marcado como admin de la organización) reparte esta bolsa entre sus usuarios, hasta el máximo indicado.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setShowNuevaOrgForm(false)}
                      className="flex-1 rounded-lg border border-white/10 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCrearOrganizacion}
                      disabled={creandoOrg}
                      className="flex-1 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 py-2 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      {creandoOrg ? "Creando…" : "Crear organización"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Sheet>
      )}

      {/* ── Modal: Ver consultas realizadas ── */}
      {showConsultasRealizadasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-2xl flex flex-col w-full max-w-3xl max-h-[85vh] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">
                  Consultas de <span className="text-brand">{consultasRealizadasUser?.username}</span>
                </h3>
                <p className="text-xs text-white/35 mt-0.5">{consultasRealizadasTotal} consulta{consultasRealizadasTotal !== 1 ? "s" : ""} registrada{consultasRealizadasTotal !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => setShowConsultasRealizadasModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition text-xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-4">
              {consultasRealizadasLoading ? (
                <div className="flex justify-center items-center py-16 text-brand">
                  <SpinIcon /><span className="ml-2 text-sm">Cargando...</span>
                </div>
              ) : consultasRealizadas.length === 0 ? (
                <div className="text-center py-16 text-white/30 text-sm">
                  Este usuario no tiene consultas registradas.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl border border-white/8">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-800/60 text-white/40 uppercase tracking-wider">
                          <th className="px-3 py-2.5 font-semibold">#</th>
                          <th className="px-3 py-2.5 font-semibold">Cédula</th>
                          <th className="px-3 py-2.5 font-semibold">Tipo</th>
                          <th className="px-3 py-2.5 font-semibold">Nombre consultado</th>
                          <th className="px-3 py-2.5 font-semibold">Fecha</th>
                          <th className="px-3 py-2.5 font-semibold">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {consultasRealizadas.map((c, i) => (
                          <tr key={c.consulta_id} className="hover:bg-white/3 transition-colors">
                            <td className="px-3 py-2 text-white/30">{(consultasRealizadasPage - 1) * 20 + i + 1}</td>
                            <td className="px-3 py-2 font-mono font-semibold text-brand">{c.cedula || "—"}</td>
                            <td className="px-3 py-2 text-white/40">{c.tipo_doc || "—"}</td>
                            <td className="px-3 py-2 text-white/80">{c.nombre_completo || "—"}</td>
                            <td className="px-3 py-2 text-white/40 whitespace-nowrap">
                              {c.fecha ? new Date(c.fecha).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </td>
                            <td className={`px-3 py-2 font-semibold ${estadoColores[c.estado] || "text-white/50"}`}>
                              {c.estado || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {consultasRealizadasTotal > 20 && (
                    <div className="flex justify-center gap-2 items-center pt-3">
                      <button
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/60 text-white/60 text-xs hover:bg-cyan-900/40 hover:text-brand disabled:opacity-30 transition"
                        disabled={consultasRealizadasPage === 1}
                        onClick={() => fetchConsultasRealizadas(consultasRealizadasUser.id, consultasRealizadasPage - 1)}
                      >
                        ← Anterior
                      </button>
                      <span className="text-white/40 text-xs px-2">
                        {consultasRealizadasPage} / {Math.ceil(consultasRealizadasTotal / 20)}
                      </span>
                      <button
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/60 text-white/60 text-xs hover:bg-cyan-900/40 hover:text-brand disabled:opacity-30 transition"
                        disabled={consultasRealizadasPage >= Math.ceil(consultasRealizadasTotal / 20)}
                        onClick={() => fetchConsultasRealizadas(consultasRealizadasUser.id, consultasRealizadasPage + 1)}
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminUsuarios;
