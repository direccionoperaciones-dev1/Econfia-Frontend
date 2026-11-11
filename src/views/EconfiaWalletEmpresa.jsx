import { useCallback, useEffect, useState } from "react";
import Toast from "../components/Toast";
import WalletSolicitudes from "../components/WalletSolicitudes";
import WalletArchivo from "../components/WalletArchivo";
import { DatosEmpresaCompartidos, DocumentosEmpresa, GRUPOS_EMPRESA } from "../components/WalletEmpresaContenido";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  const h = { Authorization: `Token ${token}`, ...extra };
  // Empresa activa (para miembros que pertenecen a una empresa distinta a su cuenta).
  const empId = localStorage.getItem("wallet_empresa_id");
  if (empId) h["X-Empresa-Id"] = empId;
  return h;
}

const REP_TIPO_DOC = [
  { value: "CC", label: "Cédula de Ciudadanía (CC)" },
  { value: "CE", label: "Cédula de Extranjería (CE)" },
  { value: "PAS", label: "Pasaporte" },
];

function badgeClasses(estado) {
  const e = String(estado || "").toLowerCase();
  if (e === "verificado") return "bg-green-500/15 text-green-300 border-green-500/30";
  if (e === "rechazado") return "bg-red-500/15 text-red-300 border-red-500/30";
  if (e === "pendiente") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-surface-2/70 text-muted border-line/15";
}

// Espejo de PERMISOS (ECONFIA-BACKEND/core/wallet_equipo.py). Solo se usa si el
// backend no envía `permisos` en /estado/; el servidor sigue siendo quien valida.
const TODOS_PERMISOS = [
  "datos_ver", "datos_editar", "doc_ver", "doc_subir", "doc_eliminar", "doc_descargar",
  "solicitar", "consultar", "ver_compartidas", "descargar_compartido", "compartir",
  "equipo_gestionar", "actividad_ver",
];
const PERMISOS_ROL = {
  admin: TODOS_PERMISOS,
  rrhh: ["datos_ver", "doc_ver", "doc_subir", "doc_eliminar", "doc_descargar",
    "solicitar", "consultar", "ver_compartidas", "descargar_compartido"],
  reclutador: ["datos_ver", "doc_ver", "solicitar", "consultar", "ver_compartidas", "descargar_compartido"],
  analista: ["datos_ver", "doc_ver", "consultar", "ver_compartidas", "descargar_compartido"],
  consulta: ["datos_ver", "doc_ver", "ver_compartidas"],
  auditor: ["datos_ver", "actividad_ver"],
};

// Permisos del usuario según /estado/: lista explícita del servidor, o el rol
// contra la matriz espejo. Sin rol (backend previo a Fase 5) = dueño → admin.
function permisosDe(data) {
  if (Array.isArray(data?.permisos)) return new Set(data.permisos);
  if (data?.mi_rol) return new Set(PERMISOS_ROL[data.mi_rol] || []);
  return new Set(TODOS_PERMISOS);
}

const EMP_VACIA = {
  nombre_comercial: "", digito_verificacion: "", ciiu: "", actividad_economica: "",
  logo_url: "", tamano: "", sector: "", fecha_constitucion: "",
  razon_social: "", nit: "", tipo_organizacion: "", matricula_mercantil: "",
  camara_comercio: "", fecha_matricula: "", direccion: "", ciudad: "",
  telefono: "", correo: "", rep_nombre: "", rep_tipo_doc: "CC", rep_num_doc: "",
};

// Convierte los nulos del backend en "" para inputs controlados.
function normalizar(empresa) {
  const out = { ...EMP_VACIA };
  Object.keys(EMP_VACIA).forEach((k) => {
    if (empresa && empresa[k] != null) out[k] = empresa[k];
  });
  return out;
}

function Campo({ k, label, emp, setCampo, inputCls, labelCls, type = "text", placeholder = "" }) {
  return (
    <div>
      <label htmlFor={`empresa-${k}`} className={labelCls}>{label}</label>
      <input
        id={`empresa-${k}`}
        type={type}
        className={inputCls}
        value={emp[k]}
        placeholder={placeholder}
        onChange={(ev) => setCampo(k, ev.target.value)}
      />
    </div>
  );
}

