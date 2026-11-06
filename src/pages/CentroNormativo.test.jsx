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

  it("cambia el tipo de lista", () => {
    render(<CentroNormativo />);
    expect(screen.getByText("Consejo de Seguridad de la ONU")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /Internacionales de referencia/ }));
    expect(screen.getByText("OFAC (EE. UU.)")).toBeInTheDocument();
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
