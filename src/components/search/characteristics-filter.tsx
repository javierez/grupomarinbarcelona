"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "~/components/ui/checkbox";
import { CONDITION_FILTERS, EQUIPMENT_FILTERS } from "~/lib/search-utils";
import { CASILLA_EN_MARCA, useOpcionesBuscador } from "./opciones-buscador";
import { useAspectoV1 } from "~/components/header-style-context";

interface CharacteristicsFilterProps {
  selected: string[];
  onToggle: (key: string, checked: boolean) => void;
  /** Abierto al cargar (la barra de resultados lo abre si ya hay alguna). */
  defaultOpen?: boolean;
}

/**
 * Características (ascensor, garaje, trastero…) y estado del inmueble.
 *
 * Compartido por la home y la barra de resultados. La web no tenía ningún
 * filtro por características: no se podía buscar un piso con garaje, trastero
 * o ascensor, que es lo primero que pide quien busca.
 */
export function CharacteristicsFilter({
  selected,
  onToggle,
  defaultOpen = false,
}: CharacteristicsFilterProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { colorMarca, antiguo } = useOpcionesBuscador();
  const v1 = useAspectoV1();

  const grid = (items: typeof EQUIPMENT_FILTERS) => (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <label
          key={item.key}
          className="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            className={colorMarca ? CASILLA_EN_MARCA : undefined}
            checked={selected.includes(item.key)}
            onCheckedChange={(checked) => onToggle(item.key, checked === true)}
          />
          {item.label}
        </label>
      ))}
    </div>
  );

  const cuerpo = (
    <>
      {grid(EQUIPMENT_FILTERS)}

      {/* El estado del inmueble no es un equipamiento: va aparte para que
          "Acondicionado" no se lea como "Aire acondicionado". */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Estado del inmueble
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      {grid(CONDITION_FILTERS)}
    </>
  );

  // `v1Antigua`: el botón redondo con la flecha, centrado, de esas v1.
  if (antiguo) {
    return (
      <div className="flex w-full flex-col items-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Ocultar más características" : "Mostrar más características"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <div className="mt-3 w-full space-y-4">{cuerpo}</div>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={
          v1
            ? "inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            : "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground transition-colors hover:text-foreground"
        }
      >
        Características
        {selected.length > 0 && ` (${selected.length})`}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-3 w-full space-y-4">{cuerpo}</div>}
    </div>
  );
}
