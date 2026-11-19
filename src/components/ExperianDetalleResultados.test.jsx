import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExperianDetalleResultados from "./ExperianDetalleResultados";

// ── fixtures ─────────────────────────────────────────────────────────────────

const detallePJ = {
  id: 21,
  tipo_identificacion: "NIT",
  numero_identificacion: "999999998",
  apellido_razon_social: "WAYNE ENTERPRISES S.A.S.",
  tipo_resultado: "pj",
  estado: "completado",
  status_experian: "ACCEPTED",
  content_status: "202 ACCEPTED",
  mensaje: "Consulta de ejemplo",
  rating: "AA",
  nivel_riesgo: "BAJO",
  monto_sugerido: "45000000",
  cantidad_alertas: 0,
  resumen_json: {
    rating: "AA",
    nivel: "BAJO",
    monto_sugerido: "45000000",
  },
  respuesta_json: {
    content: {
      respuesta: {
        validacion: {
          datosBasicos: {
            razonSocial: "WAYNE ENTERPRISES S.A.S.",
            tipoDocumento: "NIT",
            numeroDocumento: "999999998",
          },
          perfilGeneral: {
            actividadEconomica: "DESARROLLO DE SOFTWARE A LA MEDIDA",
            numeroEmpleados: "85",
          },
        },
        informacionRiesgo: {
          rating: "AA",
          nivel: "BAJO",
          montoSugerido: "45000000",
        },
        comportamientoCrediticio: {
          indicadoresValores: {
            creditosVigentes: "4",
            saldoActual: "16840000",
          },
        },
        estadosFinancieros: {
          ventasNetas: "2750000000",
          utilidadNeta: "196000000",
        },
        mallaVinculos: {
          coincidencias: "0",
          linkedRestrictiveSummary: [],
        },
      },
    },
  },
};

const detallePN = {
  id: 22,
  tipo_identificacion: "CC",
  numero_identificacion: "1234567890",
  apellido_razon_social: "RODRÍGUEZ DÍAZ JUAN CARLOS",
  tipo_resultado: "pn",
  estado: "completado",
  status_experian: "ACCEPTED",
  content_status: "202 ACCEPTED",
  mensaje: "Consulta persona natural",
  score_valor: "720",
  viabilidad: "VIABLE",
  monto_sugerido: "8000000",
  cantidad_alertas: 0,
  resumen_json: {
    score: "720",
    viabilidad: "VIABLE",
    monto_sugerido: "8000000",
  },
  respuesta_json: { content: { respuesta: {} } },
};

function mockFetchSuccess(data) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
  );
}

function mockFetchError(detail = "Token inválido") {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({ detail }) })
  );
}

// ── setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  process.env.REACT_APP_API_URL = "http://localhost:8000";
  Storage.prototype.getItem = jest.fn(() => "fake-token");
  mockFetchSuccess(detallePJ);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── tests ────────────────────────────────────────────────────────────────────

describe("ExperianDetalleResultados", () => {
  describe("estados de carga y error", () => {
    it("muestra el spinner mientras la petición está en curso", () => {
      global.fetch = jest.fn(() => new Promise(() => {}));
      render(<ExperianDetalleResultados consultaId={21} />);
      expect(screen.getByText(/cargando econfia adjudicator/i)).toBeInTheDocument();
    });

    it("muestra el error cuando la petición falla", async () => {
      mockFetchError("Token inválido");
      render(<ExperianDetalleResultados consultaId={21} />);
      expect(await screen.findByText(/token inválido/i)).toBeInTheDocument();
    });
  });

  describe("persona jurídica", () => {
    it("renderiza el nombre y los datos principales", async () => {
      render(<ExperianDetalleResultados consultaId={21} />);
      expect(
        await screen.findByRole("heading", { name: "WAYNE ENTERPRISES S.A.S." })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/AA/i).length).toBeGreaterThan(0);
    });

    describe("panel de evidencia técnica", () => {
      it("oculta la evidencia tecnica de la vista principal y la muestra bajo demanda", async () => {
        render(<ExperianDetalleResultados consultaId={21} />);

        expect(
          await screen.findByRole("heading", { name: "WAYNE ENTERPRISES S.A.S." })
        ).toBeInTheDocument();

        expect(screen.getByRole("button", { name: /ver evidencia tecnica/i })).toBeInTheDocument();
        expect(screen.queryByText(/JSON completo/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Respuesta completa/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /ver evidencia tecnica/i }));

        expect(
          await screen.findByRole("heading", { name: /Evidencia tecnica/i })
        ).toBeInTheDocument();
        expect(screen.getByText(/Respuesta completa/i)).toBeInTheDocument();
      });

      it("cierra el panel al hacer clic en el botón de cerrar", async () => {
        render(<ExperianDetalleResultados consultaId={21} />);
        await screen.findByRole("heading", { name: "WAYNE ENTERPRISES S.A.S." });

        fireEvent.click(screen.getByRole("button", { name: /ver evidencia tecnica/i }));
        await screen.findByRole("heading", { name: /Evidencia tecnica/i });

        fireEvent.click(screen.getByLabelText(/cerrar evidencia tecnica/i));
        await waitFor(() =>
          expect(screen.queryByRole("heading", { name: /Evidencia tecnica/i })).not.toBeInTheDocument()
        );
      });
    });
  });

  describe("persona natural", () => {
    it("renderiza el nombre y la sección de sugerencias", async () => {
      mockFetchSuccess(detallePN);
      render(<ExperianDetalleResultados consultaId={22} />);

      expect(
        await screen.findByRole("heading", { name: "RODRÍGUEZ DÍAZ JUAN CARLOS" })
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /sugerencias/i })).toBeInTheDocument();
    });
  });
});
