import React from "react";

const ITEMS = [
  { key: "users",    icon: "👤", label: "Usuarios" },
  { key: "planes",   icon: "📦", label: "Planes y propuestas" },
  { key: "fuentes",  icon: "🗂️",  label: "Fuentes" },
  { key: "monitoreo", icon: "📡", label: "Monitoreo de fuentes" },
  { key: "soporte",  icon: "💬", label: "Soporte técnico" },
];

const AdminSidebar = ({ onSelect, selected }) => (
  <aside style={{ width: 230, background: "#1e1b4b", color: "#fff", minHeight: "100vh", padding: "24px 0" }}>
    <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>⚙️ Admin</div>
    </div>
    <ul style={{ listStyle: "none", padding: "12px 0", margin: 0 }}>
      {ITEMS.map(({ key, icon, label }) => {
        const activo = selected === key;
        return (
          <li
            key={key}
            onClick={() => onSelect(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              cursor: "pointer",
              fontWeight: activo ? 700 : 400,
              fontSize: 15,
              background: activo ? "rgba(255,255,255,0.12)" : "transparent",
              borderLeft: activo ? "4px solid #818cf8" : "4px solid transparent",
              transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            {label}
          </li>
        );
      })}
    </ul>
  </aside>
);

export default AdminSidebar;
