// Hardcoded /reformas content for account 141 (Grupo Marín).
// Lives in code (not DB) so admin UI edits to website_config can't wipe it.
// Source: "REVISTA GENERICA — 6 julio 2026" (client magazine).
// Photos extracted from that magazine and uploaded to S3 under
// accounts/141/website/reformas/.

const S3 =
  "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/reformas";

/** Mobile line printed across the magazine. Used for tel: and WhatsApp. */
export const ACCOUNT_141_REFORMAS_PHONE = "663946837";
export const ACCOUNT_141_REFORMAS_PHONE_DISPLAY = "663 946 837";

export const ACCOUNT_141_REFORMAS_HERO = {
  eyebrow: "Reformas",
  title: "Reforma a tu medida y a tu presupuesto",
  subtitle:
    "Reformas integrales, cocinas y baños en Barcelona y el Maresme. Del proyecto a la limpieza final, lo hacemos todo nosotros.",
  // Staggered collage — "después" shots, shown at close to native resolution.
  collage: [
    { src: `${S3}/integral-salon-despues.jpg`, alt: "Salón reformado por Grupo Marín" },
    { src: `${S3}/integral-bano-despues.jpg`, alt: "Baño reformado por Grupo Marín" },
    { src: `${S3}/integral-cocina-despues.jpg`, alt: "Cocina reformada por Grupo Marín" },
  ],
  // Facts and scale — deliberately a different *kind* of claim from the
  // promises in ACCOUNT_141_REFORMAS_COMMITMENTS, so the two sections don't
  // say the same thing twice.
  stats: [
    { value: "35", label: "años de experiencia" },
    { value: "4", label: "tiendas en Barcelona y el Maresme" },
    { value: "8", label: "semanas para una reforma integral" },
  ],
} as const;

export type ReformaBeforeAfter = {
  label: string;
  antes: string;
  despues: string;
};

export type ReformaService = {
  id: "integral" | "cocinas" | "banos";
  /** Card + modal title. */
  title: string;
  /** Short hook on the card. */
  tagline: string;
  /** "Desde" headline price shown on the card and in the modal. */
  priceFrom: string;
  /** Delivery / guarantee promise badge. */
  timing: string;
  /** Which icon fits the badge — a deadline vs. a guarantee. */
  badgeIcon: "clock" | "shield";
  /** Card image (a "después" shot). */
  image: string;
  imageAlt: string;
  /** Opening paragraph inside the modal. */
  intro: string;
  beforeAfter: ReformaBeforeAfter[];
  /** "Qué incluye" checklist. */
  includes: readonly string[];
  /** Optional numbered process shown inside the modal. */
  steps?: readonly string[];
  /** Heading for the process band. */
  stepsTitle?: string;
  /** Deadline claim shown beside the process heading. */
  stepsNote?: string;
  /** Optional quality levels (names only — prices stay in the presupuesto). */
  levels?: readonly { name: string; description: string }[];
  /** Optional highlighted sub-offer inside the modal. */
  highlight?: {
    title: string;
    description: string;
    priceFrom: string;
    timing: string;
    beforeAfter: ReformaBeforeAfter;
  };
};

