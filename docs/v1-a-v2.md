# De v1 a v2: una sola plantilla

Lo que la web v1 (`vestawebpage`) tenía y la v2 no, ya traído a la v2, y cómo
pasar cada una de las 12 agencias que siguen en v1. Escrito el 14-nov-2026
contra `vestawebpage` origin/main `b9ee4eb` y `vestawebpage-v2` origin/main
`8aa71bb`.

**Estado:** sin commitear, sin typecheck, sin lint, sin tests, sin abrir en un
navegador. Nada de esto se ha ejecutado. Ninguna cuenta se ha pasado. Ningún
SQL de aquí se ha lanzado. §3 (lo de la v1 como opción) es del 17-nov.

Tres tipos de cambio:

- **A. Arreglo para todas las webs v2.** Lo que la v2 hacía peor. Lo notan
  también las 14 agencias que ya están en v2 la próxima vez que se publiquen
  (§1).
- **B. Opción nueva, apagada por defecto.** Lo que era propio de la v1. Se
  enciende por cuenta en `website_config`; una v2 que no la tiene se ve igual
  que hoy (§2, y los valores de cada cuenta en §6).
- **C. Se queda como en la v2.** La agencia que pase lo verá distinto (§3).

---

## 1. A: arreglado para todas las webs v2

