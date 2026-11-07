import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CentrosCostoPanel from "./CentrosCostoPanel";
import SelectorCentroCosto from "./SelectorCentroCosto";

const respuesta = (data, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => data, blob: async () => new Blob() });

describe("central de gastos", () => {
  const reporte = {
    total: 7,
    totales: { consultas: 7, econfia: 70000, propios: 45500, gastado: 115500, presupuesto: 100000 },
    centros: [
      { centro_costo_id: 1, centro: "Compras", consultas: 5, usuarios: 1, costo_econfia: 50000, gastos_propios: 45500, total: 95500,
        presupuesto: 100000, disponible: 4500, uso_presupuesto: 95.5, detalle_usuarios: [{ usuario: "ana", consultas: 5, costo: 50000 }],
        detalle_tipos: [{ tipo: "fast", consultas: 5, costo: 50000 }] },
      { centro_costo_id: null, centro: "Sin centro de costos", consultas: 2, usuarios: 1, costo_econfia: 20000, gastos_propios: 0,
        total: 20000, presupuesto: 0, disponible: null, uso_presupuesto: null, detalle_usuarios: [], detalle_tipos: [] },
    ],
    categorias: [{ categoria: "Consultas Econfia", valor: 70000 }, { categoria: "Transporte", valor: 45500 }],
    movimientos: [
      { origen: "propio", id: 3, fecha: "2026-11-06", centro: "Compras", categoria: "Transporte", concepto: "Taxi visita", detalle: "", cantidad: 1, valor_unitario: 45500, valor: 45500 },
      { origen: "econfia", id: 8, fecha: "2026-11-05", centro: "Compras", categoria: "Consultas Econfia", concepto: "Consulta fast", detalle: "ana", cantidad: 5, valor_unitario: 10000, valor: 50000 },
    ],
    movimientos_total: 2,
  };

  const montar = () => {
    const llamadas = [];
    global.fetch = jest.fn(async (url, opciones = {}) => {
      llamadas.push({ url, metodo: opciones.method || "GET", cuerpo: opciones.body && JSON.parse(opciones.body) });
      if (url.includes("/reporte/")) return respuesta(reporte);
      if (url.includes("/api/empresa/gastos/configuracion/")) return respuesta({ valor_consulta: 10000 });
      if (url.endsWith("/api/empresa/gastos/") && opciones.method === "POST") return respuesta({ id: 4 });
      if (url.endsWith("/api/empresa/centros-costo/") && opciones.method === "POST") return respuesta({ id: 2 });
      if (url.includes("/centro-costo/") || url.includes("/centros-costo/1/")) return respuesta({});
      return respuesta({ valor_consulta: 10000, categorias: ["Transporte"], centros: [{ id: 1, nombre: "Compras", codigo: "CC1", activo: true, consultas_mes: 5, presupuesto_mensual: 100000 }],
        usuarios: [{ perfil_id: 9, username: "ana", es_admin: false, centro_costo: null }] });
    });
    render(<CentrosCostoPanel api="http://x" headers={() => ({})} onToast={() => {}} />);
    return llamadas;
  };

  it("muestra el gasto en pesos por centro y contra el presupuesto", async () => {
    montar();
    expect(await screen.findByText("$115.500")).toBeInTheDocument();
    expect(screen.getByText("$95.500")).toBeInTheDocument();
    expect(screen.getByText("95.5% usado")).toBeInTheDocument();
    expect(screen.getByText("Disponible $4.500")).toBeInTheDocument();
    expect(screen.getByText("Sin centro de costos")).toBeInTheDocument();
  });

  it("registra un gasto propio y lista los movimientos", async () => {
    const llamadas = montar();
    fireEvent.click(await screen.findByRole("tab", { name: "Movimientos" }));
    expect(await screen.findByText("Taxi visita")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gastos propios" }));
    expect(screen.queryByText("Consulta fast")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Concepto del gasto"), { target: { value: "Almuerzo cliente" } });
    fireEvent.change(screen.getByLabelText("Valor del gasto"), { target: { value: "60.000" } });
    fireEvent.change(screen.getByLabelText("Centro del gasto"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar gasto" }));
    await waitFor(() => expect(llamadas.some((l) => l.metodo === "POST" && l.cuerpo?.concepto === "Almuerzo cliente"
      && l.cuerpo?.valor === "60.000" && l.cuerpo?.centro_costo === "1")).toBe(true));
  });

  it("configura valor por consulta, centros y asignación de usuarios", async () => {
    const llamadas = montar();
    fireEvent.click(await screen.findByRole("tab", { name: "Centros y configuración" }));
    fireEvent.change(await screen.findByLabelText("Valor por consulta"), { target: { value: "12.000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar valor" }));
    await waitFor(() => expect(llamadas.some((l) => l.url.includes("/gastos/configuracion/") && l.cuerpo?.valor_consulta === "12.000")).toBe(true));

    fireEvent.change(screen.getByLabelText("Nombre del centro"), { target: { value: "Talento humano" } });
    fireEvent.change(screen.getByLabelText("Presupuesto mensual del centro"), { target: { value: "500.000" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear centro" }));
    await waitFor(() => expect(llamadas.some((l) => l.metodo === "POST" && l.cuerpo?.nombre === "Talento humano" && l.cuerpo?.presupuesto_mensual === "500.000")).toBe(true));

    const presupuesto = screen.getByLabelText("Presupuesto de Compras");
    fireEvent.change(presupuesto, { target: { value: "150000" } });
    fireEvent.blur(presupuesto);
    await waitFor(() => expect(llamadas.some((l) => l.url.endsWith("/centros-costo/1/") && l.cuerpo?.presupuesto_mensual === "150000")).toBe(true));

    fireEvent.change(screen.getByLabelText("Centro de ana"), { target: { value: "1" } });
    await waitFor(() => expect(llamadas.some((l) => l.url.endsWith("/api/empresa/usuarios/9/centro-costo/") && l.cuerpo?.centro_costo === "1")).toBe(true));
  });
});

describe("selector del usuario", () => {
  it("no aparece si la empresa no tiene centros", async () => {
    global.fetch = jest.fn(async () => respuesta({ disponibles: [], actual: null }));
    const { container } = render(<SelectorCentroCosto />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra el centro activo y deja cambiarlo", async () => {
    const disponibles = [{ id: 1, nombre: "Compras", codigo: "" }, { id: 2, nombre: "Talento humano", codigo: "" }];
    global.fetch = jest.fn(async (url, opciones = {}) => (opciones.method === "POST"
      ? respuesta({ disponibles, actual: disponibles[1] })
      : respuesta({ disponibles, actual: null })));
    render(<SelectorCentroCosto />);
    fireEvent.click(await screen.findByRole("button", { name: /Sin centro de costos/ }));
    fireEvent.click(screen.getByRole("button", { name: "Talento humano" }));
    expect(await screen.findByRole("button", { name: /Talento humano/ })).toBeInTheDocument();
    expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({ centro_costo: 2 });
  });
});