export const ACCOUNT_141_REFORMAS_SERVICES: readonly ReformaService[] = [
  {
    id: "integral",
    title: "Reforma integral",
    tagline: "Del sueño al plano. Tu hogar entero, de principio a fin.",
    priceFrom: "Desde 490 €/m²",
    timing: "En 8 semanas",
    badgeIcon: "clock",
    image: `${S3}/integral-salon-despues.jpg`,
    imageAlt: "Salón diáfano tras una reforma integral de Grupo Marín",
    intro:
      "Tu hogar empieza con una idea única y la convertimos en un diseño personalizado. Nos ocupamos de todo — proyecto, licencias, obra y limpieza final — con un único interlocutor y un presupuesto cerrado desde el primer día.",
    beforeAfter: [
      {
        label: "Baño",
        antes: `${S3}/integral-bano-antes.jpg`,
        despues: `${S3}/integral-bano-despues.jpg`,
      },
      {
        label: "Salón",
        antes: `${S3}/integral-salon-antes.jpg`,
        despues: `${S3}/integral-salon-despues.jpg`,
      },
      {
        label: "Cocina",
        antes: `${S3}/integral-cocina-antes.jpg`,
        despues: `${S3}/integral-cocina-despues.jpg`,
      },
    ],
    stepsTitle: "10 pasos para tu reforma integral",
    stepsNote: "En tan solo 8 semanas",
    steps: [
      "Elaboración de presupuesto y propuesta de distribución",
      "Derribo y replanteo de regatas",
      "Instalaciones eléctricas y fontanería",
      "Construcción de tabiquería",
      "Revestimiento de suelo y paredes",
      "Carpintería de madera, aluminio y climatización",
      "Pintura",
      "Mobiliario de cocina y sanitarios",
      "Remates y mecanismos",
      "Limpieza general",
    ],
    levels: [
      {
        name: "Low Cost",
        description:
          "Una reforma accesible. Perfecta funcionalidad con marcas más económicas.",
      },
      {
        name: "Confort",
        description:
          "Pensado para tu confort diario, con soluciones prácticas y funcionales.",
      },
      {
        name: "Alto Standing",
        description:
          "Diseño y acabados de alto standing para una vivienda que marca estilo.",
      },
    ],
    includes: [
      "Proyecto y renderizado con vista 3D",
      "Gestión de licencias y tramitaciones",
      "Presupuesto cerrado, sin imprevistos",
      "Pagos a medida que avanza la obra",
      "Garantía de materiales y mano de obra",
      "Certificado de legalización de obra y eficiencia energética",
    ],
  },
  {
    id: "cocinas",
    title: "Cocinas",
    tagline: "El corazón del hogar. Tu cocina, tu estilo.",
    priceFrom: "Desde 8.900 €",
    timing: "Presupuesto cerrado",
    badgeIcon: "shield",
    image: `${S3}/cocina-despues.jpg`,
    imageAlt: "Cocina blanca reformada por Grupo Marín",
    intro:
      "No es solo una cocina. Rediseñamos la distribución, la iluminación y el almacenaje para que ganes espacio real, y te asesoramos en la compra de materiales para que cada euro rinda más.",
    beforeAfter: [
      {
        label: "Cocina",
        antes: `${S3}/cocina-antes.jpg`,
        despues: `${S3}/cocina-despues.jpg`,
      },
    ],
    // Not in the magazine (it only prints the 10 pasos for la reforma
    // integral). Derived from that sequence, restricted to lo que toca una
    // cocina, so the three modals read as one method.
    stepsTitle: "10 pasos para tu cocina nueva",
    stepsNote: "Con presupuesto cerrado",
    steps: [
      "Toma de medidas y elaboración de presupuesto",
      "Propuesta de distribución y proyecto 3D",
      "Elección de materiales, encimera y electrodomésticos",
      "Desmontaje del mobiliario y retirada de escombros",
      "Replanteo de regatas",
      "Instalaciones eléctricas y fontanería",
      "Alicatado, pavimento y pintura",
      "Montaje del mobiliario y la encimera",
      "Instalación de electrodomésticos, grifería y campana",
      "Remates, mecanismos y limpieza general",
    ],
    levels: [
      {
        name: "Low Cost",
        description:
          "Una reforma accesible. Perfecta funcionalidad con marcas más económicas.",
      },
      {
        name: "Confort",
        description:
          "Pensado para tu confort diario, con soluciones prácticas y funcionales.",
      },
      {
        name: "Alto Standing",
        description:
          "Diseño y acabados de alto standing para una cocina que marca estilo.",
      },
    ],
    includes: [
      "Mobiliario, encimera y frentes a medida",
      "Electrodomésticos integrados",
      "Fontanería y electricidad renovadas",
      "Alicatado, pavimento e iluminación",
      "Asesoría en la compra de materiales",
      "Proyecto 3D antes de empezar",
    ],
  },
  {
    id: "banos",
    title: "Baños",
    tagline: "Tu baño renovado en solo 7 días.",
    priceFrom: "Desde 5.900 €",
    timing: "En 7 días",
    badgeIcon: "clock",
    image: `${S3}/bano-despues.jpg`,
    imageAlt: "Baño reformado con mueble de madera y ducha de obra",
    intro:
      "Transformamos tu baño en tiempo récord. Un equipo propio, un calendario cerrado y una sola visita de obra: entras el lunes con un baño antiguo y el viernes siguiente lo estrenas.",
    beforeAfter: [
      {
        label: "Baño",
        antes: `${S3}/bano-antes.jpg`,
        despues: `${S3}/bano-despues.jpg`,
      },
    ],
    // Same origin as the cocinas steps: derived from the integral list, not
    // printed in the magazine. Fits the 7-day promise on the card.
    stepsTitle: "10 pasos para tu baño nuevo",
    stepsNote: "En tan solo 7 días",
    steps: [
      "Toma de medidas y elaboración de presupuesto",
      "Propuesta de distribución y proyecto 3D",
      "Elección de sanitarios, grifería y acabados",
      "Desmontaje de sanitarios y retirada de escombros",
      "Replanteo de regatas",
      "Instalaciones eléctricas y fontanería",
      "Impermeabilización y formación del plato de ducha",
      "Alicatado, pavimento y pintura",
      "Montaje de sanitarios, mueble, grifería y mampara",
      "Remates, mecanismos y limpieza general",
    ],
    includes: [
      "Sanitarios, mueble y grifería nuevos",
      "Plato de ducha o bañera a tu elección",
      "Alicatado y pavimento completos",
      "Fontanería y electricidad renovadas",
      "Mampara e iluminación",
      "Garantía de materiales y mano de obra",
    ],
    highlight: {
      title: "Sustituye tu bañera por un plato de ducha",
      description:
        "Sin obra interminable ni polvo por toda la casa. Rápido, limpio y sin complicaciones.",
      priceFrom: "Desde 1.900 €",
      timing: "En solo 2 días",
      beforeAfter: {
        label: "Bañera por ducha",
        antes: `${S3}/ducha-antes.jpg`,
        despues: `${S3}/ducha-despues.jpg`,
      },
    },
  },
] as const;

