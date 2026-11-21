"use client";

import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  buildSearchSlug,
  MIN_BATHROOM_OPTIONS,
  MIN_BEDROOM_OPTIONS,
  pruneSubtypes,
  subtypeOptionsFor,
  type PropertyType,
  type SearchParams,
  type OpcionesBuscador,
  type SubtypeOption,
} from "~/lib/search-utils";
import { OpcionesBuscadorProvider } from "~/components/search/opciones-buscador";
import { CabeceraAnaDiaz } from "~/components/search/cabecera-ana-diaz";
import {
  isAccount137,
  ACCOUNT_137_SEARCH_GREEN,
} from "~/lib/account-overrides/137";
import { roomsFilterLabel, selectionHasRooms } from "~/lib/property-rooms";
import {
  TwoLevelLocationSelect,
} from "~/components/ui/two-level-location-select";
import { PropertyTypeMenu } from "~/components/search/property-type-menu";
import { CharacteristicsFilter } from "~/components/search/characteristics-filter";
import { staggerContainer, staggerItem } from "~/lib/animations";
import { useAspectoV1, useCuenta } from "~/components/header-style-context";

type ConcretePropertyType = Exclude<PropertyType, "any">;
type Operation = "for-sale" | "for-rent";
interface PriceBounds {
  minPrice: number;
  maxPrice: number;
}

interface SearchFormData {
  province: string;
  cities: string[];
  neighborhoodIds: string[];
  propertyTypes: ConcretePropertyType[];
  bedrooms: string;
  bathrooms: string;
  status: "for-sale" | "for-rent";
  amenities: string[];
  subtypes: string[];
}

interface PropertySearchProps {
  provinces: string[];
  propertyTypes: string[];
  subtypeOptions: SubtypeOption[];
  /** Precio mínimo/máximo publicado, por operación. */
  priceRanges: Record<Operation, PriceBounds>;
  /** Lo de la v1 que la agencia tenga encendido (`opcionesBuscador`). */
  opciones: OpcionesBuscador;
  /** Ana Díaz (137): su logo encima del buscador, como en la v1. */
  logoUrl?: string | null;
}

const RANGO_V1_ANTIGUA: PriceBounds = { minPrice: 0, maxPrice: 2000000 };
const INICIO_V1_ANTIGUA = [50000, 2000000];

// Ana Díaz (137): its name and logo on top, labels and «Buscar» in dark green,
// as on its v1 home.
const LABEL_137 = {
  className: "mb-2 block text-base font-medium",
  style: { color: ACCOUNT_137_SEARCH_GREEN },
};
const LABEL = {
  className: "mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground",
  style: undefined,
};