| Qué ve el visitante o la agencia | Dónde |
|---|---|
| **Los contactos de la web salen en Leads.** La consulta de una ficha y el formulario de contacto crean el contacto con `newLead: true`, como la v1. Hoy no: en 60 días, 51 de 57 leads de formulario de webs v2 quedaron fuera del tablero (141: 26 de 31, 155: 13 de 14, 103: 8, 154: 2, 135: 1, 226: 1) | `server/actions/property-inquiry.ts`, `contact-form.ts` |
| **RGPD: ningún formulario de la web da el consentimiento.** Ficha y contacto no tienen casilla. La de /vender (las dos) acepta términos y privacidad, no comunicaciones: se apunta su fecha (`additionalInfo.termsAcceptedAt`) y el contacto se queda en `not_asked`, para que la agencia lo pida. La v1 guardaba «aceptado» con las cuatro categorías, comerciales incluidas; en el CRM eso es un sí a todo y ya no deja pedirlo. Y /vender guarda `additionalInfo` como objeto: era una cadena y el CRM no leía la nota | `lib/web-form-consent.ts` (+ test), `server/actions/property-listing.ts`, `vender-lead.ts` |
| /vender de varios pasos: el propietario entra en **Captaciones** (`captacionStatus: "pendiente"`, `source: "Website"`) además del inmueble en borrador | `server/actions/property-listing.ts` |
| «Reservado» solo con la operación en arras o firmada, o un alquiler entero pendiente (antes, cualquier operación no perdida; feedback #2184, Doña Urraca 18) | `server/queries/filters.ts` `reservadoCondition` (+ test), `listings.ts` |
| Marca de agua en las miniaturas (listados, home, mapa), no solo en la ficha. Si la copia con marca no existe, sale la original | `lib/card-images.ts` (+ test), `server/queries/card-images.ts`, `listings.ts`, `listing-card.tsx`, `property-map-card.tsx` |
| La misma foto dos veces en una tarjeta: desempate por `property_image_id` | `server/queries/card-images.ts` |
| Etiqueta «Destacado» en tarjetas y feed | `listing-card.tsx`, `propiedades/feed/feed-details.tsx` |
| La rejilla «Propiedades destacadas» de la home pone los destacados primero, aunque la agencia ordene por fecha o precio | `listings.ts` `buildSortOrder(…, { featuredFirst })` |
| Orden: «Más antiguos» vuelve; «Destacados primero» se puede elegir aunque la agencia tenga otro orden; paginación, mapa y feed ya no añaden `?sort=` cuando es el de la agencia (URLs duplicadas en Google) | `lib/sort-params.ts` (+ test), `sort-dropdown.tsx`, `pagination.tsx`, `FeedViewToggle.tsx`, `MapViewToggle.tsx`, `PropertyFeed.tsx`, `[...slug]/page.tsx`, `inversiones`, `promociones` |
| Las tarjetas de colección de la home respetan el orden de la agencia | `server/queries/promo-cards.ts` |
| `/venta-propiedades/origen-bancario` y `/destacados` vuelven a filtrar (hoy los lee como una ciudad, 0 resultados); `con-a-estrenar` vuelve a filtrar obra nueva | `lib/search-utils.ts`, `search-filters.ts`, `search-bar.tsx` (+ `lib/search-categories.test.ts`) |
| Buscar «P008800» en el menú abre la ficha sin «Application error» (los dos arreglos a mano de inmobiliariaanadiaz, 5 y 9-nov) | `server/queries/reference-target.ts`, `server/actions/reference-search.ts`, `navbar.tsx`, `[...slug]/page.tsx` |
| Precio de 4 cifras con punto: «1.200 €/mes», no «1200 €/mes» (ficha, promociones, correos) | `propiedades/[id]/page.tsx`, `promotion-utils.ts`, `account-137-summary.tsx`, plantillas de correo (+ `lib/price-format.test.ts`) |
| «Tipo de inmueble» con el subtipo primero («Nave industrial», «Oficina»); habitaciones (`RoomSharing`) con las condiciones de alquiler | `property/characteristics-data.ts` (+ test) |
| Descripción del anuncio vacía → la del inmueble, solo para mostrar (no para buscar) | `listings.ts` `publicDescription`, comentario corregido en `text-search.ts` |
| Título de las subpáginas con la marca: «Aviso Legal \| Ana Díaz». Las fichas van sin repetirla | `app/layout.tsx`, `propiedades/[id]/page.tsx` |
| JSON-LD: `SiteNavigationElement` en la home (las 10 entradas de la v1) y teléfono y correo de la oficina por defecto si SEO no los tiene | `components/site-navigation-json-ld.tsx`, `app/page.tsx`, `components/json-ld.tsx` |
| /promociones sin el módulo: `noindex`; ya estaba fuera del sitemap. No 404 como la v1: rompería el banner de 141 (`kind: "promotions"`, enlaza a `/promociones?promotion=<id>` con `pages.promociones = false`) | `app/promociones/page.tsx` |
| Servicios con Markdown del CRM (`**negrita**`, listas, enlaces) en vez de los asteriscos | `components/ui/rich-text.tsx`, `about/ExtendedServicesGrid.tsx` |
| Tarjeta de categoría con la foto rota: degradado de la marca, no un hueco. Y sin tarjeta vacía cuando la agencia quita «Segunda mano» o «Inversión» del menú (`menuLabels` = `""`) | `components/category-panel.tsx` |
| **Contador de visitas** (`web_page_views`, `listing_web_views`), el que ve la agencia en el CRM. No cuenta en la vista previa | `components/page-view-beacon.tsx`, `server/actions/page-views.ts`, `app/layout.tsx` |
| **Los filtros del buscador ya no responden por otra agencia.** `actions/locations.ts` era `"use server"` con el `accountId` del que llama: cualquiera pedía provincias, barrios, precios y subtipos publicados de otra cuenta, y `getAllLocations` las zonas de todas. Ahora las consultas son solo de servidor y el navegador pide provincias y barrios por una acción fina que usa la cuenta de la web. Fuera cinco funciones sin uso | `server/queries/search-options.ts` (nuevo), `server/actions/locations-navegador.ts` (nuevo), `ui/two-level-location-select.tsx`, `search-bar.tsx`, `property-search.tsx`, `property-search-wrapper.tsx`, `[...slug]/page.tsx` |
| `/venta-terrenos-industriales` (tipo propio de la v1 de 137) = Terreno › Suelo industrial | `lib/search-utils.ts` `parseSearchSlug` |
| Icono «eye» (Transparencia) en valores y servicios: hoy sale «?» | `lib/service-icons.ts`, a mano igual que lo emite `gen-service-icons.mjs` del CRM, que ya lo lleva |

Quién lo nota de las que ya están en v2, al republicar: todas, los Leads y el
contador; **103, 139 y 141** la marca de agua en todas las miniaturas, **226**
en cuatro anuncios (180 no cambia); **158 y 180** el icono «eye» de sus valores.

---

## 2. B: opciones nuevas (apagadas)

| Clave | Qué hace | v1 |
|---|---|---|
| `features_props.venderFormulario = "corto"` | /vender = nombre, teléfono, correo y casilla; «te llamaremos». Contacto en Captaciones con «(vender)», aviso que abre `/contactos/{id}` y correo al administrador «Nueva captación web» (`agent-lead-notification`). Sin inmueble ni anuncio. 5 por minuto e IP, honeypot | Así era |
| `hero_props.buscador = "completo"` (por defecto `"texto"`) | Portada con título, subtítulo, los dos botones («Explorar Propiedades», «Contáctanos» o los suyos) y el buscador entero (Compra/Alquiler, tipo, zona, habitaciones, baños, precio) dentro, en vez de la caja de texto. Velo: `features_props.heroOverlayOpacity` (la v1, 0,4) | Así era |
| `hero_props.overlay = "claro"` (por defecto `"oscuro"`) | Velo blanco al 40 % y nada de texto sobre la foto, solo el buscador. El título queda como h1 oculto (Google y lectores de pantalla). No la lleva ninguna: 137 va con su portada de hoy | — |
| `features_props.enlacesInNav = true` | «Enlaces de interés» en el menú | Siempre salía |
| `features_props.serviciosLayout = "stacked"` | /servicios una fila por servicio, foto al lado (122 ya lo tiene) | 122 |
| `features_props.menuLabels.segundaMano = "Comprar"` (o `""` para quitarla) | Nombre de la entrada de venta del menú | «Comprar» fijo |
| `features_props.navOrder` | Orden del menú (ya existía) | ver §6 |
| `features_props.logoSize = "medium"` | Logo del tamaño de la v1 (ya existía) | `standard` v1 ≈ `medium` v2 |
| `font_props = {"sansFamily":"geist"}` | La letra de la v1 cuando la cuenta no tiene ninguna (la v2 pone DM Sans) | `geist` |
| `promo_cards_props` con las 3 tarjetas de la v1 | Origen bancario, Destacados, Oportunidad en vez de Segunda mano, Promociones, Inversiones | Por defecto |
| `features_props.descriptionAlign = "justify"` | Descripción de la ficha justificada. Ojo: también justifica otros textos de la web | Justificada |
| 137 (`lib/account-overrides/137.ts`) | Menú verde oscuro y negrita, precio verde, resumen propio de la ficha, barra Fotos / Mapa / Vídeo / 3D, miniaturas grandes | `isAccount137` |
| 111 (`lib/account-overrides/111.ts`) | Aviso legal y protección de datos de su abogado, copia literal de lo publicado | `isAccount111` |

Lo de 137 y 111 es código de esa agencia: cuando tengan repo propio, el
fichero y las ramas que lo leen se van allí.

---

## 3. C: lo demás de la v1, traído como opción

Javier, 17-nov: «we need to keep it all». Todo lo que aquí decía «se queda como
en la v2» o «se pierde» está **traído**: una clave de `features_props`,
apagada por defecto (las 14 webs v2 no cambian), que §6 enciende en cada cuenta.

| Qué vuelve como en la v1 | Clave | Dónde |
|---|---|---|
| Ficha: tarjeta de la oficina (logo o inicial, nombre, teléfono, correo), también con el formulario abierto. Con `use_agent_phone`, la del agente, como hoy | `fichaTarjetaOficina` | `property/tarjetas-contacto.tsx` (nuevo), `property-page-client.tsx`, `propiedades/[id]/page.tsx` |
| Ficha: ubicación con calle y CP, los que deja la visibilidad (`publicPostalCode`) | `fichaDireccion` | `propiedades/[id]/page.tsx` |
| /contacto sin foto de cabecera: H1, migas y `BreadcrumbJsonLd` | `contactoCabecera` | `app/contacto/page.tsx` |
| «Tiempo de respuesta estimado: menos de 24 horas» tras enviar; /nosotros «…en menos de 24 horas» | `respuesta24h` | `ContactForm.tsx`, `ContactContent.tsx`, `contact-section.tsx`, `contacto/[ciudad]/page.tsx`, `nosotros/page.tsx` |
| Botón del banner en el color de marca (también en la vista previa del CRM) | `bannerBotonMarca` | `banner-carousel.tsx`, `promo-banner.tsx`, `components/portada.tsx`, `preview-banner-client.tsx` |
| Orden por defecto: tipo (casa/piso, local, resto) antes que destacados. Solo la v1 de 21 lo tiene; las otras tres ya ordenan como la v2 | `ordenPorTipo` | `server/queries/listings.ts` |
| Tarjeta: «En Venta» / «En Alquiler» / «En Traspaso» | `tarjetaEtiquetaLarga` | `lib/card-display.ts`, `website-config.ts` `getPropertiesConfig`, `listing-card.tsx` |
| «Compra» en el buscador de la portada (con `hero_props.buscador = "completo"`) | `buscadorCompra` | `property-search.tsx`, `search/opciones-buscador.tsx` (nuevo), `lib/search-utils.ts` |
| Zona, casillas y barra de precio del buscador en el color de marca | `buscadorColorMarca` | `ui/two-level-location-select.tsx`, `characteristics-filter.tsx`, `ui/slider.tsx` |
| «Nave» en el menú de tipos (todas las v1 lo decían) | `buscadorNave` | `property-type-menu.tsx` |
| Una ruta que no es venta / alquiler / todo: 301 a su búsqueda de venta (`/comprar-pisos/leon` → pisos en León), no 404. Antes mira `paginas`; ficheros, `/api` y `/_next` siguen en 404 | `redirigirRutasAntiguas` | `[...slug]/page.tsx`, `search-utils.ts` `legacySaleSlug` |
| Cabecera teñida al 20 % del primario sobre la portada | `headerTint` | `navbar.tsx`, `app/layout.tsx` |
| Pie claro al 20 % del primario. Gana a `footerBrand` | `footerTint` | `footer.tsx` |
| «Nosotros» siempre (a `/#about` sin página) y «Contacto» a `/#contact` | `navHomeAnchors` | `navbar.tsx`, `app/layout.tsx` |
| WhatsApp: solo el móvil `sales` de la oficina por defecto | `whatsappFrom: "sales"` | `app/layout.tsx` |
| El aspecto: títulos centrados en negrita sin antetítulo (Destacados, Sobre nosotros, Contacto, ficha, resultados), menos aire entre secciones, botones rectos (`h-11 rounded-md`), etiquetas de formulario en tipo oración, el buscador `rounded-lg`, la cabecera con «Busca» cuadrado antes de las redes y sin el botón del mapa, el pie con sus títulos subrayados y la oficina en tarjeta, la ficha con precio y estado arriba a la derecha y las cifras en caja gris, el segundo párrafo de Sobre nosotros bajo «Nuestra Misión», y la tarjeta de inmueble de la v1 (tipo y operación arriba, título y precio en una línea, Destacado / Oportunidad abajo al centro, «Ref:»). Se queda lo de la v2: marca de agua, regla de Reservado, destacados, «1.200 €» y lo de 137 | `aspectoV1` | `globals.css`, `ui/button.tsx`, `app/layout.tsx`, `header-style-context.tsx`, `navbar.tsx`, `listing-card.tsx`, `listing-card-v1.tsx` (nuevo), `lib/card-display.ts`, `website-config.ts`, `propertygrid/*`, `property-grid.tsx`, `about/*`, `about-section.tsx`, `contact/*`, `property-search.tsx`, `search-bar.tsx`, `characteristics-filter.tsx`, `footer.tsx`, `footer/*` (`footer-v1.tsx` nuevo), `[...slug]/page.tsx`, `propiedades/[id]/page.tsx`, `property-page-client.tsx`, `property-characteristics.tsx`, `energy-certificate-section.tsx` |
| Por generación de la v1. `v1Antigua` (21, 122, 142): buscador sin características, cifras sin nombre, menús sin naves y barra de precio con asas. `v1Primera` (21, 142): «Busca por referencia» y `/todo` como venta. `v1Inicial` (solo 142, la más vieja): «Solares» en menús, pie, títulos y FAQ, sin «Naves» ni «Enlaces de interés» en el pie, más aire sobre las tarjetas de portada, galería sin pantalla completa y `/promociones` y `/enlaces-de-interes` en 404. Con `aspectoV1`, «Comprar» y «Alquilar» abren el desplegable pequeño de la v1, no el panel ancho; 111 y 137 dejan la barra de precio sin asas, como en vivo | `v1Antigua`, `v1Primera`, `v1Inicial` | `navbar.tsx`, `footer.tsx`, `category-panel.tsx`, `image-gallery.tsx`, `ui/slider.tsx`, `[...slug]/page.tsx`, `faqs/faqs-content.tsx`, `promociones/page.tsx`, `enlaces-de-interes/page.tsx` |
| 137: pie con todos los tipos en dos columnas, tarjetas editoriales, logo oculto en el móvil, «Buscar» y etiquetas en `#14532d` | código (`isAccount137`) | `account-overrides/137.ts`, `footer.tsx`, `listing-card.tsx`, `navbar.tsx`, `search-bar.tsx`, `property-search.tsx`, `search/cabecera-ana-diaz.tsx` (nuevo), `property-search-wrapper.tsx` |

`tarjetaEtiquetaLarga` va en `features_props` y no en
`properties_props.cardDisplay`: el editor del CRM rehace `cardDisplay` campo a
campo (`use-website-form.ts:432-441`) y la borraría al guardar «Inmuebles».

### No se trae, y por qué

- **Buscar por texto en la calle oculta, el precio oculto o el título
  interno.** Un visitante probaría palabras hasta dar con la dirección de un
  piso que la agencia esconde. A propósito.
- Similares con descripción y «Ver detalles»: la v1 no pinta similares
  (`similarProperties = []`); no hay nada que traer.
- Filas de Instagram / LinkedIn: solo se iban si se apaga toda la tarjeta de
  datos, y ninguna de las cinco lo hace. Cambiar el defecto la traería a 224.
- Favicon: los dos generadores escriben `src/app/icon.png` con el logo; sale
  igual. Precio en `--price`: solo 137 lo cambiaba, y ya va verde. Slugs
  viejos de ficha: ya redirigen con 301.
- Estilo menor: los enlaces del menú en minúscula y pequeños, y el logo del pie
  a `h-28`.
- Lo que ve el visitante sale de la base de hoy; la v1 enseña la de su última
  generación (21: 28-jul, 122: 15-sep, 111: 28-sep, 137: 9-oct). §10.

### WhatsApp flotante

Con `whatsappFrom: "sales"` la v2 hace lo de la v1. Sin ella: `whatsappNumber`,
luego `main`, luego `sales`, y solo móviles.

- **41:** la v1 publica 675384838 (su `sales`); lo guardado en
  `whatsappNumber` es `+34 628 02 97 89`. Va en §6 con `"sales"`: **confirmar
  con la agencia** antes de pasarla.
- 122 y 142 la llevan para seguir sin botón, como hoy. 21, 111 y 137 no tienen
  botón en ninguna de las dos.

---

## 4. Las 12 cuentas

Leído de producción el 14-nov-2026 (solo SELECT).

| Cuenta | Web de Vesta hoy | Anuncios publicados | Último lead web | Notas |
|---|---|---|---|---|
| 137 Ana Díaz | inmobiliariaanadiaz | 451 | 11-nov | Guard liberado el 19-nov (§7) |
| 122 Ecogar | ecogar | 138 | 30-ago | Servicios `stacked`, menú mínimo, «más recientes» |
| 21 Acrópolis | acropolis | 396 | 22-ago | Sin publicar desde el 7-may y `website_config` cambiado el 20-oct: sale todo de golpe |
| 111 Burgo Nuevo | burgonuevo | 133 | 10-nov | Datos legales que no cuadran (§5) |
| 142 Mito Atlántida | elmitoatlantida.vercel.app | 1 | — | Sellar su proyecto (§6) |
| 41 Best House León | todavía no | 418 | — | WhatsApp (§3) |
| 136 Best House Castellón | todavía no | 199 | — | |
| 132 La Maison | todavía no | 63 | — | |
| 147 Huertas | todavía no | 52 | — | `features_props` vacío |
| 146 Inmodumar | todavía no | 23 | — | |
| 32 Francisco Pérez | todavía no | 0 | — | Sin anuncios publicados |
| 113 Baru Haus | todavía no | 0 | — | Sin anuncios; título SEO de otra agencia (§5) |

**32, 41, 113, 132, 136, 146 y 147 no tienen web de Vesta todavía:** publicar
crea la primera en `<proyecto>.vercel.app`. Sus dominios propios
(lamaisonbcn.com, inmodumar.com, best-house.com…) no son nuestros y siguen
como están.

Hay además 6 cuentas de prueba en v1 (`is_test`: 34, 117, 121, 129, Toripark,
Martos).

---

## 5. Lo que hay que mirar con los ojos

- **137, portada:** `buscador: "completo"` con su título de hoy, que es como
  se ve hoy. Mirar en las capturas título, botones y buscador. 137 sigue sin
  regenerarse hasta que sus arreglos a mano estén en la plantilla (§7.4).
- **137, sus detalles** (§3, traídos el 17-nov): pie en dos columnas, tarjetas
  editoriales, logo oculto en el móvil, «Buscar» verde, «Nave». Mirarlos en
  las capturas, escritorio y móvil.
- **111.** `accounts`: Barigle Inversiones SL, B85850550, Av. Independencia 5.
  Su texto legal: Arco de Ánimas 1 bajo, 24003 León. Copiado tal cual está
  publicado; que la agencia diga cuál es el bueno.
- **113.** Su título SEO dice «Inmobiliaria Acrópolis». Se corrige en el CRM
  (Sitio Web → SEO) antes de publicar.

---

## 6. Configuración por cuenta (B)

**Las cinco con web (21, 111, 122, 137, 142) se quedan como se ven hoy**: una
agencia no cambia de aspecto si no lo pide. Las siete sin web de Vesta salen
con lo de la v2; a cuatro solo se les quita «Inversión», que saldría vacía.

Común a las cinco: `venderFormulario: "corto"`, `logoSize: "medium"`,
`navOrder` de la v1, `hero_props.buscador: "completo"` y las catorce de §3 que
llevan todas: `fichaTarjetaOficina`, `fichaDireccion`, `contactoCabecera`,
`respuesta24h`, `tarjetaEtiquetaLarga`, `buscadorCompra`, `buscadorColorMarca`,
`buscadorNave`, `redirigirRutasAntiguas`, `headerTint`, `footerTint`,
`navHomeAnchors`, `navTextoNormal` (los enlaces del menú de la v1: sin ellos
«Enlaces de interés» salta a tres líneas a 1440 px) y `aspectoV1` (títulos,
botones, tarjetas, pie y ficha como en la v1). Con `headerTint` el logo
va en sus colores también sobre la portada: sin él, el de 111 sale como un
disco blanco. Con `footerTint`, el logo del pie al tamaño de la v1 (`lg:h-28`).

| Cuenta | `features_props`, además | `menuLabels` | `hero_props` | Tarjetas de la v1 |
|---|---|---|---|---|
| 21 | `enlacesInNav`, velo 0,4, `ordenPorTipo` (también en la portada), `bannerBotonMarca` | `segundaMano: "Comprar"`, `inversion: ""` | `completo` | sí (no tiene) |
| 111 | `enlacesInNav`, velo 0,4 | `segundaMano: "Comprar"`, `inversion: ""` | `completo` | no (tiene las suyas) |
| 122 | `whatsappFrom: "sales"`, y `sections.socialFamily: false` aparte (abajo; su velo 0,6 se queda) | `segundaMano: ""`, `nosotros: ""` | `completo` | no (tiene las suyas) |
| 137 | `enlacesInNav`, `serviciosInNav: false` | `segundaMano: "Comprar"`, `inversion: ""` | `completo` + `overlay: "claro"` (su portada de hoy: velo blanco, su logo y su nombre sobre el buscador, sin título ni botones) | no (tiene las suyas) |
| 142 | `enlacesInNav`, velo 0,4, `whatsappFrom: "sales"` | `segundaMano: "Comprar"`, `inversion: ""` | `completo` | no (tiene las suyas) |
| 41 | `whatsappFrom: "sales"` (**confirmar** 675384838, §3) | — | — | — |
| 32, 113, 146, 147 | — | `inversion: ""` | — | — |
| 132, 136 | nada | | | |

`bannerBotonMarca` solo cambia algo en 21, la única con `banner_props`.

`buscador: "completo"` (sin `overlay: "claro"`) es ya la portada de la v1
tal cual: título, subtítulo y botones a la izquierda, y el buscador debajo,
montado sobre el borde de la foto (`hero-client.tsx`). Antes los centraba y
metía el buscador en una foto de 88vh: en 122 asomaba el crédito del vídeo.
Ninguna cuenta la tiene puesta (17-nov), así que no cambia ninguna web v2.

«Inversión» fuera en las cinco: la v1 no tiene esa entrada en el menú. 21
conserva «Promociones»: tiene `pages.promociones` y 3 promociones (17-nov), y
su v1 publicada es del 28-jul. El pie de 137 sale gris aunque lleve naranja
(`footer.tsx`): en la v1 su naranja iba en código y el pie no lo usaba.

«Velo 0,4» = `heroOverlayOpacity: 0.4`, el negro al 40 % de la v1 (la v2 pone
0,35). «Inversión» fuera donde no hay ningún destacado en venta: 142, 32, 113,
146, 147 (las demás tienen 2-24). Las cinco ya tienen `font_props`.
`descriptionAlign: "justify"` no va: añadirlo solo si las capturas lo piden.

`website_config` guarda los JSON como **texto** (`::jsonb` y vuelta a
`::text`). El trigger sella `updated_at`; da igual, porque el cron solo
republica webs v2. Va **justo antes de publicar esa cuenta**: la v1 publicada
no lee estas claves. Una cuenta cada vez: cambiar `21` en la última línea.

En seco (lo que hay y lo que quedaría), y luego el mismo bloque con el
`UPDATE` de abajo en lugar del `SELECT`:

```sql
WITH v1(account_id, con_web, extra, labels, hero, tarjetas) AS (VALUES
  (21,  true,  '{"enlacesInNav":true,"heroOverlayOpacity":0.4,"ordenPorTipo":true,"bannerBotonMarca":true}', '{"segundaMano":"Comprar","inversion":""}', '{"buscador":"completo"}', true),
  (111, true,  '{"enlacesInNav":true,"heroOverlayOpacity":0.4}', '{"segundaMano":"Comprar","inversion":""}', '{"buscador":"completo"}', false),
  (122, true,  '{"whatsappFrom":"sales"}', '{"segundaMano":"","nosotros":""}', '{"buscador":"completo"}', false),
  (137, true,  '{"enlacesInNav":true,"serviciosInNav":false}', '{"segundaMano":"Comprar","inversion":""}', '{"buscador":"completo","overlay":"claro"}', false),
  (142, true,  '{"enlacesInNav":true,"heroOverlayOpacity":0.4,"whatsappFrom":"sales"}', '{"segundaMano":"Comprar","inversion":""}', '{"buscador":"completo"}', false),
  -- 41: el WhatsApp de su v1 (675384838). Confirmar con la agencia antes.
  (41,  false, '{"whatsappFrom":"sales"}', '{}', NULL, false),
  (32,  false, '{}', '{"inversion":""}', NULL, false),
  (113, false, '{}', '{"inversion":""}', NULL, false),
  (146, false, '{}', '{"inversion":""}', NULL, false),
  (147, false, '{}', '{"inversion":""}', NULL, false)
), comun AS (SELECT
  '{"venderFormulario":"corto","logoSize":"medium","navOrder":["venta","alquiler","promociones","inversion","vender","servicios","nosotros","blog","contacto","enlaces"],
    "fichaTarjetaOficina":true,"fichaDireccion":true,"contactoCabecera":true,"respuesta24h":true,
    "tarjetaEtiquetaLarga":true,"buscadorCompra":true,"buscadorColorMarca":true,"buscadorNave":true,
    "redirigirRutasAntiguas":true,"headerTint":true,"footerTint":true,"navHomeAnchors":true,"navTextoNormal":true,"aspectoV1":true}'::jsonb AS features,
  '[{"id":"origen-bancario","kind":"static_link","title":"Origen bancario","subtitle":"Inmuebles procedentes de entidades financieras","href":"/venta-propiedades/origen-bancario","imageUrl":"https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80","position":0},{"id":"destacados","kind":"static_link","title":"Destacados","subtitle":"Una selección curada de los mejores inmuebles","href":"/venta-propiedades/destacados","imageUrl":"https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80","position":1},{"id":"oportunidad","kind":"static_link","title":"Oportunidad","subtitle":"Precios y condiciones por debajo de mercado","href":"/venta-propiedades/oportunidad","imageUrl":"https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1200&q=80","position":2}]' AS tarjetas
), nuevo AS (
  SELECT w.account_id,
    w.features_props AS features_antes,
    jsonb_set(
      coalesce(nullif(w.features_props, ''), '{}')::jsonb
        || CASE WHEN v1.con_web THEN c.features ELSE '{}' END || v1.extra::jsonb,
      '{menuLabels}',
      coalesce(nullif(w.features_props, '')::jsonb -> 'menuLabels', '{}') || v1.labels::jsonb
    )::text AS features_props,
    CASE WHEN v1.hero IS NULL THEN w.hero_props
      ELSE (coalesce(nullif(w.hero_props, ''), '{}')::jsonb || v1.hero::jsonb)::text END AS hero_props,
    CASE WHEN v1.tarjetas THEN c.tarjetas ELSE w.promo_cards_props END AS promo_cards_props
  FROM website_config w JOIN v1 USING (account_id) CROSS JOIN comun c
)
SELECT * FROM nuevo WHERE account_id = 21;
```

```sql
-- mismo WITH de arriba, y en vez del SELECT final:
UPDATE website_config w
SET features_props = n.features_props, hero_props = n.hero_props,
    promo_cards_props = n.promo_cards_props
FROM nuevo n WHERE w.account_id = n.account_id AND w.account_id = 21;
```

El `SELECT` en seco se probó el 14-nov con 21, 32, 122, 137 y 147 (solo
lectura): sale lo esperado; 122 conserva sus `menuLabels` y su velo, 137 sus
tarjetas y su título. Las claves del 17-nov no se han probado en seco.

Solo para tres cuentas, aparte:

```sql
-- 122: «Sé uno más de la familia» bajo la portada. Lo tiene encendido
-- (sections.socialFamily, 17-nov) y la v1 no lo pintaba. Anidado: el || de
-- arriba no llega, y así conserva sus socialFamilyPlatforms.
UPDATE website_config
SET features_props = jsonb_set(features_props::jsonb, '{sections,socialFamily}', 'false')::text
WHERE account_id = 122;

-- 137: su naranja (en la v1 estaba en código) como color de la cuenta
UPDATE website_config
SET color_props = '{"primaryColor":"#E85D00","secondaryColor":"#E85D00"}'
WHERE account_id = 137;

-- 142: que publique en su proyecto de siempre y no cree otro
-- (sin esto el nombre sale de accounts.name: «inversionesinmobiliariaselmitodelaatlantidasl»)
UPDATE website_config SET vercel_project = 'elmitoatlantida' WHERE account_id = 142;
```

A 14-nov: 137 tiene `color_props = {}`, 142 `vercel_project = null`, 122
`menuLabels = {"vender":"","alquilar":"","inversion":""}` (se conservan),
`enlacesInNav: false` y `heroOverlayOpacity: 0.6`. Ninguna tiene `buscador`,
`overlay`, `navOrder` ni `logoSize`. A 17-nov: 142 no tiene `enlacesInNav`
(la v1 lo enseña), y solo 122 tiene `defaultSort` (`date-desc`).

---

## 7. Antes de la primera

1. **El CRM tiene que conservar las claves nuevas** (frente B; leído el
   17-nov en `~/Desktop/vesta`, sin tocarlo). Hoy sobreviven casi siempre:
   el editor guarda `featuresProps` entero (`use-website-form.ts:551`,
   `getValues()` en `use-website-save.ts:69`) y el chat vuelve a poner lo
   que zod quita, solo en el primer nivel (`chat/secciones.ts:268-275`).
   `hero_props.buscador` ya está en el esquema y en la red. Falta:
   - `borrador-reglas.ts:236-239` `SIN_CONTROL_EN_EL_EDITOR.featuresProps`:
     añadir las 15 de §3. Sin eso, una pestaña del editor abierta antes del
     SQL, un script o una propuesta mandan `featuresProps` sin ellas y la web
     vuelve a la v2 en la siguiente publicación, sin un error.
   - `website-settings.ts` `featuresPropsSchema` (junto a `venderFormulario`,
     `:711`): las 14 `z.boolean().optional()` y
     `whatsappFrom: z.enum(["sales"]).optional()`, para que el chat las valide
     y el modelo las conozca.
   - `lo-que-se-ve.ts` `aspecto` / `sinLoQueNoSeVe` (`:29`, `:195`): con
     `footerTint`, pedir `footerBrand` no cambia el pie y debería deshacerse
     con su aviso; y el pie y la cabecera teñidos no están descritos.
2. **Merge de esta rama a `vestawebpage-v2` main** (su sí). El generador
   copia la plantilla de la carpeta desde la que corre: Railway tiene que
   estar en ese commit.
3. CRM, menor:
   - `src/lib/website-preview/nav-items.ts:154-160`: «Enlaces» dice
     `only: "v1"`; ahora la v2 también (`enlacesInNav`).
   - `src/types/website-settings.ts:690-696`: «enlacesInNav por defecto true,
     solo v1» y «serviciosLayout solo v1» ya no son verdad.
   - Icono «eye»: ya está en `scripts/gen-service-icons.mjs` y, a mano y
     igual, en `src/lib/service-icons.ts` de esta rama. Falta correr el
     generador para que el selector del CRM lo ofrezca y lo lleve la v1.
4. **La vista previa de «Mi web» pinta la web de cada agencia.** Web y vista
   previa pintan `components/portada.tsx`; antes de desplegar la plantilla,
   `scripts/comparar-vista-previa.ts` (cómo, en
   `scripts/generate-site/DEPLOYMENT.md`). Tras pasar una cuenta, su ✗ tiene
   que desaparecer.
5. **El guard del frente A** rechaza publicar encima del repo de una web
   que tiene commits que no están en la plantilla. Hoy le pasa a 137 (sus
   arreglos a mano del 5 y el 9-nov, que ya están en la v2: §1, referencia).
   Liberado el 19-nov: sus dos asuntos van en `TRAIDOS_CON_OTRO_ASUNTO`
   (`scripts/generate-site/github.ts`).

---

## 8. Por decidir y al pasar

- **/vender corto:** hecho y apagado; solo lo encienden las cinco con web.
  Si se prefiere quitar (0 leads en 180 días): `server/actions/vender-lead.ts`,
  `components/vender/vender-lead-form.tsx`,
  `templates/emails/agent-lead-notification.ts` y el `if` de
  `app/vender/page.tsx`.

### Al pasar cada cuenta

Nada de §3 se pierde: lo enciende el SQL de §6. A 14-nov ninguna de las cinco
tiene `use_agent_phone` ni cabecera en /contacto, así que con
`fichaTarjetaOficina` y `contactoCabecera` se ven como en la v1.

- **41:** confirmar con la agencia el número de WhatsApp antes de su SQL (§3).

---

## 9. Pasar una cuenta (una a una, con su sí para cada una)

1. **SQL de esa cuenta** (§6), en seco y luego de verdad.
2. **Capturas antes.** La v2 de la cuenta en local, contra producción (solo
   lee), comparada con la v1 publicada:

   ```bash
   cd ~/Desktop/vestawebpage-v2
   NEXT_PUBLIC_ACCOUNT_ID=137 pnpm build && NEXT_PUBLIC_ACCOUNT_ID=137 pnpm start -p 3002
   # en otra terminal:
   pnpm tsx scripts/comparar-v1-v2.ts --cuenta 137 \
     --v1 https://www.inmobiliariaanadiaz.es --v2 http://localhost:3002 --ref P008800
   ```

   Abre `comparar-v1-v2/137-<fecha>/index.html`: cada página en escritorio y
   móvil, v1 a la izquierda, v2 a la derecha. El navegador es headless: no
   suma visitas.
3. **Anotar el deployment actual** en Vercel (proyecto de
   `website_config.vercel_project`, Deployments, el de Production). Es la
   vuelta atrás.
4. **Publicar desde el CRM** como equipo de Vesta (la agencia no puede:
   `publicaPorSoporte`): impersonar → `/account-admin/website` → «Publicar
   cambios» → «Reconstruir».
   - Publicar ya no cobra créditos ni tiene tope semanal (lo quitó el
     frente B).
   - **Si el repo de la web tiene commits que no están en la plantilla, el
     generador lo rechaza** (guard del frente A). 137 ya no (§7).
   - Con proyecto sellado, el generador **sobrescribe con force-push el repo
     de GitHub** de la web: la historia v1 se pierde. `git clone` antes si se
     quiere guardar.
   - Al terminar sella `accounts.site_template = 'v2'` solo.
   - Sin web de Vesta (32, 41, 113, 132, 136, 146, 147): publicar crea la
     primera en `<proyecto>.vercel.app`; sus dominios propios no se tocan.
     Para que la agencia solo edite con la vista previa v2, sin publicar: el
     botón de plantilla junto a «Publicar cambios»
     (`setAccountSiteTemplateAction`, solo equipo).
5. **Capturas después**, `--v2 https://<su dominio>` y `--v1` al deployment
   viejo (`*.vercel.app` sigue vivo).
6. **Probar a mano:** buscar una referencia, enviar /vender y el contacto
   (llegan leads de verdad: avisar a la agencia o borrarlos), una ficha en el
   móvil.

### Vuelta atrás

Vercel → el proyecto → Deployments → el anotado en el paso 3 → «Instant
Rollback»: vuelve la v1 en segundos, mismo dominio. Luego, en el CRM, el botón
de plantilla a «v1» (el rollback no toca la base). El repo de GitHub se queda
con la v2: la siguiente publicación sería v2 otra vez.

### Cuando estén todas

Archivar `vestawebpage` y su preview (`docs/plan/web-por-chat.md` §4-§5 del
worktree `web-por-chat` del CRM).

---

## 10. Riesgos

- **El contador escribe desde todas las webs v2**: una fila por página y día
  en `web_page_views` (y `listing_web_views` en fichas). Descarta bots y
  headless, pero `registerPageView` es una server action pública: se pueden
  inflar las visitas de una agencia, igual que hoy en inmobiliariaanadiaz.
- **`resolveReferencePath` es pública.** Solo devuelve la ruta de un inmueble
  publicado de esa misma web (la cuenta sale de `NEXT_PUBLIC_ACCOUNT_ID`) y
  valida con zod. `submitVenderLead` también: honeypot y 5 por minuto e IP.
- **`locations-navegador`** sigue siendo pública (provincias y barrios con
  anuncios publicados), pero solo de la cuenta de la web. En la vista previa
  del CRM de otra cuenta, el primer pintado es de esa cuenta y lo que se pide
  al cambiar un filtro, de la web: hoy la vista previa no pinta el buscador.
- **Datos de hoy, no los de la v1.** Cada v1 enseña la base de su última
  generación (21: 28-jul, 122: 15-sep, 111: 28-sep, 137: 9-oct); la v2 lee la
  de hoy. Lo que la agencia cambió desde entonces sale al pasar (21, además,
  su `website_config` del 20-oct: §4).
- **`redirigirRutasAntiguas`:** una URL mal escrita deja de dar 404 y va a
  una búsqueda de venta (a veces vacía). Solo en las cinco.
- Pasan de ~400 líneas: `listing-card.tsx` (430), `property-search.tsx`
  (426), `footer.tsx` (402).
- Ficheros del frente A tocados (trozos pequeños, sin mover código):
  `app/layout.tsx`, `server/queries/website-config.ts`, `promo-cards.ts`,
  `banner.ts`. Del layout y la búsqueda también `app/page.tsx`,
  `[...slug]/page.tsx`, `components/hero.tsx`, `search-bar.tsx`,
  `property-search.tsx`, `property-search-wrapper.tsx`,
  `ui/two-level-location-select.tsx`; `server/actions/locations.ts` borrado.