/** Secondary services — listed, no modal. */
export const ACCOUNT_141_REFORMAS_EXTRAS = {
  title: "Otros servicios",
  subtitle:
    "Trabajos puntuales que también resolvemos con el mismo presupuesto cerrado.",
  items: [
    {
      title: "Impermeabilización de terrazas",
      description:
        "Materiales de alta calidad para una protección duradera contra filtraciones y humedad. No es solo evitar goteras.",
      image: `${S3}/impermeabilizacion.jpg`,
      imageAlt: "Operario impermeabilizando una terraza",
    },
    {
      title: "Tarimas de madera y pérgolas",
      description:
        "Pérgolas y tarimas que combinan funcionalidad, confort y belleza. No es solo un cambio, es crear ambiente.",
      image: `${S3}/tarimas.jpg`,
      imageAlt: "Porche con pérgola y tarima de madera",
    },
    {
      title: "Placas solares",
      description:
        "Diseño e instalación de sistemas fotovoltaicos para hogares y empresas. Ahorra, cuida el planeta y produce tu propia energía.",
      image: `${S3}/placas-solares.jpg`,
      imageAlt: "Vivienda unifamiliar con placas solares en la cubierta",
    },
  ],
} as const;

/**
 * "Lo que nos diferencia — REFORMAS", the full list from the magazine, grouped
 * so ten claims read as three short lists instead of one wall.
 */
export const ACCOUNT_141_REFORMAS_COMMITMENTS = {
  title: "Nuestro compromiso",
  subtitle: "Lo que nos diferencia de la competencia.",
  groups: [
    {
      title: "Precio",
      items: [
        "Mejoramos cualquier presupuesto de la competencia",
        "Presupuesto cerrado, sin sorpresas ni imprevistos",
        "Financiamos tu reforma: cómodos plazos cada mes, sin entrada inicial",
        "Adaptamos la reforma a lo que te quieras gastar",
        "Realiza los pagos a medida que ves avanzar la obra",
      ],
    },
    {
      title: "Plazo",
      items: [
        "Te descontamos 80 € al día si no cumplimos el plazo pactado",
        "Empieza ya tu reforma, sin esperas",
      ],
    },
    {
      title: "Confianza",
      items: [
        "Obtén tu proyecto 3D antes de empezar",
        "Garantía de materiales y mano de obra",
        "Visita nuestra exposición de reformas piloto",
      ],
    },
  ],
} as const;

export const ACCOUNT_141_REFORMAS_CTA = {
  title: "¿Hacemos un presupuesto sin compromiso?",
  subtitle:
    "Te visitamos, medimos y te damos un precio cerrado. Sin coste y sin compromiso.",
} as const;
