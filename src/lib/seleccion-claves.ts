/**
 * Lo que la agencia puede señalar en la vista de «Mi web» (contrato
 * web-por-chat §6.1): cada `data-vesta` de los componentes, con el
 * nombre que ve al pasar el ratón, qué es y de qué campo de `website_config`
 * sale. Un solo mapa: una clave nueva se pone aquí y en el componente, y
 * `seleccion.test.ts` falla si un componente usa una que no está.
 *
 * - `conNombre` se usa cuando el elemento trae nombre (`data-vesta-nombre`, o
 *   el texto de un botón o un enlace): «Botón «Llámanos»», «Opinión de Marta».
 * - `{i}` en el campo es `data-vesta-i` (la oficina, el servicio, el bloque);
 *   sin él, el campo se queda en la lista entera.
 * - `id` dice qué es `data-vesta-id` en ese elemento y en lo que lleva dentro.
 */
import type {
  AboutProps,
  FooterProps,
  HeroProps,
  PropertiesProps,
  TestimonialProps,
} from "~/lib/data";
import type { Bloque } from "~/lib/pagina-propia";
import type { BlogProps } from "~/server/queries/blog";
import type { ContactProps } from "~/server/queries/contact";
import type { FeaturesProps } from "~/server/queries/website-config";

export const TIPOS_DE_ELEMENTO = [
  "texto",
  "imagen",
  "boton",
  "enlace",
  "bloque",
  "inmueble",
  "opinion",
  "seccion",
] as const;
export type TipoDeElemento = (typeof TIPOS_DE_ELEMENTO)[number];

/** Las columnas que se señalan, con su forma: el campo tiene que existir en ellas. */
type Config = {
  heroProps: HeroProps;
  propertiesProps: PropertiesProps;
  aboutProps: AboutProps;
  testimonialProps: TestimonialProps;
  contactProps: ContactProps;
  footerProps: FooterProps;
  featuresProps: FeaturesProps;
  blogProps: BlogProps;
  promoCardsProps: unknown[];
  faqsProps: unknown[];
  bannerProps: unknown;
  socialLinks: unknown;
  logo: unknown;
};
/** Las columnas que son una lista: «promoCardsProps[2]». */
type Lista = { [K in keyof Config]: Config[K] extends readonly unknown[] ? K : never }[keyof Config];
/** La columna y su primera clave («heroProps.title») tienen que existir; lo de debajo, no se mira. */
type Segundo = {
  [K in keyof Config]: `${K}.${Extract<keyof NonNullable<Config[K]>, string>}`;
}[keyof Config];
export type Campo =
  | keyof Config
  | `${Lista}[{i}]`
  | `${Lista}[{i}].${string}`
  | Segundo
  | `${Segundo}[{i}]`
  | `${Segundo}[{i}].${string}`
  | `${Segundo}.${string}`;

export type Definicion = {
  etiqueta: string;
  conNombre?: string;
  tipo: TipoDeElemento;
  campo?: Campo;
  id?: "listingId" | "testimonialId";
};

