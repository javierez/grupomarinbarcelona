/**
 * Cómo se reconoce a quien escribe desde la web si ya está en el CRM, y dónde
 * va su teléfono: las reglas de `~/server/queries/contact-lookup` del CRM
 * (`emailMatch`, `phoneMatch`, `phoneUpdateForKnownContact`), que desde aquí
 * no se puede importar. Si allí cambian, aquí también. Puro y sin nada de
 * servidor (lo usan también los formularios); el SQL está en
 * `~/server/contacto-de-la-web`.
 *
 * La web comparaba la cadena tal cual: «Ana@X.es» no era «ana@x.es» ni
 * «600 111 222» era «+34600111222», y el teléfono secundario no se miraba
 * (Best House duplicó así un número en el CRM, 23-sep-2026).
 */

/** Lo que cabe en `contacts.phone` y `secondary_phone` (varchar 20). */
export const MAX_TELEFONO = 20;
export const TELEFONO_DEMASIADO_LARGO = "El teléfono es demasiado largo";

/**
 * El teléfono de un formulario, ya sin espacios a los lados, no cabe en la
 * ficha: se rechaza con su error y no se recorta (recortado sería otro número).
 */
export function errorDelTelefono(phone: string | null | undefined): string | null {
  return (phone ?? "").trim().length > MAX_TELEFONO ? TELEFONO_DEMASIADO_LARGO : null;
}

/** «Ana@X.es » es «ana@x.es». Vacío, null. */
export function correoParaBuscar(email: string | null | undefined): string | null {
  const correo = email?.trim().toLowerCase();
  return correo ? correo : null;
}

/**
 * Los países que reconoce el CRM, de más cifras a menos («351» antes que
 * «35»). Copia de `COUNTRY_CODES` de `~/lib/phone-utils` del CRM.
 */
const PAISES = (
  "212 213 216 228 502 503 504 505 506 507 508 509 591 592 593 595 598 971 972 " +
  "351 352 353 354 355 356 357 358 359 370 371 372 373 374 375 376 377 378 " +
  "380 381 382 383 385 386 387 389 420 421 " +
  "30 31 32 33 34 36 39 40 41 43 44 45 46 47 48 49 51 52 53 54 55 56 57 58 " +
  "60 61 62 63 64 65 66 81 82 86 90 91 92 93 94 95 98 1 7"
).split(" ");

/**
 * El país y el número de un teléfono escrito de cualquier forma: copia de
 * `extractPhonePrefix` del CRM. «+34…», «0034…», «34» y 9 cifras, «+351…»,
 * «33 607 864 104»; sin país reconocible, España. No copia
 * `isNonPhoneWhatsappId`: un formulario no trae ids de WhatsApp.
 */
export function separarPrefijo(phone: string | null | undefined): {
  prefijo: string;
  numero: string;
} {
  if (!phone) return { prefijo: "+34", numero: "" };
  let limpio = phone.replace(/[^\d+]/g, "");
  for (const pais of PAISES) {
    if (limpio.startsWith(`+${pais}`)) {
      return { prefijo: `+${pais}`, numero: limpio.slice(1 + pais.length) };
    }
    if (limpio.startsWith(`00${pais}`)) {
      return { prefijo: `+${pais}`, numero: limpio.slice(2 + pais.length) };
    }
  }
  // «34» sin «+»: español solo con sus 11 cifras (un móvil italiano también empieza por 34).
  if (limpio.startsWith("34") && limpio.length === 11) {
    return { prefijo: "+34", numero: limpio.slice(2) };
  }
  // El país delante y sin «+» («33 607 864 104»): uno español tiene 9 cifras.
  if (/^[1-5]\d{10,12}$/.test(limpio)) {
    const pais = PAISES.find((p) => p !== "34" && limpio.startsWith(p));
    const numero = limpio.slice(pais?.length ?? 0);
    if (pais) {
      return { prefijo: `+${pais}`, numero: pais !== "39" ? numero.replace(/^0/, "") : numero };
    }
  }
  if (limpio.startsWith("00") && limpio.length > 6) limpio = `+${limpio.slice(2)}`;
  if (limpio.startsWith("+") && limpio.length > 4 && /^\d{2}$/.test(limpio.slice(1, 3))) {
    return { prefijo: `+${limpio.slice(1, 3)}`, numero: limpio.slice(3) };
  }
  return { prefijo: "+34", numero: limpio.replace(/\D/g, "") };
}

/**
 * Las cifras sin el país (`normalizePhone` del CRM): «600 111 222»,
 * «+34 600111222», «0034600111222» y «34600111222» son «600111222».
 */
export function telefonoLocal(phone: string | null | undefined): string {
  return separarPrefijo(phone).numero;
}

/**
 * Los LIKE que casan su teléfono con el principal o el secundario de una
 * ficha, guardado en cualquier formato (sin espacios, guiones, paréntesis ni
 * «+»): que acabe en sus cifras sin el país (`phoneMatch` del CRM). Uno de
 * fuera, también por sus últimas 10 cifras o más, por si la ficha lo guarda
 * con el país dentro o sin él (`finalesNacionales`). Con menos de 6, ninguno.
 */
export function patronesDelTelefono(phone: string | null | undefined): string[] {
  if (!phone) return [];
  const local = telefonoLocal(phone);
  if (local.length < 6) return [];
  const patrones = new Set([`%${local}`]);
  if (separarPrefijo(phone).prefijo !== "+34") {
    const cifras = phone.replace(/\D/g, "");
    for (let n = 10; n < cifras.length; n++) patrones.add(`%${cifras.slice(-n)}`);
  }
  return [...patrones];
}

/**
 * Dónde va el teléfono que trae alguien que ya estaba
 * (`phoneUpdateForKnownContact` del CRM). Sin teléfono en la ficha, es el suyo
 * (y sale del secundario si ya estaba ahí); con otro distinto, a secundario si
 * está libre; si no, no se pisa nada. Como en el CRM, el número sin el país y
 * el país en su columna. Un lead que dejó primero solo el correo salía «sin
 * teléfono» con el número escondido en el secundario (#2304, 22-oct-2026).
 */
export function telefonoParaLaFicha(
  ficha: { phone: string | null; secondaryPhone: string | null },
  llega: string | null | undefined,
): {
  phone?: string;
  phonePrefix?: string;
  secondaryPhone?: string | null;
  secondaryPhonePrefix?: string | null;
} {
  if (!llega) return {};
  const { prefijo, numero } = separarPrefijo(llega);
  if (numero.length < 6) return {};
  const esElMismo = (guardado: string | null) =>
    !!guardado?.trim() && telefonoLocal(guardado) === numero;

  if (!ficha.phone?.trim()) {
    return {
      phone: numero,
      phonePrefix: prefijo,
      ...(esElMismo(ficha.secondaryPhone)
        ? { secondaryPhone: null, secondaryPhonePrefix: null }
        : {}),
    };
  }
  if (esElMismo(ficha.phone) || ficha.secondaryPhone?.trim()) return {};
  return { secondaryPhone: numero, secondaryPhonePrefix: prefijo };
}
