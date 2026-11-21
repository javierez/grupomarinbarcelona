/**
 * El modo de señalar de §6.1, ya en la página: un marco y una etiqueta sobre
 * lo que hay bajo el ratón, y el clic se lo queda (ni navega ni envía nada).
 * Solo lo carga `SeleccionEnVivo` cuando el CRM lo enciende: una visita normal
 * no lo baja nunca.
 */
import { elementoDeLasMarcas, imagenOriginal, type Marca } from "./seleccion";
import { definicionDe } from "./seleccion-claves";

const TINTA = "#171717";
const MARCADO = "[data-vesta]";
/** Lo que sigue funcionando al señalar (el ☰ abre su menú para señalar lo de dentro). */
const PASA = "[data-vesta-pasa]";
/** Lo que se bloquea mientras se señala, además del clic y las teclas. */
const BLOQUEADOS = ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "auxclick", "contextmenu", "submit"];

let activa: { origen: string; apagar: () => void } | null = null;

export function activarSeleccion(origen: string): void {
  if (activa) {
    activa.origen = origen;
    return;
  }
  const capa = document.createElement("div");
  capa.setAttribute("aria-hidden", "true");
  Object.assign(capa.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "2147483647" });
  const marco = document.createElement("div");
  Object.assign(marco.style, {
    position: "fixed",
    display: "none",
    boxSizing: "border-box",
    border: `2px solid ${TINTA}`,
    borderRadius: "6px",
  });
  const pastilla = document.createElement("div");
  Object.assign(pastilla.style, {
    position: "fixed",
    display: "none",
    maxWidth: "min(80vw, 360px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: "4px 10px",
    borderRadius: "9999px",
    background: TINTA,
    color: "#fff",
    font: "500 12px/16px system-ui, -apple-system, sans-serif",
  });
  capa.append(marco, pastilla);
  const cursor = document.createElement("style");
  // Un iframe (el mapa) se traga el ratón: así el clic cae en su envoltorio.
  cursor.textContent = "*{cursor:pointer!important}iframe{pointer-events:none!important}";
  document.head.append(cursor);
  document.body.append(capa);

  let actual: HTMLElement | null = null;

  const pintar = () => {
    const caja = actual && cajaDe(actual);
    if (!actual || !caja) {
      marco.style.display = "none";
      pastilla.style.display = "none";
      return;
    }
    Object.assign(marco.style, {
      display: "block",
      left: `${caja.left}px`,
      top: `${caja.top}px`,
      width: `${caja.width}px`,
      height: `${caja.height}px`,
    });
    pastilla.textContent = leer(actual)?.etiqueta ?? "";
    pastilla.style.display = "block";
    // Encima del marco; si no cabe, dentro de él.
    const arriba = caja.top >= 28 ? caja.top - 26 : caja.top + 6;
    pastilla.style.top = `${arriba}px`;
    pastilla.style.left = `${Math.max(4, Math.min(caja.left, window.innerWidth - pastilla.offsetWidth - 4))}px`;
  };

  const enviar = (mensaje: object) => window.parent.postMessage(mensaje, activa?.origen ?? "null");
  const bloquear = (e: Event) => {
    if (pasa(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const alMover = (e: PointerEvent) => {
    const el = pasa(e.target) ? null : bajo(e);
    if (el === actual) return;
    actual = el;
    pintar();
  };
  const alPulsar = (e: MouseEvent) => {
    if (pasa(e.target)) return;
    bloquear(e);
    const el = bajo(e);
    const elemento = el && leer(el);
    if (!elemento) return;
    enviar({ type: "vesta:seleccionado", elemento });
    desactivarSeleccion();
  };
  const alTeclear = (e: KeyboardEvent) => {
    bloquear(e);
    if (e.key !== "Escape") return;
    enviar({ type: "vesta:seleccion-cancelada" });
    desactivarSeleccion();
  };

  window.addEventListener("pointermove", alMover, true);
  window.addEventListener("click", alPulsar, true);
  window.addEventListener("keydown", alTeclear, true);
  for (const tipo of BLOQUEADOS) window.addEventListener(tipo, bloquear, true);
  window.addEventListener("scroll", pintar, true);
  window.addEventListener("resize", pintar);

  activa = {
    origen,
    apagar: () => {
      window.removeEventListener("pointermove", alMover, true);
      window.removeEventListener("click", alPulsar, true);
      window.removeEventListener("keydown", alTeclear, true);
      for (const tipo of BLOQUEADOS) window.removeEventListener(tipo, bloquear, true);
      window.removeEventListener("scroll", pintar, true);
      window.removeEventListener("resize", pintar);
      capa.remove();
      cursor.remove();
    },
  };
}

export function desactivarSeleccion(): void {
  activa?.apagar();
  activa = null;
}

function pasa(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(PASA) !== null;
}

/**
 * Lo señalado bajo el ratón. Una sección cede a la foto o el vídeo que se ve
 * detrás de ese punto: la de la portada va en una capa por debajo del texto,
 * y el clic en ella cae en la sección.
 */
function bajo(e: MouseEvent): HTMLElement | null {
  const el = marcado(e.target);
  if (!el || definicionDe(el.dataset.vesta ?? "")?.tipo !== "seccion") return el;
  const foto = [...el.querySelectorAll<HTMLElement>(MARCADO)].find((m) => {
    if (definicionDe(m.dataset.vesta ?? "")?.tipo !== "imagen") return false;
    const r = m.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  });
  return foto ?? el;
}

/** El marcado más cercano que está en el mapa. */
function marcado(target: EventTarget | null): HTMLElement | null {
  let el = target instanceof Element ? target.closest<HTMLElement>(MARCADO) : null;
  while (el && !definicionDe(el.dataset.vesta ?? "")) {
    el = el.parentElement?.closest<HTMLElement>(MARCADO) ?? null;
  }
  return el;
}

function leer(el: HTMLElement) {
  const marcas: Marca[] = [];
  for (let n: HTMLElement | null = el; n; n = n.parentElement?.closest<HTMLElement>(MARCADO) ?? null) {
    const d = n.dataset;
    marcas.push({
      clave: d.vesta ?? "",
      id: d.vestaId,
      i: d.vestaI,
      nombre: d.vestaNombre,
      pagina: d.vestaPagina,
      bloque: d.vestaBloque,
    });
  }
  const img = el.querySelector("img");
  return elementoDeLasMarcas(marcas, {
    ruta: window.location.pathname,
    texto: el.innerText || el.textContent || img?.alt,
    imagen: imagenOriginal(fuenteDe(el), window.location.href),
  });
}

/** La foto o el vídeo que se ve: el propio elemento o el primero visible dentro. */
function fuenteDe(el: HTMLElement): string | undefined {
  const medios = [el, ...el.querySelectorAll<HTMLElement>("img, video")].filter(
    (m) => m instanceof HTMLImageElement || m instanceof HTMLVideoElement,
  );
  // La portada y la tarjeta del piso apilan varias y apagan las que no se ven.
  const seVe = (m: HTMLElement) =>
    getComputedStyle(m).opacity !== "0" && getComputedStyle(m.parentElement ?? m).opacity !== "0";
  const visible = medios.find(seVe) ?? medios[0];
  if (visible instanceof HTMLImageElement) return visible.currentSrc || visible.src;
  if (visible instanceof HTMLVideoElement) {
    return visible.currentSrc || visible.querySelector("source")?.src || visible.poster || undefined;
  }
  return undefined;
}

type Caja = { left: number; top: number; width: number; height: number };

/**
 * Dónde pintar el marco. Un envoltorio `contents` no tiene caja: la de sus
 * hijos. Lo que se sale de su sección (la foto fija de la portada) se recorta
 * a ella, y todo a la ventana.
 */
function cajaDe(el: HTMLElement): Caja | null {
  const propia = rectangulo(el);
  if (!propia) return null;
  const padre = el.parentElement?.closest<HTMLElement>(MARCADO);
  const dentro = padre ? cortar(propia, rectangulo(padre)) : propia;
  return cortar(dentro ?? propia, { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
}

function rectangulo(el: HTMLElement): Caja | null {
  const r = el.getBoundingClientRect();
  if (r.width > 0 || r.height > 0) return r;
  const hijos = [...el.children].map((c) => c.getBoundingClientRect()).filter((c) => c.width > 0 || c.height > 0);
  if (hijos.length === 0) return null;
  const left = Math.min(...hijos.map((c) => c.left));
  const top = Math.min(...hijos.map((c) => c.top));
  return {
    left,
    top,
    width: Math.max(...hijos.map((c) => c.right)) - left,
    height: Math.max(...hijos.map((c) => c.bottom)) - top,
  };
}

function cortar(a: Caja, b: Caja | null): Caja | null {
  if (!b) return a;
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const width = Math.min(a.left + a.width, b.left + b.width) - left;
  const height = Math.min(a.top + a.height, b.top + b.height) - top;
  return width > 0 && height > 0 ? { left, top, width, height } : null;
}