export function PropertySearch({
  provinces,
  propertyTypes,
  subtypeOptions,
  priceRanges,
  opciones,
  logoUrl,
}: PropertySearchProps) {
  const router = useRouter();
  const acct137 = isAccount137(useCuenta());
  // v1 look: its rounded-lg card with a plain shadow, and v1's inline labels.
  const v1 = useAspectoV1();
  const label = v1
    ? acct137
      ? { className: "text-base font-medium", style: LABEL_137.style }
      : { className: "text-sm font-medium", style: undefined }
    : acct137
      ? LABEL_137
      : LABEL;
  // El deslizador parte de todo el rango de la operación elegida y solo manda
  // el extremo que el visitante movió. Antes arrancaba en 50.000 € y al tocar
  // un extremo mandaba los dos: "hasta 300.000 €" añadía "desde 50.000 €", y
  // en alquiler eso dejaba cero resultados.
  // v1Antigua (`opciones.antiguo`): el deslizador de entonces. Leía el precio
  // como texto, caía siempre al de reserva (0 – 2.000.000 €) y arrancaba en
  // 50.000 €; no cambiaba con la operación.
  const rangoDe = (op: Operation): PriceBounds =>
    opciones.antiguo ? RANGO_V1_ANTIGUA : priceRanges[op];
  const inicioDe = (op: Operation): number[] =>
    opciones.antiguo
      ? INICIO_V1_ANTIGUA
      : [priceRanges[op].minPrice, priceRanges[op].maxPrice];
  const [priceRange, setPriceRange] = useState<number[]>(inicioDe("for-sale"));
  const [searchParams, setSearchParams] = useState<SearchFormData>({
    province: "",
    cities: [],
    neighborhoodIds: [],
    propertyTypes: [],
    bedrooms: "any",
    bathrooms: "any",
    status: "for-sale",
    amenities: [],
    subtypes: [],
  });
  // ¿Aplica habitaciones/baños a los tipos elegidos? (No a garaje, nave…)
  const roomsApply = selectionHasRooms(searchParams.propertyTypes);


  const handleSelectChange = (
    name: "province" | "bedrooms" | "bathrooms" | "status",
    value: string,
  ) => {
    setSearchParams((prev) => {
      const next = { ...prev, [name]: value };
      // Clear cities/neighborhoods when province changes
      if (name === "province") {
        next.cities = [];
        next.neighborhoodIds = [];
      }
      return next;
    });
    // Otra operación, otro rango de precios: el de venta no sirve en alquiler.
    if (name === "status" && !opciones.antiguo) {
      setPriceRange(inicioDe(value as Operation));
    }
  };

  const bounds = rangoDe(searchParams.status);
  const inicio = inicioDe(searchParams.status);
  const minPriceFilter =
    (priceRange[0] ?? bounds.minPrice) > bounds.minPrice &&
    priceRange[0] !== inicio[0]
      ? priceRange[0]
      : undefined;
  const maxPriceFilter =
    (priceRange[1] ?? bounds.maxPrice) < bounds.maxPrice &&
    priceRange[1] !== inicio[1]
      ? priceRange[1]
      : undefined;

  const handleLocationSelectionChange = (selection: {
    cities: string[];
    neighborhoodIds: string[];
  }) => {
    setSearchParams((prev) => ({
      ...prev,
      cities: selection.cities,
      neighborhoodIds: selection.neighborhoodIds,
    }));
  };

  const togglePropertyType = (
    value: ConcretePropertyType,
    checked: boolean,
  ) => {
    setSearchParams((prev) => {
      const has = prev.propertyTypes.includes(value);
      if (checked === has) return prev;
      const propertyTypes = checked
        ? [...prev.propertyTypes, value]
        : prev.propertyTypes.filter((t) => t !== value);
      // Un subtipo de un tipo desmarcado, o habitaciones en una selección que
      // ya no las tiene (garaje, nave…), acotarían a cero sin que se viera.
      const keepRooms = selectionHasRooms(propertyTypes);
      return {
        ...prev,
        propertyTypes,
        subtypes: pruneSubtypes(prev.subtypes, propertyTypes),
        bedrooms: keepRooms ? prev.bedrooms : "any",
        bathrooms: keepRooms ? prev.bathrooms : "any",
      };
    });
  };

  const toggleSubtype = (key: string, checked: boolean) => {
    setSearchParams((prev) => ({
      ...prev,
      subtypes: checked
        ? Array.from(new Set([...prev.subtypes, key]))
        : prev.subtypes.filter((k) => k !== key),
    }));
  };

  const toggleAmenity = (key: string, checked: boolean) => {
    setSearchParams((prev) => ({
      ...prev,
      amenities: checked
        ? Array.from(new Set([...prev.amenities, key]))
        : prev.amenities.filter((k) => k !== key),
    }));
  };

  // Filter context for the location dropdowns — makes them show only
  // provinces/cities/neighborhoods that still have matching listings given
  // the other active filters.
  const locationFilters = {
    propertyType:
      searchParams.propertyTypes.length > 0
        ? searchParams.propertyTypes
        : undefined,
    status: searchParams.status,
    bedrooms:
      searchParams.bedrooms !== "any"
        ? Number.parseInt(searchParams.bedrooms)
        : undefined,
    bathrooms:
      searchParams.bathrooms !== "any"
        ? Number.parseInt(searchParams.bathrooms)
        : undefined,
    minPrice: minPriceFilter,
    maxPrice: maxPriceFilter,
    // Los desplegables de ubicación se estrechan con todos los filtros.
    amenities:
      searchParams.amenities.length > 0 ? searchParams.amenities : undefined,
    subtypes:
      searchParams.subtypes.length > 0 ? searchParams.subtypes : undefined,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const {
      province,
      cities,
      neighborhoodIds,
      propertyTypes: selectedTypes,
      bedrooms,
      bathrooms,
      status,
      amenities,
      subtypes,
    } = searchParams;

    const searchParamsData: SearchParams = {
      cities: cities.length > 0 ? cities : undefined,
      neighborhoodIds: neighborhoodIds.length > 0 ? neighborhoodIds : undefined,
      province: province || undefined,
      propertyType: selectedTypes.length > 0 ? selectedTypes : undefined,
      bedrooms,
      bathrooms,
      minPrice: minPriceFilter,
      maxPrice: maxPriceFilter,
      status,
      amenities: amenities.length > 0 ? amenities : undefined,
      subtypes: subtypes.length > 0 ? subtypes : undefined,
    };

    const searchSlug = buildSearchSlug(searchParamsData);
    router.push(`/${searchSlug}`);
  };

  // Format numbers consistently to avoid hydration issues
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-ES").format(num);
  };

  return (
    <OpcionesBuscadorProvider value={opciones}>
    <motion.div 
      className={
        v1
          ? "relative mx-auto max-w-5xl rounded-lg bg-background/95 p-4 text-left shadow-lg backdrop-blur-sm sm:p-6"
          : "mx-auto max-w-5xl rounded-2xl border border-border/60 bg-background/95 p-5 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur-md sm:p-7"
      }
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {acct137 && <CabeceraAnaDiaz logoUrl={logoUrl} />}
      <motion.form
        className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4"
        onSubmit={handleSubmit}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* First Row */}
        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="status" className={label.className} style={label.style}>
            Operación
          </Label>
          <Select
            defaultValue={searchParams.status}
            onValueChange={(value) =>
              handleSelectChange("status", value as "for-sale" | "for-rent")
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Operación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="for-sale">
                {opciones.compra ? "Compra" : "Venta"}
              </SelectItem>
              <SelectItem value="for-rent">Alquiler</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="property-type" className={label.className} style={label.style}>
            Tipo de Propiedad
          </Label>
          <PropertyTypeMenu
            id="property-type"
            types={propertyTypes}
            selectedTypes={searchParams.propertyTypes}
            onToggleType={togglePropertyType}
            subtypeOptions={subtypeOptionsFor(
              subtypeOptions,
              searchParams.status,
            )}
            selectedSubtypes={searchParams.subtypes}
            onToggleSubtype={toggleSubtype}
            placeholder="Cualquiera"
          />
        </motion.div>

        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="bedrooms" className={label.className} style={label.style}>
            {roomsFilterLabel(searchParams.propertyTypes)}
          </Label>
          <Select
            value={searchParams.bedrooms}
            onValueChange={(value) => handleSelectChange("bedrooms", value)}
            disabled={!roomsApply}
          >
            <SelectTrigger id="bedrooms">
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquiera</SelectItem>
              {MIN_BEDROOM_OPTIONS.map((n) => (
                <SelectItem key={n} value={n}>
                  +{n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="bathrooms" className={label.className} style={label.style}>
            Baños
          </Label>
          <Select
            value={searchParams.bathrooms}
            onValueChange={(value) => handleSelectChange("bathrooms", value)}
            disabled={!roomsApply}
          >
            <SelectTrigger id="bathrooms">
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquiera</SelectItem>
              {MIN_BATHROOM_OPTIONS.map((n) => (
                <SelectItem key={n} value={n}>
                  +{n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Second Row */}
        <motion.div className="col-span-2 space-y-2" variants={staggerItem}>
          <Label className={label.className} style={label.style}>Ubicación</Label>
          <TwoLevelLocationSelect
            initialProvinces={provinces}
            selectedProvince={searchParams.province}
            selectedCities={searchParams.cities}
            selectedNeighborhoodIds={searchParams.neighborhoodIds}
            filters={locationFilters}
            onProvinceChange={(province) => handleSelectChange("province", province)}
            onSelectionChange={handleLocationSelectionChange}
          />
        </motion.div>

        <motion.div className="space-y-2" variants={staggerItem}>
          <div className="flex flex-col space-y-1 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <Label className={label.className} style={label.style}>Precio</Label>
            <span className="text-xs text-muted-foreground text-center sm:text-right">
              {formatNumber(priceRange[0] ?? 0)}€ -{" "}
              {formatNumber(priceRange[1] ?? 0)}€
            </span>
          </div>
          <Slider
            value={priceRange}
            min={bounds.minPrice}
            max={bounds.maxPrice}
            step={
              opciones.antiguo ? 10000 : searchParams.status === "for-rent" ? 50 : 5000
            }
            onValueChange={setPriceRange}
            className="py-4"
            marca={opciones.colorMarca}
            sinAsas={opciones.colorMarca && !opciones.antiguo}
          />
        </motion.div>

        <motion.div className="flex items-end" variants={staggerItem}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button
              type="submit"
              className={acct137 ? "w-full text-white hover:opacity-90" : "w-full"}
              size="pill"
              style={acct137 ? { backgroundColor: ACCOUNT_137_SEARCH_GREEN } : undefined}
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </motion.div>
        </motion.div>

        <motion.div className="col-span-2 md:col-span-4" variants={staggerItem}>
          <CharacteristicsFilter
            selected={searchParams.amenities}
            onToggle={toggleAmenity}
          />
        </motion.div>
      </motion.form>
    </motion.div>
    </OpcionesBuscadorProvider>
  );
}
