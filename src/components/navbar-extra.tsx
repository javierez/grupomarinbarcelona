import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  MENU_EN_VIVO,
  esEnlaceInterno,
  type EnlaceDelMenu,
  type MenuEnVivo,
} from "~/lib/nav-extra";

/**
 * Los enlaces propios y el orden de la barra. En un borrador, el que acaba de
 * mandar el CRM (`BorradorEnVivo` lo pasa con `MENU_EN_VIVO`), sin recargar;
 * fuera de un borrador el evento no llega nunca y manda lo publicado.
 */
export function useMenuEnVivo(
  navExtra: EnlaceDelMenu[] | undefined,
  navOrder: string[] | undefined,
): MenuEnVivo {
  const [vivo, setVivo] = useState<MenuEnVivo | null>(null);
  useEffect(() => {
    const alCambiar = (e: Event) => setVivo((e as CustomEvent<MenuEnVivo>).detail);
    window.addEventListener(MENU_EN_VIVO, alCambiar);
    return () => window.removeEventListener(MENU_EN_VIVO, alCambiar);
  }, []);
  return vivo ?? { navExtra: navExtra ?? [], navOrder };
}

/** Una entrada del menú, sin caja propia: solo dice a «Mi web» qué es (§6.1). */
export function EntradaDelMenu({ children }: { children: ReactNode }) {
  return (
    <span className="contents" data-vesta="nav.enlace">
      {children}
    </span>
  );
}

/** Un enlace propio del menú: los de la web con Link, los de fuera con su rel. */
export function EnlaceExtra({
  enlace,
  className,
  onClick,
  children,
}: {
  enlace: EnlaceDelMenu;
  className: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const target = enlace.nuevaPestana ? "_blank" : undefined;
  if (esEnlaceInterno(enlace.href)) {
    return (
      <Link
        href={enlace.href}
        className={className}
        onClick={onClick}
        target={target}
        data-vesta="nav.enlace-propio"
      >
        {children ?? enlace.texto}
      </Link>
    );
  }
  return (
    <a
      href={enlace.href}
      className={className}
      onClick={onClick}
      target={target}
      rel="noopener noreferrer"
      data-vesta="nav.enlace-propio"
    >
      {children ?? enlace.texto}
    </a>
  );
}
