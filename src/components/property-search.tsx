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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Slider } from "~/components/ui/slider";
import { getPropertyTypeLabel } from "~/lib/data";
import { Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  buildSearchSlug,
  type PropertyType,
  type SearchParams,
} from "~/lib/search-utils";
import {
  TwoLevelLocationSelect,
} from "~/components/ui/two-level-location-select";
import { staggerContainer, staggerItem } from "~/lib/animations";

type ConcretePropertyType = Exclude<PropertyType, "any">;

interface SearchFormData {
  province: string;
  cities: string[];
  neighborhoodIds: string[];
  propertyTypes: ConcretePropertyType[];
  bedrooms: string;
  bathrooms: string;
  status: "for-sale" | "for-rent";
}

interface PropertySearchProps {
  provinces: string[];
  propertyTypes: string[];
  priceRange: { minPrice: number; maxPrice: number };
  accountId: string;
}

export function PropertySearch({
  provinces,
  propertyTypes,
  priceRange: dbPriceRange,
  accountId,
}: PropertySearchProps) {
  const router = useRouter();
  const [priceRange, setPriceRange] = useState<number[]>([
    dbPriceRange.minPrice || 50000,
    dbPriceRange.maxPrice || 1000000,
  ]);
  const [isPriceSliderTouched, setIsPriceSliderTouched] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchFormData>({
    province: "",
    cities: [],
    neighborhoodIds: [],
    propertyTypes: [],
    bedrooms: "any",
    bathrooms: "any",
    status: "for-sale",
  });


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
  };

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
      if (checked && !has) {
        return { ...prev, propertyTypes: [...prev.propertyTypes, value] };
      }
      if (!checked && has) {
        return {
          ...prev,
          propertyTypes: prev.propertyTypes.filter((t) => t !== value),
        };
      }
      return prev;
    });
  };

  const propertyTypeButtonLabel = (() => {
    const sel = searchParams.propertyTypes;
    if (sel.length === 0) return "Cualquiera";
    if (sel.length === 1) {
      const t = sel[0]!;
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return `${sel.length} tipos`;
  })();

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
    minPrice: isPriceSliderTouched ? (priceRange[0] ?? 0) : undefined,
    maxPrice: isPriceSliderTouched ? (priceRange[1] ?? 0) : undefined,
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
    } = searchParams;

    const searchParamsData: SearchParams = {
      cities: cities.length > 0 ? cities : undefined,
      neighborhoodIds: neighborhoodIds.length > 0 ? neighborhoodIds : undefined,
      province: province || undefined,
      propertyType: selectedTypes.length > 0 ? selectedTypes : undefined,
      bedrooms,
      bathrooms,
      minPrice: isPriceSliderTouched ? (priceRange[0] ?? 0) : undefined,
      maxPrice: isPriceSliderTouched ? (priceRange[1] ?? 0) : undefined,
      status,
    };

    const searchSlug = buildSearchSlug(searchParamsData);
    router.push(`/${searchSlug}`);
  };

  // Format numbers consistently to avoid hydration issues
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-ES").format(num);
  };

  return (
    <motion.div 
      className="mx-auto max-w-5xl rounded-2xl border border-border/60 bg-background/95 p-5 shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur-md sm:p-7"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <motion.form
        className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4"
        onSubmit={handleSubmit}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* First Row */}
        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="status" className="mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
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
              <SelectItem value="for-sale">Venta</SelectItem>
              <SelectItem value="for-rent">Alquiler</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="property-type" className="mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Tipo de Propiedad
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="property-type"
                type="button"
                variant="outline"
                className="flex h-11 w-full items-center justify-between px-4 font-normal transition-colors hover:border-foreground/30"
              >
                <span
                  className={
                    searchParams.propertyTypes.length === 0
                      ? "text-muted-foreground"
                      : ""
                  }
                >
                  {propertyTypeButtonLabel}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[var(--radix-dropdown-menu-trigger-width)]"
              align="start"
            >
              {propertyTypes.map((type) => {
                const value = type as ConcretePropertyType;
                return (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={searchParams.propertyTypes.includes(value)}
                    onCheckedChange={(checked) =>
                      togglePropertyType(value, checked === true)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {getPropertyTypeLabel(type)}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="bedrooms" className="mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Habitaciones
          </Label>
          <Select
            defaultValue={searchParams.bedrooms}
            onValueChange={(value) => handleSelectChange("bedrooms", value)}
          >
            <SelectTrigger id="bedrooms">
              <SelectValue placeholder="Habitaciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquiera</SelectItem>
              <SelectItem value="1">+1</SelectItem>
              <SelectItem value="2">+2</SelectItem>
              <SelectItem value="3">+3</SelectItem>
              <SelectItem value="4">+4</SelectItem>
              <SelectItem value="5">+5</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="bathrooms" className="mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Baños
          </Label>
          <Select
            defaultValue={searchParams.bathrooms}
            onValueChange={(value) => handleSelectChange("bathrooms", value)}
          >
            <SelectTrigger id="bathrooms">
              <SelectValue placeholder="Baños" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Cualquiera</SelectItem>
              <SelectItem value="1">+1</SelectItem>
              <SelectItem value="2">+2</SelectItem>
              <SelectItem value="3">+3</SelectItem>
              <SelectItem value="4">+4</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Second Row */}
        <motion.div className="col-span-2 space-y-2" variants={staggerItem}>
          <Label className="mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">Ubicación</Label>
          <TwoLevelLocationSelect
            initialProvinces={provinces}
            accountId={accountId}
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
            <Label className="mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">Precio</Label>
            <span className="text-xs text-muted-foreground text-center sm:text-right">
              {formatNumber(priceRange[0] ?? 0)}€ -{" "}
              {formatNumber(priceRange[1] ?? 0)}€
            </span>
          </div>
          <Slider
            defaultValue={priceRange}
            min={dbPriceRange.minPrice || 0}
            max={dbPriceRange.maxPrice || 2000000}
            step={10000}
            onValueChange={(value) => {
              setPriceRange(value);
              setIsPriceSliderTouched(true);
            }}
            className="py-4"
          />
        </motion.div>

        <motion.div className="flex items-end" variants={staggerItem}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button type="submit" className="w-full" size="pill">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </motion.div>
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
