/** @jest-environment node */
// Ejecuta el script real del informe en un DOM: buscador flotante + autocompletado.
const { JSDOM, VirtualConsole } = require("jsdom");
const { buildInformeHtml } = require("./informeHtml");

function abrirInforme() {
  const resultados = [
    { fuente: "Boletín Policía Nacional de Colombia", tipo_fuente: "Antecedentes Judiciales", estado: "validado", score: 1, mensaje: "ok" },
    { fuente: "Policía Nacional", tipo_fuente: "Antecedentes Judiciales", estado: "validado", score: 5, mensaje: "registra" },
    { fuente: "OFAC", tipo_fuente: "Sanciones Internacionales", estado: "validado", score: 1, mensaje: "ok" },
  ];
  const html = buildInformeHtml({ consulta: { fecha: "2026-11-25T07:27:31-05:00", candidato: { nombre: "P", apellido: "Q", cedula: "1" } }, riesgo: { categoria: "Bajo", riesgo: 1, probabilidad: 1, consecuencia: 1 }, resultados, apiUrl: "", qrUrl: "", verifyUrl: "", burbujaUrl: "" });
  const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole: new VirtualConsole() });
  dom.window.Element.prototype.scrollIntoView = function () { dom.window.__saltoA = this.getAttribute("data-label"); };
  return dom.window;
}
const tecla = (w, el, key) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key, bubbles: true }));
function escribir(w, texto) {
  const input = w.document.getElementById("buscar-fuente");
  input.value = texto;
  input.dispatchEvent(new w.Event("input", { bubbles: true }));
  return input;
}
const opciones = (w) => [...w.document.querySelectorAll("#sugerencias [role=option]")].map((li) => li.textContent);

describe("buscador del informe", () => {
  test("se abre con el botón flotante, se cierra con Escape y reabre con /", () => {
    const w = abrirInforme(); const d = w.document;
    const panel = d.getElementById("panel-buscar");
    expect(d.querySelector(".sticky")).toBeNull();
    d.getElementById("btn-buscar").click();
    expect(panel.classList.contains("hidden")).toBe(false);
    expect(d.activeElement.id).toBe("buscar-fuente");
    tecla(w, d, "Escape");
    expect(panel.classList.contains("hidden")).toBe(true);
    tecla(w, d, "/");
    expect(panel.classList.contains("hidden")).toBe(false);
  });

  test("autocompleta sin tildes, con hallazgo primero, y elige con flechas + Enter", () => {
    const w = abrirInforme();
    const input = escribir(w, "policia");
    expect(opciones(w)).toEqual([
      "Policía NacionalAntecedentes Judiciales",
      "Boletín Policía Nacional de ColombiaAntecedentes Judiciales",
    ]);
    tecla(w, input, "ArrowDown");
    tecla(w, input, "ArrowDown");
    tecla(w, input, "Enter");
    expect(w.__saltoA).toBe("Boletín Policía Nacional de Colombia");
    expect(input.value).toBe("Boletín Policía Nacional de Colombia");
    expect(w.document.getElementById("sugerencias").classList.contains("hidden")).toBe(true);
  });

  test("elige con el mouse y busca también por tipo", () => {
    const w = abrirInforme();
    escribir(w, "sanciones");
    expect(opciones(w)).toEqual(["OFACSanciones Internacionales"]);
    w.document.querySelector("#sugerencias [data-i='0']").dispatchEvent(new w.MouseEvent("mousedown", { bubbles: true }));
    expect(w.__saltoA).toBe("OFAC");
  });
});
