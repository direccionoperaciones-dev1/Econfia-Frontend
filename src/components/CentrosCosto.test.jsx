import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CentrosCostoPanel from "./CentrosCostoPanel";
import SelectorCentroCosto from "./SelectorCentroCosto";

const respuesta = (data, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => data, blob: async () => new Blob() });

describe("panel de centros de costos", () => {
  it("crea, asigna y muestra el consumo por centro", async () => {
    const llamadas = [];
    global.fetch = jest.fn(async (url, opciones = {}) => {
      llamadas.push({ url, metodo: opciones.method || "GET", cuerpo: opciones.body && JSON.parse(opciones.body) });
      if (url.includes("/reporte/")) {
        return respuesta({ total: 7, centros: [
          { centro_costo_id: 1, centro: "Compras", consultas: 5, porcentaje: 71.4, usuarios: 1, detalle_usuarios: [{ usuario: "ana", consultas: 5 }], detalle_tipos: [{ tipo: "fast", consultas: 5 }] },
          { centro_costo_id: null, centro: "Sin centro de costos", consultas: 2, porcentaje: 28.6, usuarios: 1, detalle_usuarios: [], detalle_tipos: [] },
        ] });
      }
      if (url.endsWith("/api/empresa/centros-costo/") && opciones.method === "POST") return respuesta({ id: 2 });
      if (url.includes("/centro-costo/")) return respuesta({});
      return respuesta({ centros: [{ id: 1, nombre: "Compras", codigo: "CC1", activo: true, consultas_mes: 5 }], usuarios: [{ perfil_id: 9, username: "ana", es_admin: false, centro_costo: null }] });
    });
    const avisos = [];
    render(<CentrosCostoPanel api="http://x" headers={() => ({})} onToast={(t) => avisos.push(t)} />);

    expect(await screen.findByText("Sin centro de costos")).toBeInTheDocument();
    expect(screen.getByText("7 consultas en el periodo")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nombre del centro"), { target: { value: "Talento humano" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear centro" }));
    await waitFor(() => expect(llamadas.some((l) => l.metodo === "POST" && l.cuerpo?.nombre === "Talento humano")).toBe(true));

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
