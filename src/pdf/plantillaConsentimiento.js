// src/pdf/plantillaConsentimiento.js
// Genera (client-side, jsPDF) una PLANTILLA GENÉRICA de consentimiento informado /
// autorización de tratamiento de datos, para que el usuario la descargue, la haga
// firmar por el titular y la conserve en sus registros. NO está atada a la consulta
// (es una sugerencia / conveniencia). Texto BORRADOR estándar (Ley 1581/2012,
// Ley 1266/2008) — revisar/ajustar con el área legal antes de usarlo oficialmente.
import jsPDF from "jspdf";

const MARGIN = 20;
const LINE = "_".repeat(60);

export function descargarPlantillaConsentimiento() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - MARGIN * 2;
  let y = MARGIN;

  const salto = (mm) => { y += mm; };
  const nuevaPaginaSiHaceFalta = (alto = 8) => {
    if (y + alto > doc.internal.pageSize.getHeight() - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };
  const parrafo = (texto, { size = 10, font = "normal", gap = 2 } = {}) => {
    doc.setFont("helvetica", font);
    doc.setFontSize(size);
    doc.setTextColor(30, 30, 30);
    const lineas = doc.splitTextToSize(texto, contentW);
    lineas.forEach((l) => {
      nuevaPaginaSiHaceFalta(6);
      doc.text(l, MARGIN, y);
      salto(size * 0.42 + 1.2);
    });
    salto(gap);
  };
  const titulo = (texto, size = 14) => {
    nuevaPaginaSiHaceFalta(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(10, 40, 80);
    doc.text(texto, pageW / 2, y, { align: "center" });
    salto(size * 0.5 + 2);
  };
  const subtitulo = (texto) => {
    nuevaPaginaSiHaceFalta(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(10, 40, 80);
    doc.text(texto, MARGIN, y);
    salto(5.5);
  };

  // ----- Encabezado -----
  titulo("AUTORIZACION PARA EL TRATAMIENTO DE DATOS");
  titulo("PERSONALES Y CONSULTA DE ANTECEDENTES", 14);
  salto(2);
  parrafo(
    "En cumplimiento de la Ley 1581 de 2012, la Ley 1266 de 2008 (Habeas Data), el " +
    "Decreto 1377 de 2013 y demas normas concordantes, el presente documento recoge la " +
    "autorizacion libre, previa, expresa e informada del titular para el tratamiento de " +
    "sus datos personales.",
    { size: 9, gap: 3 }
  );

  // ----- Datos del titular -----
  subtitulo("1. Datos del titular");
  parrafo("Nombre completo: " + LINE, { gap: 1 });
  parrafo("Tipo y numero de documento: " + LINE, { gap: 1 });
  parrafo("Ciudad: __________________________     Fecha: _____ / _____ / __________", { gap: 3 });

  // ----- Empresa / responsable -----
  subtitulo("2. Empresa responsable de la consulta");
  parrafo("Razon social: " + LINE, { gap: 1 });
  parrafo("NIT: __________________________     Finalidad de la consulta: __________________", { gap: 3 });

  // ----- Autorizacion -----
  subtitulo("3. Autorizacion");
  parrafo(
    "Yo, el titular identificado arriba, autorizo de manera libre, previa, expresa e " +
    "informada a la empresa responsable y a sus aliados tecnologicos (incluida la " +
    "plataforma ECONFIA) para recolectar, consultar, verificar, almacenar, usar y tratar " +
    "mis datos personales en fuentes publicas y privadas, con la finalidad indicada " +
    "(por ejemplo: proceso de seleccion, vinculacion, contratacion, debida diligencia o " +
    "prevencion de riesgos).",
    { gap: 2 }
  );

  // ----- Derechos -----
  subtitulo("4. Derechos del titular");
  parrafo(
    "Como titular tengo derecho a: conocer, actualizar y rectificar mis datos; solicitar " +
    "prueba de esta autorizacion; ser informado sobre el uso dado a mis datos; presentar " +
    "quejas ante la SIC; y revocar la autorizacion y/o solicitar la supresion de mis datos " +
    "cuando no exista un deber legal o contractual de conservarlos.",
    { gap: 3 }
  );

  // ----- Declaracion y firma -----
  subtitulo("5. Declaracion y firma");
  parrafo(
    "Declaro que la informacion suministrada es veraz y que se me informo de forma clara " +
    "sobre las finalidades del tratamiento y sobre mis derechos.",
    { gap: 8 }
  );
  nuevaPaginaSiHaceFalta(30);
  parrafo("Firma del titular: " + "_".repeat(40), { gap: 1 });
  parrafo("Documento: __________________________     Huella (opcional): __________", { gap: 6 });

  // ----- Pie -----
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  const pie =
    "Plantilla sugerida por ECONFIA. Es responsabilidad de cada empresa adaptarla y validarla " +
    "con su area legal. Este documento NO se sube a la plataforma; la empresa lo conserva como " +
    "soporte del consentimiento.";
  doc.splitTextToSize(pie, contentW).forEach((l) => {
    nuevaPaginaSiHaceFalta(5);
    doc.text(l, MARGIN, y);
    salto(3.3);
  });

  doc.save("plantilla-consentimiento-informado-econfia.pdf");
}
