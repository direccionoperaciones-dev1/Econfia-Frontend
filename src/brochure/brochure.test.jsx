import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Flipbook from "./Flipbook";
import BrochureEditor from "../components/BrochureEditor";
import { BROCHURE_POR_DEFECTO, enlaceSeguro } from "./brochureBase";

let ancho = 1300;
beforeAll(() => {
  global.ResizeObserver = class { observe() {} disconnect() {} };
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get() { return ancho; } });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get() { return 900; } });
});

describe("enlaceSeguro", () => {
  it("solo deja pasar https, rutas propias, mailto y tel", () => {
    expect(enlaceSeguro("https://econfia.co")).toBe("https://econfia.co");
    expect(enlaceSeguro("/img/a.jpg")).toBe("/img/a.jpg");
    expect(enlaceSeguro("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(enlaceSeguro("javascript:alert(1)")).toBe("");
    expect(enlaceSeguro("//evil.com/x")).toBe("");
  });
});

describe("Flipbook", () => {
  it("en computador abre como revista: portada, luego de a dos páginas", () => {
    ancho = 1300;
    render(<Flipbook contenido={BROCHURE_POR_DEFECTO} />);
    expect(screen.getByText("Portada")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("2 – 3 de 10")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("4 – 5 de 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByText("2 – 3 de 10")).toBeInTheDocument();
  });

  it("el índice lleva a la página elegida", () => {
    ancho = 1300;
    render(<Flipbook contenido={BROCHURE_POR_DEFECTO} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Así de fácil empiezas/ })[0]);
    expect(screen.getByText("8 – 9 de 10")).toBeInTheDocument();
  });

  it("en celular muestra una página a la vez", () => {
    ancho = 390;
    render(<Flipbook contenido={BROCHURE_POR_DEFECTO} />);
    expect(screen.getByText("1 de 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("2 de 10")).toBeInTheDocument();
  });

  it("agrega una contraportada si el número de páginas es impar", () => {
    ancho = 390;
    render(<Flipbook contenido={{ paginas: BROCHURE_POR_DEFECTO.paginas.slice(0, 3) }} />);
    expect(screen.getByText("1 de 4")).toBeInTheDocument();
  });
});

describe("BrochureEditor", () => {
  it("parte del borrador, edita en vivo y guarda", async () => {
    ancho = 1300;
    const llamadas = [];
    const api = jest.fn(async (path, options = {}) => {
      llamadas.push({ path, ...options });
      if (options.method === "PUT") return { ...JSON.parse(options.body), actualizado: "2026-11-26T10:00:00" };
      return { contenido: null, publicado: true, actualizado: null };
    });
    const setToast = jest.fn();
    render(<BrochureEditor api={api} setToast={setToast} />);
    await screen.findByText("Brochure interactivo");
    const guardar = screen.getByRole("button", { name: /Guardado/ });
    expect(guardar).toBeDisabled();

    // Portada seleccionada: cambia el título y se ve en la vista previa.
    const titulo = screen.getByDisplayValue("Decisiones seguras con");
    fireEvent.change(titulo, { target: { value: "Confianza verificada" } });
    expect(screen.getAllByText(/Confianza verificada/).length).toBeGreaterThan(1);

    fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));
    await waitFor(() => expect(llamadas.some((l) => l.method === "PUT")).toBe(true));
    const put = JSON.parse(llamadas.find((l) => l.method === "PUT").body);
    expect(put.contenido.paginas[0].titulo).toBe("Confianza verificada");
    expect(put.publicado).toBe(true);
    expect(setToast).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
  });

  it("agrega una página del tipo elegido después de la seleccionada", async () => {
    const api = jest.fn(async () => ({ contenido: null, publicado: true }));
    render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Páginas (10)");
    fireEvent.change(screen.getByLabelText("Tipo de página nueva"), { target: { value: "cifras" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("Páginas (11)")).toBeInTheDocument();
    expect(screen.getByText(/Página 2: Cifras/)).toBeInTheDocument();
  });
});
