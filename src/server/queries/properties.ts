"use server";

import { resolveSquareMeter } from "~/lib/surface";
import { db } from "../db";
import {
  properties,
  listings,
  locations,
  propertyImages,
  listingActivity,
} from "~/server/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { cache } from "react";
import { env } from "~/env";
import type { PropertyType, Property } from "~/lib/data";
import { hasAtLeastOnePhoto } from "./filters";
import { latestRealPriceDrop, type PriceDrop } from "~/lib/price-drop";

const ACCOUNT_ID = 141n;

export const getPropertiesProps = cache(async () => {
  try {
    // Query properties with their listings and first image
    const propertiesData = await db
      .select({
        // Property fields
        propertyId: properties.propertyId,
        referenceNumber: properties.referenceNumber,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        squareMeter: properties.squareMeter,
        builtSurfaceArea: properties.builtSurfaceArea,

        // Listing fields
        listingId: listings.listingId,
        price: listings.price,
        listingType: listings.listingType,
        status: listings.status,
        isFeatured: listings.isFeatured,

        // Location fields
        city: locations.city,
        province: locations.province,
        neighborhood: locations.neighborhood,

        // First image
        imageUrl: propertyImages.imageUrl,
      })
      .from(properties)
      .innerJoin(
        listings,
        and(
          eq(listings.propertyId, properties.propertyId),
          eq(listings.accountId, ACCOUNT_ID),
          eq(listings.isActive, true),
        ),
      )
      .leftJoin(
        locations,
        eq(properties.neighborhoodId, locations.neighborhoodId),
      )
      .leftJoin(
        propertyImages,
        and(
          eq(propertyImages.propertyId, properties.propertyId),
          eq(propertyImages.isActive, true),
          eq(propertyImages.imageOrder, 0),
          sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('tour', 'youtube', 'video'))`,
        ),
      )
      .where(
        and(
          eq(properties.accountId, ACCOUNT_ID),
          eq(properties.isActive, true),
          eq(listings.status, "En Venta"),
          eq(listings.publishToWebsite, true),
          hasAtLeastOnePhoto(properties.propertyId),
        ),
      )
      .orderBy(desc(listings.isFeatured), desc(listings.createdAt))
      .limit(12);

    // Transform the data to match the expected Property type
    const formattedProperties: Property[] = propertiesData.map((property) => ({
      id: property.propertyId?.toString() || "",
      reference: property.referenceNumber || "",
      listingId: property.listingId?.toString() || "",
      title: `${property.propertyType} en ${property.neighborhood || property.city}`,
      address: `${property.neighborhood || ""}, ${property.city}`,
      city: property.city || "",
      state: property.province || "",
      zipCode: "",
      price: property.price ? Number(property.price) : 0,
      bedrooms: property.bedrooms || 0,
      bathrooms:
        typeof property.bathrooms === "number"
          ? property.bathrooms
          : parseInt(property.bathrooms || "0") || 0,
      // Land flips the columns — resolveSquareMeter picks the plot on solar and
      // the useful area everywhere else. See ~/lib/surface.
      squareFeet:
        resolveSquareMeter(
          property.propertyType,
          property.squareMeter,
          property.builtSurfaceArea,
        ) ?? 0,
      description: "",
      features: [],
      propertyType:
        (property.propertyType?.toLowerCase() as PropertyType) || "piso",
      status:
        property.listingType === "Rent" ? "for-rent" : ("for-sale" as any),
      isFeatured: property.isFeatured || false,
      imageUrl: property.imageUrl || "/placeholder-property.jpg",
      images: [],
      energyCertification: null,
      hasElevator: false,
      hasGarage: false,
      hasStorageRoom: false,
    }));

    return {
      title: "Propiedades Destacadas",
      subtitle: "Descubre nuestra selección de propiedades disponibles",
      buttonText: "Ver Todas las Propiedades",
      itemsPerPage: 6,
      properties: formattedProperties,
    };
  } catch (error) {
    console.error("Error fetching properties:", error);
    return {
      title: "Propiedades Destacadas",
      subtitle: "Descubre nuestra selección de propiedades disponibles",
      buttonText: "Ver Todas las Propiedades",
      itemsPerPage: 6,
      properties: [],
    };
  }
});

/**
 * La bajada de precio que se enseña en la ficha («Ha bajado 10.000 €»), o null.
 * Sale del último `price_changed` que el CRM guardó para el anuncio.
 */
export const getRecentPriceDrop = cache(
  async (listingId: bigint): Promise<PriceDrop | null> => {
    try {
      const [last] = await db
        .select({
          createdAt: listingActivity.createdAt,
          details: listingActivity.details,
          price: listings.price,
        })
        .from(listingActivity)
        .innerJoin(
          listings,
          and(
            eq(listings.listingId, listingActivity.listingId),
            eq(listings.accountId, ACCOUNT_ID),
          ),
        )
        .where(
          and(
            eq(listingActivity.listingId, listingId),
            eq(listingActivity.action, "price_changed"),
          ),
        )
        .orderBy(desc(listingActivity.createdAt))
        .limit(1);
      if (!last) return null;

      const details = last.details as { oldValue?: unknown; newValue?: unknown };
      const drop = latestRealPriceDrop([
        {
          createdAt: last.createdAt,
          oldValue: Number(details.oldValue),
          newValue: Number(details.newValue),
        },
      ]);
      // Si el precio de hoy no es el de esa bajada, alguien lo cambió por otro
      // camino y la etiqueta mentiría.
      return drop && drop.newPrice === Number(last.price) ? drop : null;
    } catch (error) {
      console.error("Error fetching price drop:", error);
      return null;
    }
  },
);
