import type { AboutProps } from "../../lib/data";

// NOTE: resolveTeamPhotos lives in ./team-photos.ts (imported directly by
// callers). Keeping it out of this file lets the static-site transformer
// hardcode getAboutProps and strip this file's DB imports without breaking the
// runtime team-photo helper.

export const getAboutProps = (_accountIdArg?: bigint): AboutProps | null => {
  return {
  "image": "/placeholder-about.jpg",
  "title": "Sobre Nosotros",
  "values": [],
  "content": "En Grupo Marín reunimos construcción e intermediación inmobiliaria bajo un mismo techo, algo que casi nadie ofrece en el Maresme. Desde Premià de Dalt acompañamos a nuestros clientes en cada etapa: comprar, vender, alquilar o reformar su vivienda, con un equipo comprometido que gestiona también la documentación y los contratos.",
  "showKPI": false,
  "content2": "Nuestra propuesta es sencilla: que no tengas que acudir a varios sitios para resolver lo que necesitas. Combinamos el conocimiento del mercado inmobiliario con la experiencia real en construcción y reformas integrales, para que tu vivienda gane valor y tú ganes tranquilidad. Sin letra pequeña, sin rodeos, solo resultados.",
  "kpi3Data": "9",
  "kpi3Name": "Zonas de actuación",
  "services": [{
  "icon": "Home",
  "title": "Compra de vivienda"
}, {
  "icon": "Handshake",
  "title": "Venta de vivienda"
}, {
  "icon": "Key",
  "title": "Alquiler"
}, {
  "icon": "Hammer",
  "title": "Reformas"
}, {
  "icon": "Banknote",
  "title": "Financiación"
}, {
  "icon": "Scale",
  "title": "Gestión legal y documental"
}],
  "subtitle": "Construcción, reformas e inmobiliaria, todo en un solo lugar",
  "buttonName": "Contacta a Nuestro Equipo",
  "originsTitle": "De dónde venimos",
  "originsContent": "Grupo Marín nace de la unión de dos mundos que casi nunca van de la mano: la construcción y la intermediación inmobiliaria. Desde nuestra base en el Maresme —Premià de Dalt, Premià de Mar y Vilassar de Mar— nos especializamos en acompañar al cliente de principio a fin, reuniendo bajo un mismo techo lo que otros ofrecen por separado. Un modelo pensado para que cada persona encuentre en nosotros una sola respuesta a todas sus necesidades, con el trato cercano y transparente que nos define.",
  "extendedServices": [{
  "icon": "Hammer",
  "image": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/servicios/reforma-integral_1783011252930.png",
  "title": "Reforma integral",
  "description": "Renovamos tu vivienda por completo con un único equipo de confianza: distribución, acabados y coordinación de gremios, con visualización previa del resultado."
}, {
  "icon": "ChefHat",
  "image": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/categories/reformas_1783011157255.png",
  "title": "Cocinas",
  "description": "Diseño y renovación de cocinas a medida, con materiales de calidad y una planificación pensada para tu día a día."
}, {
  "icon": "ShowerHead",
  "image": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/servicios/reforma-ducha_1783011252930.png",
  "title": "Baños y duchas",
  "description": "Reformamos baños y cambiamos tu bañera por un cómodo y seguro plato de ducha, con acabados modernos y resistentes."
}],
  "aboutSectionTitle": "Nuestra Misión",
  "nosotrosHeroImage": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/nosotros/nosotros-hero.jpg",
  "nosotrosPageTitle": "Sobre Nosotros",
  "servicesHeroImage": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/servicios/reforma-integral_1783011252930.png",
  "servicesPageTitle": "Reformas",
  "maxServicesDisplayed": 6,
  "nosotrosPageSubtitle": "Dos mundos unidos para ofrecerte un servicio completo: construcción e inmobiliaria de la mano, desde el Maresme.",
  "servicesPageSubtitle": "Reformas integrales, cocinas, baños y proyectos a medida. Transformamos tu vivienda con un equipo propio y visualización previa del resultado.",
  "servicesSectionTitle": "Nuestros Servicios"
};
}
