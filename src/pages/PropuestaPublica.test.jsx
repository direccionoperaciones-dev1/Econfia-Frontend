import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PropuestaPublica from "./PropuestaPublica";

// react-router no se resuelve en Jest en este proyecto: se simulan los dos hooks que usa la página.
let mockBusqueda = "";
jest.mock("react-router-dom", () => ({ useParams: () => ({ token: "abc" }), useLocation: () => ({ search: mockBusqueda }) }));

const item = (id, plan_nombre, cantidad, valor_unitario, extra = {}) => ({
  id, plan_nombre, cantidad, valor_unitario: String(valor_unitario), total: String(cantidad * valor_unitario),
  precio_unitario: String(valor_unitario), precio_paquete: null, descuento_porcentaje: "0", descuento_unitario: "0",
  descuento_volumen_porcentaje: "0", precio_consulta_adicional: null, es_bono: false, etiqueta: "plan",
  unidad_singular: "consulta", unidad_plural: "consultas", beneficios: [], fuentes: [], usuarios: null, disponibilidad: "",
  plan_descripcion: "", ...extra,
});
const PROPUESTA = {
  numero: 4, cliente_nombre: "Ana", cliente_empresa: "ACME", moneda: "COP", valida_hasta: "2099-01-01", vencida: false,
  estado: "enviada", observaciones: "", descuento_porcentaje: "0", presupuesto_cliente: "1000000", contrapropuesta: null,
  subtotal: "900000", total: "900000", fecha: "2026-11-24", adjuntos: [],
  items: [
    item(1, "EconfiaFast", 100, 5000),
    item(2, "Estudio de seguridad", 4, 100000, { unidad_singular: "estudio", unidad_plural: "estudios", etiqueta: "servicio" }),
  ],
};

let envios;
function abrir(search = "", datos = PROPUESTA) {
  mockBusqueda = search;
  envios = [];
  global.fetch = jest.fn(async (u, options = {}) => {
    if (options.method === "POST") {
      envios.push(JSON.parse(options.body));
      return { ok: true, status: 201, json: async () => ({ detail: "Recibimos tu contrapropuesta.", contrapropuesta: { creada: "2026-11-24T10:00:00", total: "1000000", lineas: [] } }) };
    }
    return { ok: true, status: 200, json: async () => datos };
  });
  render(<PropuestaPublica />);
}

describe("contrapropuesta del cliente", () => {
  it("cambia cantidades, recalcula y no deja pasarse del presupuesto", async () => {
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Personaliza tu cotización" }));
    const enviar = screen.getByRole("button", { name: "Enviar cotización personalizada" });
    expect(enviar).toBeDisabled(); // sin cambios todavía
    expect(screen.getByText("Te quedan $ 100.000")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Cantidad de Estudio de seguridad"), { target: { value: "6" } });
    expect(screen.getByText("Te pasas por $ 100.000")).toBeInTheDocument();
    expect(enviar).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Cantidad de EconfiaFast"), { target: { value: "80" } });
    expect(screen.getByText("Te quedan $ 0")).toBeInTheDocument();
    expect(enviar).toBeEnabled();
    fireEvent.click(enviar);
    await waitFor(() => expect(envios).toHaveLength(1));
    expect(envios[0].items).toEqual([{ id: 1, cantidad: 80 }, { id: 2, cantidad: 6 }]);
    expect(await screen.findByText("Recibimos tu cotización personalizada. Tu asesor te contactará.")).toBeInTheDocument();
  });

  it("sugiere cuántas más le alcanzan con lo que queda", async () => {
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Personaliza tu cotización" }));
    fireEvent.click(screen.getByRole("button", { name: "+20 más te alcanzan" }));
    expect(screen.getByLabelText("Cantidad de EconfiaFast")).toHaveValue(120);
  });

  it("en la vista previa del asesor no se puede enviar", async () => {
    abrir("?preview=1");
    fireEvent.click(await screen.findByRole("button", { name: "Personaliza tu cotización" }));
    fireEvent.change(screen.getByLabelText("Cantidad de EconfiaFast"), { target: { value: "90" } });
    expect(screen.getByRole("button", { name: "Enviar cotización personalizada" })).toBeDisabled();
  });
});

describe("explicación de la propuesta", () => {
  it("con presupuesto: dice que se armó con él y menciona descuento y reunión presencial", async () => {
    abrir();
    expect(await screen.findByText("Cómo funciona tu propuesta")).toBeInTheDocument();
    expect(screen.getByText("Propuesta con descuento")).toBeInTheDocument();
    expect(screen.getByText(/reunión presencial, donde resolvemos/)).toBeInTheDocument();
    expect(screen.getByText("Ajustada a tu presupuesto")).toBeInTheDocument();
    expect(screen.queryByText("Es un ejemplo de referencia")).not.toBeInTheDocument();
  });

  it("sin presupuesto: aclara que la cotización es solo un ejemplo genérico", async () => {
    abrir("", { ...PROPUESTA, presupuesto_cliente: null });
    expect(await screen.findByText("Es un ejemplo de referencia")).toBeInTheDocument();
    expect(screen.getByText(/solo un ejemplo genérico/)).toBeInTheDocument();
    expect(screen.queryByText("Ajustada a tu presupuesto")).not.toBeInTheDocument();
  });

  it("sin presupuesto: el cliente escribe el suyo y se envía con la cotización", async () => {
    abrir("", { ...PROPUESTA, presupuesto_cliente: null });
    fireEvent.click(await screen.findByRole("button", { name: "Personaliza tu cotización" }));
    fireEvent.change(screen.getByLabelText("Tu presupuesto"), { target: { value: "800000" } });
    fireEvent.change(screen.getByLabelText("Cantidad de Estudio de seguridad"), { target: { value: "5" } });
    expect(screen.getByText("Te pasas por $ 200.000")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Cantidad de Estudio de seguridad"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar cotización personalizada" }));
    await waitFor(() => expect(envios).toHaveLength(1));
    expect(envios[0].presupuesto).toBe(800000);
  });

  it("con presupuesto del asesor no se muestra el campo para escribirlo", async () => {
    abrir();
    fireEvent.click(await screen.findByRole("button", { name: "Personaliza tu cotización" }));
    expect(screen.queryByLabelText("Tu presupuesto")).not.toBeInTheDocument();
  });
});
