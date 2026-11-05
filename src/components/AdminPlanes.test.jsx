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
const PLANES = [
  plan(1, "econfiafast", "EconfiaFast", 5000),
  plan(2, "poligrafo", "Polígrafo", 100000, { es_producto: true, unidad_singular: "prueba", unidad_plural: "pruebas" }),
];
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
  await screen.findByText("Arma el paquete del cliente");
}

const resumen = () => screen.getByText("Resumen del paquete").parentElement;

const EXPERIAN = plan(3, "experian", "Econfia Adjudicator", 0, {
  productos: [
    { clave: "adjudicator", nombre: "Econfia Adjudicator" },
    { clave: "credit-report", nombre: "Econfia Credit Report" },
    { clave: "contact-search", nombre: "Econfia Contact Search" },
  ],
  tarifas: [
    { id: 7, producto: "credit-report", cantidad: 1, precio_unitario: "30000.00", precio_paquete: "30000.00", descuento_porcentaje: "0", precio_consulta_adicional: null, activo: true },
    { id: 8, producto: "adjudicator", cantidad: 1, precio_unitario: "27000.00", precio_paquete: "27000.00", descuento_porcentaje: "0", precio_consulta_adicional: null, activo: true },
  ],
});

describe("tarifas por producto", () => {
  it("multiplica cantidad × precio y una tarifa nueva hereda producto y precio", async () => {
    preparar([EXPERIAN]);
    render(<AdminPlanes />);
    fireEvent.click(await screen.findByRole("button", { name: "Tarifas" }));
    expect(screen.getAllByLabelText("Producto")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "+ Agregar tarifa" }));
    const productos = screen.getAllByLabelText("Producto");
    expect(productos[2]).toHaveValue("adjudicator");

    const cantidades = screen.getAllByLabelText("Cantidad de consultas");
    fireEvent.change(cantidades[2], { target: { value: "500" } });
    expect(screen.getAllByLabelText("Precio del paquete")[2]).toHaveValue("13.500.000");
  });

  it("al escoger el producto usa su precio y solo muestra sus tarifas", async () => {
    preparar([EXPERIAN]);
    await abrirPropuestas();
    fireEvent.change(screen.getByLabelText("Plan o servicio"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Producto"), { target: { value: "credit-report" } });
    expect(screen.getByLabelText(/^Precio por consulta/)).toHaveValue("30.000");
    const opciones = within(screen.getByLabelText("Tarifa por volumen")).getAllByRole("option");
    expect(opciones).toHaveLength(2);
    expect(within(resumen()).getByRole("listitem")).toHaveTextContent("Econfia Credit Report");
  });
});

describe("armador de paquetes", () => {
  it("combina consultas con fuentes, servicio y bono, y el bono no suma", async () => {
    const envios = preparar();
    await abrirPropuestas();

    fireEvent.change(screen.getByLabelText("Nombre del cliente"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });

    // Línea de consultas: reutiliza la tarjeta vacía inicial.
    fireEvent.change(screen.getAllByLabelText("Plan o servicio").pop(), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Escoger fuentes" }));
    fireEvent.click(await screen.findByLabelText("Lista OFAC"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar selección" }));
    await waitFor(() => expect(screen.getByText("1 fuente incluida")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "+ Polígrafo" }));
    fireEvent.click(screen.getByRole("button", { name: /\+ Bono/ }));
    const selects = screen.getAllByLabelText("Plan o servicio");
    fireEvent.change(selects[selects.length - 1], { target: { value: "2" } });

    const lineas = within(resumen()).getAllByRole("listitem");
    expect(lineas).toHaveLength(3);
    expect(lineas[0]).toHaveTextContent("1 fuente");
    expect(lineas[1]).toHaveTextContent(/1 prueba$|1 prueba\b/);
    expect(lineas[2]).toHaveTextContent("Sin costo");
    expect(screen.getByText("Total propuesto").parentElement).toHaveTextContent("105.000");

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(envios).toHaveLength(1));
    const [consultas, poligrafo, bono] = envios[0].items;
    expect(consultas.fuentes).toEqual(["ofac"]);
    expect(poligrafo.plan).toBe(2);
    expect(poligrafo.es_bono).toBe(false);
    expect(bono.es_bono).toBe(true);
  });

  it("avisa si el servicio aún no se ha creado", async () => {
    preparar([PLANES[0]]);
    await abrirPropuestas();
    fireEvent.click(screen.getByRole("button", { name: "+ Estudio de seguridad" }));
    expect(await screen.findByText(/Primero crea «Estudio de seguridad»/)).toBeInTheDocument();
  });
});
