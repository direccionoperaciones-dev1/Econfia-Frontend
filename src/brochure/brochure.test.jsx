import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Flipbook from "./Flipbook";
import VisorBrochure from "./Formatos";
import BrochureEditor from "../components/BrochureEditor";
import BrochureLienzo from "../components/BrochureLienzo";
import { parsearDatos } from "./Elementos";
import { BROCHURE_POR_DEFECTO, enlaceSeguro } from "./brochureBase";

let ancho = 1300;
beforeAll(() => {
  global.ResizeObserver = class { observe() {} disconnect() {} };
  // jsdom no trae PointerEvent: sin esto los eventos llegan sin coordenadas.
  if (!window.PointerEvent) {
    window.PointerEvent = class extends MouseEvent { constructor(tipo, props = {}) { super(tipo, props); this.pointerId = props.pointerId; } };
  }
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
    fireEvent.click(screen.getByRole("button", { name: /Ver como revista/ }));
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
    fireEvent.click(screen.getByRole("button", { name: /Ver como revista/ }));
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

describe("Lienzo (mover, tamaño y elementos)", () => {
  const tema = BROCHURE_POR_DEFECTO.tema;
  const paginas = BROCHURE_POR_DEFECTO.paginas;
  function montar(pagina, seleccion = null) {
    const onCambiar = jest.fn();
    const onSeleccion = jest.fn();
    const utils = render(<BrochureLienzo pagina={pagina} tema={tema} indice={0} paginas={paginas} ancho={560} onCambiar={onCambiar} seleccion={seleccion} onSeleccion={onSeleccion} />);
    return { ...utils, onCambiar, onSeleccion };
  }

  it("arrastrar el título lo mueve (queda guardado como ajuste)", () => {
    const { container, onCambiar, onSeleccion } = montar(paginas[0]);
    const titulo = container.querySelector('[data-campo="titulo"]');
    document.elementsFromPoint = () => [titulo];
    const capa = screen.getByTestId("capa-lienzo");
    fireEvent.pointerDown(capa, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    expect(onSeleccion).toHaveBeenCalledWith({ tipo: "campo", campo: "titulo", item: null });
    fireEvent.pointerMove(capa, { clientX: 130, clientY: 160, pointerId: 1 });
    expect(onCambiar).toHaveBeenLastCalledWith(expect.objectContaining({ ajustes: { titulo: { x: 30, y: 60, s: 1 } } }));
  });

  it("agrega un texto libre y lo selecciona", () => {
    const { onCambiar, onSeleccion } = montar(paginas[1]);
    fireEvent.click(screen.getByRole("button", { name: "Texto" }));
    const nueva = onCambiar.mock.calls[0][0];
    expect(nueva.elementos).toHaveLength(1);
    expect(nueva.elementos[0]).toEqual(expect.objectContaining({ tipo: "texto", texto: "Escribe aquí" }));
    expect(onSeleccion).toHaveBeenCalledWith({ tipo: "elemento", id: nueva.elementos[0].id });
  });

  it("cambia el tamaño de un elemento desde la esquina y lo borra con Supr", () => {
    const el = { id: "e1", tipo: "forma", forma: "rectangulo", x: 10, y: 10, w: 100, h: 50 };
    const pagina = { ...paginas[1], elementos: [el] };
    const { onCambiar, onSeleccion } = montar(pagina, { tipo: "elemento", id: "e1" });
    const esquina = screen.getByRole("button", { name: "Cambiar tamaño" });
    fireEvent.pointerDown(esquina, { clientX: 0, clientY: 0, pointerId: 2 });
    fireEvent.pointerMove(screen.getByTestId("capa-lienzo"), { clientX: 40, clientY: 20, pointerId: 2 });
    expect(onCambiar).toHaveBeenLastCalledWith(expect.objectContaining({ elementos: [expect.objectContaining({ w: 140, h: 70 })] }));
    fireEvent.keyDown(window, { key: "Delete" });
    expect(onCambiar).toHaveBeenLastCalledWith(expect.objectContaining({ elementos: [] }));
    expect(onSeleccion).toHaveBeenLastCalledWith(null);
  });

  it("dibuja los elementos libres sobre la página", () => {
    const pagina = { ...paginas[1], elementos: [{ id: "t1", tipo: "texto", texto: "Hola Canva", x: 0, y: 0, w: 200, h: 40, tamano: 20 },
      { id: "g1", tipo: "grafica", grafica: "barras", datos: "A: 10\nB: 20", x: 0, y: 100, w: 200, h: 120 }] };
    montar(pagina);
    expect(screen.getByText("Hola Canva")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("lee los datos de la gráfica como «Etiqueta: valor»", () => {
    expect(parsearDatos("Fast: 45\nEssencial: 30,5\nbasura")).toEqual([{ etiqueta: "Fast", valor: 45 }, { etiqueta: "Essencial", valor: 30.5 }]);
  });
});

describe("Más fácil: deshacer, girar e imán", () => {
  const tema = BROCHURE_POR_DEFECTO.tema;
  const paginas = BROCHURE_POR_DEFECTO.paginas;

  it("deshace y rehace los cambios con los botones y con Ctrl+Z / Ctrl+Y", async () => {
    ancho = 1300;
    const api = jest.fn(async () => ({ contenido: null, publicado: true }));
    render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Página 1 de 10");
    const deshacer = screen.getByRole("button", { name: "Deshacer" });
    expect(deshacer).toBeDisabled();
    fireEvent.change(screen.getByDisplayValue("Decisiones seguras con"), { target: { value: "Otro título" } });
    expect(deshacer).toBeEnabled();
    fireEvent.click(deshacer);
    expect(screen.getByDisplayValue("Decisiones seguras con")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rehacer" }));
    expect(screen.getByDisplayValue("Otro título")).toBeInTheDocument();
    document.activeElement?.blur();
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(screen.getByDisplayValue("Decisiones seguras con")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "y", ctrlKey: true });
    expect(screen.getByDisplayValue("Otro título")).toBeInTheDocument();
  });

  it("gira un elemento con la manija y se pega a 90°", () => {
    const onCambiar = jest.fn();
    const pagina = { ...paginas[1], elementos: [{ id: "e1", tipo: "forma", forma: "rectangulo", x: 10, y: 10, w: 100, h: 50 }] };
    render(<BrochureLienzo pagina={pagina} tema={tema} indice={1} paginas={paginas} ancho={560} onCambiar={onCambiar} seleccion={{ tipo: "elemento", id: "e1" }} onSeleccion={jest.fn()} />);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Girar" }), { clientX: 0, clientY: -40, pointerId: 3 });
    fireEvent.pointerMove(screen.getByTestId("capa-lienzo"), { clientX: 100, clientY: 3, pointerId: 3 });
    expect(onCambiar).toHaveBeenLastCalledWith(expect.objectContaining({ elementos: [expect.objectContaining({ rot: 90 })] }));
  });

  it("al arrastrar se imanta al margen de la página", () => {
    const onCambiar = jest.fn();
    const pagina = { ...paginas[1], elementos: [{ id: "e1", tipo: "forma", forma: "rectangulo", x: 10, y: 300, w: 100, h: 50 }] };
    const { container } = render(<BrochureLienzo pagina={pagina} tema={tema} indice={1} paginas={paginas} ancho={560} onCambiar={onCambiar} seleccion={null} onSeleccion={jest.fn()} />);
    const nodo = container.querySelector('[data-elemento="e1"]');
    document.elementsFromPoint = () => [nodo];
    const capa = screen.getByTestId("capa-lienzo");
    fireEvent.pointerDown(capa, { button: 0, clientX: 0, clientY: 0, pointerId: 4 });
    // jsdom mide el elemento en x=0: moverlo 40 lo deja a 4 px del margen (44) y se pega.
    fireEvent.pointerMove(capa, { clientX: 40, clientY: 0, pointerId: 4 });
    expect(onCambiar).toHaveBeenLastCalledWith(expect.objectContaining({ elementos: [expect.objectContaining({ x: 54 })] }));
    // Con Alt no se imanta.
    fireEvent.pointerMove(capa, { clientX: 40, clientY: 0, pointerId: 4, altKey: true });
    expect(onCambiar).toHaveBeenLastCalledWith(expect.objectContaining({ elementos: [expect.objectContaining({ x: 50 })] }));
  });
});

describe("Editar sin que la página salte", () => {
  it("al seleccionar en el lienzo no desplaza la página, solo enfoca el campo", async () => {
    ancho = 1300;
    const scrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {});
    const api = jest.fn(async () => ({ contenido: null, publicado: true }));
    const { container } = render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Página 1 de 10");
    const subtitulo = container.querySelector('.bq-lienzo [data-campo="subtitulo"]');
    document.elementsFromPoint = () => [subtitulo];
    const capa = screen.getByTestId("capa-lienzo");
    fireEvent.pointerDown(capa, { button: 0, clientX: 50, clientY: 50, pointerId: 9 });
    fireEvent.pointerUp(capa, { pointerId: 9 });
    await waitFor(() => expect(document.activeElement?.closest("#bq-campo-subtitulo")).not.toBeNull());
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    scrollTo.mockRestore();
  });
});

describe("Índice editable", () => {
  const tema = BROCHURE_POR_DEFECTO.tema;
  const paginas = BROCHURE_POR_DEFECTO.paginas;

  it("con muchas páginas se compacta y quita la imagen para que todo quepa", () => {
    const { container } = render(<BrochureLienzo pagina={paginas[2]} tema={tema} indice={2} paginas={paginas} ancho={560} onCambiar={jest.fn()} seleccion={null} onSeleccion={jest.fn()} />);
    const lineas = container.querySelectorAll('[data-campo="indice"]');
    expect(lineas).toHaveLength(8);
    expect(screen.getByText("Empieza hoy con Econfia")).toBeInTheDocument();
    // 8 líneas: alto compacto; la imagen se mantiene hasta 8.
    expect(parseInt(lineas[0].style.height, 10)).toBeLessThanOrEqual(54);
  });

  it("una línea del índice se selecciona y se mueve en el lienzo", () => {
    const onCambiar = jest.fn();
    const onSeleccion = jest.fn();
    const { container } = render(<BrochureLienzo pagina={paginas[2]} tema={tema} indice={2} paginas={paginas} ancho={560} onCambiar={onCambiar} seleccion={null} onSeleccion={onSeleccion} />);
    const linea = container.querySelectorAll('[data-campo="indice"]')[1];
    document.elementsFromPoint = () => [linea];
    const capa = screen.getByTestId("capa-lienzo");
    fireEvent.pointerDown(capa, { button: 0, clientX: 0, clientY: 0, pointerId: 5, altKey: true });
    expect(onSeleccion).toHaveBeenCalledWith({ tipo: "campo", campo: "indice", item: 1 });
    fireEvent.pointerMove(capa, { clientX: 0, clientY: 30, pointerId: 5, altKey: true });
    expect(onCambiar).toHaveBeenLastCalledWith(expect.objectContaining({ ajustes: { "indice.1": { x: 0, y: 30, s: 1 } } }));
  });

  it("desde el panel se oculta una página del índice y se cambia su título", async () => {
    ancho = 1300;
    const api = jest.fn(async () => ({ contenido: null, publicado: true }));
    const { container } = render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Página 1 de 10");
    fireEvent.click(screen.getByRole("button", { name: "Editar la página 3" }));
    fireEvent.change(screen.getByLabelText("Título de la página 2"), { target: { value: "Bienvenidos" } });
    expect(screen.getAllByText("Bienvenidos").length).toBeGreaterThan(0);
    const antes = container.querySelectorAll('.bq-lienzo [data-campo="indice"]').length;
    fireEvent.click(screen.getAllByRole("checkbox", { name: /Mostrar/ })[0]);
    expect(container.querySelectorAll('.bq-lienzo [data-campo="indice"]')).toHaveLength(antes - 1);
  });
});

describe("Empresa, biblioteca, gráficas y efectos", () => {
  const tema = BROCHURE_POR_DEFECTO.tema;
  const paginas = BROCHURE_POR_DEFECTO.paginas;
  const lienzo = (pagina) => render(<BrochureLienzo pagina={pagina} tema={tema} indice={1} paginas={paginas} ancho={560} onCambiar={jest.fn()} seleccion={null} onSeleccion={jest.fn()} />);

  it("dibuja misión/visión, línea de tiempo y clientes con testimonio", () => {
    lienzo({ tipo: "mision_vision", titulo: "Grupo Soluciones", items: [{ icono: "objetivo", titulo: "Misión", texto: "Proteger decisiones" }, { icono: "estrella", titulo: "Visión", texto: "Ser referente" }] });
    expect(screen.getByText("Proteger decisiones")).toBeInTheDocument();
    lienzo({ tipo: "linea_tiempo", titulo: "Experiencia", items: [{ valor: "2010", titulo: "Fundación" }, { valor: "2026", titulo: "Econfia" }] });
    expect(screen.getByText("2010")).toBeInTheDocument();
    lienzo({ tipo: "clientes", titulo: "Clientes", items: [{ imagen: "/img/a.png", titulo: "ACME" }], cita: "Excelente servicio", autor: "Gerente ACME" });
    expect(screen.getByAltText("ACME")).toBeInTheDocument();
    expect(screen.getByText("— Gerente ACME")).toBeInTheDocument();
  });

  it("agrega la página de Valores como tarjetas listas para editar", async () => {
    ancho = 1300;
    const api = jest.fn(async () => ({ contenido: null, publicado: true }));
    render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Página 1 de 10");
    fireEvent.click(screen.getByRole("button", { name: "Páginas" }));
    fireEvent.change(screen.getByLabelText("Tipo de página nueva"), { target: { value: "valores" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("Página 2 de 11")).toBeInTheDocument();
    expect(screen.getAllByText("Nuestros valores").length).toBeGreaterThan(0);
  });

  it("la biblioteca lista las imágenes guardadas y sube varias a la vez", async () => {
    ancho = 1300;
    const llamadas = [];
    const api = jest.fn(async (path, options = {}) => {
      llamadas.push({ path, ...options });
      if (path === "/api/brochure/imagenes/" && !options.method) return [{ id: 1, url: "https://api.econfia.co/media/brochure/a.png", nombre: "logo.png" }];
      if (path === "/api/brochure/imagenes/" && options.method === "POST") return { imagenes: [{ id: 2, url: "https://api.econfia.co/media/brochure/b.png", nombre: "b.png" }, { id: 3, url: "https://api.econfia.co/media/brochure/c.png", nombre: "c.png" }] };
      return { contenido: null, publicado: true };
    });
    render(<BrochureEditor api={api} setToast={jest.fn()} />);
    await screen.findByText("Página 1 de 10");
    const boton = await screen.findAllByRole("button", { name: "Mis imágenes (1)" });
    fireEvent.click(boton[0]);
    fireEvent.click(screen.getAllByTitle("logo.png")[0]);
    expect(screen.getAllByDisplayValue("https://api.econfia.co/media/brochure/a.png").length).toBeGreaterThan(0);
    const archivos = [new File(["x"], "b.png", { type: "image/png" }), new File(["y"], "c.png", { type: "image/png" })];
    fireEvent.change(screen.getAllByLabelText("Subir imágenes")[0], { target: { files: archivos } });
    await waitFor(() => expect(llamadas.some((l) => l.method === "POST")).toBe(true));
    const post = llamadas.find((l) => l.method === "POST");
    expect(post.body.getAll("archivos")).toHaveLength(2);
    expect(await screen.findAllByRole("button", { name: "Mis imágenes (3)" })).not.toHaveLength(0);
  });

  it("las gráficas de tendencia y barras horizontales muestran el valor al pasar el cursor", () => {
    const pagina = { ...paginas[1], elementos: [
      { id: "g1", tipo: "grafica", grafica: "barras_h", datos: "Fast: 45\nFull: 30", sufijo: "%", x: 0, y: 0, w: 300, h: 120 },
      { id: "g2", tipo: "grafica", grafica: "linea", datos: "2024: 10\n2025: 40", x: 0, y: 200, w: 300, h: 150 },
    ] };
    render(<PaginaFija pagina={pagina} />);
    expect(screen.getByText("45%")).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByText("Fast").closest("div"));
    expect(screen.getByText("Fast: 45%")).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  it("aplica efectos a la imagen y mezcla con el fondo", () => {
    const pagina = { ...paginas[1], elementos: [{ id: "i1", tipo: "imagen", imagen: "/img/brochure/lupa.jpg", desenfoque: 4, gris: 100, desvanecer: "abajo", mezcla: "multiply", x: 0, y: 0, w: 100, h: 100 }] };
    const { container } = render(<PaginaFija pagina={pagina} />);
    const img = container.querySelector('[data-elemento="i1"] img');
    expect(img.style.filter).toContain("blur(4px)");
    expect(img.style.filter).toContain("grayscale(100%)");
    expect(container.querySelector('[data-elemento="i1"]').style.mixBlendMode).toBe("multiply");
  });
});

function PaginaFija({ pagina }) {
  const PaginaBrochure = require("./PaginaBrochure").default;
  return <div style={require("./brochureBase").variablesTema(BROCHURE_POR_DEFECTO.tema)}><PaginaBrochure pagina={pagina} tema={BROCHURE_POR_DEFECTO.tema} numero={2} paginas={BROCHURE_POR_DEFECTO.paginas} ancho={560} estatico /></div>;
}
