import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AdminPlanes from "./AdminPlanes";

// Toast arrastra react-router, que Jest no resuelve en este proyecto.
jest.mock("./Toast", () => ({ __esModule: true, default: ({ message }) => <div>{message}</div> }));

const plan = (id, nombre, nombre_display, precio, extra = {}) => ({
  id, nombre, nombre_display, precio, costo: 0, moneda: "COP", activo: true, descripcion: "",
  periodicidad: "mensual", periodicidad_display: "Mensual", tarifas: [], consultas_incluidas: null,
  es_producto: false, unidad_singular: "consulta", unidad_plural: "consultas", ...extra,
});
const tarifa = (id, producto, cantidad, unitario, paquete) => ({
  id, producto, cantidad, precio_unitario: String(unitario), precio_paquete: String(paquete),
  descuento_porcentaje: "0", precio_consulta_adicional: null, activo: true,
});
const FAST = plan(1, "econfiafast", "EconfiaFast", 0, {
  tarifas: [tarifa(1, "", 1, 5000, 5000), tarifa(2, "", 500, 4000, 2000000)],
});
const POLIGRAFO = plan(2, "poligrafo", "Polígrafo", 100000, { es_producto: true, unidad_singular: "prueba", unidad_plural: "pruebas" });
const ESTUDIO = plan(4, "estudio-seguridad", "Estudio de seguridad", 0, { es_producto: true, unidad_singular: "estudio", unidad_plural: "estudios" });
const EXPERIAN = plan(3, "experian", "Econfia Adjudicator", 0, {
  productos: [
    { clave: "adjudicator", nombre: "Econfia Adjudicator" },
    { clave: "credit-report", nombre: "Econfia Credit Report" },
    { clave: "contact-search", nombre: "Econfia Contact Search" },
  ],
  tarifas: [tarifa(7, "credit-report", 1, 30000, 30000), tarifa(8, "adjudicator", 1, 27000, 27000)],
});
const PLANES = [FAST, POLIGRAFO, ESTUDIO, EXPERIAN];
const FUENTES = [{ nombre: "ofac", nombre_pila: "Lista OFAC" }, { nombre: "rues", nombre_pila: "" }];

const respuesta = (data) => ({ ok: true, status: 200, json: async () => data, text: async () => JSON.stringify(data) });

function preparar(planes = PLANES) {
  const envios = [];
  global.fetch = jest.fn(async (url, options = {}) => {
    if (url.includes("/api/propuestas/") && options.method === "POST") {
      envios.push(JSON.parse(options.body));
      return respuesta({ id: 9, adjuntos: [] });
    }
    if (url.endsWith("/api/planes/")) return respuesta(planes);
    if (url.endsWith("/api/propuestas/")) return respuesta([]);
    if (url.endsWith("/api/fuentes/")) return respuesta(FUENTES);
    return respuesta(null);
  });
  return envios;
}

async function abrirPropuestas() {
  render(<AdminPlanes />);
  fireEvent.click(await screen.findByRole("button", { name: /^Propuestas/ }));
  await screen.findByText("1. Marca lo que quiere el cliente");
}

const resumen = () => screen.getByText("Resumen del paquete").parentElement;
const total = () => screen.getByText("Total propuesto").parentElement;
const casilla = (nombre) => screen.getByRole("checkbox", { name: new RegExp(`^${nombre}`) });

describe("tabla de planes", () => {
  it("muestra cada producto y los servicios, con aviso si no tienen precio", async () => {
    preparar();
    render(<AdminPlanes />);
    const fila = (await screen.findByText("Econfia Contact Search")).closest("tr");
    expect(fila).toHaveTextContent("Sin precio");
    expect(screen.getByText("Econfia Credit Report").closest("tr")).toHaveTextContent("30.000");
    expect(screen.getAllByText("Estudio de seguridad").pop().closest("tr")).toHaveTextContent("Sin precio");
  });

  it("los precios del plan Experian traen una fila por cada producto faltante", async () => {
    preparar();
    render(<AdminPlanes />);
    const fila = (await screen.findByText("Econfia Contact Search")).closest("tr");
    fireEvent.click(within(fila).getByRole("button", { name: "Poner precio" }));
    const productos = screen.getAllByLabelText("Producto");
    expect(productos).toHaveLength(3);
    expect(productos[2]).toHaveValue("contact-search");

    fireEvent.change(screen.getAllByLabelText("Cantidad de consultas")[2], { target: { value: "500" } });
    fireEvent.change(screen.getAllByLabelText("Precio unitario")[2], { target: { value: "26.000" } });
    expect(screen.getAllByLabelText("Precio del paquete")[2]).toHaveValue("13.000.000");
  });
});

