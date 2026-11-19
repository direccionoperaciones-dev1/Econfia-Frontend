import {
  getExperianSubjectField,
  isExperianConsulta,
  normalizeExperianConsulta,
} from "./experian";

describe("experian utils", () => {
  test("normaliza una consulta Experian para la tabla de resultados", () => {
    const row = normalizeExperianConsulta({
      id: 17,
      created_at: "2026-06-10T12:30:00Z",
      tipo_identificacion: "1",
      numero_identificacion: "123456789",
      apellido_razon_social: "Kent",
      tipo_resultado: "pn",
      estado: "completado",
      status_experian: "ACCEPTED",
      score_valor: "853",
      viabilidad: "ALTA",
      mensaje: "Consulta exitosa",
    });

    expect(row).toMatchObject({
      id: 17,
      row_id: "experian-17",
      source: "experian",
      // El producto se muestra como "Econfia Adjudicator" en la tabla.
      tipo_consulta: "Econfia Adjudicator",
      cedula: "123456789",
      nombre: "Kent",
      estado: "completado",
      tipo_resultado: "pn",
      score_valor: "853",
    });
  });

  test("detecta consultas Experian por source o tipo_consulta", () => {
    expect(isExperianConsulta({ source: "experian" })).toBe(true);
    expect(isExperianConsulta({ tipo_consulta: "experian" })).toBe(true);
    expect(isExperianConsulta({ tipo_consulta: "essential" })).toBe(false);
  });

  test("usa razon social para NIT y primer apellido para persona natural", () => {
    expect(getExperianSubjectField("NIT")).toEqual({
      key: "apellidoRazonSocial",
      label: "Razón social",
      placeholder: "Ingrese la razón social",
      persona: "pj",
    });

    expect(getExperianSubjectField("1")).toEqual({
      key: "apellidoRazonSocial",
      label: "Primer apellido",
      placeholder: "Ingrese el primer apellido",
      persona: "pn",
    });
  });
});
