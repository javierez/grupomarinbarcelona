// «Tipo de inmueble» y el bloque de alquiler de la ficha. Sin framework:
// afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/components/property/characteristics-data.test.ts
import { buildCharacteristicGroups, propertyTypeRowLabel } from "./characteristics-data";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

console.log("propertyTypeRowLabel");
eq(propertyTypeRowLabel({ propertyType: "piso" }), "Piso", "sin subtipo: el tipo con nombre");
eq(propertyTypeRowLabel({ propertyType: "industrial" }), "Nave Industrial", "un tipo que antes salía crudo");
eq(propertyTypeRowLabel({ propertyType: "oficina" }), "Oficina", "oficina con mayúscula, como la tarjeta");
eq(
  propertyTypeRowLabel({ propertyType: "local", propertySubtype: "industrial" }),
  "Nave Industrial",
  "el subtipo manda: una nave guardada como local",
);
eq(propertyTypeRowLabel({ propertyType: "piso", propertySubtype: "Ático" }), "Ático", "subtipo sin mapa: tal cual");
eq(propertyTypeRowLabel({ propertyType: "piso", propertySubtype: "  " }), "Piso", "subtipo vacío: el tipo");
eq(propertyTypeRowLabel({}), "", "sin tipo: nada");

console.log("bloque de alquiler");
const rentalGroupCount = (listingType: string) =>
  buildCharacteristicGroups({ propertyType: "piso", listingType, isFurnished: true, petsAllowed: true }).length;
eq(
  rentalGroupCount("RoomSharing") > rentalGroupCount("Sale"),
  true,
  "una habitación (RoomSharing) enseña lo de alquiler, una venta no",
);
eq(rentalGroupCount("RoomSharing"), rentalGroupCount("Rent"), "RoomSharing como Rent");

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
