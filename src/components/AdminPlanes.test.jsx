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

let parches = [];
function preparar(planes = PLANES, propuestas = []) {
  const envios = [];
  parches = [];
  global.fetch = jest.fn(async (url, options = {}) => {
    if (options.method === "PATCH") {
      parches.push({ url, cuerpo: JSON.parse(options.body) });
      return respuesta({});
    }
    if (url.includes("/api/propuestas/") && options.method === "POST") {
      envios.push(JSON.parse(options.body));
      return respuesta({ id: 9, adjuntos: [] });
    }
    if (url.endsWith("/api/planes/")) return respuesta(planes);
    if (url.endsWith("/api/propuestas/")) return respuesta(propuestas);
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

describe("presentación", () => {
  it("el catálogo muestra el rango de precio según la cantidad", async () => {
    preparar();
    await abrirPropuestas();
    expect(casilla("EconfiaFast").closest("label")).toHaveTextContent("$ 4.000 a $ 5.000 por consulta, según cantidad");
    expect(casilla("Polígrafo").closest("label")).toHaveTextContent("$ 100.000 por prueba");
  });

  it("la tabla de propuestas resume los servicios y despliega el resto", async () => {
    const items = ["EconfiaFast", "Polígrafo", "Estudio de seguridad", "Econfia Credit Report", "Basic Element"]
      .map((plan_nombre, i) => ({ id: i + 1, plan_nombre, cantidad: 1, es_bono: false }));
    preparar(PLANES, [{ id: 3, creada: "2026-11-05T10:00:00", cliente_nombre: "Edgar", cliente_email: "e@example.com", items, adjuntos: [], total: "100", moneda: "COP", valida_hasta: "2026-11-20", estado: "borrador" }]);
    await abrirPropuestas();
    expect(screen.getByText("5 servicios")).toBeInTheDocument();
    expect(screen.queryByText("Basic Element")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "+2 más" }));
    expect(screen.getByText("Basic Element")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ver menos" }));
    expect(screen.queryByText("Basic Element")).not.toBeInTheDocument();
  });
});

describe("propuesta guardada antes de un cambio de precio", () => {
  it("avisa el precio vigente y lo aplica al cambiar la cantidad", async () => {
    const vieja = {
      id: 3, creada: "2026-11-05T10:00:00", cliente_nombre: "Edgar", cliente_email: "e@example.com", adjuntos: [],
      total: "4000", moneda: "COP", valida_hasta: "2026-11-20", estado: "borrador", descuento_porcentaje: "0.00",
      items: [{ id: 1, plan: 1, producto: "", plan_nombre: "EconfiaFast", cantidad: 1, precio_unitario: "4000.00", precio_paquete: null, tarifa_origen: null, descuento_porcentaje: "0.00", descuento_volumen_porcentaje: "0.00", precio_consulta_adicional: null, es_bono: false, fuentes_detalle: [] }],
    };
    preparar(PLANES, [vieja]);
    await abrirPropuestas();
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Descuento de EconfiaFast")).toHaveValue(0);
    expect(screen.getByText(/no es el vigente/)).toHaveTextContent("$ 5.000");
    fireEvent.click(screen.getByRole("button", { name: "Usar precio vigente" }));
    expect(total()).toHaveTextContent("5.000");
    expect(screen.queryByText(/no es el vigente/)).not.toBeInTheDocument();
  });
});

describe("ahorro de cada tarifa", () => {
  it("se calcula del precio y el precio se calcula del ahorro", async () => {
    preparar([plan(14, "inmuebles-snr", "Econfia Asset Search", 0, { tarifas: [tarifa(31, "", 1, 30000, 30000), tarifa(47, "", 200, 15009, 3001800)] })]);
    render(<AdminPlanes />);
    fireEvent.click(await screen.findByRole("button", { name: "Tarifas" }));
    const ahorros = screen.getAllByLabelText("Ahorro porcentual");
    // Al abrir todavía muestra lo guardado; al tocar el precio se recalcula.
    fireEvent.change(screen.getAllByLabelText("Precio unitario")[1], { target: { value: "15.010" } });
    expect(ahorros[1]).toHaveValue(49.97);
    expect(ahorros[0]).toHaveValue(0);

    fireEvent.change(ahorros[1], { target: { value: "50" } });
    expect(screen.getAllByLabelText("Precio unitario")[1]).toHaveValue("15.000");
    expect(screen.getAllByLabelText("Precio del paquete")[1]).toHaveValue("3.000.000");
    expect(ahorros[1]).toHaveValue(50);
  });
});

describe("cotizar desde la tabla", () => {
  it("calcula el valor para la cantidad escrita, con escala y descuento", async () => {
    preparar([{ ...FAST, descuento_porcentaje: "10" }, EXPERIAN]);
    render(<AdminPlanes />);
    const fast = await screen.findByLabelText("Cotizar EconfiaFast");
    fireEvent.change(fast, { target: { value: "100" } });
    // 100 consultas en el rango de 1: 100 × 5.000 = 500.000, menos 10 % = 450.000.
    expect(fast.closest("td")).toHaveTextContent("= $ 450.000");
    fireEvent.change(fast, { target: { value: "600" } });
    // 600 en el rango de 500: 600 × 4.000 = 2.400.000, menos 10 % = 2.160.000.
    expect(fast.closest("td")).toHaveTextContent("= $ 2.160.000");

    const credit = screen.getByLabelText("Cotizar Econfia Credit Report");
    fireEvent.change(credit, { target: { value: "20" } });
    expect(credit.closest("td")).toHaveTextContent("= $ 600.000");
  });
});

describe("descuento por defecto", () => {
  it("se pone en la tabla y muestra el precio con descuento", async () => {
    preparar([{ ...EXPERIAN, descuentos_productos: { adjudicator: "5" } }, FAST]);
    render(<AdminPlanes />);
    const credit = await screen.findByLabelText("Descuento de Econfia Credit Report");
    fireEvent.change(credit, { target: { value: "10" } });
    fireEvent.blur(credit);
    await waitFor(() => expect(parches).toHaveLength(1));
    expect(parches[0].url).toMatch(/\/api\/planes\/3\/$/);
    expect(parches[0].cuerpo).toEqual({ descuentos_productos: { adjudicator: "5", "credit-report": 10 } });

    const fast = screen.getByLabelText("Descuento de EconfiaFast");
    fast.focus();
    fireEvent.change(fast, { target: { value: "7" } });
    fireEvent.keyDown(fast, { key: "Enter" });
    await waitFor(() => expect(parches).toHaveLength(2));
    expect(parches[1].cuerpo).toEqual({ descuento_porcentaje: 7 });

    // Adjudicator ya trae 5 %: 27.000 pasa a 25.650.
    expect(screen.getByLabelText("Descuento de Econfia Adjudicator").closest("tr")).toHaveTextContent("25.650");
  });

  it("entra solo al marcar el producto en la propuesta", async () => {
    preparar([{ ...EXPERIAN, descuentos_productos: { "credit-report": "10" } }, POLIGRAFO]);
    await abrirPropuestas();
    fireEvent.click(casilla("Econfia Credit Report"));
    expect(screen.getByLabelText("Descuento de Econfia Credit Report")).toHaveValue(10);
    expect(total()).toHaveTextContent("27.000");
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

  it("descuenta solo a un producto o a todo el combo", async () => {
    preparar();
    await abrirPropuestas();
    fireEvent.click(casilla("Econfia Credit Report"));
    fireEvent.click(casilla("Polígrafo"));
    // 10 % solo a Polígrafo: 30.000 + 90.000.
    fireEvent.change(screen.getByLabelText("Descuento de Polígrafo"), { target: { value: "10" } });
    expect(total()).toHaveTextContent("120.000");
    // Y 50 % a todo el combo encima.
    fireEvent.change(screen.getByLabelText(/^Descuento a todo el combo/), { target: { value: "50" } });
    expect(total()).toHaveTextContent("60.000");
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
