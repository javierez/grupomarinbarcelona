import {
  ArrowUp,
  Thermometer,
  Shield,
  Home,
  Lock,
  Hammer,
  Snowflake,
  Car,
  Building,
  Sun,
  TreePine,
  Waves,
  Zap,
  Dumbbell,
  WashingMachine,
  Bath,
  Baby,
  Heart,
  Utensils,
  Wifi,
  ChefHat,
  Microwave,
  Refrigerator,
  Tv,
  Eye,
  Bus,
  Music,
  Flame,
  Box,
  Video,
  UserCheck,
  Accessibility,
  Square,
  Satellite,
  Cookie,
  Sofa,
  Wine,
  Shirt,
  Droplet,
  PersonStanding,
  Circle,
  Palmtree,
  Check,
  type LucideIcon,
} from "lucide-react";

export type InfoRow = { label: string; value: string };
export type Chip = { label: string; icon: LucideIcon };
export type CharGroup = {
  key: string;
  /** Section heading; undefined → render without a heading (as today). */
  title?: string;
  icon?: LucideIcon;
  /** Shown without the "Ver más características" toggle in the sections layout. */
  always?: boolean;
  rows: InfoRow[];
  chips: Chip[];
};

/** Returns true if the value is meaningful (not null/undefined/empty/Sin_especificar/0). */
function hasValue(val: unknown): boolean {
  if (val == null || val === "" || val === 0 || val === "0") return false;
  if (
    typeof val === "string" &&
    val.toLowerCase().replace(/[_\s]/g, "") === "sinespecificar"
  )
    return false;
  return true;
}

