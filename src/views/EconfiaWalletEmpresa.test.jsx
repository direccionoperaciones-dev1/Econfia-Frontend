import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EconfiaWalletEmpresa from "./EconfiaWalletEmpresa";

jest.mock("../components/Toast", () => ({ message }) => <div role="status">{message}</div>);
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

function setup() {
  const empresa = { razon_social: "Empresa SAS", nombre_comercial: "Marca", ciiu: "6201", tamano: "micro" };
  global.fetch = jest.fn(async (url, options = {}) => {
    if (url.endsWith("/estado/")) return { ok: true, json: async () => ({ empresa,
      documentos: [{ id: 1, tipo_label: "ISO 27001", grupo: "certificaciones", nombre_original: "iso.pdf" }],
      tipos_documento: [{ valor: "iso_27001", label: "Certificación ISO 27001", grupo: "certificaciones" }],
    }) };
    if (url.endsWith("/datos/")) return { ok: true, json: async () => ({ empresa: JSON.parse(options.body) }) };
    if (url.endsWith("/logo/")) return { ok: true, json: async () => ({ logo_url: "/media/logo.png" }) };
    return { ok: true, json: async () => ({ compartidas: [] }) };
  });
  render(<EconfiaWalletEmpresa />);
}

test("edita campos ampliados sin perder foco y guarda sus valores", async () => {
  setup();
  const nombre = await screen.findByLabelText("Nombre comercial");
  nombre.focus();
  fireEvent.change(nombre, { target: { value: "Nueva marca" } });
  expect(screen.getByLabelText("Nombre comercial")).toHaveFocus();
  fireEvent.change(screen.getByLabelText("CIIU principal"), { target: { value: "0111" } });
  fireEvent.change(screen.getByLabelText("Fecha de constitución"), { target: { value: "2020-05-10" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar datos" }));
  await screen.findByText("Datos de la empresa guardados.");
  const call = global.fetch.mock.calls.find(([url]) => url.endsWith("/datos/"));
  expect(JSON.parse(call[1].body)).toMatchObject({ nombre_comercial: "Nueva marca", ciiu: "0111", fecha_constitucion: "2020-05-10" });
  expect(screen.getByRole("heading", { name: "Certificaciones (1)" })).toBeInTheDocument();
});

test("sube el logo sin descartar los datos sin guardar", async () => {
  setup();
  fireEvent.change(await screen.findByLabelText("Nombre comercial"), { target: { value: "Pendiente de guardar" } });
  const file = new File(["imagen"], "logo.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText(/PNG, JPG o WEBP/), { target: { files: [file] } });
  await waitFor(() => expect(screen.getByAltText("Logo actual de la empresa")).toHaveAttribute("src", "/media/logo.png"));
  expect(screen.getByLabelText("Nombre comercial")).toHaveValue("Pendiente de guardar");
  const call = global.fetch.mock.calls.find(([url]) => url.endsWith("/logo/"));
  expect(call[1].body.get("logo")).toBe(file);
});

// ── Controles según el rol (matriz PERMISOS de core/wallet_equipo.py) ──
const PERMISOS = {
  admin: ["datos_ver", "datos_editar", "doc_ver", "doc_subir", "doc_eliminar", "doc_descargar", "solicitar",
    "consultar", "ver_compartidas", "descargar_compartido", "compartir", "equipo_gestionar", "actividad_ver"],
  reclutador: ["datos_ver", "doc_ver", "solicitar", "consultar", "ver_compartidas", "descargar_compartido"],
  auditor: ["datos_ver", "actividad_ver"],
};

async function setupRol(rol, { enviarPermisos = true } = {}) {
  const empresa = { razon_social: "Empresa SAS", nit: "900000000", logo_url: "/media/logo.png" };
  global.fetch = jest.fn(async (url) => {
    if (url.endsWith("/estado/")) return { ok: true, json: async () => ({ empresa,
      documentos: [{ id: 1, tipo_label: "ISO 27001", grupo: "certificaciones", nombre_original: "iso.pdf", archivo_url: "/media/iso.pdf" }],
      tipos_documento: [{ valor: "iso_27001", label: "Certificación ISO 27001", grupo: "certificaciones" }],
      mi_rol: rol, ...(enviarPermisos ? { permisos: PERMISOS[rol] } : {}),
    }) };
    if (url.endsWith("/equipo/")) return { ok: true, json: async () => ({
      mi_rol: rol, puede_gestionar: rol === "admin", roles: [], miembros: [], invitaciones: [] }) };
    if (url.endsWith("/llave-fija/")) return { ok: true, json: async () => ({ llave: null, sugerencias: ["WLT-EMPRESA"] }) };
    return { ok: true, json: async () => ({ compartidas: [], solicitudes: [], tipos: [], actividad: [] }) };
  });
  render(<EconfiaWalletEmpresa />);
  await screen.findByLabelText("Razón social *");
  await screen.findByRole("heading", { name: "Equipo" });
}

const boton = (name) => screen.queryByRole("button", { name });

test("admin ve todas las acciones de edición, compartir y actividad", async () => {
  await setupRol("admin");
  expect(screen.getByLabelText("Razón social *")).toBeEnabled();
  for (const name of ["Guardar datos", "⤓ Traer de Cámara de Comercio", "Subir", "Eliminar", "Quitar logo",
    "Generar llave para compartir", "Usar esta llave", "Enviar solicitud", "Consultar"]) {
    expect(boton(name)).toBeInTheDocument();
  }
  expect(screen.getByLabelText(/PNG, JPG o WEBP/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Ver documento" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Actividad" })).toBeInTheDocument();
  expect(screen.queryByText(/solo permite ver estos datos/)).not.toBeInTheDocument();
});

test("reclutador ve los datos en solo lectura y solo puede solicitar y consultar", async () => {
  await setupRol("reclutador");
  expect(screen.getByLabelText("Razón social *")).toBeDisabled();
  expect(screen.getByText(/Tu rol \(reclutador\) solo permite ver estos datos/)).toBeInTheDocument();
  for (const name of ["Guardar datos", "⤓ Traer de Cámara de Comercio", "Subir", "Eliminar", "Quitar logo",
    "Generar llave para compartir", "Usar esta llave"]) {
    expect(boton(name)).not.toBeInTheDocument();
  }
  expect(screen.queryByLabelText(/PNG, JPG o WEBP/)).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Ver documento" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Mi llave" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Actividad" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Certificaciones (1)" })).toBeInTheDocument();
  expect(boton("Enviar solicitud")).toBeInTheDocument();
  expect(boton("Consultar")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Wallets compartidas conmigo" })).toBeInTheDocument();
  expect(global.fetch.mock.calls.some(([url]) => url.endsWith("/llave-fija/"))).toBe(false);
});

test("auditor solo ve datos en lectura, equipo y actividad", async () => {
  await setupRol("auditor");
  expect(screen.getByLabelText("Razón social *")).toBeDisabled();
  expect(screen.getByRole("heading", { name: "Actividad" })).toBeInTheDocument();
  for (const heading of ["Documentos de la empresa", "Solicitar documentos", "Solicitudes de documentos",
    "Consultar Wallet", "Wallets compartidas conmigo", "Compartir mi wallet", "Credenciales disponibles"]) {
    expect(screen.queryByRole("heading", { name: heading })).not.toBeInTheDocument();
  }
  expect(boton("Guardar datos")).not.toBeInTheDocument();
  expect(boton("Consultar")).not.toBeInTheDocument();
});

test("sin lista de permisos del servidor usa la matriz del rol", async () => {
  await setupRol("auditor", { enviarPermisos: false });
  expect(boton("Guardar datos")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Actividad" })).toBeInTheDocument();
});
