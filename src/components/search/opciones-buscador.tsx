"use client";

import { createContext, useContext } from "react";
import type { OpcionesBuscador } from "~/lib/search-utils";

/**
 * Las opciones de la v1 del buscador (`opcionesBuscador`), para las piezas de
 * dentro (casillas, menú de tipos) sin pasarlas de mano en mano. Sin
 * proveedor, el buscador de la v2 de hoy.
 */
const Contexto = createContext<OpcionesBuscador>({
  compra: false,
  colorMarca: false,
  nave: false,
  antiguo: false,
});

export const OpcionesBuscadorProvider = Contexto.Provider;

export function useOpcionesBuscador(): OpcionesBuscador {
  return useContext(Contexto);
}

/** Casilla marcada en el color de marca, como en la v1 (`buscadorColorMarca`). */
export const CASILLA_EN_MARCA =
  "data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=checked]:text-brand-foreground";
