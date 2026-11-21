/**
 * Lo que la ficha pública de un inmueble manda al NAVEGADOR: solo lo que
 * pintan sus componentes de cliente. Antes recibían el anuncio entero de
 * `getListingDetails`, y en el código de cada ficha iban la dirección y el
 * código postal de un inmueble "solo zona", el móvil y el correo del agente
 * aunque la tarjeta fuera la de la oficina, el precio "A consultar" y campos
 * internos (referencia catastral, visitas, consultas, portales).
 *
 * La dirección y las coordenadas no viajan: el mapa recibe las suyas ya
 * difuminadas (`toPublicDetailLocation`) y la dirección se pinta en el
 * servidor.
 *
 * Pure + client-safe.
 */

/**
 * Lo que lee «Características» (`buildCharacteristicGroups`, en
 * `~/components/property/characteristics-data`). Un campo nuevo allí va
 * también aquí, o no sale: `ficha-publica.test.ts` lo comprueba.
 */
export const CAMPOS_CARACTERISTICAS = [
  "airConditioningType", "alarm", "appliancesIncluded", "balconyCount",
  "beachfront", "bright", "buildingFloors", "builtInWardrobes",
  "builtSurfaceArea", "carpentryType", "childrenArea", "communityPool",
  "conciergeService", "conservationStatus", "coveredClothesline",
  "disabledAccessible", "doubleGlazing", "elevatorToGarage", "exterior",
  "fireplace", "fridge", "furnishedKitchen", "furnitureQuality",
  "galleryCount", "garageInBuilding", "garageNumber", "garageSpaces",
  "garageType", "garden", "gym", "hasElevator", "hasGarage", "hasHeating",
  "hasStorageRoom", "heatingType", "homeAutomation", "hotWaterType",
  "hydromassage", "internet", "isFittedOut", "isFurnished", "jacuzzi",
  "kitchenType", "lastRenovationYear", "laundryRoom", "listingType",
  "livingRoomSize", "mainFloorType", "microwave", "mountainViews",
  "musicSystem", "nearbyPublicTransport", "newConstruction", "openKitchen",
  "optionalGarage", "optionalGaragePrice", "optionalStorageRoom",
  "optionalStorageRoomPrice", "orientation", "oven", "pantry", "petsAllowed",
  "pool", "privatePool", "propertySubtype", "propertyType", "satelliteDish",
  "seaViews", "securityDoor", "securityGuard", "shutterType", "sportsArea",
  "squareMeter", "stoneware", "storageRoomSize", "studentFriendly",
  "suiteBathroom", "tennisCourt", "terrace", "terraceSize", "tv",
  "underConstruction", "videoIntercom", "views", "washingMachine",
  "windowType", "wineCellar", "wineCellarSize", "yearBuilt",
] as const;

type CampoCaracteristica = (typeof CAMPOS_CARACTERISTICAS)[number];

export type CaracteristicasPublicas = Partial<Record<CampoCaracteristica, unknown>>;

/** La tarjeta «Agente» de la barra lateral. */
export interface AgentePublico {
  name: string | null;
  image: string | null;
  phone: string | null;
  email: string | null;
}

/** La barra lateral: tarjeta de contacto y formulario de consulta. */
export interface FichaCliente {
  listingId: string;
  propertyId: string;
  /** El título guardado, para la nota de la consulta (ya va en la URL). */
  titulo: string | null;
  /** null si la agencia oculta el precio: la ficha dice «A consultar». */
  precio: string | null;
  /** null cuando la tarjeta es la de la oficina: no hacen falta sus datos. */
  agente: AgentePublico | null;
}

interface FichaEntrada extends CaracteristicasPublicas {
  listingId: string | number | bigint;
  propertyId: string | number | bigint;
  title?: string | null;
  price?: string | number | null;
  hidePrice?: boolean | null;
  useAgentPhone?: boolean | null;
  agentName?: string | null;
  agentImage?: string | null;
  agentPhone?: string | null;
  agentEmail?: string | null;
}

export function fichaPublica(
  p: FichaEntrada,
  o: { hayOficina: boolean },
): { caracteristicas: CaracteristicasPublicas; cliente: FichaCliente } {
  const caracteristicas: CaracteristicasPublicas = {};
  for (const campo of CAMPOS_CARACTERISTICAS) {
    if (p[campo] !== undefined) caracteristicas[campo] = p[campo];
  }

  // La misma regla que pinta la barra: con «Cuenta» en Vesta (useAgentPhone
  // apagado) sale la oficina; sin datos de oficina, el agente.
  const tarjetaDeOficina = !p.useAgentPhone && o.hayOficina;

  return {
    caracteristicas,
    cliente: {
      listingId: String(p.listingId),
      propertyId: String(p.propertyId),
      titulo: p.title?.trim() ? p.title : null,
      precio: p.hidePrice || p.price == null ? null : String(p.price),
      agente: tarjetaDeOficina
        ? null
        : {
            name: p.agentName ?? null,
            image: p.agentImage ?? null,
            phone: p.agentPhone ?? null,
            email: p.agentEmail ?? null,
          },
    },
  };
}