/** Capitalize each word ("aire frio" → "Aire Frio"). */
function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Like titleCase but keeps "PVC" upper-cased. */
function windowCase(s: string): string {
  return s
    .split(" ")
    .map((w) =>
      w.toUpperCase() === "PVC"
        ? "PVC"
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  piso: "Piso",
  casa: "Casa",
  local: "Local",
  solar: "Terreno",
  garaje: "Garaje",
};

// Códigos válidos de `properties.conservation_status`. No existe el 5: se saltó
// a propósito para casar con Fotocasa.
const CONSERVATION_LABEL: Record<number, string> = {
  1: "Bueno",
  2: "Muy bueno",
  3: "Como nuevo",
  4: "A reformar",
  6: "Reformado",
};

// En producción quedan filas con códigos heredados (5 y 8) que aún no se han
// migrado. Los plegamos sobre el código canónico para no dejar la fila muda;
// cualquier otro valor fuera de la tabla devuelve null y la fila no se pinta.
const LEGACY_CONSERVATION_CODE: Record<number, number> = {
  5: 6, // Reformado
  // Aquí NO va el 8. Los códigos 0/7/8 los escribió la migración de
  // clickviviendas, que volcó "Orden calificación energética" sobre esta
  // columna: son la calificación ENERGÉTICA (0 = Sin calificación, 1..7 = A..G,
  // 8 = Exento), no el estado del inmueble. Pintarlos aquí publicaría una
  // afirmación sobre el estado que sale del certificado energético.
};

function conservationLabel(raw: unknown): string | null {
  const code = Number(raw);
  if (!Number.isFinite(code)) return null;
  const normalized = LEGACY_CONSERVATION_CODE[code] ?? code;
  return CONSERVATION_LABEL[normalized] ?? null;
}

/**
 * Builds the ordered list of characteristic groups for a property.
 * Empty groups (no rows and no chips) are omitted. The first three groups are
 * flagged `always` so the sections layout can keep showing them above the
 * "Ver más características" toggle exactly as before.
 */
export function buildCharacteristicGroups(property: any): CharGroup[] {
  const isLand = property.propertyType === "solar";
  const isRental =
    property.listingType === "Rent" ||
    property.listingType === "RentWithOption";

  const groups: CharGroup[] = [];
  const push = (g: CharGroup) => {
    if (g.rows.length > 0 || g.chips.length > 0) groups.push(g);
  };

  // --- Basic information ---
  // Note: "Referencia" is intentionally omitted here — the listing ref is already
  // shown in the property header, so repeating it would be redundant.
  const basic: InfoRow[] = [];
  if (hasValue(property.propertyType))
    basic.push({
      label: "Tipo de inmueble",
      value:
        PROPERTY_TYPE_LABEL[property.propertyType] ?? property.propertyType,
    });
  // On land this column holds the PLOT, not a built surface — labelling a bare
  // solar "Superficie construida" advertises a building that isn't there.
  if (hasValue(property.builtSurfaceArea) && Number(property.builtSurfaceArea) > 0)
    basic.push({
      label: isLand ? "Superficie de parcela" : "Superficie construida",
      value: `${Number(property.builtSurfaceArea).toLocaleString()} m²`,
    });
  // NOTE: no "Superficie edificable" row here. `property.squareMeter` has
  // already been through resolveSquareMeter() in getListingDetails, so on land
  // it holds the PLOT — printing it would repeat the row above. Showing the
  // real buildable area would require carrying the raw column through the
  // query separately; not worth it until someone asks for it.
  if (!isLand && hasValue(property.yearBuilt))
    basic.push({ label: "Año construcción", value: String(property.yearBuilt) });
  const conservation =
    !isLand && hasValue(property.conservationStatus)
      ? conservationLabel(property.conservationStatus)
      : null;
  if (conservation)
    basic.push({ label: "Estado conservación", value: conservation });
  push({ key: "basic", always: true, rows: basic, chips: [] });

  // --- Essential features (chips) ---
  const essential: Chip[] = [];
  if (!isLand && property.hasElevator)
    essential.push({ label: "Ascensor", icon: ArrowUp });
  if (!isLand && property.hasGarage)
    essential.push({ label: "Garaje", icon: Car });
  if (!isLand && property.hasStorageRoom)
    essential.push({ label: "Trastero", icon: Box });
  if (!isLand && property.hasHeating)
    essential.push({ label: "Calefacción", icon: Thermometer });
  if (!isLand && hasValue(property.airConditioningType))
    essential.push({ label: "Aire Acondicionado", icon: Snowflake });
  // Acondicionamiento del local. Tri-estado: sólo se anuncia el afirmativo —
  // NULL es "no consta" y `false` no es un reclamo comercial.
  if (!isLand && property.isFittedOut === true)
    essential.push({ label: "Acondicionado", icon: Hammer });
  if (!isLand && property.terrace)
    essential.push({ label: "Terraza", icon: Sun });
  if (property.garden) essential.push({ label: "Jardín", icon: TreePine });
  if (property.pool) essential.push({ label: "Piscina", icon: Waves });
  if (!isLand && property.bright)
    essential.push({ label: "Luminoso", icon: Sun });
  if (!isLand && property.exterior)
    essential.push({ label: "Exterior", icon: Eye });
  push({ key: "essential", always: true, rows: [], chips: essential });

  // --- Security ---
  if (!isLand) {
    const security: Chip[] = [];
    if (property.alarm) security.push({ label: "Alarma", icon: Shield });
    if (property.securityDoor)
      security.push({ label: "Puerta Blindada", icon: Lock });
    if (property.videoIntercom)
      security.push({ label: "Videoportero", icon: Video });
    if (property.conciergeService)
      security.push({ label: "Conserjería", icon: UserCheck });
    if (property.securityGuard)
      security.push({ label: "Vigilancia", icon: Shield });
    push({
      key: "security",
      title: "Seguridad",
      icon: Shield,
      always: true,
      rows: [],
      chips: security,
    });
  }

  // --- Building features ---
  if (!isLand) {
    const rows: InfoRow[] = [];
    if (hasValue(property.buildingFloors))
      rows.push({
        label: "Plantas del edificio",
        value: String(property.buildingFloors),
      });
    if (hasValue(property.orientation))
      rows.push({ label: "Orientación", value: titleCase(property.orientation) });
    if (hasValue(property.mainFloorType))
      rows.push({ label: "Tipo de suelo", value: titleCase(property.mainFloorType) });
    if (hasValue(property.windowType))
      rows.push({ label: "Tipo de ventanas", value: windowCase(property.windowType) });
    if (hasValue(property.shutterType))
      rows.push({ label: "Tipo de persianas", value: titleCase(property.shutterType) });
    if (hasValue(property.carpentryType))
      rows.push({ label: "Carpintería", value: titleCase(property.carpentryType) });
    const chips: Chip[] = [];
    if (property.doubleGlazing)
      chips.push({ label: "Doble Cristal", icon: Square });
    if (property.builtInWardrobes)
      chips.push({ label: "Armarios Empotr.", icon: Box });
    if (property.disabledAccessible)
      chips.push({ label: "Accesible", icon: Accessibility });
    if (property.satelliteDish)
      chips.push({ label: "Antena Parabólica", icon: Satellite });
    push({
      key: "building",
      title: "Características del Edificio",
      icon: Building,
      rows,
      chips,
    });
  }

  // --- Kitchen ---
  if (!isLand) {
    const rows: InfoRow[] = [];
    if (hasValue(property.kitchenType))
      rows.push({ label: "Tipo de cocina", value: titleCase(property.kitchenType) });
    const chips: Chip[] = [];
    if (property.openKitchen)
      chips.push({ label: "Cocina Abierta", icon: ChefHat });
    if (property.furnishedKitchen)
      chips.push({ label: "Cocina Amueblada", icon: Sofa });
    if (property.pantry) chips.push({ label: "Despensa", icon: Cookie });
    push({ key: "kitchen", title: "Cocina", icon: ChefHat, rows, chips });
  }

  // --- Climate control ---
  if (!isLand) {
    const rows: InfoRow[] = [];
    if (hasValue(property.heatingType))
      rows.push({ label: "Tipo de calefacción", value: property.heatingType });
    if (hasValue(property.hotWaterType))
      rows.push({ label: "Agua caliente", value: property.hotWaterType });
    if (hasValue(property.airConditioningType))
      rows.push({
        label: "Aire acondicionado",
        value: titleCase(property.airConditioningType),
      });
    push({ key: "climate", title: "Climatización", icon: Thermometer, rows, chips: [] });
  }

  // --- Garage ---
  if (!isLand && property.hasGarage) {
    const rows: InfoRow[] = [];
    if (hasValue(property.garageType))
      rows.push({ label: "Tipo de garaje", value: titleCase(property.garageType) });
    if (hasValue(property.garageSpaces))
      rows.push({ label: "Plazas", value: String(property.garageSpaces) });
    if (hasValue(property.garageNumber))
      rows.push({ label: "Número", value: String(property.garageNumber) });
    const chips: Chip[] = [];
    if (property.garageInBuilding)
      chips.push({ label: "En Edificio", icon: Building });
    if (property.elevatorToGarage)
      chips.push({ label: "Ascensor a Garaje", icon: ArrowUp });
    push({ key: "garage", title: "Garaje", icon: Car, rows, chips });
  }

  // --- Additional spaces ---
  if (!isLand) {
    const rows: InfoRow[] = [];
    if (hasValue(property.terraceSize))
      rows.push({ label: "Tamaño terraza", value: `${property.terraceSize} m²` });
    if (hasValue(property.livingRoomSize))
      rows.push({ label: "Tamaño salón", value: `${property.livingRoomSize} m²` });
    if (hasValue(property.storageRoomSize))
      rows.push({ label: "Tamaño trastero", value: `${property.storageRoomSize} m²` });
    if (hasValue(property.wineCellarSize))
      rows.push({ label: "Tamaño bodega", value: `${property.wineCellarSize} m²` });
    if (hasValue(property.balconyCount))
      rows.push({ label: "Balcones", value: String(property.balconyCount) });
    if (hasValue(property.galleryCount))
      rows.push({ label: "Galerías", value: String(property.galleryCount) });
    const chips: Chip[] = [];
    if (property.wineCellar) chips.push({ label: "Bodega", icon: Wine });
    if (property.laundryRoom)
      chips.push({ label: "Lavadero", icon: WashingMachine });
    if (property.coveredClothesline)
      chips.push({ label: "Tendedero Cubierto", icon: Shirt });
    if (property.fireplace) chips.push({ label: "Chimenea", icon: Flame });
    push({ key: "spaces", title: "Espacios Adicionales", icon: Building, rows, chips });
  }

  // --- Luxury & recreation ---
  {
    const chips: Chip[] = [];
    if (property.jacuzzi) chips.push({ label: "Jacuzzi", icon: Waves });
    if (property.hydromassage)
      chips.push({ label: "Hidromasaje", icon: Droplet });
    if (property.gym) chips.push({ label: "Gimnasio", icon: Dumbbell });
    if (property.sportsArea)
      chips.push({ label: "Zona Deportiva", icon: PersonStanding });
    if (property.communityPool)
      chips.push({ label: "Piscina Comunitaria", icon: Waves });
    if (property.privatePool)
      chips.push({ label: "Piscina Privada", icon: Waves });
    if (property.tennisCourt)
      chips.push({ label: "Pista de Tenis", icon: Circle });
    if (property.childrenArea)
      chips.push({ label: "Zona Infantil", icon: Baby });
    if (property.musicSystem)
      chips.push({ label: "Sistema Musical", icon: Music });
    if (property.homeAutomation)
      chips.push({ label: "Domótica", icon: Zap });
    if (property.suiteBathroom)
      chips.push({ label: "Baño en Suite", icon: Bath });
    push({ key: "luxury", title: "Lujo y Recreación", icon: Heart, rows: [], chips });
  }

  // --- Views and location ---
  {
    const chips: Chip[] = [];
    if (property.views) chips.push({ label: "Buenas Vistas", icon: Eye });
    if (property.mountainViews)
      chips.push({ label: "Vista Montaña", icon: TreePine });
    if (property.seaViews) chips.push({ label: "Vista al Mar", icon: Waves });
    if (property.beachfront)
      chips.push({ label: "Primera Línea", icon: Palmtree });
    if (property.nearbyPublicTransport)
      chips.push({ label: "Transporte Público", icon: Bus });
    push({ key: "views", title: "Vistas y Ubicación", icon: Eye, rows: [], chips });
  }

  // --- Appliances ---
  if (!isLand) {
    const chips: Chip[] = [];
    if (property.internet) chips.push({ label: "Internet", icon: Wifi });
    if (property.oven) chips.push({ label: "Horno", icon: ChefHat });
    if (property.microwave) chips.push({ label: "Microondas", icon: Microwave });
    if (property.washingMachine)
      chips.push({ label: "Lavadora", icon: WashingMachine });
    if (property.fridge) chips.push({ label: "Nevera", icon: Refrigerator });
    if (property.tv) chips.push({ label: "Televisión", icon: Tv });
    if (property.stoneware) chips.push({ label: "Vajilla", icon: Utensils });
    push({
      key: "appliances",
      title: "Electrodomésticos",
      icon: Utensils,
      rows: [],
      chips,
    });
  }

  // --- Construction status ---
  if (!isLand) {
    const chips: Chip[] = [];
    if (property.newConstruction)
      chips.push({ label: "Obra Nueva", icon: Building });
    if (property.underConstruction)
      chips.push({ label: "En Construcción", icon: Building });
    if (property.lastRenovationYear)
      chips.push({
        label: `Reformado en ${property.lastRenovationYear}`,
        icon: Check,
      });
    push({
      key: "construction",
      title: "Estado de Construcción",
      icon: Building,
      rows: [],
      chips,
    });
  }

  // --- Rental conditions ---
  if (isRental) {
    const rows: InfoRow[] = [];
    if (property.isFurnished) rows.push({ label: "Amueblado", value: "Sí" });
    if (hasValue(property.furnitureQuality))
      rows.push({ label: "Calidad mobiliario", value: property.furnitureQuality });
    if (property.studentFriendly)
      rows.push({ label: "Admite estudiantes", value: "Sí" });
    if (property.petsAllowed)
      rows.push({ label: "Admite mascotas", value: "Sí" });
    if (property.appliancesIncluded)
      rows.push({ label: "Electrodomésticos incluidos", value: "Sí" });
    if (property.optionalGarage && property.optionalGaragePrice)
      rows.push({
        label: "Garaje opcional",
        value: `${Number(property.optionalGaragePrice).toLocaleString()}€/mes`,
      });
    if (property.optionalStorageRoom && property.optionalStorageRoomPrice)
      rows.push({
        label: "Trastero opcional",
        value: `${Number(property.optionalStorageRoomPrice).toLocaleString()}€/mes`,
      });
    push({
      key: "rental",
      title: "Condiciones de Alquiler",
      icon: Home,
      rows,
      chips: [],
    });
  }

  // Raw DB enum values can contain underscores (e.g. "Suelo_laminado",
  // "Cocina_americana"). Replace them with spaces everywhere they're shown.
  for (const g of groups) {
    for (const r of g.rows) r.value = r.value.replace(/_/g, " ");
  }

  return groups;
}
