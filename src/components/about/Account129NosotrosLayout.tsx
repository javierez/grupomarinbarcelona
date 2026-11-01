import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE =
  "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/nosotros/hero.png";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
      {children}
    </span>
  );
}

export function Account129NosotrosLayout() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero image */}
      <section className="relative pt-20">
        <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-foreground">
          <Image
            src={HERO_IMAGE}
            alt="Conócenos"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex items-end pb-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <span className="mb-4 block text-xs font-medium uppercase tracking-eyebrow text-white/80">
                Nosotros
              </span>
              <h1 className="max-w-4xl text-5xl font-medium leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
                Conócenos un poco más
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial column */}
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="space-y-14 text-base leading-relaxed text-foreground/80 sm:text-lg">
          <p>
            Fundada con una sólida experiencia en promoción y construcción, somos una
            empresa inmobiliaria cuyo origen radica en la comercialización de inmuebles
            propios. Hemos evolucionado para convertirnos en una firma de referencia en
            el mercado inmobiliario español, ofreciendo una gama completa de servicios
            adaptados a las necesidades de nuestros clientes.
          </p>

          <div>
            <SectionLabel>Valores Fundamentales</SectionLabel>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Honestidad, integridad y compromiso
            </h2>
          </div>
          <p>
            Nos guiamos por principios sólidos de honestidad, integridad y compromiso.
            Creemos en establecer relaciones auténticas y duraderas con nuestros
            clientes, actuando como una verdadera extensión de sus intereses. Nuestra
            misión es proporcionar un servicio transparente y personalizado, que supere
            las expectativas en cada interacción.
          </p>

          <div>
            <SectionLabel>Proceso de Trabajo</SectionLabel>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Profesionalismo y eficacia en cada paso
            </h2>
          </div>
          <p>
            Nuestro proceso de trabajo se distingue por su profesionalismo y eficacia.
            Utilizamos herramientas de marketing digital de última generación para
            maximizar la visibilidad de las propiedades que gestionamos, alcanzando más
            de 20 millones de visitas mensuales en nuestras plataformas. Esto nos
            permite una comercialización rápida y efectiva. Desde el primer contacto
            hasta la firma final del contrato, ofrecemos un acompañamiento cercano,
            brindando asesoramiento experto y personalizado en cada etapa del proceso.
          </p>

          <div>
            <SectionLabel>Cobertura Nacional</SectionLabel>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Operamos en toda España
            </h2>
          </div>
          <p>
            Operamos en toda España, ofreciendo nuestra experiencia y servicios en
            cualquier punto del país con la misma dedicación y compromiso. Nuestro
            equipo de marketing y ventas está preparado para desplazarse rápidamente,
            garantizando una respuesta eficiente en menos de 24 horas, y asegurando que
            las propiedades de nuestros clientes reciban la atención necesaria para una
            comercialización exitosa.
          </p>

          <div>
            <SectionLabel>La familia</SectionLabel>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Un equipo joven y altamente cualificado
            </h2>
          </div>
          <p>
            Esta familia está compuesta por profesionales jóvenes y altamente
            cualificados, con especializaciones que abarcan desde la administración
            hasta el marketing digital, redes sociales y valoraciones técnicas. Cada
            miembro de nuestro equipo aporta una valiosa combinación de habilidades y
            experiencia, lo que nos permite evaluar propiedades de manera integral,
            considerando tanto aspectos técnicos como económicos.
          </p>

          <div>
            <SectionLabel>Compromiso con la Excelencia</SectionLabel>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              La calidad como estándar
            </h2>
          </div>
          <p>
            Nos esforzamos por mantener los más altos estándares de calidad en todos
            nuestros servicios. Estamos dedicados a la innovación continua, adaptándonos
            a las tendencias del mercado para ofrecer soluciones inmobiliarias
            vanguardistas. Nuestro objetivo es ser la primera opción de nuestros
            clientes en cualquier necesidad inmobiliaria, construyendo una reputación
            basada en la confianza y la excelencia.
          </p>

          <div className="pt-6 text-center">
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium uppercase tracking-eyebrow text-background transition-colors hover:bg-foreground/90"
            >
              Contactar
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
