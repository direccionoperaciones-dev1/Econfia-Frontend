import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, FileText, LogOut, User,  BookOpen,  Volume2,
  ChevronLeft, ChevronRight, Sun, Moon, Activity, MousePointerClick, Landmark, ShieldCheck,
} from "lucide-react";

import { Fuel } from "lucide-react";
import { CircleDollarSignIcon } from "./icons/CircleDollarSignIcon";
import {MapPinIcon} from "./icons/MapIcon"
import { useTheme } from "../context/ThemeContext";
import {GaugeIcon} from "./icons/Range"
import {UserIcon} from "./icons/Perons"
import {BookTextIcon} from "./icons/Consultas"
import {CircleHelpIcon} from "./icons/help"
import {WalletIcon} from "./icons/wallet"
import {FingerprintIcon} from "./icons/huella"
import {CursorClickIcon} from "./icons/essencitialExpress"
import {ZapIcon} from "./icons/fast"
import { BriefcaseBusinessIcon } from "./icons/Empresa"
import {FolderOpenIcon } from "./icons/basic"
import {SendIcon} from "./icons/essencial"
import {IdCardIcon } from "./icons/iconcontratista"
import {EvChargerIcon} from "./icons/iconfull"
import {LogoutIcon} from "./icons/loout"
import UserCogIcon from '../assets/icons8-lista-de-verificación-64.png';

