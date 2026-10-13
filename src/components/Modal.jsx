import React from "react";

const Modal = ({ children, onClose, panelClassName = "" }) => {
  const defaultPanel = "min-w-[320px] max-w-lg overflow-y-auto rounded-xl bg-white p-6";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6">
      <div className={`relative max-h-[90vh] shadow-2xl ${panelClassName || defaultPanel}`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-3 z-20 grid h-9 w-9 place-items-center rounded-full text-xl font-bold text-muted transition hover:bg-surface-2 hover:text-content"
          aria-label="Cerrar"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