export default function EconfiaWalletEmpresa() {
  const [emp, setEmp] = useState(EMP_VACIA);
  const [documentos, setDocumentos] = useState([]);
  const [credenciales, setCredenciales] = useState([]);
  const [histCred, setHistCred] = useState(null); // { cred, lista } | null
  const [esquemasDisponibles, setEsquemasDisponibles] = useState([]);
  const [credEditor, setCredEditor] = useState(null); // { esquema, valores }
  const [credFiles, setCredFiles] = useState({});
  const [emitiendoCred, setEmitiendoCred] = useState(false);
  const [tiposDoc, setTiposDoc] = useState([]);
  const [precargado, setPrecargado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [precargando, setPrecargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [tipoDocSel, setTipoDocSel] = useState("certificado_camara");
  const [archivo, setArchivo] = useState(null);
  const [toast, setToast] = useState(null);
  // Fase 1: consultar wallets de personas por llave + compartidas conmigo
  const [consultarClave, setConsultarClave] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [compartidas, setCompartidas] = useState([]);
  // Fase 2: compartir mi propia wallet de empresa
  const [compartirAtributos, setCompartirAtributos] = useState(["datos", "representante", "documentos"]);
  const [compartiendo, setCompartiendo] = useState(false);
  const [llaveEmpresa, setLlaveEmpresa] = useState(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  // Llave fija personal de la empresa (handle propio WLT-..., desde sugerencias)
  const [llaveFija, setLlaveFija] = useState(null);
  const [sugerenciasLlave, setSugerenciasLlave] = useState([]);
  const [llaveInput, setLlaveInput] = useState("");
  const [guardandoLlave, setGuardandoLlave] = useState(false);
  const [editandoLlave, setEditandoLlave] = useState(false);
  // Rol del usuario en la empresa (Fase 5) → qué controles se muestran.
  const [miRol, setMiRol] = useState(null);
  // null hasta que /estado/ responde: no se muestra ni se carga nada por adelantado.
  const [permisos, setPermisos] = useState(null);
  const puede = (accion) => Boolean(permisos?.has(accion));

  const actualizarLogo = async (archivoLogo) => {
    setSubiendoLogo(true);
    try {
      const fd = new FormData();
      if (archivoLogo) fd.append("logo", archivoLogo);
      const res = await fetch(`${API_URL}/api/wallet/empresa/logo/`, {
        method: archivoLogo ? "POST" : "DELETE", headers: authHeaders(),
        ...(archivoLogo ? { body: fd } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar el logo.");
      setEmp((prev) => ({ ...prev, logo_url: data.logo_url || "" }));
      setToast({ type: "success", message: archivoLogo ? "Logo guardado." : "Logo eliminado." });
    } catch (error) {
      setToast({ type: "error", message: error.message || "Error de conexión." });
    } finally { setSubiendoLogo(false); }
  };

  const setCampo = (k, v) => setEmp((e) => ({ ...e, [k]: v }));

  const copiarCompartido = async (texto, nombre) => {
    try {
      await navigator.clipboard.writeText(texto);
      setToast({ type: "success", message: `${nombre} copiado.` });
    } catch {
      setToast({ type: "error", message: "No se pudo copiar. Selecciona el texto y cópialo manualmente." });
    }
  };

  const cargarEstado = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/estado/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setEmp(normalizar(data.empresa));
        setDocumentos(data.documentos || []);
        setTiposDoc(data.tipos_documento || []);
        setPrecargado(Boolean(data.empresa?.precargado_camara));
        setMiRol(data.mi_rol || null);
        setPermisos(permisosDe(data));
      } else {
        setToast({ type: "error", message: data.error || "No se pudo cargar la empresa." });
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión." });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  const cargarCredenciales = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/credenciales/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setCredenciales(data.credenciales || []);
    } catch { /* silencioso */ }
  }, []);
  useEffect(() => { cargarCredenciales(); }, [cargarCredenciales]);

  const cargarEsquemasDisponibles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/esquemas/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setEsquemasDisponibles(data.esquemas || []);
    } catch { /* silencioso */ }
  }, []);
  useEffect(() => { cargarEsquemasDisponibles(); }, [cargarEsquemasDisponibles]);

  const cargarCompartidas = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/compartidas/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setCompartidas(data.compartidas || []);
    } catch { /* silencioso */ }
  }, []);
  useEffect(() => { cargarCompartidas(); }, [cargarCompartidas]);

  // ── Fase 5: equipo, roles y actividad ──
  const [equipo, setEquipo] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [invEmail, setInvEmail] = useState("");
  const [invRol, setInvRol] = useState("consulta");

  const cargarEquipo = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/equipo/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setEquipo(data);
    } catch { /* silencioso */ }
  }, []);
  const cargarActividad = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/actividad/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setActividad(data.actividad || []);
    } catch { /* silencioso */ }
  }, []);
  useEffect(() => { cargarEquipo(); cargarActividad(); }, [cargarEquipo, cargarActividad]);

  const invitar = async (e) => {
    e.preventDefault();
    if (!invEmail.trim()) { setToast({ type: "error", message: "Ingresa un correo." }); return; }
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/equipo/invitar/`, {
        method: "POST", headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email: invEmail.trim(), rol: invRol }),
      });
      const data = await res.json();
      if (res.ok) { setInvEmail(""); setToast({ type: "success", message: "Invitación enviada." }); cargarEquipo(); }
      else setToast({ type: "error", message: data.error || "No se pudo invitar." });
    } catch { setToast({ type: "error", message: "Error de conexión." }); }
  };
  const cambiarRol = async (id, rol) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/equipo/${id}/rol/`, {
        method: "POST", headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ rol }),
      });
      if (res.ok) cargarEquipo();
      else { const d = await res.json(); setToast({ type: "error", message: d.error || "No se pudo cambiar el rol." }); }
    } catch { setToast({ type: "error", message: "Error de conexión." }); }
  };
  const desactivarMiembro = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/equipo/${id}/desactivar/`, { method: "POST", headers: authHeaders() });
      if (res.ok) cargarEquipo();
      else { const d = await res.json(); setToast({ type: "error", message: d.error || "No se pudo desactivar." }); }
    } catch { setToast({ type: "error", message: "Error de conexión." }); }
  };

  const consultarPorClave = async (claveRaw) => {
    const clave = (claveRaw || "").trim().toUpperCase();
    if (!clave) { setToast({ type: "error", message: "Ingresa una llave." }); return; }
    setConsultando(true); setResultado(null);
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/consultar/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ clave }),
      });
      const data = await res.json();
      if (res.ok) { setResultado(data); cargarCompartidas(); }
      else setToast({ type: "error", message: data.error || "No se pudo consultar." });
    } catch {
      setToast({ type: "error", message: "Error de conexión." });
    } finally {
      setConsultando(false);
    }
  };
  const consultarWallet = (e) => { e.preventDefault(); consultarPorClave(consultarClave); };

  const abrirCredencial = (esquema) => {
    setCredFiles({});
    setCredEditor({ esquema, valores: { ...(esquema.valores_sugeridos || {}) } });
  };

  const setCredValor = (clave, valor) => {
    setCredEditor((prev) => ({ ...prev, valores: { ...(prev?.valores || {}), [clave]: valor } }));
  };

  const emitirCredencialEmpresa = async () => {
    if (!credEditor?.esquema) return;
    setEmitiendoCred(true);
    try {
      const tieneArchivos = Object.values(credFiles).some(Boolean);
      let opciones;
      if (tieneArchivos) {
        const fd = new FormData();
        fd.append("valores", JSON.stringify(credEditor.valores || {}));
        Object.entries(credFiles).forEach(([clave, file]) => { if (file) fd.append(`archivo__${clave}`, file); });
        opciones = { method: "POST", headers: authHeaders(), body: fd };
      } else {
        opciones = {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ valores: credEditor.valores || {} }),
        };
      }
      const res = await fetch(`${API_URL}/api/wallet/empresa/esquemas/${credEditor.esquema.id}/emitir/`, opciones);
      const data = await res.json();
      if (!res.ok) {
        const detalle = Array.isArray(data.detalles) ? ` ${data.detalles.join(" ")}` : "";
        setToast({ type: "error", message: (data.error || "No se pudo generar la credencial.") + detalle });
        return;
      }
      setToast({ type: "success", message: "Credencial generada correctamente." });
      setCredEditor(null);
      setCredFiles({});
      cargarCredenciales();
      cargarEsquemasDisponibles();
    } catch {
      setToast({ type: "error", message: "Error al generar la credencial." });
    } finally {
      setEmitiendoCred(false);
    }
  };

  const verHistorialCred = async (cred) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/credenciales/${cred.id}/verificaciones/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setHistCred({ cred, lista: data.verificaciones || [] });
      else setToast({ type: "error", message: data.error || "No se pudo cargar el historial." });
    } catch { setToast({ type: "error", message: "Error de conexión." }); }
  };

  const descargarCredencialPDF = async (credencialId) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/credenciales/${credencialId}/pdf/`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        setToast({ type: "error", message: "No se pudo descargar la credencial." });
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credencial-empresa-${credencialId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setToast({ type: "error", message: "Error al descargar la credencial." });
    }
  };

  const toggleCompartir = (k) =>
    setCompartirAtributos((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const compartirMiWallet = async () => {
    if (!compartirAtributos.length) { setToast({ type: "error", message: "Elige al menos un bloque." }); return; }
    setCompartiendo(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/compartir/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ atributos: compartirAtributos, dias: 7, max_consultas: 0 }),
      });
      const data = await res.json();
      if (res.ok) setLlaveEmpresa(data);
      else setToast({ type: "error", message: data.error || "No se pudo generar la llave." });
    } catch {
      setToast({ type: "error", message: "Error de conexión." });
    } finally {
      setCompartiendo(false);
    }
  };

  const cargarLlaveFija = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/llave-fija/`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setLlaveFija(data.llave || null);
        setSugerenciasLlave(data.sugerencias || []);
        if (data.llave?.clave) setLlaveInput(data.llave.clave);
        else if ((data.sugerencias || []).length) setLlaveInput(data.sugerencias[0]);
      }
    } catch {
      /* silencioso */
    }
  }, []);

  const guardarLlaveFija = async (clave) => {
    const valor = (clave ?? llaveInput ?? "").trim();
    if (!valor) { setToast({ type: "error", message: "Elige o escribe una llave." }); return; }
    setGuardandoLlave(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/llave-fija/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ clave: valor }),
      });
      const data = await res.json();
      if (!res.ok) { setToast({ type: "error", message: data.error || "No se pudo guardar la llave." }); return; }
      setLlaveFija(data);
      setLlaveInput(data.clave);
      setEditandoLlave(false);
      setToast({ type: "success", message: "Tu llave quedó lista." });
    } catch {
      setToast({ type: "error", message: "Error al guardar la llave." });
    } finally {
      setGuardandoLlave(false);
    }
  };

  // La llave fija es de la cuenta propia: solo tiene sentido para quien comparte.
  const puedeCompartir = puede("compartir");
  useEffect(() => { if (puedeCompartir) cargarLlaveFija(); }, [cargarLlaveFija, puedeCompartir]);

  // Vuelca los datos traídos (Cámara local o RUES) sobre el formulario sin
  // pisar lo que el usuario ya haya escrito con valores vacíos.
  const aplicarDatos = (datos) => {
    setEmp((e) => {
      const merged = { ...e };
      Object.entries(datos || {}).forEach(([k, v]) => {
        if (v != null && v !== "") merged[k] = v;
      });
      return merged;
    });
    setPrecargado(true);
  };

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  // Paso 2 (fallback): consulta RUES EN VIVO vía Celery + polling.
  const consultarRuesEnVivo = async () => {
    setToast({ type: "info", message: "Consultando RUES en vivo… puede tardar ~30 s." });
    const disparo = await fetch(`${API_URL}/api/wallet/empresa/precargar-rues/`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ nit: emp.nit }),
    });
    const tarea = await disparo.json();
    if (!disparo.ok || !tarea.task_id) {
      setToast({ type: "error", message: tarea.error || "No se pudo iniciar la consulta a RUES." });
      return;
    }
    // Sondea el estado hasta ~90 s (30 intentos × 3 s).
    for (let i = 0; i < 30; i++) {
      await espera(3000);
      let data;
      try {
        const res = await fetch(
          `${API_URL}/api/wallet/empresa/precargar-rues/estado/?task=${encodeURIComponent(tarea.task_id)}`,
          { headers: authHeaders() },
        );
        data = await res.json();
      } catch {
        continue; // reintenta en el siguiente ciclo
      }
      if (data.estado === "pendiente") continue;
      if (data.estado === "listo" && data.encontrado) {
        aplicarDatos(data.datos);
        setToast({ type: "success", message: "Datos traídos de RUES." });
        return;
      }
      setToast({ type: "error", message: data.mensaje || "La empresa no se encontró en RUES." });
      return;
    }
    setToast({ type: "error", message: "RUES tardó demasiado. Intenta de nuevo en un momento." });
  };

  // Híbrido: primero la tabla local (instantánea); si no está, RUES en vivo.
  const traerDeCamara = async () => {
    setPrecargando(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/precargar/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ nit: emp.nit }),
      });
      const data = await res.json();
      if (res.ok && data.encontrado) {
        aplicarDatos(data.datos);
        setToast({ type: "success", message: "Datos traídos de Cámara de Comercio." });
      } else {
        // No estaba en la base local → consulta RUES en vivo.
        await consultarRuesEnVivo();
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión." });
    } finally {
      setPrecargando(false);
    }
  };

  const guardarDatos = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/datos/`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(emp),
      });
      const data = await res.json();
      if (res.ok) {
        setEmp(normalizar(data.empresa));
        setToast({ type: "success", message: "Datos de la empresa guardados." });
        cargarEsquemasDisponibles();
      } else {
        setToast({ type: "error", message: data.error || "No se pudo guardar." });
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión." });
    } finally {
      setGuardando(false);
    }
  };

  const subirDocumento = async (e) => {
    e.preventDefault();
    if (!archivo) { setToast({ type: "error", message: "Selecciona un archivo." }); return; }
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("tipo", tipoDocSel);
      fd.append("archivo", archivo);
      const res = await fetch(`${API_URL}/api/wallet/empresa/documentos/`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setArchivo(null);
        setToast({ type: "success", message: "Documento subido." });
        cargarEstado();
      } else {
        setToast({ type: "error", message: data.error || "No se pudo subir." });
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión." });
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarDocumento = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/empresa/documentos/${id}/`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (res.ok) { setDocumentos((d) => d.filter((x) => x.id !== id)); }
      else setToast({ type: "error", message: "No se pudo eliminar." });
    } catch {
      setToast({ type: "error", message: "Error de conexión." });
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-surface-2/70 border border-line/15 text-content text-sm " +
    "placeholder:text-muted/70 focus:outline-none focus:border-brand/50 focus:bg-surface transition-all";
  const labelCls = "block text-xs font-semibold text-content/80 mb-1";

  const campoProps = { emp, setCampo, inputCls, labelCls };
  const renderCampoCredencial = (campo) => {
    const clave = campo.clave;
    const valor = credEditor?.valores?.[clave] ?? "";
    if (campo.tipo === "booleano") {
      return (
        <label className="flex items-center gap-2 text-sm text-content cursor-pointer">
          <input
            type="checkbox"
            className="accent-emerald-500 w-4 h-4"
            checked={!!valor && String(valor).toLowerCase() !== "false"}
            onChange={(e) => setCredValor(clave, e.target.checked)}
          />
          Sí
        </label>
      );
    }
    if (campo.tipo === "lista") {
      const opciones = campo.validacion?.opciones || [];
      return (
        <select className={inputCls} value={valor} onChange={(e) => setCredValor(clave, e.target.value)}>
          <option value="">Seleccione…</option>
          {opciones.map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
      );
    }
    if (campo.tipo === "archivo") {
      return (
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => setCredFiles((prev) => ({ ...prev, [clave]: e.target.files?.[0] || null }))}
          className="w-full text-xs text-content file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-white file:text-xs file:font-semibold hover:file:bg-emerald-400 file:cursor-pointer"
        />
      );
    }
    return (
      <input
        type={campo.tipo === "numero" ? "number" : campo.tipo === "fecha" ? "date" : "text"}
        className={inputCls}
        value={valor}
        onChange={(e) => setCredValor(clave, e.target.value)}
      />
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {histCred && (
        <div onClick={() => setHistCred(null)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-surface border border-line/15 rounded-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-content">Historial de verificaciones</h3>
              <button onClick={() => setHistCred(null)} className="text-xs font-semibold text-muted hover:text-content">Cerrar</button>
            </div>
            <p className="text-xs text-muted mb-3">{histCred.cred.esquema} · #{histCred.cred.id}</p>
            {histCred.lista.length === 0 && <p className="text-sm text-muted">Nadie ha verificado esta credencial todavía.</p>}
            <div className="space-y-1">
              {histCred.lista.map((v, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-xs border-b border-line/10 py-1.5">
                  <span className="text-content">{new Date(v.fecha).toLocaleString("es-CO")}{v.ip ? <span className="text-muted"> · {v.ip}</span> : null}</span>
                  <span className={v.valida ? "text-emerald-300 font-bold" : "text-red-300 font-bold"}>{v.valida ? "Válida" : "No válida"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {llaveEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
          onClick={() => setLlaveEmpresa(null)}>
          <div className="relative w-full max-w-sm bg-surface border border-line/15 rounded-2xl shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLlaveEmpresa(null)} className="absolute top-3 right-3 text-muted hover:text-content text-lg leading-none">✕</button>
            <h3 className="text-content font-bold text-lg">Llave de tu empresa</h3>
            <p className="text-muted text-xs mt-1 mb-4">
              Comparte el enlace o escanea el QR para ver los datos autorizados. Las empresas también pueden ingresar la llave en “Consultar Wallet”.
            </p>
            {llaveEmpresa.qr_base64 && (
              <div className="bg-white rounded-xl p-3 inline-block mb-3">
                <img src={`data:image/png;base64,${llaveEmpresa.qr_base64}`} alt="QR del enlace público de la empresa" className="w-40 h-40" />
              </div>
            )}
            <div className="bg-surface-2/70 border border-emerald-500/30 rounded-xl py-3">
              <span className="text-emerald-300 font-mono text-xl font-bold tracking-widest">{llaveEmpresa.clave}</span>
            </div>
            <button
              onClick={() => copiarCompartido(llaveEmpresa.clave, "Código")}
              className="mt-3 w-full px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold">
              Copiar llave
            </button>
            {llaveEmpresa.url && (
              <div className="mt-3 space-y-2">
                <a href={llaveEmpresa.url} target="_blank" rel="noreferrer" className="block text-xs text-emerald-300 underline break-all">
                  {new URL(llaveEmpresa.url, window.location.origin).href}
                </a>
                <button onClick={() => copiarCompartido(new URL(llaveEmpresa.url, window.location.origin).href, "Enlace")}
                  className="w-full px-5 py-2 rounded-lg border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                  Copiar enlace
                </button>
              </div>
            )}
            <p className="text-muted text-[11px] mt-3">Vence: {new Date(llaveEmpresa.expires_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          🏢 econfiaWallet · Empresa
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-black text-content">
          {emp.razon_social || "Billetera de la empresa"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Datos de tu persona jurídica, representante legal y documentos, en un solo lugar.
        </p>
      </div>

      {cargando ? (
        <p className="text-center text-muted py-10">Cargando…</p>
      ) : (
        <div className="space-y-6">
          {/* ── Bloque 1 + 2: Datos de la empresa y representante ── */}
          <form
            onSubmit={guardarDatos}
            className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-lg font-bold text-content">Datos de la empresa</h2>
              {puede("datos_editar") && <button
                type="button"
                onClick={traerDeCamara}
                disabled={precargando}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15 transition-all disabled:opacity-60"
              >
                {precargando ? "Buscando…" : "⤓ Traer de Cámara de Comercio"}
              </button>}
            </div>
            {!puede("datos_editar") && (
              <p className="text-xs text-muted mb-4">
                Tu rol{miRol ? ` (${miRol})` : ""} solo permite ver estos datos; los edita el Administrador.
              </p>
            )}
            {precargado && (
              <p className="text-xs text-emerald-300/80 mb-4">
                ✓ Algunos datos se precargaron desde RUES/Cámara de Comercio. Revísalos y corrige lo que necesites.
              </p>
            )}

            <fieldset disabled={!puede("datos_editar")} className="min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo {...campoProps} k="razon_social" label="Razón social *" />
              <Campo {...campoProps} k="nombre_comercial" label="Nombre comercial" />
              <Campo {...campoProps} k="nit" label="NIT *" placeholder="Ej: 900000000-1" />
              <Campo {...campoProps} k="digito_verificacion" label="Dígito de verificación" placeholder="Ej: 1" />
              <Campo {...campoProps} k="ciiu" label="CIIU principal" placeholder="Ej: 6201" />
              <Campo {...campoProps} k="actividad_economica" label="Actividad económica" />
              <div>
                <label className={labelCls} htmlFor="empresa-tamano">Tamaño de la empresa</label>
                <select id="empresa-tamano" className={inputCls} value={emp.tamano} onChange={(e) => setCampo("tamano", e.target.value)}>
                  <option value="">Sin especificar</option>
                  {[["micro", "Microempresa"], ["pequena", "Pequeña"], ["mediana", "Mediana"], ["grande", "Grande"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <Campo {...campoProps} k="sector" label="Sector" />
              <Campo {...campoProps} k="fecha_constitucion" label="Fecha de constitución" type="date" />
              <Campo {...campoProps} k="tipo_organizacion" label="Tipo de organización" placeholder="S.A.S., S.A., …" />
              <Campo {...campoProps} k="matricula_mercantil" label="Matrícula mercantil" />
              <Campo {...campoProps} k="camara_comercio" label="Cámara de Comercio" placeholder="Ej: Bogotá" />
              <Campo {...campoProps} k="fecha_matricula" label="Fecha de matrícula" type="date" />
              <Campo {...campoProps} k="ciudad" label="Ciudad" />
              <Campo {...campoProps} k="telefono" label="Teléfono" />
              <div className="md:col-span-2">
                <Campo {...campoProps} k="direccion" label="Dirección" />
              </div>
              <Campo {...campoProps} k="correo" label="Correo" type="email" />
            </div>

            {/* Representante legal */}
            <h2 className="text-lg font-bold text-content mt-6 mb-4">Representante legal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Campo {...campoProps} k="rep_nombre" label="Nombre completo del representante *" />
              </div>
              <div>
                <label className={labelCls}>Tipo de documento</label>
                <select
                  className={inputCls}
                  value={emp.rep_tipo_doc}
                  onChange={(ev) => setCampo("rep_tipo_doc", ev.target.value)}
                >
                  {REP_TIPO_DOC.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <Campo {...campoProps} k="rep_num_doc" label="Número de documento" />
            </div>
            </fieldset>

            {puede("datos_editar") && <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar datos"}
              </button>
            </div>}
          </form>

          {(puede("datos_editar") || emp.logo_url) && <section className="bg-surface border border-line/15 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-content mb-3">Logo de la empresa</h2>
            {emp.logo_url && <img src={emp.logo_url} alt="Logo actual de la empresa" className="w-24 h-24 object-contain rounded-xl bg-white mb-3" />}
            {puede("datos_editar") && <>
            <label className="block text-sm text-muted mb-2" htmlFor="empresa-logo">PNG, JPG o WEBP · máximo 2 MB y 4096 × 4096 píxeles</label>
            <input id="empresa-logo" type="file" accept=".png,.jpg,.jpeg,.webp" disabled={subiendoLogo}
              className="w-full text-sm text-content"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) actualizarLogo(file); e.target.value = ""; }} />
            {subiendoLogo && <p role="status" className="text-sm text-muted mt-2">Actualizando logo…</p>}
            {emp.logo_url && <button type="button" disabled={subiendoLogo} onClick={() => actualizarLogo(null)} className="text-sm text-red-400 mt-3 disabled:opacity-50">Quitar logo</button>}
            </>}
          </section>}

          {/* ── Bloque 3: Documentos de la empresa ── */}
          {puede("doc_ver") && <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
            <h2 className="text-lg font-bold text-content mb-4">Documentos de la empresa</h2>

            {puede("doc_subir") && <form onSubmit={subirDocumento} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-5">
              <div className="flex-1">
                <label className={labelCls}>Tipo de documento</label>
                <select className={inputCls} value={tipoDocSel} onChange={(e) => setTipoDocSel(e.target.value)}>
                  {GRUPOS_EMPRESA.map(([grupo, label]) => (
                    <optgroup key={grupo} label={label}>
                      {tiposDoc.filter((t) => (t.grupo || "otros") === grupo).map((t) => (
                        <option key={t.valor} value={t.valor}>{t.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className={labelCls}>Archivo (PDF o imagen)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:text-emerald-300 file:font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={subiendo}
                className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {subiendo ? "Subiendo…" : "Subir"}
              </button>
            </form>}

            <DocumentosEmpresa documentos={documentos}
              onEliminar={puede("doc_eliminar") ? eliminarDocumento : undefined}
              verArchivo={puede("doc_descargar")} />
          </div>}

          {/* ── Esquemas publicados que la empresa puede completar ── */}
          {puede("datos_editar") && <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
            <h2 className="text-lg font-bold text-content mb-1">Credenciales disponibles</h2>
            <p className="text-xs text-muted mb-4">
              Plantillas publicadas por la entidad. Se completan con los datos que ya tiene tu wallet empresa; si falta algo, puedes llenarlo antes de generar.
            </p>
            {esquemasDisponibles.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay plantillas publicadas para esta empresa.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {esquemasDisponibles.map((e) => (
                  <div key={e.id} className="rounded-xl border border-line/15 bg-surface-2/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-content truncate">{e.nombre}</h3>
                        <p className="text-xs text-muted mt-1">
                          {e.organizacion || "Global"} · v{e.version}{e.emitidas ? ` · ${e.emitidas} emitida(s)` : ""}
                        </p>
                      </div>
                      <span className="w-4 h-4 rounded-full shrink-0" style={{ background: e.color || "#10b981" }} />
                    </div>
                    {e.descripcion && <p className="text-xs text-muted mt-2 line-clamp-2">{e.descripcion}</p>}
                    <button
                      type="button"
                      onClick={() => abrirCredencial(e)}
                      className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
                    >
                      Completar / Generar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {credEditor && (
              <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-surface/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-content font-bold">{credEditor.esquema.nombre}</h3>
                    <p className="text-xs text-muted">Revisa los datos autocompletados y completa los campos faltantes.</p>
                  </div>
                  <button type="button" onClick={() => { setCredEditor(null); setCredFiles({}); }}
                    className="px-3 py-1.5 rounded-lg border border-line/15 text-muted hover:text-content text-sm">
                    Cerrar
                  </button>
                </div>

                {(() => {
                  const grupos = [];
                  const idx = {};
                  (credEditor.esquema.campos || []).forEach((c) => {
                    const g = c.grupo || "Datos";
                    if (!(g in idx)) { idx[g] = grupos.length; grupos.push({ g, campos: [] }); }
                    grupos[idx[g]].campos.push(c);
                  });
                  return grupos.map((sec) => (
                    <section key={sec.g} className="mb-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 mb-2">{sec.g}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sec.campos.map((campo) => (
                          <div key={campo.clave}>
                            <label className={labelCls}>
                              {campo.etiqueta || campo.clave}{campo.requerido ? " *" : ""}
                            </label>
                            {renderCampoCredencial(campo)}
                            {campo.ayuda && <p className="text-[11px] text-muted mt-1">{campo.ayuda}</p>}
                          </div>
                        ))}
                      </div>
                    </section>
                  ));
                })()}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={emitiendoCred}
                    onClick={emitirCredencialEmpresa}
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-60"
                  >
                    {emitiendoCred ? "Generando…" : "Generar credencial"}
                  </button>
                </div>
              </div>
            )}
          </div>}

          {/* ── Credenciales emitidas a la empresa ── */}
          <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
            <h2 className="text-lg font-bold text-content mb-1">Credenciales de la empresa</h2>
            <p className="text-xs text-muted mb-4">
              Credenciales oficiales emitidas para esta wallet empresarial.
            </p>
            {credenciales.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay credenciales emitidas para esta empresa.</p>
            ) : (
              <div className="space-y-2">
                {credenciales.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-2/60 border border-line/15">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-content truncate">{c.esquema}</div>
                      <div className="text-xs text-muted">
                        {c.organizacion ? `${c.organizacion} · ` : ""}Emitida {new Date(c.created_at).toLocaleString("es-CO")}
                      </div>
                      <div className={`text-[11px] font-semibold mt-0.5 ${c.verificaciones ? "text-emerald-300" : "text-muted"}`}>
                        {c.verificaciones ? `✓ Verificada ${c.verificaciones} ${c.verificaciones === 1 ? "vez" : "veces"}` : "Sin verificaciones aún"}
                        {c.ultima_verificacion ? ` · última ${new Date(c.ultima_verificacion).toLocaleString("es-CO")}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${badgeClasses(c.estado)}`}>
                        {c.estado}
                      </span>
                      <button type="button" onClick={() => descargarCredencialPDF(c.id)}
                        className="text-xs font-semibold text-emerald-300 hover:text-emerald-200">
                        PDF
                      </button>
                      <button type="button" onClick={() => verHistorialCred(c)}
                        className="text-xs font-semibold text-content/70 hover:text-content">
                        Historial
                      </button>
                      {c.url_verificacion && (
                        <a href={c.url_verificacion} target="_blank" rel="noreferrer"
                          className="text-xs font-semibold text-sky-300 hover:text-sky-200">
                          Verificar ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Mi llave fija (handle propio de la empresa) ── */}
          {puede("compartir") && <div className="bg-gradient-to-br from-emerald-500/10 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-emerald-500/25 shadow-2xl shadow-emerald-500/10 p-6">
            <h2 className="text-lg font-bold text-content mb-1">Mi llave</h2>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              Es el identificador propio de tu empresa para que un tercero consulte tu wallet. Elige una de las
              sugerencias (creadas con tu NIT o razón social) y compártela. No cambia ni vence.
            </p>
            {llaveFija?.clave && !editandoLlave ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-surface-2/70 border border-emerald-500/30 rounded-xl px-5 py-3">
                  <span className="text-emerald-300 font-mono text-xl font-bold tracking-widest break-all">{llaveFija.clave}</span>
                </div>
                <button onClick={() => copiarCompartido(llaveFija.clave, "Llave")}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors">
                  Copiar
                </button>
                <button onClick={() => { setEditandoLlave(true); setLlaveInput(llaveFija.clave); }}
                  className="px-4 py-2.5 rounded-lg border border-line/20 text-muted hover:text-content hover:border-emerald-500/30 text-sm font-semibold transition-colors">
                  Cambiar
                </button>
              </div>
            ) : sugerenciasLlave.length > 0 ? (
              <div>
                <p className="text-muted text-[11px] mb-2">Elige la que prefieras:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sugerenciasLlave.map((s) => (
                    <button key={s} onClick={() => setLlaveInput(s)}
                      className={`px-3 py-2 rounded-lg font-mono text-sm font-semibold border transition-colors ${
                        llaveInput === s
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-surface-2/60 text-emerald-300 border-emerald-500/30 hover:border-emerald-400"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => guardarLlaveFija()} disabled={guardandoLlave || !llaveInput}
                    className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                    {guardandoLlave ? "Guardando…" : "Usar esta llave"}
                  </button>
                  {llaveFija?.clave && (
                    <button onClick={() => { setEditandoLlave(false); setLlaveInput(llaveFija.clave); }}
                      className="px-4 py-2.5 rounded-lg border border-line/20 text-muted hover:text-content text-sm font-semibold transition-colors">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted text-xs">
                Completa el NIT y la razón social de tu empresa para poder sugerirte una llave.
              </p>
            )}
          </div>}

          {/* ── Compartir mi wallet de empresa ── */}
          {puede("compartir") && <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
            <h2 className="text-lg font-bold text-content mb-1">Compartir mi wallet</h2>
            <p className="text-xs text-muted mb-4">
              Genera una llave para que un tercero (otra empresa o persona) vea los datos que elijas de tu empresa.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {[["datos", "Datos de la empresa"], ["representante", "Representante legal"], ["documentos", "Documentos"]].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 rounded-xl border border-line/10 bg-surface-2/50 px-3 py-2 cursor-pointer text-sm text-content">
                  <input type="checkbox" className="accent-emerald-500" checked={compartirAtributos.includes(k)} onChange={() => toggleCompartir(k)} />
                  {l}
                </label>
              ))}
            </div>
            <button
              onClick={compartirMiWallet}
              disabled={compartiendo || !compartirAtributos.length}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-60"
            >
              {compartiendo ? "Generando…" : "Generar llave para compartir"}
            </button>
          </div>}

          {/* ── Consultar Wallet (verificar persona/empresa por llave) ── */}
          {puede("ver_compartidas") && (
            <WalletSolicitudes empresa puedeSolicitar={puede("solicitar")} onActualizado={cargarCompartidas} />
          )}
          {puede("consultar") && <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
            <h2 className="text-lg font-bold text-content mb-1">Consultar Wallet</h2>
            <p className="text-xs text-muted mb-4">
              Ingresa la llave <span className="font-mono">WLT-XXXX-XXXX</span> que una persona o empresa te compartió para ver los datos que autorizó.
            </p>
            <form onSubmit={consultarWallet} className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                value={consultarClave}
                onChange={(e) => setConsultarClave(e.target.value.toUpperCase())}
                placeholder="WLT-K8X4-9PN2"
                className={inputCls + " font-mono tracking-wider"}
              />
              <button
                type="submit"
                disabled={consultando}
                className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {consultando ? "Consultando…" : "Consultar"}
              </button>
            </form>
            {resultado && (
              <div className="mt-2 p-4 rounded-xl bg-surface-2/60 border border-line/15 space-y-3">
                <DatosEmpresaCompartidos empresa={resultado.empresa} />
                {resultado.representante && (
                  <div className="text-xs text-muted">
                    Rep. legal: <b className="text-content">{resultado.representante.nombre}</b>
                    {resultado.representante.num_doc ? ` (${resultado.representante.tipo_doc} ${resultado.representante.num_doc})` : ""}
                  </div>
                )}
                {resultado.persona && (
                  <div>
                    <div className="text-sm font-bold text-content">{resultado.persona.nombre}</div>
                    <div className="text-xs text-muted">{resultado.persona.documento}</div>
                  </div>
                )}
                {resultado.es_empresa ? (
                  resultado.atributos?.includes("documentos") && <DocumentosEmpresa documentos={resultado.documentos || []} />
                ) : (
                  resultado.documentos?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted mb-1">Documentos compartidos</div>
                    <div className="space-y-1">
                      {resultado.documentos.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-content truncate">{d.tipo_label}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeClasses(d.estado_verificacion)}`}>{d.estado_label}</span>
                            <WalletArchivo documento={d} />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  )
                )}
                {resultado.antecedentes && (
                  <div className="text-xs text-muted">Antecedentes: <b className="text-content">{resultado.antecedentes.estado}</b></div>
                )}
                {resultado.consultas_restantes != null && (
                  <div className="text-[11px] text-muted">Consultas restantes con esta llave: {resultado.consultas_restantes}</div>
                )}
              </div>
            )}
          </div>}

          {/* ── Wallets compartidas conmigo ── */}
          {puede("ver_compartidas") && <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
            <h2 className="text-lg font-bold text-content mb-4">Wallets compartidas conmigo</h2>
            {compartidas.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Aún no tienes wallets compartidas ni solicitudes autorizadas.</p>
            ) : (
              <div className="space-y-2">
                {compartidas.map((c) => (
                  <div key={c.clave} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2/60 border border-line/15">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-content truncate">{c.titular}</div>
                      <div className="text-xs text-muted">
                        {c.solicitud && `${c.solicitud} · `}{c.documentos} documento(s) · vence {new Date(c.expira).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${c.vigente ? "bg-green-500/15 text-green-300 border-green-500/30" : "bg-surface-2/70 text-muted border-line/15"}`}>
                        {c.vigente ? "Vigente" : c.estado === "revocada" ? "Revocada" : "Expirada"}
                      </span>
                      {c.vigente && puede("consultar") && (
                        <button
                          onClick={() => { setConsultarClave(c.clave); consultarPorClave(c.clave); }}
                          className="text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                        >Ver</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>}

          {/* ── Equipo (Fase 5) ── */}
          {equipo && (
            <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
              <h2 className="text-lg font-bold text-content mb-1">Equipo</h2>
              <p className="text-xs text-muted mb-4">
                Miembros de la empresa y sus roles. Tu rol: <b className="text-content">{equipo.mi_rol}</b>.
              </p>
              {equipo.puede_gestionar && (
                <form onSubmit={invitar} className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="correo@empresa.com" className={inputCls} />
                  <select value={invRol} onChange={(e) => setInvRol(e.target.value)} className={inputCls + " sm:max-w-[190px]"}>
                    {(equipo.roles || []).map((r) => <option key={r.valor} value={r.valor}>{r.label}</option>)}
                  </select>
                  <button type="submit" className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 whitespace-nowrap">
                    Invitar
                  </button>
                </form>
              )}
              <div className="space-y-2">
                {(equipo.miembros || []).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-2/60 border border-line/15">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-content truncate">
                        {m.nombre}{m.es_dueno && <span className="ml-2 text-[10px] text-amber-300">titular</span>}
                      </div>
                      <div className="text-xs text-muted truncate">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {equipo.puede_gestionar && !m.es_dueno ? (
                        <select value={m.rol} onChange={(e) => cambiarRol(m.id, e.target.value)}
                          className="text-xs rounded-md bg-surface-2/70 border border-line/15 text-content px-2 py-1">
                          {(equipo.roles || []).map((r) => <option key={r.valor} value={r.valor}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md border bg-surface-2/70 text-muted border-line/15">{m.rol_label}</span>
                      )}
                      {!m.activo && <span className="text-[10px] text-red-300">inactivo</span>}
                      {equipo.puede_gestionar && !m.es_dueno && m.activo && (
                        <button onClick={() => desactivarMiembro(m.id)} className="text-xs font-semibold text-red-300 hover:text-red-200">Quitar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {(equipo.invitaciones || []).length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-muted mb-1">Invitaciones pendientes</div>
                  {equipo.invitaciones.map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-xs text-muted py-1">
                      <span>{i.email} · {i.rol_label}</span>
                      <span className="text-[10px]">{i.vigente ? "pendiente" : "vencida"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Actividad (Fase 5) ── */}
          {equipo && puede("actividad_ver") && (
            <div className="bg-gradient-to-br from-surface/95 via-surface-2/80 to-surface/95 backdrop-blur-xl rounded-[20px] border border-line/15 shadow-2xl shadow-emerald-500/10 p-6">
              <h2 className="text-lg font-bold text-content mb-4">Actividad</h2>
              {actividad.length === 0 ? (
                <p className="text-sm text-muted text-center py-3">Sin actividad registrada.</p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-auto">
                  {actividad.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-line/10">
                      <span className="text-content truncate">{a.usuario} · <span className="text-muted">{a.rol}</span></span>
                      <span className="text-muted shrink-0">{a.accion}{a.documento ? ` · ${a.documento}` : ""} · {new Date(a.fecha).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
