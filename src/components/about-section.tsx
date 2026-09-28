import { env } from "~/env";
import { getAboutProps } from "../server/queries/about";
import { AboutHeader } from "./about/AboutHeader";
import { ServicesGrid } from "./about/ServicesGrid";
import { MissionSection } from "./about/MissionSection";
import { KpiSection } from "./about/KpiSection";
import { AboutButton } from "./about/AboutButton";
import { YouTubeEmbed } from "./ui/youtube-embed";
import { RichAboutText } from "./about/RichAboutText";
import { Card, CardContent } from "~/components/ui/card";
import { getFeaturesProps } from "~/server/queries/website-config";
import { cn } from "~/lib/utils";
import {
  isAccount139,
  ACCOUNT_139_SECTION_PADDING,
} from "~/lib/account-overrides/139";

export async function AboutSection({ accountId }: { accountId?: bigint } = {}) {
  const aboutProps = await getAboutProps(accountId);
  const descriptionAlign = (await getFeaturesProps(accountId)).descriptionAlign;

  // Fallbacks in case data is missing
  const title = aboutProps?.title || "Sobre Nosotros";
  const subtitle =
    aboutProps?.subtitle ||
    "Tu socio de confianza en el viaje inmobiliario";
  const content =
    aboutProps?.content ||
    "Creemos que encontrar la propiedad perfecta debe ser una experiencia emocionante y gratificante. Con años de experiencia en la industria, nuestro dedicado equipo de profesionales está comprometido a proporcionar un servicio y orientación excepcionales a lo largo de tu viaje inmobiliario.";
  // Optional full-width block rendered below the about grid (empty = hidden).
  const content2 = aboutProps?.content2 ?? "";
  const services = aboutProps?.services || [
    { title: "Conocimiento local experto", icon: "map" },
    { title: "Servicio personalizado", icon: "user" },
    { title: "Comunicación transparente", icon: "message-square" },
    { title: "Experiencia en negociación", icon: "handshake" },
    { title: "Marketing integral", icon: "megaphone" },
    { title: "Soporte continuo", icon: "help-circle" },
  ];

  // Prepare KPI data
  const kpis = [];
  if (aboutProps?.kpi1Name && aboutProps?.kpi1Data)
    kpis.push({ name: aboutProps.kpi1Name, data: aboutProps.kpi1Data });
  if (aboutProps?.kpi2Name && aboutProps?.kpi2Data)
    kpis.push({ name: aboutProps.kpi2Name, data: aboutProps.kpi2Data });
  if (aboutProps?.kpi3Name && aboutProps?.kpi3Data)
    kpis.push({ name: aboutProps.kpi3Name, data: aboutProps.kpi3Data });
  if (aboutProps?.kpi4Name && aboutProps?.kpi4Data)
    kpis.push({ name: aboutProps.kpi4Name, data: aboutProps.kpi4Data });

  const tight = isAccount139();

  return (
    <section
      className={tight ? ACCOUNT_139_SECTION_PADDING : "py-24 sm:py-28 lg:py-32"}
      id="about"
    >
      <div className="container">
        <AboutHeader title={title} subtitle={subtitle} />

        <div className="grid items-start gap-8 sm:gap-12 lg:grid-cols-2">
          {env.NEXT_PUBLIC_ACCOUNT_ID === "129" ? (
            <YouTubeEmbed videoId="-Q34xHrPcB4" title="Conócenos" />
          ) : (
            <ServicesGrid
              services={services}
              title={aboutProps?.servicesSectionTitle || "Nuestros Servicios"}
              maxServicesDisplayed={aboutProps?.maxServicesDisplayed || 6}
            />
          )}

          <MissionSection
            title={aboutProps?.aboutSectionTitle || "Nuestra Misión"}
            content={content}
          />
        </div>

        {content2 && (
          <Card className={cn("border-border/60", tight ? "mt-6 sm:mt-8" : "mt-10 sm:mt-14")}>
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <RichAboutText text={content2} align={descriptionAlign} />
            </CardContent>
          </Card>
        )}

        <AboutButton
          text={aboutProps?.buttonName || "Contacta a Nuestro Equipo"}
          href="#contact"
        />

        {aboutProps?.showKPI && <KpiSection kpis={kpis} />}
      </div>
    </section>
  );
}
