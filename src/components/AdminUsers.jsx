
import React, { useEffect, useState } from "react";
import Toast from "./Toast";

const Modal = ({ open, onClose, children }) => open ? (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
    <div style={{ background: '#fff', padding: 24, borderRadius: 12, minWidth: 320, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
) : null;


const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const AdminUsers = () => {

  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const token = localStorage.getItem("token");
  const [planes, setPlanes] = useState([]);
  const [modalUser, setModalUser] = useState(null);
  const [userPlanes, setUserPlanes] = useState([]);
  const [savingPlanes, setSavingPlanes] = useState(false);
  // Cargar planes disponibles
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/planes/`, {
      headers: { "Authorization": `Token ${token}` }
    })
      .then(res => res.json())
      .then(setPlanes)
      .catch(() => setPlanes([]));
  }, [token]);
  // Abrir modal de asignación de planes
  const openPlanesModal = (user) => {
    setModalUser(user);
    setUserPlanes(user.perfil?.planes?.map(p => p.id) || []);
  };

  // Guardar asignación de planes
  const handleSavePlanes = async () => {
    if (!modalUser) return;
    setSavingPlanes(true);
    try {
      const res = await fetch(`${API_URL}/api/perfiles/${modalUser.perfil.id}/asignar-planes/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ planes: userPlanes })
      });
      if (!res.ok) throw new Error("Error al asignar planes");
      setToast({ type: "success", message: "Planes actualizados" });
      setModalUser(null);
      // Refrescar lista de usuarios
      fetch(`${API_URL}/api/admin/users/`, {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(setUsers);
    } catch (e) {
      setToast({ type: "error", message: "Error al asignar planes" });
    } finally {
      setSavingPlanes(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("No autenticado. Inicia sesión como admin.");
      return;
    }
    fetch(`${API_URL}/api/admin/users/`, {
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json();
      })
      .then(setUsers)
      .catch((err) => {
        setError("Error: " + (err.message.includes('<!DOCTYPE') ? "No autorizado o backend caído." : err.message));
      });
  }, [token]);


  const handleActivate = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${userId}/activar/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al activar usuario");
      setToast({ type: "success", message: data.detail || "Usuario activado" });
      // Refrescar lista
      setUsers(users => users.map(u => u.id === userId ? { ...u, is_active: true } : u));
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios/${userId}/desactivar/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al desactivar usuario");
      setToast({ type: "success", message: data.detail || "Usuario desactivado" });
      // Refrescar lista
      setUsers(users => users.map(u => u.id === userId ? { ...u, is_active: false } : u));
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  };

  if (error) return <div style={{color: 'red'}}>{error}</div>;
  if (!users.length) return <div>Cargando usuarios...</div>;

  return (
    <div>
      <h3>Usuarios</h3>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          sound={toast.type === "error" ? "/sounds/error-011-352286.mp3" : "/sounds/econfia-bot/econfia-1.wav"}
        />
      )}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Nombre</th>
            <th>Staff</th>
            <th>Superuser</th>
            <th>Activo</th>
            <th>Acción</th>
            <th>Planes</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.full_name}</td>
              <td>{u.is_staff ? "Sí" : "No"}</td>
              <td>{u.is_superuser ? "Sí" : "No"}</td>
              <td>{u.is_active ? "Sí" : "No"}</td>
              <td>
                {u.is_active ? (
                  <button onClick={() => handleDeactivate(u.id)} style={{ color: 'red', fontWeight: 600 }}>Desactivar</button>
                ) : (
                  <button onClick={() => handleActivate(u.id)} style={{ color: 'green', fontWeight: 600 }}>Activar</button>
                )}
              </td>
              <td>
                <button onClick={() => openPlanesModal(u)} style={{ fontWeight: 600 }}>Asignar/Quitar</button>
              </td>
                  <Modal open={!!modalUser} onClose={() => setModalUser(null)}>
                    <h4>Asignar planes a {modalUser?.username}</h4>
                    <div style={{ margin: '12px 0' }}>
                      {planes.filter(plan => !plan.es_producto).map(plan => (
                        <label key={plan.id} style={{ display: 'block', marginBottom: 6 }}>
                          <input
                            type="checkbox"
                            checked={userPlanes.includes(plan.id)}
                            onChange={e => {
                              if (e.target.checked) setUserPlanes([...userPlanes, plan.id]);
                              else setUserPlanes(userPlanes.filter(id => id !== plan.id));
                            }}
                          /> {plan.nombre}
                        </label>
                      ))}
                    </div>
                    <button onClick={handleSavePlanes} disabled={savingPlanes} style={{ marginRight: 8 }}>
                      {savingPlanes ? "Guardando..." : "Guardar"}
                    </button>
                    <button onClick={() => setModalUser(null)} disabled={savingPlanes}>Cancelar</button>
                  </Modal>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;