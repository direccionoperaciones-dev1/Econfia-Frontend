import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Flipbook from "./Flipbook";
import VisorBrochure from "./Formatos";
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
  jest.setTimeout(30000);
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
    await screen.findByText("Página 1 de 10");
    fireEvent.click(screen.getByRole("button", { name: "Páginas" }));
    fireEvent.change(screen.getByLabelText("Tipo de página nueva"), { target: { value: "cifras" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("Página 2 de 11")).toBeInTheDocument();
    expect(screen.getByText("Cifras")).toBeInTheDocument();
  });

  it("al hacer clic en una tarjeta del brochure abre su campo para editarla", async () => {
    ancho = 1300;
    const api = jest.fn(async () => ({ contenido: null, publicado: true }));
    render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Página 1 de 10");
    // La tarjeta "Econfia Essencial" está en la página 6 (productos).
    fireEvent.click(screen.getAllByText("Econfia Essencial")[0]);
    expect(screen.getByText("Página 6 de 10")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Econfia Essencial")).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement?.closest("#bq-item-1")).not.toBeNull());
  });

  it("en Diseño cambia el formato y el adorno", async () => {
    ancho = 1300;
    const api = jest.fn(async () => ({ contenido: null, publicado: true }));
    render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Página 1 de 10");
    fireEvent.click(screen.getByRole("button", { name: "Diseño" }));
    fireEvent.click(screen.getByRole("button", { name: /Video/ }));
    expect(screen.getByText("Escena 1 de 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Folleto/ }));
    expect(screen.getByText("Caras 1–3 de 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sin adorno/ }));
    expect(screen.getByRole("button", { name: /Guardar cambios/ })).toBeEnabled();
  });
});

describe("Formatos", () => {
  const con = (formato) => ({ ...BROCHURE_POR_DEFECTO, tema: { ...BROCHURE_POR_DEFECTO.tema, formato } });

  it("folleto muestra tres caras y avanza de a tres", () => {
    ancho = 1300;
    render(<VisorBrochure contenido={con("folleto")} />);
    expect(screen.getByText("Caras 1–3 de 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("Caras 4–6 de 10")).toBeInTheDocument();
  });

  it("video avanza solo y se puede pausar", () => {
    jest.useFakeTimers();
    ancho = 1300;
    render(<VisorBrochure contenido={{ ...con("video"), tema: { ...con("video").tema, video_segundos: 3 } }} />);
    expect(screen.getByText("Escena 1 de 10")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(3300); });
    expect(screen.getByText("Escena 2 de 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    act(() => { jest.advanceTimersByTime(8000); });
    expect(screen.getByText("Escena 2 de 10")).toBeInTheDocument();
    jest.useRealTimers();
  });

  it("infografía dibuja todas las páginas en una tira", () => {
    ancho = 900;
    render(<VisorBrochure contenido={con("infografia")} />);
    expect(screen.getAllByText("Empieza hoy con Econfia").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Así de fácil empiezas").length).toBeGreaterThan(0);
  });

  it("dibuja el adorno de constelaciones detrás del contenido", () => {
    ancho = 390;
    const { container } = render(<Flipbook contenido={BROCHURE_POR_DEFECTO} />);
    expect(container.querySelectorAll("svg line").length).toBeGreaterThan(3);
  });
});