export const CLAVES = {
  // Menú
  nav: { etiqueta: "Menú", tipo: "seccion", campo: "featuresProps.navOrder" },
  "nav.logo": { etiqueta: "Logo", tipo: "imagen", campo: "logo" },
  "nav.enlace": {
    etiqueta: "Enlace del menú",
    conNombre: "Enlace «{nombre}» del menú",
    tipo: "enlace",
    campo: "featuresProps.menuLabels",
  },
  "nav.enlace-propio": {
    etiqueta: "Enlace del menú",
    conNombre: "Enlace «{nombre}» del menú",
    tipo: "enlace",
    campo: "featuresProps.navExtra",
  },
  "nav.redes": { etiqueta: "Redes sociales del menú", tipo: "enlace", campo: "socialLinks" },
  "nav.buscador": { etiqueta: "Buscador del menú", tipo: "seccion", campo: "featuresProps.referenceSearch" },

  // Portada
  hero: { etiqueta: "Portada", tipo: "seccion", campo: "heroProps" },
  "hero.titulo": { etiqueta: "Título de la portada", tipo: "texto", campo: "heroProps.title" },
  "hero.subtitulo": { etiqueta: "Subtítulo de la portada", tipo: "texto", campo: "heroProps.subtitle" },
  "hero.imagen": { etiqueta: "Foto de la portada", tipo: "imagen", campo: "heroProps.backgroundImage" },
  "hero.video": { etiqueta: "Vídeo de la portada", tipo: "imagen", campo: "heroProps.backgroundVideo" },
  "hero.diapositiva": { etiqueta: "Texto de la portada", tipo: "texto", campo: "heroProps.slides[{i}]" },
  "hero.boton-buscar": {
    etiqueta: "Botón de la portada",
    conNombre: "Botón «{nombre}»",
    tipo: "boton",
    campo: "heroProps.findPropertyButton",
  },
  "hero.boton-contacto": {
    etiqueta: "Botón de contacto de la portada",
    conNombre: "Botón «{nombre}»",
    tipo: "boton",
    campo: "heroProps.contactButton",
  },
  "hero.boton-directo": {
    etiqueta: "Botón de la portada",
    conNombre: "Botón «{nombre}»",
    tipo: "boton",
    campo: "featuresProps.heroDirectButtons[{i}]",
  },
  "hero.buscador": {
    etiqueta: "Buscador de la portada",
    tipo: "seccion",
    campo: "featuresProps.heroSearchPlaceholder",
  },
  tarjetas: { etiqueta: "Tarjetas de la portada", tipo: "seccion", campo: "promoCardsProps" },
  familia: { etiqueta: "Redes sociales de la portada", tipo: "seccion", campo: "aboutProps.showSocialFamilySection" },
  "familia.titulo": { etiqueta: "Título de las redes sociales", tipo: "texto" },
  "familia.subtitulo": {
    etiqueta: "Subtítulo de las redes sociales",
    tipo: "texto",
    campo: "featuresProps.sections.socialFamilySubtitle",
  },
  "familia.red": { etiqueta: "Red social", conNombre: "Tarjeta de {nombre}", tipo: "enlace", campo: "socialLinks" },
  recorridos: { etiqueta: "Recorridos en vídeo", tipo: "seccion", campo: "featuresProps.video.homeReels" },
  "recorridos.titulo": { etiqueta: "Título de los vídeos", tipo: "texto", campo: "featuresProps.video.homeReelsTitle" },
  "recorridos.subtitulo": {
    etiqueta: "Subtítulo de los vídeos",
    tipo: "texto",
    campo: "featuresProps.video.homeReelsSubtitle",
  },
  // Las oficinas salen de su tabla, no de website_config.
  oficinas: { etiqueta: "Elige tu oficina", tipo: "seccion" },
  oficina: { etiqueta: "Oficina", conNombre: "Oficina «{nombre}»", tipo: "enlace" },
  tarjeta: { etiqueta: "Tarjeta", conNombre: "Tarjeta «{nombre}»", tipo: "enlace", campo: "promoCardsProps[{i}]" },
  "banner.titulo": { etiqueta: "Título del banner", tipo: "texto", campo: "bannerProps" },
  "banner.subtitulo": { etiqueta: "Subtítulo del banner", tipo: "texto", campo: "bannerProps" },
  "banner.imagen": { etiqueta: "Foto del banner", tipo: "imagen", campo: "bannerProps" },
  "banner.boton": { etiqueta: "Botón del banner", conNombre: "Botón «{nombre}»", tipo: "boton", campo: "bannerProps" },

  // Inmuebles destacados y fichas
  destacados: { etiqueta: "Inmuebles destacados", tipo: "seccion", campo: "propertiesProps" },
  "destacados.titulo": { etiqueta: "Título de los destacados", tipo: "texto", campo: "propertiesProps.title" },
  "destacados.subtitulo": {
    etiqueta: "Subtítulo de los destacados",
    tipo: "texto",
    campo: "propertiesProps.subtitle",
  },
  "destacados.boton": {
    etiqueta: "Botón de los destacados",
    conNombre: "Botón «{nombre}»",
    tipo: "boton",
    campo: "propertiesProps.buttonText",
  },
  "inmueble.tarjeta": { etiqueta: "Tarjeta del piso", tipo: "inmueble", id: "listingId" },
  "inmueble.foto": { etiqueta: "Foto del piso", tipo: "imagen" },
  ficha: { etiqueta: "Ficha del piso", tipo: "inmueble", id: "listingId" },
  "ficha.titulo": { etiqueta: "Título del piso", tipo: "texto" },
  "ficha.precio": { etiqueta: "Precio del piso", tipo: "texto" },
  "ficha.fotos": { etiqueta: "Fotos del piso", tipo: "imagen" },
  "ficha.descripcion": { etiqueta: "Descripción del piso", tipo: "texto" },

  // Sobre nosotros y servicios
  nosotros: { etiqueta: "Sobre nosotros", tipo: "seccion", campo: "aboutProps" },
  "nosotros.titulo": { etiqueta: "Título de Sobre nosotros", tipo: "texto", campo: "aboutProps.title" },
  "nosotros.subtitulo": { etiqueta: "Subtítulo de Sobre nosotros", tipo: "texto", campo: "aboutProps.subtitle" },
  "nosotros.texto": { etiqueta: "Texto de Sobre nosotros", tipo: "texto", campo: "aboutProps.content" },
  "nosotros.texto2": { etiqueta: "Segundo texto de Sobre nosotros", tipo: "texto", campo: "aboutProps.content2" },
  "nosotros.imagen": { etiqueta: "Foto de Sobre nosotros", tipo: "imagen", campo: "aboutProps.image" },
  "nosotros.boton": {
    etiqueta: "Botón de Sobre nosotros",
    conNombre: "Botón «{nombre}»",
    tipo: "boton",
    campo: "aboutProps.buttonName",
  },
  "nosotros.cifras": { etiqueta: "Cifras", tipo: "seccion", campo: "aboutProps.showKPI" },
  "nosotros.pagina-titulo": {
    etiqueta: "Título de la página Nosotros",
    tipo: "texto",
    campo: "aboutProps.nosotrosPageTitle",
  },
  "nosotros.pagina-subtitulo": {
    etiqueta: "Subtítulo de la página Nosotros",
    tipo: "texto",
    campo: "aboutProps.nosotrosPageSubtitle",
  },
  "nosotros.pagina-imagen": {
    etiqueta: "Foto de la página Nosotros",
    tipo: "imagen",
    campo: "aboutProps.nosotrosHeroImage",
  },
  "nosotros.pagina-video": {
    etiqueta: "Vídeo de la página Nosotros",
    tipo: "imagen",
    campo: "aboutProps.nosotrosHeroVideo",
  },
  "nosotros.historia": { etiqueta: "Nuestra historia", tipo: "texto", campo: "aboutProps.originsContent" },
  "nosotros.valores": { etiqueta: "Valores", tipo: "seccion", campo: "aboutProps.values" },
  "nosotros.valor": {
    etiqueta: "Valor",
    conNombre: "Valor «{nombre}»",
    tipo: "texto",
    campo: "aboutProps.values[{i}]",
  },
  "nosotros.equipo": { etiqueta: "Equipo", tipo: "seccion", campo: "aboutProps.team" },
  "nosotros.persona": {
    etiqueta: "Persona del equipo",
    conNombre: "Ficha de {nombre}",
    tipo: "texto",
    campo: "aboutProps.team[{i}]",
  },
  servicios: { etiqueta: "Servicios", tipo: "seccion", campo: "aboutProps.services" },
  "servicios.pagina-titulo": {
    etiqueta: "Título de la página Servicios",
    tipo: "texto",
    campo: "aboutProps.servicesPageTitle",
  },
  "servicios.pagina-subtitulo": {
    etiqueta: "Subtítulo de la página Servicios",
    tipo: "texto",
    campo: "aboutProps.servicesPageSubtitle",
  },
  "servicios.pagina-imagen": {
    etiqueta: "Foto de la página Servicios",
    tipo: "imagen",
    campo: "aboutProps.servicesHeroImage",
  },
  "servicios.pagina-video": {
    etiqueta: "Vídeo de la página Servicios",
    tipo: "imagen",
    campo: "aboutProps.servicesHeroVideo",
  },
  "servicios.llamada": { etiqueta: "Invitación a contactar", tipo: "seccion", campo: "featuresProps.serviciosCta" },
  diferencias: { etiqueta: "Lo que nos diferencia", tipo: "seccion" },
  servicio: {
    etiqueta: "Servicio",
    conNombre: "Servicio «{nombre}»",
    tipo: "texto",
    campo: "aboutProps.services[{i}]",
  },
  "servicios.ampliados": { etiqueta: "Servicios", tipo: "seccion", campo: "aboutProps.extendedServices" },
  "servicio.ampliado": {
    etiqueta: "Servicio",
    conNombre: "Servicio «{nombre}»",
    tipo: "texto",
    campo: "aboutProps.extendedServices[{i}]",
  },
  "boton.contacto": {
    etiqueta: "Botón de contacto",
    conNombre: "Botón «{nombre}»",
    tipo: "boton",
    campo: "featuresProps.menuLabels.contacto",
  },

  // Opiniones
  opiniones: { etiqueta: "Opiniones", tipo: "seccion", campo: "testimonialProps" },
  "opiniones.titulo": { etiqueta: "Título de las opiniones", tipo: "texto", campo: "testimonialProps.title" },
  opinion: { etiqueta: "Opinión", conNombre: "Opinión de {nombre}", tipo: "opinion", id: "testimonialId" },

  // Contacto
  contacto: { etiqueta: "Contacto", tipo: "seccion", campo: "contactProps" },
  "contacto.titulo": { etiqueta: "Título de Contacto", tipo: "texto", campo: "contactProps.title" },
  "contacto.subtitulo": { etiqueta: "Subtítulo de Contacto", tipo: "texto", campo: "contactProps.subtitle" },
  "contacto.telefono": {
    etiqueta: "Teléfono",
    tipo: "texto",
    campo: "contactProps.offices[{i}].phoneNumbers.main",
  },
  "contacto.email": { etiqueta: "Correo", tipo: "texto", campo: "contactProps.offices[{i}].emailAddresses.info" },
  "contacto.direccion": { etiqueta: "Dirección", tipo: "texto", campo: "contactProps.offices[{i}].address" },
  "contacto.horario": { etiqueta: "Horario", tipo: "texto", campo: "contactProps.offices[{i}].scheduleInfo" },
  "contacto.formulario": { etiqueta: "Formulario de contacto", tipo: "seccion", campo: "contactProps.messageForm" },
  // Los botones que flotan abajo a la derecha.
  "boton.whatsapp": { etiqueta: "Botón de WhatsApp", tipo: "boton", campo: "contactProps.whatsappNumber" },
  "boton.llamar": { etiqueta: "Botón de llamar", tipo: "boton", campo: "contactProps.callNumber" },
  "contacto.mapa": { etiqueta: "Mapa de la oficina", tipo: "seccion", campo: "contactProps.map" },
  "contacto.pagina-titulo": {
    etiqueta: "Título de la página Contacto",
    tipo: "texto",
    campo: "contactProps.heroTitle",
  },
  "contacto.pagina-subtitulo": {
    etiqueta: "Subtítulo de la página Contacto",
    tipo: "texto",
    campo: "contactProps.heroSubtitle",
  },
  "contacto.pagina-imagen": { etiqueta: "Foto de la página Contacto", tipo: "imagen", campo: "contactProps.heroImage" },
  "contacto.pagina-video": { etiqueta: "Vídeo de la página Contacto", tipo: "imagen", campo: "contactProps.heroVideo" },

  // Vender: el texto y los pasos son de la plantilla, no de website_config.
  "vender.titulo": { etiqueta: "Título de Vender", tipo: "texto" },
  "vender.subtitulo": { etiqueta: "Subtítulo de Vender", tipo: "texto" },
  "vender.pasos": { etiqueta: "Pasos del formulario", tipo: "seccion" },
  "vender.paso": { etiqueta: "Paso", conNombre: "Paso «{nombre}»", tipo: "texto" },
  "vender.formulario": { etiqueta: "Formulario para vender", tipo: "seccion", campo: "featuresProps.venderFormulario" },

  // Preguntas frecuentes (/faqs): la cabecera y la ayuda son de la plantilla.
  "faqs.titulo": { etiqueta: "Título de Preguntas frecuentes", tipo: "texto" },
  "faqs.subtitulo": { etiqueta: "Subtítulo de Preguntas frecuentes", tipo: "texto" },
  "faqs.ayuda": { etiqueta: "¿Necesitas más ayuda?", tipo: "seccion" },
  preguntas: {
    etiqueta: "Preguntas frecuentes",
    conNombre: "Preguntas «{nombre}»",
    tipo: "seccion",
    campo: "faqsProps[{i}]",
  },
  // Su `i` es el de su categoría: la pregunta se dice por su nombre.
  pregunta: {
    etiqueta: "Pregunta",
    conNombre: "Pregunta «{nombre}»",
    tipo: "texto",
    campo: "faqsProps[{i}].questions",
  },

  // Blog: los artículos están en su tabla, no en website_config (el artículo va en `ruta` o en el texto).
  "blog.titulo": { etiqueta: "Título del blog", tipo: "texto", campo: "blogProps.pageTitle" },
  "blog.subtitulo": { etiqueta: "Subtítulo del blog", tipo: "texto", campo: "blogProps.pageSubtitle" },
  "blog.lista": { etiqueta: "Lista de artículos", tipo: "seccion" },
  "blog.articulo": { etiqueta: "Artículo", conNombre: "Artículo «{nombre}»", tipo: "seccion" },
  "blog.articulo-titulo": { etiqueta: "Título del artículo", tipo: "texto" },
  "blog.articulo-texto": { etiqueta: "Texto del artículo", tipo: "texto" },

  // Pie
  pie: { etiqueta: "Pie de página", tipo: "seccion", campo: "footerProps" },
  "pie.descripcion": { etiqueta: "Texto del pie", tipo: "texto", campo: "footerProps.description" },
  "pie.copyright": { etiqueta: "Copyright del pie", tipo: "texto", campo: "footerProps.copyright" },
  "pie.redes": { etiqueta: "Redes sociales del pie", tipo: "enlace", campo: "socialLinks" },

  // Páginas propias (`featuresProps.paginas`): la página y el bloque van en `bloque`.
  "pagina.titulo": { etiqueta: "Título de la página", tipo: "texto", campo: "featuresProps.paginas" },
  bloque: { etiqueta: "Bloque de la página", conNombre: "{nombre}", tipo: "bloque", campo: "featuresProps.paginas" },
  "bloque.titulo": { etiqueta: "Título del bloque", tipo: "texto", campo: "featuresProps.paginas" },
  "bloque.subtitulo": { etiqueta: "Subtítulo del bloque", tipo: "texto", campo: "featuresProps.paginas" },
  "bloque.boton": {
    etiqueta: "Botón del bloque",
    conNombre: "Botón «{nombre}»",
    tipo: "boton",
    campo: "featuresProps.paginas",
  },
  "bloque.imagen": { etiqueta: "Foto del bloque", tipo: "imagen", campo: "featuresProps.paginas" },
  "bloque.pregunta": {
    etiqueta: "Pregunta",
    conNombre: "Pregunta «{nombre}»",
    tipo: "texto",
    campo: "featuresProps.paginas",
  },
} satisfies Record<string, Definicion>;

export type Clave = keyof typeof CLAVES;

/** El nombre de cada bloque de las páginas propias, para la etiqueta de `bloque`. */
export const NOMBRE_DEL_BLOQUE: Record<Bloque["tipo"], string> = {
  cabecera: "Cabecera de la página",
  texto: "Texto de la página",
  inmuebles: "Inmuebles de la página",
  galeria: "Galería de fotos",
  formulario: "Formulario de la página",
  preguntas: "Preguntas frecuentes",
  llamada: "Llamada a la acción",
  testimonios: "Opiniones de la página",
};

export function definicionDe(clave: string): Definicion | undefined {
  return Object.hasOwn(CLAVES, clave) ? (CLAVES as Record<string, Definicion>)[clave] : undefined;
}
