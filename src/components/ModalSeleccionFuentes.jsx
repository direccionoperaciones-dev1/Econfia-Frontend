/**
 * ModalSeleccionFuentes — Modal genérico para seleccionar fuentes/bots
 * 
 * Props:
 *   isOpen           {boolean}  — muestra/oculta el modal
 *   onClose          {function} — callback al cerrar
 *   onConfirm        {function} — callback al confirmar (recibe array de nombres seleccionados)
 *   title            {string}   — título del modal (ej: "Selecciona las fuentes")
 *   loading          {boolean}  — muestra spinner mientras se cargan fuentes
 *   seleccionInicial {string[]} — nombres ya marcados al abrir
 *   limite           {number}   — máximo de fuentes (por defecto 45)
 *   permitirVacio    {boolean}  — deja confirmar sin ninguna fuente
 *
 * onConfirm también recibe, como segundo argumento, las fuentes completas.
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ModalSeleccionFuentes({
  isOpen,
  onClose,
  onConfirm,
  title = "Selecciona las fuentes",
  loading = false,
  seleccionInicial,
  limite = 45,
  permitirVacio = false,
}) {
  const [fuentes, setFuentes] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [query, setQuery] = useState("");
  const [cargando, setCargando] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  // Cargar fuentes al abrir modal
  useEffect(() => {
    if (!isOpen) return;
    if (seleccionInicial) setSeleccionadas(seleccionInicial);

    const fetchFuentes = async () => {
      try {
        setCargando(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/fuentes/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });
        const json = await res.json();
        setFuentes(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("Error cargando fuentes:", err);
        setFuentes([]);
      } finally {
        setCargando(false);
      }
    };

    fetchFuentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la selección inicial solo se toma al abrir
  }, [isOpen, API_URL]);

  // Filtrar fuentes por texto
  const filteredFuentes = fuentes.filter((f) => {
    const texto = `${f?.nombre ?? ""} ${f?.nombre_pila ?? ""}`.toLowerCase();
    return texto.includes(query.toLowerCase());
  });

  // Manejo de checkboxes (máximo 45 fuentes)
  const handleCheckbox = (nombre) => {
    setSeleccionadas((prev) => {
      if (prev.includes(nombre)) {
        return prev.filter((n) => n !== nombre);
      }
      // Si ya se llegó al límite, no agregar más
      if (prev.length >= limite) {
        return prev;
      }
      return [...prev, nombre];
    });
  };

  // Seleccionar/deseleccionar todas (respetando límite de 45)
  const allSelected =
    filteredFuentes.length > 0 &&
    filteredFuentes.every((f) => seleccionadas.includes(f.nombre));

  const handleToggleAll = () => {
    if (allSelected) {
      setSeleccionadas([]);
    } else {
      const nuevas = filteredFuentes.map((f) => f.nombre);
      setSeleccionadas(nuevas.slice(0, limite));
    }
  };

  // Confirmar selección
  const handleConfirmar = () => {
    if (seleccionadas.length === 0 && !permitirVacio) {
      alert("Selecciona al menos una fuente");
      return;
    }
    if (onConfirm) onConfirm(seleccionadas, fuentes.filter((f) => seleccionadas.includes(f.nombre)));
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setSeleccionadas([]);
    setQuery("");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
        {/* Elementos decorativos */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Modal */}
        <div className="relative bg-gradient-to-br from-slate-900/90 via-brand-2/30 to-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[20px] shadow-2xl shadow-brand/20 max-w-3xl w-full p-6 text-white max-h-[80vh] overflow-y-auto">
          {/* Glow effect */}
          <div className="absolute inset-0 opacity-50 rounded-[20px] bg-gradient-to-r from-brand/5 via-transparent to-brand-2/5 pointer-events-none" />

          {/* Botón cerrar */}
          <button
            onClick={handleCloseModal}
            className="absolute top-3 right-3 text-white/60 hover:text-red-400 text-xl font-bold transition-colors z-10"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="relative z-10">
            {/* Título */}
            <div className="text-center mb-4">
              <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-brand/20 to-brand-2/20 border border-brand/30 mb-2">
                <span className="text-brand text-xs font-medium">Personaliza tu consulta</span>
              </div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-white via-brand/40 to-brand-2 bg-clip-text text-transparent">
                {title}
              </h2>
            </div>

            {/* Filtro y botón "Seleccionar todas" */}
            <div className="mb-3 flex flex-col md:flex-row md:items-center md:gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar fuentes por nombre..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-brand/50 focus:bg-white/10 focus:shadow-lg focus:shadow-brand/10 transition-all backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={handleToggleAll}
                className={`mt-2 md:mt-0 md:ml-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 border border-brand/40 whitespace-nowrap ${
                  allSelected
                    ? "bg-brand/80 text-white hover:bg-brand"
                    : "bg-white/10 text-brand hover:bg-brand/20"
                }`}
              >
                {allSelected ? "Deseleccionar todas" : "Seleccionar todas"}
              </button>
            </div>

            {/* Contador y aviso de límite */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand font-medium">
                  Fuentes seleccionadas: {seleccionadas.length}{Number.isFinite(limite) ? ` / ${limite}` : ""}
                </span>
                {seleccionadas.length >= limite && (
                  <span className="text-xs text-orange-400 font-medium">⚠️ Límite máximo alcanzado</span>
                )}
              </div>
            </div>

            {/* Cargando */}
            {cargando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand"></div>
              </div>
            ) : (
              <>
                {/* Lista de fuentes */}
                <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto">
                  {filteredFuentes.length > 0 ? (
                    filteredFuentes.map((fuente) => {
                      const isDisabled = seleccionadas.length >= limite && !seleccionadas.includes(fuente.nombre);
                      return (
                      <label
                        key={fuente.nombre}
                        className={`flex items-start gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand/30 transition-all group ${
                          isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(fuente.nombre)}
                          onChange={() => handleCheckbox(fuente.nombre)}
                          disabled={isDisabled}
                          className={`accent-brand w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white group-hover:text-brand transition-colors">
                            {fuente.nombre_pila || fuente.nombre}
                          </p>
                        </div>
                      </label>
                    );
                    })
                  ) : (
                    <p className="text-center text-white/50 py-4 text-sm">
                      No hay coincidencias con el filtro.
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm border border-white/20 text-white/80 hover:bg-white/10 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmar}
                    disabled={(seleccionadas.length === 0 && !permitirVacio) || loading}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                      (seleccionadas.length === 0 && !permitirVacio) || loading
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : "bg-gradient-to-r from-brand to-brand-2 text-white hover:opacity-90 hover:shadow-lg hover:shadow-brand/50"
                    }`}
                  >
                    {loading ? "Confirmar..." : "Confirmar selección"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