export default function Taskbar() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      setUser(u);
      console.log("[TaskBar] user:", u);
      if (u) {
        console.log("[TaskBar] is_staff:", u.is_staff, "is_superuser:", u.is_superuser);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    function handleUserUpdate() {
      try {
        const u = JSON.parse(localStorage.getItem("user"));
        setUser(u);
      } catch {
        setUser(null);
      }
    }
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const hasPlanes = user?.perfil?.planes && user.perfil.planes.length > 0;
  const isAdmin = user?.is_superuser || user?.is_staff;

// Accesos de consulta según los planes asignados
let consultaItems = [];
if (hasPlanes) {
  const planes = user.perfil.planes.map(p => (p.nombre || '').toLowerCase());
  if (planes.includes("ecorefull")) {
    consultaItems.push({ path: "/3c8f1a2e", icon: <EvChargerIcon size={26} strokeWidth={1.75} />, label: "E-Core Full", color: "amber" });
  }
  if (planes.includes("contratista")) {
    consultaItems.push({ path: "/6c1b9f3d", icon: <IdCardIcon size = {26} />, label: "E-Contratista", color: "orange" });
  }
  if (planes.includes("essential")) {
    consultaItems.push({ path: "/9e3a6c1f", icon: <SendIcon size ={26} />, label: "E-Essential", color: "cyan" });
  }
  if (planes.includes("basic-element") || planes.includes("basic-elemnt")) {
    consultaItems.push({ path: "/b4f8d2e7", icon: <FolderOpenIcon  size ={26} />, label: "E-Basic Element", color: "violet" });
  }
  if(planes.includes("empresa")){
    consultaItems.push({ path: "/4a7e2b8f", icon: < BriefcaseBusinessIcon  size={26} strokeWidth={1.75} />, label: "Empresa RUES", color: "emerald" });
  }
  if (planes.includes("inmuebles-snr")) {
    consultaItems.push({ path: "/inmuebles-snr", icon: <Landmark size={28} strokeWidth={1.75} />, label: "Econfia Asset Search", color: "sky" });
  }
  if (planes.includes("econfiafast")) {
    consultaItems.push({ path: "/7f3a9e2b", icon: <ZapIcon size={26} />, label: "E-Fast", color: "yellow" });
  }
  if (planes.includes("consolidado-riesgo") || planes.includes("econfiafast") || isAdmin) {
    consultaItems.push({ path: "/consolidado-riesgo", icon: <ShieldCheck size={27} />, label: "E-Integrity 360", color: "cyan" });
  }
  if (planes.includes("essencial-express")) {
    consultaItems.push({ path: "/a1e6c4b8", icon: <CursorClickIcon size ={26} />, label: "E-Essential Express", color: "pink" });
  }
  if(planes.includes("validacion-titulos")){
  consultaItems.push({ path: "/2b7d5e9c", icon: <img src={UserCogIcon} alt="Validación de títulos" />, label: "Validación de títulos", color: "indigo" });
  }
  if (planes.includes("e-identidad")) {
    consultaItems.push({ path: "/1d5f8e3a", icon: <FingerprintIcon size={36} strokeWidth={1.75} />, label: "E-Identidad", color: "teal" });
  }
  if (planes.includes("wallet")) {
    consultaItems.push({ path: "/e7c1a9d4", icon: <WalletIcon size={36} strokeWidth={1.75} />, label: "EconfiaWallet", color: "emerald" });
  }
  if (planes.includes("experian")) {
    consultaItems.push({ path: "/5c2e8f4a", icon: <GaugeIcon size={36} strokeWidth={1.75} />, label: "Econfia Adjudicator", color: "sky" });
  }
  if (planes.includes("historia_credito") || planes.includes("experian")) {
    consultaItems.push({ path: "/3e9f7c1d", icon: <CircleDollarSignIcon size={36} strokeWidth={1.75} />, label: "Econfia Credit Report", color: "sky" });
  }
  if (planes.includes("reconocer") || planes.includes("experian")) {
    consultaItems.push({ path: "/6b2d8e4f", icon: <MapPinIcon size={36} strokeWidth={1.75} />, label: "Econfia Contact Search", color: "sky" });
  }
}

// Menú base — "Salir" siempre primero, de izquierda a derecha
let menuItems = [
  { path: "/f1d8a5c3", icon: <LogoutIcon size={36} strokeWidth={1.75} />, label: "Salir", color: "rose" },
  ...consultaItems,
  { path: "/e9c4b2f7", icon: <UserIcon size={36} />, label: "Perfil", color: "fuchsia" },
  { path: "/d3b7f1e9", icon: <BookTextIcon size={36} strokeWidth={1.75} />, label: "Consultas", color: "blue" },
  { path: "/c2e6b9a4", icon: <CircleHelpIcon size={36} strokeWidth={1.75} />, label: "Ayuda", color: "lime" },
];

// Monitoreo de fuentes (solo lectura) para el usuario NO admin:
// puede ver el estado de las fuentes pero no lanzar escaneo ni ver el porcentaje.
if (!isAdmin) {
  menuItems.push({ path: "/7f2b9e4d", icon: <Activity size={16} strokeWidth={1.75} />, label: "Monitoreo de fuentes", color: "sky" });
}

// Accesos CRUD solo para admin
if (isAdmin) {
  menuItems = [
    ...menuItems,
    { path: "/7b3f9d1e", icon: <User size={16} strokeWidth={1.75} />, label: "Admin Usuarios", color: "rose" },
    { path: "/1e5c8a4b", icon: <FileText size={16} strokeWidth={1.75} />, label: "Planes y propuestas", color: "amber" },
    { path: "/4d9b2f6e", icon: <Search size={16} strokeWidth={1.75} />, label: "Admin Fuentes", color: "cyan" },
    { path: "/2c8e5f1a", icon: <BookOpen size={16} strokeWidth={1.75} />, label: "Admin Blog", color: "violet" },
    { path: "/8f4a1d7c", icon: <Volume2 size={16} strokeWidth={1.75} />, label: "Admin Sonidos", color: "emerald" },
    { path: "/9a3f2c7e", icon: <Activity size={16} strokeWidth={1.75} />, label: "Admin Monitoreo", color: "sky" },
    { path: "/3f8a1e6d", icon: <WalletIcon size={16} strokeWidth={1.75} />, label: "Admin Wallet", color: "emerald" },
  ];
}
// Admin de una Entidad (org-admin) que NO es superadmin de Econfia: acceso al
// panel de Wallet, donde solo verá la pestaña de Esquemas de credenciales.
else if (user?.perfil?.es_admin_organizacion) {
  menuItems.push({ path: "/3f8a1e6d", icon: <WalletIcon size={16} strokeWidth={1.75} />, label: "Esquemas Wallet", color: "emerald" });
}

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const COLOR_HEX = {
    amber: "#f59e0b",
    orange: "#f97316",
    cyan: "#06b6d4",
    violet: "#8b5cf6",
    emerald: "#10b981",
    yellow: "#eab308",
    pink: "#ec4899",
    indigo: "#6366f1",
    teal: "#14b8a6",
    sky: "#0ea5e9",
    fuchsia: "#d946ef",
    blue: "#3b82f6",
    lime: "#84cc16",
    rose: "#f43f5e",
  };

  // Descripción corta (solo se muestra bajo el módulo central).
  // NO forma parte de menuItems: es únicamente metadata visual.
  const DESCRIPCIONES = {
    "Salir": "Cerrar sesión",
    "E-Core Full": "Consulta integral completa",
    "E-Contratista": "Validación de contratistas",
    "E-Essential": "Consulta esencial",
    "E-Basic Element": "Consulta básica",
    "Empresa RUES": "Información empresarial confiable",
    "Econfia Asset Search": "Matrículas y direcciones registradas",
    "E-Fast": "Validación instantánea de documentos",
    "E-Integrity 360": "Expediente integral vigente e histórico",
    "E-Essencial Express": "Consultas por número de documento",
    "Validación de títulos": "Verificación académica",
    "E-Identidad": "Verificación de identidad",
    "econfiaWallet": "Tu identidad digital",
    "Econfia Adjudicator": "Score y viabilidad crediticia",
    "Econfia Credit Report": "Historia de crédito detallada",
    "Econfia Contact Search": "Ubicación y contacto",
    "Perfil": "Tu cuenta",
    "Consultas": "Historial de consultas",
    "Ayuda": "Soporte y guías",
    "Monitoreo de fuentes": "Estado de las fuentes",
    "Admin Usuarios": "Gestión de usuarios",
    "Planes y propuestas": "Gestión comercial",
    "Admin Fuentes": "Gestión de fuentes",
    "Admin Blog": "Gestión del blog",
    "Admin Sonidos": "Gestión de sonidos",
    "Admin Monitoreo": "Monitoreo global",
  };

// ─────────────────────────────────────────────────────────────
// DISCO 3D REAL / CARRUSEL CILÍNDRICO
// ─────────────────────────────────────────────────────────────

const N = menuItems.length;

// Ángulo real entre cada servicio en el cilindro
const ANGLE_STEP = N > 0 ? 360 / N : 0;

// Radio del disco/cilindro.
// Depende de la cantidad de módulos disponibles: usuarios con pocos accesos no
// necesitan un anillo gigantesco; admins con muchos módulos conservan espacio.
const DISC_RADIUS = Math.round(Math.min(520, Math.max(285, 170 + N * 20)));
const DISC_STAGE_WIDTH = Math.round(Math.min(1180, Math.max(620, DISC_RADIUS * 2 + 260)));
const DISC_BELT_WIDTH = Math.round(DISC_RADIUS * 1.58);
const DISC_GLOW_WIDTH = Math.round(DISC_BELT_WIDTH * 0.88);

const activeIndex = menuItems.findIndex(
  (item) => pathname === item.path || pathname.startsWith(item.path + "/")
);

// Rotación CONTINUA y acumulativa del disco (en grados).
// Nunca "reinicia": siempre gira por el camino más corto, de modo que
// el anillo se siente infinito y sin saltos bruscos (p. ej. de "Salir"
// al último módulo de admin).
const [rotation, setRotation] = useState(
  activeIndex >= 0 && ANGLE_STEP ? -activeIndex * ANGLE_STEP : 0
);

// Módulo que está al frente, derivado de la rotación actual.
const safeCenter =
  N > 0 && ANGLE_STEP
    ? ((Math.round(-rotation / ANGLE_STEP) % N) + N) % N
    : 0;

// Gira hasta un índice por el camino más corto (sin dar la vuelta completa).
const goToIndex = (target) => {
  setRotation((rot) => {
    if (N === 0 || !ANGLE_STEP) return rot;
    const current = ((Math.round(-rot / ANGLE_STEP) % N) + N) % N;
    let diff = ((target - current) % N + N) % N;
    if (diff > N / 2) diff -= N; // camino más corto: [-N/2, N/2]
    return rot - diff * ANGLE_STEP;
  });
};

// Al navegar a una ruta, el disco gira hasta ese módulo (camino más corto).
useEffect(() => {
  if (activeIndex >= 0) goToIndex(activeIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeIndex]);

// Las flechas siempre avanzan/retroceden UNA posición (rotación continua).
const rotatePrev = () => setRotation((r) => r + ANGLE_STEP);
const rotateNext = () => setRotation((r) => r - ANGLE_STEP);

// Click en cualquier módulo: navega directo con un solo clic.
// El disco gira solo hasta ese módulo gracias al efecto de la ruta activa
// (goToIndex en el useEffect de activeIndex), por el camino más corto.
const handleItemClick = (index, path) => {
  navigate(path);
};

// Diferencia circular entre un módulo y el central.
const circularDistance = (index) => {
  if (N <= 1) return 0;

  let distance = Math.abs(index - safeCenter);

  if (distance > N / 2) {
    distance = N - distance;
  }

  return distance;
};

// Color del cinturón = color del módulo que está al frente.
const centerColor =
  (N > 0 && COLOR_HEX[menuItems[safeCenter]?.color]) || "#38bdf8";

return (
  <div className="absolute top-32 left-0 right-0 z-40 flex justify-center pointer-events-none">
    <style>{`

      /* =========================================================
         VIDRIO
      ========================================================= */

      .disc-glass {
        background:
          radial-gradient(
            circle at 50% 35%,
            rgb(var(--th-content) / 0.05),
            transparent 58%
          ),
          linear-gradient(
            180deg,
            rgb(var(--th-surface) / 0.58),
            rgb(var(--th-surface-2) / 0.72)
          );

        backdrop-filter: blur(12px) saturate(160%);
        -webkit-backdrop-filter: blur(12px) saturate(160%);
      }

      .disc-control {
        background:
          linear-gradient(
            180deg,
            rgb(var(--th-surface) / 0.76),
            rgb(var(--th-surface-2) / 0.60)
          );

        border: 1px solid rgb(var(--th-line) / 0.24);

        box-shadow:
          0 10px 30px rgb(0 0 0 / 0.28),
          inset 0 1px 0 rgb(255 255 255 / 0.05);

        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }


      /* =========================================================
         ESCENARIO 3D
      ========================================================= */

      .disc-stage {
        position: relative;

        width: min(var(--disc-stage-width, 1180px), 82vw);
        height: 205px;

        perspective: 1500px;
        perspective-origin: 50% 44%;

        transform-style: preserve-3d;

        overflow: visible;
      }


      /* =========================================================
         CINTURÓN / PLATAFORMA ELÍPTICA
      ========================================================= */

      .disc-belt {
        position: absolute;

        left: 50%;
        top: 34px;

        width: var(--disc-belt-width, 820px);
        height: 240px;

        transform:
          translateX(-50%)
          rotateX(74deg)
          translateZ(0px);

        transform-style: preserve-3d;

        border-radius: 50%;

        pointer-events: none;

        z-index: 0;

        /* más transparente en conjunto */
        opacity: 0.38;

        transition: opacity 0.6s ease;
      }

      

        box-shadow:
          0 0 16px color-mix(in srgb, var(--belt-color, #38bdf8) 32%, transparent),
          0 0 45px color-mix(in srgb, var(--belt-color, #38bdf8) 15%, transparent),
          0 0 90px color-mix(in srgb, var(--belt-color, #38bdf8) 10%, transparent),
          inset 0 0 70px color-mix(in srgb, var(--belt-color, #38bdf8) 6%, transparent);
      }

      .disc-belt::after {
        content: "";

        position: absolute;

        inset: 35px 70px;

        border-radius: 50%;

        border:
          1px solid
          color-mix(in srgb, var(--belt-color, #38bdf8) 20%, transparent);

        box-shadow:
          0 0 20px color-mix(in srgb, var(--belt-color, #38bdf8) 12%, transparent),
          inset 0 0 38px color-mix(in srgb, var(--belt-color, #38bdf8) 7%, transparent);
      }


      /* Brillo frontal del cinturón */
      .disc-front-glow {
        position: absolute;

        left: 50%;
        top: 168px;

        transform: translateX(-50%);

        width: var(--disc-glow-width, 720px);
        height: 18px;

        border-radius: 50%;

        background:
          linear-gradient(
            90deg,
            transparent 0%,
            color-mix(in srgb, var(--belt-color, #38bdf8) 30%, transparent) 18%,
            color-mix(in srgb, var(--belt-color, #38bdf8) 78%, transparent) 38%,
            var(--belt-color, #38bdf8) 50%,
            color-mix(in srgb, var(--belt-color, #38bdf8) 78%, transparent) 62%,
            color-mix(in srgb, var(--belt-color, #38bdf8) 30%, transparent) 82%,
            transparent 100%
          );

        filter: blur(6px);

        opacity: 0.32;

        pointer-events: none;

        z-index: 1;

        animation: discGlowPulse 3.6s ease-in-out infinite;
      }

      @keyframes discGlowPulse {
        0%, 100% {
          opacity: 0.42;
          transform: translateX(-50%) scaleX(0.94);
        }
        50% {
          opacity: 0.82;
          transform: translateX(-50%) scaleX(1.04);
        }
      }


      /* =========================================================
         MUNDO 3D
      ========================================================= */

      .disc-world {
        position: absolute;

        left: 50%;
        top: 116px;

        width: 1px;
        height: 1px;

        transform-style: preserve-3d;

        transition:
          transform 0.78s cubic-bezier(.20,.90,.25,1);

        will-change: transform;

        z-index: 5;
      }


      /* =========================================================
         ITEM
      ========================================================= */

      .disc-item {
        position: absolute;

        left: 0;
        top: 0;

        width: 132px;
        height: 145px;

        margin-left: -66px;
        margin-top: -72px;

        display: flex;
        flex-direction: column;
        align-items: center;

        gap: 8px;

        pointer-events: auto;

        cursor: pointer;

        transform-style: preserve-3d;
        backface-visibility: visible;

        transition:
          filter 0.78s cubic-bezier(.20,.90,.25,1),
          opacity 0.78s cubic-bezier(.20,.90,.25,1);

        will-change:
          transform,
          opacity,
          filter;

        background: transparent;
        border: 0;
      }


      /* =========================================================
         BURBUJA DEL ICONO
      ========================================================= */

      .disc-icon {
        position: relative;

        width: 44px;
        height: 44px;

        border-radius: 9999px;

        display: flex;
        align-items: center;
        justify-content: center;

        color: rgb(var(--th-content) / 0.88);

        background:
          radial-gradient(
            circle at 50% 34%,
            rgb(var(--th-content) / 0.06),
            transparent 52%
          ),
          linear-gradient(
            180deg,
            rgb(var(--th-surface) / 0.92),
            rgb(var(--th-surface-2) / 0.90)
          );

        border:
          2px solid
          color-mix(
            in srgb,
            var(--item-color, #38bdf8) 62%,
            transparent
          );

        box-shadow:
          0 0 15px
          color-mix(
            in srgb,
            var(--item-color, #38bdf8) 24%,
            transparent
          ),
          inset 0 0 20px rgb(var(--th-surface-2) / 0.55);

        transition:
          width 0.78s cubic-bezier(.20,.90,.25,1),
          height 0.78s cubic-bezier(.20,.90,.25,1),
          border-color 0.78s cubic-bezier(.20,.90,.25,1),
          box-shadow 0.78s cubic-bezier(.20,.90,.25,1),
          background 0.78s cubic-bezier(.20,.90,.25,1);
      }


      /* reflejo interno */
      .disc-icon::before {
        content: "";

        position: absolute;

        width: 60%;
        height: 34%;

        left: 20%;
        top: 7%;

        border-radius: 50%;

        background:
          linear-gradient(
            180deg,
            rgb(255 255 255 / 0.12),
            transparent
          );

        filter: blur(2px);

        pointer-events: none;
      }


      /* =========================================================
         ACTIVO
      ========================================================= */

      .disc-item.is-center .disc-icon {
        width: 60px;
        height: 60px;

        color: rgb(var(--th-content));

        border-width: 3px;

        border-color:
          color-mix(
            in srgb,
            var(--item-color, #38bdf8) 94%,
            white 6%
          );

        background:
          radial-gradient(
            circle at 50% 38%,
            color-mix(
              in srgb,
              var(--item-color, #38bdf8) 26%,
              transparent
            ),
            rgb(var(--th-surface) / 0.94) 72%
          );

        box-shadow:
          0 0 20px 2px
          color-mix(
            in srgb,
            var(--item-color, #38bdf8) 70%,
            transparent
          ),

          0 0 45px 8px
          color-mix(
            in srgb,
            var(--item-color, #38bdf8) 42%,
            transparent
          ),

          0 0 85px 12px
          color-mix(
            in srgb,
            var(--item-color, #38bdf8) 20%,
            transparent
          ),

          inset 0 0 28px rgb(255 255 255 / 0.06);
      }


      /* =========================================================
         ICONO INTERNO
      ========================================================= */

      .disc-icon-inner {
        position: relative;
        z-index: 2;

        display: flex;
        align-items: center;
        justify-content: center;

        width: 20px;
        height: 20px;
      }

      .disc-icon-inner > svg {
        width: 20px;
        height: 20px;
      }

      .disc-icon-inner > img {
        width: 20px;
        height: 20px;

        object-fit: contain;
      }

      .disc-item.is-center .disc-icon-inner {
        width: 26px;
        height: 26px;
      }

      .disc-item.is-center .disc-icon-inner > svg {
        width: 26px;
        height: 26px;
      }

      .disc-item.is-center .disc-icon-inner > img {
        width: 25px;
        height: 25px;
      }


      /* =========================================================
         TEXTO
      ========================================================= */

      .disc-label {
        max-width: 145px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        text-align: center;

        font-size: 12px;
        font-weight: 700;

        line-height: 1.1;

        color:
          rgb(var(--th-content) / 0.60);

        transition:
          color 0.5s ease,
          font-size 0.5s ease,
          text-shadow 0.5s ease;
      }

      .disc-item.is-center .disc-label {
        font-size: 17px;
        font-weight: 900;

        color:
          rgb(var(--th-content));

        text-shadow:
          0 0 14px
          color-mix(
            in srgb,
            var(--item-color, #38bdf8) 65%,
            transparent
          );
      }

      .disc-desc {
        max-width: 155px;

        text-align: center;

        font-size: 10px;
        font-weight: 500;

        line-height: 1.2;

        color:
          rgb(var(--th-content) / 0.50);

        opacity: 0;

        transform: translateY(-3px);

        transition:
          opacity 0.45s ease,
          transform 0.45s ease;
      }

      .disc-item.is-center .disc-desc {
        opacity: 1;
        transform: translateY(0);
      }


      /* =========================================================
         FLECHAS
      ========================================================= */

      .disc-page-btn {
        width: 44px;
        height: 44px;

        border-radius: 9999px;

        display: flex;
        align-items: center;
        justify-content: center;

        flex-shrink: 0;

        pointer-events: auto;

        color:
          rgb(var(--th-content) / 0.82);

        transition:
          transform 0.18s ease,
          border-color 0.18s ease,
          color 0.18s ease,
          box-shadow 0.18s ease;
      }

      .disc-page-btn:hover {
        transform: scale(1.08);

        color: rgb(var(--th-content));

        border-color:
          rgba(56, 189, 248, 0.60);

        box-shadow:
          0 0 18px rgba(56, 189, 248, 0.18);
      }

      .disc-page-btn:active {
        transform: scale(0.94);
      }


      /* =========================================================
         TEXTO DE AYUDA
      ========================================================= */

      .disc-hint {
        display: flex;
        align-items: center;

        gap: 7px;

        margin-top: -12px;

        font-size: 10px;
        font-weight: 700;

        letter-spacing: 0.14em;

        text-transform: uppercase;

        color:
          rgb(var(--th-content) / 0.42);
      }


      /* =========================================================
         RESPONSIVE
      ========================================================= */

      @media (max-width: 1100px) {

        .disc-stage {
          width: min(var(--disc-stage-width, 760px), 760px);
          transform: scale(0.90);
        }

        .disc-belt {
          width: min(var(--disc-belt-width, 760px), 760px);
        }
      }

      @media (max-width: 820px) {

        .disc-stage {
          width: min(var(--disc-stage-width, 620px), 620px);

          transform:
            scale(0.76);

          transform-origin: top center;
        }
      }

    `}</style>


    <div className="pointer-events-auto flex flex-col items-center">


      {/* =======================================================
          FILA PRINCIPAL
      ======================================================= */}

      <div className="flex items-start gap-4">


        {/* FLECHA IZQUIERDA */}

        <button
          type="button"
          onClick={rotatePrev}
          className="disc-page-btn disc-control"
          aria-label="Rotar disco a la izquierda"
          style={{ marginTop: 78 }}
        >
          <ChevronLeft size={21} />
        </button>


        {/* =====================================================
            DISCO
        ===================================================== */}

        <div
          className="disc-stage"
          style={{
            "--belt-color": centerColor,
            "--disc-stage-width": `${DISC_STAGE_WIDTH}px`,
            "--disc-belt-width": `${DISC_BELT_WIDTH}px`,
            "--disc-glow-width": `${DISC_GLOW_WIDTH}px`,
          }}
        >


          {/* cinturón */}

          <div className="disc-belt" />

          <div className="disc-front-glow" />


          {/* mundo 3D */}

          <div
            className="disc-world"
            style={{
              transform:
                `rotateY(${rotation}deg)`
            }}
          >

            {menuItems.map((item, index) => {

              const distance =
                circularDistance(index);

              const depthFactor =
                N > 1
                  ? distance / (N / 2)
                  : 0;

              const isCenter =
                index === safeCenter;


              /* blur progresivo */

              const blur =
                isCenter
                  ? 0
                  : Math.min(
                      4.8,
                      depthFactor * 5.2
                    );


              /* opacidad */

              const opacity =
                isCenter
                  ? 1
                  : Math.max(
                      0.16,
                      1 - depthFactor * 0.78
                    );


              /* brillo */

              const brightness =
                isCenter
                  ? 1.20
                  : Math.max(
                      0.42,
                      1.06 - depthFactor * 0.65
                    );


              /* escala */

              const scale =
                isCenter
                  ? 1.06
                  : Math.max(
                      0.66,
                      1 - depthFactor * 0.32
                    );


              /* los muy traseros siguen existiendo,
                 pero casi no llaman la atención */

              const zIndex =
                Math.round(
                  100 - depthFactor * 80
                );


              return (

                <button
                  key={item.path}

                  type="button"

                  className={
                    `disc-item ${
                      isCenter
                        ? "is-center"
                        : ""
                    }`
                  }

                  onClick={() =>
                    handleItemClick(
                      index,
                      item.path
                    )
                  }

                  style={{

                    transform: `
                      rotateY(${index * ANGLE_STEP}deg)
                      translateZ(${DISC_RADIUS}px)
                      scale(${scale})
                    `,

                    opacity,

                    filter: `
                      blur(${blur}px)
                      brightness(${brightness})
                    `,

                    zIndex,

                    "--item-color":
                      COLOR_HEX[item.color] ||
                      "#38bdf8",
                  }}

                  title={item.label}
                >

                  <span
                    className="disc-icon disc-glass"
                  >

                    <span
                      className="disc-icon-inner text-current"
                    >
                      {item.icon}
                    </span>

                  </span>


                  <span className="disc-label">
                    {item.label}
                  </span>


                  <span className="disc-desc">
                    {
                      DESCRIPCIONES[
                        item.label
                      ]
                    }
                  </span>

                </button>

              );
            })}

          </div>

        </div>


        {/* FLECHA DERECHA */}

        <button
          type="button"
          onClick={rotateNext}
          className="disc-page-btn disc-control"
          aria-label="Rotar disco a la derecha"
          style={{ marginTop: 78 }}
        >
          <ChevronRight size={21} />
        </button>


        {/* TEMA */}

        <button
          type="button"
          onClick={toggleTheme}
          className="disc-page-btn disc-control"
          aria-label="Cambiar tema"
          title={
            theme === "dark"
              ? "Cambiar a tema claro"
              : "Cambiar a tema oscuro"
          }
          style={{ marginTop: 78 }}
        >
          {
            theme === "dark"
              ? <Sun size={20} />
              : <Moon size={20} />
          }
        </button>

      </div>


      {/* =======================================================
          AYUDA
      ======================================================= */}


    </div>

  </div>
);
}