describe("armador de paquetes", () => {
  it("marcar suma solo, con el precio de cada producto", async () => {
    const envios = preparar();
    await abrirPropuestas();
    fireEvent.change(screen.getByLabelText("Nombre del cliente"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });

    fireEvent.click(casilla("Econfia Credit Report"));
    fireEvent.click(casilla("Polígrafo"));
    expect(total()).toHaveTextContent("130.000");

    // Desmarcar quita la línea y resta.
    fireEvent.click(casilla("Polígrafo"));
    expect(total()).toHaveTextContent("30.000");
    fireEvent.click(casilla("Polígrafo"));

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(envios).toHaveLength(1));
    const [credit, poligrafo] = envios[0].items;
    expect(credit.producto).toBe("credit-report");
    expect(credit.tarifa_origen).toBe(7);
    expect(poligrafo.plan).toBe(2);
    expect(poligrafo.precio_unitario).toBe(100000);
  });

  it("la cantidad escoge la tarifa que aplica", async () => {
    preparar();
    await abrirPropuestas();
    fireEvent.click(casilla("EconfiaFast"));
    const cantidad = screen.getByLabelText("Cantidad de EconfiaFast");

    fireEvent.change(cantidad, { target: { value: "10" } });
    expect(total()).toHaveTextContent("50.000");

    fireEvent.click(screen.getByRole("button", { name: "500" }));
    expect(total()).toHaveTextContent("2.000.000");

    // Entre rangos usa el precio unitario del rango alcanzado: 600 × 4.000.
    fireEvent.change(cantidad, { target: { value: "600" } });
    expect(total()).toHaveTextContent("2.400.000");
  });

  it("un producto sin precio no se puede marcar y el regalo no suma", async () => {
    preparar();
    await abrirPropuestas();
    expect(casilla("Estudio de seguridad")).toBeDisabled();
    expect(casilla("Econfia Contact Search")).toBeDisabled();

    fireEvent.click(casilla("Polígrafo"));
    fireEvent.click(screen.getByRole("button", { name: /Regalar/ }));
    const lineas = within(resumen()).getAllByRole("listitem");
    expect(lineas).toHaveLength(2);
    expect(lineas[1]).toHaveTextContent("Sin costo");
    expect(total()).toHaveTextContent("100.000");

    // Desmarcar quita también su regalo.
    fireEvent.click(casilla("Polígrafo"));
    expect(screen.getByText("Todavía no has marcado nada.")).toBeInTheDocument();
  });

  it("muestra el motivo real cuando el servidor rechaza una línea", async () => {
    preparar();
    await abrirPropuestas();
    fireEvent.change(screen.getByLabelText("Nombre del cliente"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });
    fireEvent.click(casilla("Polígrafo"));
    const normal = global.fetch.getMockImplementation();
    global.fetch.mockImplementation(async (url, options = {}) => (
      options.method === "POST"
        ? { ok: false, status: 400, json: async () => ({ items: [{}, { producto: ["Ese producto no pertenece."] }] }) }
        : normal(url, options)
    ));
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    expect(await screen.findByText("Línea 2 · producto: Ese producto no pertenece.")).toBeInTheDocument();
  });

  it("guarda las fuentes escogidas de una línea", async () => {
    const envios = preparar();
    await abrirPropuestas();
    fireEvent.change(screen.getByLabelText("Nombre del cliente"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });
    fireEvent.click(casilla("EconfiaFast"));
    fireEvent.click(screen.getByRole("button", { name: "Escoger fuentes" }));
    fireEvent.click(await screen.findByLabelText("Lista OFAC"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar selección" }));
    await waitFor(() => expect(screen.getByText("1 fuente incluida")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(envios).toHaveLength(1));
    expect(envios[0].items[0].fuentes).toEqual(["ofac"]);
  });
});
