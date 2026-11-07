import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CentroNormativo from "./CentroNormativo";

jest.mock("../components/Header", () => () => null);

describe("Centro normativo", () => {
  it("muestra el sector escogido con su norma", () => {
    render(<CentroNormativo />);
    expect(screen.getByText(/Circular Externa 100-000020/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Sector transporte/ }));
    expect(screen.getByText(/Resolución 2328 de 2025/)).toBeInTheDocument();
    expect(screen.getByText("Superintendencia de Transporte")).toBeInTheDocument();
  });

  it("muestra vigentes primero, el historial al pedirlo y las fuentes del sector", () => {
    render(<CentroNormativo />);
    fireEvent.click(screen.getByRole("tab", { name: /Sector transporte/ }));
    expect(screen.getByText("Ente regulador")).toBeInTheDocument();
    expect(screen.getByText(/Circular Única de Infraestructura y Transporte/)).toBeInTheDocument();
    expect(screen.queryByText("Resolución 74854 de 2016")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ver historial \(1\)/ }));
    expect(screen.getByText("Resolución 74854 de 2016")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Fuentes Econfia/ }));
    expect(screen.getByText("RUNT")).toBeInTheDocument();
  });

  it("cambia el tipo de lista", () => {
    render(<CentroNormativo />);
    expect(screen.getByText("Consejo de Seguridad de la ONU")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /No vinculantes de alta relevancia/ }));
    expect(screen.getByText("OFAC (Lista Clinton)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Control y antecedentes/ }));
    expect(screen.getByText(/Proveedores ficticios/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /PEP/ }));
    expect(screen.getByText("SIGEP")).toBeInTheDocument();
  });

  it("muestra el SIGRIP para entidades públicas", () => {
    render(<CentroNormativo />);
    fireEvent.click(screen.getByRole("tab", { name: /Entidades públicas/ }));
    expect(screen.getByText(/no les aplican el SARLAFT ni el SAGRILAFT/)).toBeInTheDocument();
    expect(screen.getByText("Decreto 1122 de 2024")).toBeInTheDocument();
  });

  it("recorre el rol del oficial de cumplimiento como carrusel", () => {
    render(<CentroNormativo />);
    expect(screen.getByRole("heading", { name: "¿Qué hace un oficial de cumplimiento?" })).toBeInTheDocument();
    ["¿Qué hace?", "¿Cómo lo hace?", "¿Para qué lo hace?", "¿Por qué existe este rol?"].forEach((p) =>
      expect(screen.getByRole("tab", { name: p })).toBeInTheDocument()
    );
    expect(screen.getByRole("heading", { name: "Diseña el sistema de prevención" })).toBeInTheDocument();
    expect(screen.getByText("1 de 14")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ir a Reporta a las autoridades" }));
    expect(screen.getByText(/reportes de operaciones sospechosas \(ROS\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "¿Por qué existe este rol?" }));
    expect(screen.getByRole("heading", { name: "Porque la norma lo exige" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByRole("heading", { name: "Diseña el sistema de prevención" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(screen.getByRole("heading", { name: "Porque los mercados lo piden" })).toBeInTheDocument();
  });

  it("filtra el glosario por grupo", () => {
    render(<CentroNormativo />);
    fireEvent.click(screen.getByRole("button", { name: "Sistemas" }));
    expect(screen.getByRole("button", { name: /SIPLAFT/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^GAFI/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entidades" }));
    expect(screen.getByRole("button", { name: /^UIAF/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /SIPLAFT/ })).not.toBeInTheDocument();
  });

  it("filtra y despliega conceptos", () => {
    render(<CentroNormativo />);
    fireEvent.change(screen.getByLabelText("Buscar concepto"), { target: { value: "UIAF" } });
    const boton = screen.getByRole("button", { name: /ROS/ });
    expect(screen.queryByRole("button", { name: /Matriz de riesgo/ })).not.toBeInTheDocument();
    fireEvent.click(boton);
    expect(screen.getByText(/No es una denuncia penal/)).toBeInTheDocument();
  });
});
