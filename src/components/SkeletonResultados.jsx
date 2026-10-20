import React from "react";

/**
 * Skeleton (esqueleto) de carga para la vista de resultados / historial de
 * consultas. Reemplaza al spinner: muestra placeholders con la forma del
 * contenido real (tarjeta de identidad + rejilla de fuentes) con un shimmer
 * suave. Usa los tokens de tema (content/surface/line) para verse bien en
 * cualquier tema (oscuro / claro / naranja).
 */
const Bloque = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-content/10 ${className}`} />
);

export default function SkeletonResultados({ fuentes = 8, className = "min-h-[60vh]" }) {
  return (
    <div className={`w-full px-4 ${className}`} aria-busy="true" aria-label="Cargando resultados">
      <div className="mx-auto w-full max-w-5xl py-6">
        {/* Encabezado: título + acciones */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Bloque className="h-6 w-48" />
            <Bloque className="h-3 w-32 opacity-70" />
          </div>
          <div className="flex gap-2">
            <Bloque className="h-9 w-28 rounded-lg" />
            <Bloque className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Tarjeta de identidad (DNI) */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-line/15 bg-surface/60 p-5">
          <div className="flex gap-4">
            <Bloque className="h-24 w-24 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3 py-1">
              <Bloque className="h-4 w-40" />
              <Bloque className="h-3 w-56 opacity-80" />
              <Bloque className="h-3 w-32 opacity-60" />
              <Bloque className="h-3 w-48 opacity-70" />
            </div>
          </div>
        </div>

        {/* Rejilla de fuentes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: fuentes }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-line/15 bg-surface/50 p-4"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="mb-3 flex items-center gap-3">
                <Bloque className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Bloque className="h-3 w-3/4" />
                  <Bloque className="h-2.5 w-1/2 opacity-60" />
                </div>
                <Bloque className="h-6 w-10 rounded-full" />
              </div>
              <Bloque className="h-2.5 w-full opacity-70" />
              <Bloque className="mt-1.5 h-2.5 w-5/6 opacity-50" />
            </div>
          ))}
        </div>

        {/* Pie: spinner doble anillo + texto (se conserva el spinner original) */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="relative h-14 w-14 rounded-full bg-surface/75">
            <span className="absolute inset-0 rounded-full border-2 border-brand/20" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-brand border-t-brand [animation-duration:0.9s]" />
            <span className="absolute inset-1.5 animate-spin rounded-full border-2 border-transparent border-b-brand-2 border-l-brand-2 [animation-duration:1.4s] [animation-direction:reverse]" />
            <span className="absolute inset-0 m-auto h-2 w-2 animate-pulse rounded-full bg-brand" />
          </div>
          <span className="text-xs font-semibold text-muted">Preparando tu información…</span>
        </div>
      </div>
    </div>
  );
}
