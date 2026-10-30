import React, { useState } from "react";

// Declaración de autorización del titular (Ley 1581) para los formularios de
// consulta. Se muestra corta con "Leer más" para no alargar el formulario; el
// texto completo sigue siendo el que el usuario acepta al marcar la casilla.
export const DECLARACION_AUTORIZACION =
  "Declaro bajo mi responsabilidad que cuento con la autorización previa del titular de los datos " +
  "personales objeto de consulta o con un fundamento legal válido que me habilita para realizarla, y que " +
  "utilizaré la información exclusivamente para finalidades legítimas y autorizadas";

const CORTA = "Declaro que cuento con la autorización del titular para esta consulta";

export default function TextoAutorizacion({ extra = "" }) {
  const [abierto, setAbierto] = useState(false);
  // Va dentro del <label> de la casilla: el botón no debe marcarla/desmarcarla.
  const alternar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAbierto((v) => !v);
  };
  return (
    <>
      {abierto ? `${DECLARACION_AUTORIZACION}${extra}` : `${CORTA}${extra ? extra : "."}`}{" "}
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className="inline font-semibold text-brand underline-offset-2 hover:underline"
      >
        {abierto ? "Leer menos" : "Leer más"}
      </button>
    </>
  );
}
