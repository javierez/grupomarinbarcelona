
import type { FooterProps } from "../../lib/data";

export const getFooterProps = (_accountIdArg?: bigint): FooterProps | null => {
  return {
  "companyName": "Grupo Marín Creative SLU",
  "description": "Construcción, reformas e inmobiliaria en el Maresme. Sin letra pequeña, sin rodeos, solo resultados.",
  "socialLinks": {
  "instagram": "https://www.instagram.com/grupomarinccm/"
},
  "officeLocations": [{
  "name": "Grupo Marín Premià",
  "address": ["Carrer Geranis, 25", "Premià de Dalt, Barcelona"],
  "phone": "695611457",
  "email": "grupomarinbcn@gmail.com"
}, {
  "name": "Grupo Marín Vilassar de Mar",
  "address": ["Av. Montevideo, 150", "Vilassar de Mar, Barcelona"],
  "phone": "936178921",
  "email": "grupomarinvdm@gmail.com"
}, {
  "name": "Grupo Marín Barcelona",
  "address": ["Carrer Sardenya, 206", "Barcelona, Barcelona"],
  "phone": "936178921",
  "email": "grupomarinbcn@gmail.com"
}, {
  "name": "Grupo Marín Blanes",
  "address": ["Carrer Cristòfol Colom, 28", "Blanes, Girona"],
  "phone": "663946837",
  "email": "grupomarinbcn@gmail.com"
}],
  "copyright": "© 2026 Grupo Marín. Todos los derechos reservados."
};
}
