"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Mail, Phone, MapPin, Clock, Instagram, Linkedin } from "lucide-react";
import { ContactForm } from "./ContactForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { ContactProps } from "~/server/queries/contact";
import { fadeInUp, staggerContainer, staggerItem } from "~/lib/animations";
import { OfficeLocationMap } from "./OfficeLocationMap";
import { useAspectoV1, useCuenta, useMinimalHeaders } from "~/components/header-style-context";
import {
  isAccount139,
  ACCOUNT_139_SECTION_PADDING,
} from "~/lib/account-overrides/139";

interface ContactContentProps {
  title: string;
  subtitle: string;
  messageForm: boolean;
  address: boolean;
  phone: boolean;
  mail: boolean;
  schedule: boolean;
  map: boolean;
  contactProps: ContactProps | null;
  /** Instagram / LinkedIn URLs surfaced on the contact card (all accounts). */
  instagramUrl?: string;
  linkedinUrl?: string;
  /** `features_props.respuesta24h`: «menos de 24 horas» after sending (v1). */
  respuesta24h?: boolean;
}

export function ContactContent({
  title,
  subtitle,
  messageForm,
  address,
  phone,
  mail,
  schedule,
  map,
  contactProps,
  instagramUrl,
  linkedinUrl,
  respuesta24h,
}: ContactContentProps) {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    contactProps?.offices?.find((office) => office.isDefault)?.id ||
      contactProps?.offices?.[0]?.id ||
      "",
  );

  const selectedOffice = contactProps?.offices?.find(
    (office) => office.id === selectedOfficeId,
  );
  // La oficina que se ve, para señalar su teléfono o su correo desde «Mi web».
  const oficina = contactProps?.offices?.findIndex((office) => office.id === selectedOfficeId);

  const officeAddress = selectedOffice?.address
    ? [
        selectedOffice.address.street,
        [selectedOffice.address.postalCode, selectedOffice.address.city]
          .filter(Boolean)
          .join(" "),
        selectedOffice.address.state,
        selectedOffice.address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : null;
  // Instagram handle (e.g. "@domusaurea") parsed from the profile URL.
  const instagramHandle = instagramUrl
    ? "@" + instagramUrl.replace(/\/+$/, "").split("/").pop()
    : null;
  const storedEmbedUrl = selectedOffice?.mapUrl?.includes("maps/embed")
    ? selectedOffice.mapUrl
    : null;
  const showMap = map && (storedEmbedUrl || officeAddress);
  // With address, phone, email, hours and map all switched off there is
  // nothing left to say in the office card, so the form stands alone.
  const showInfoCard = address || phone || mail || schedule || map;
  const minimal = useMinimalHeaders();
  // v1 look: small bold heading with no kicker, bold item labels, its padding.
  const cuenta = useCuenta();
  const v1 = useAspectoV1();
  const itemLabel = v1
    ? "text-sm font-medium sm:text-base"
    : "mb-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground";
  // Account 139: tighter rhythm and no contact heading block at the very bottom.
  const tight = isAccount139(cuenta);

  return (
    <section
      className={
        tight
          ? `container ${ACCOUNT_139_SECTION_PADDING}`
          : v1
            ? "container py-12 sm:py-16"
            : "container py-24 sm:py-28 lg:py-32"
      }
      id="contact"
      data-vesta="contacto"
    >
      {!tight && (
      <motion.div
        className={v1 ? "mb-8 flex flex-col items-center text-center sm:mb-12" : "mb-16 flex flex-col items-center text-center"}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeInUp}
      >
        {!minimal && !v1 && (
          <motion.span
            className="mb-5 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            Contacto
          </motion.span>
        )}
        <motion.h2
          data-vesta="contacto.titulo"
          className={v1 ? "mb-2 text-2xl font-bold sm:text-3xl" : "mb-6 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {title}
        </motion.h2>
        {!minimal && (
          <motion.p
            data-vesta="contacto.subtitulo"
            className={v1 ? "mx-auto max-w-2xl px-4 text-sm text-muted-foreground sm:text-base" : "mx-auto max-w-2xl px-4 text-base leading-relaxed text-muted-foreground sm:text-lg"}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
      )}

      <motion.div
        className={
          showInfoCard
            ? "grid gap-6 sm:gap-8 lg:grid-cols-2"
            : "mx-auto grid max-w-2xl gap-6 sm:gap-8"
        }
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {messageForm && (
          <motion.div variants={staggerItem} data-vesta="contacto.formulario">
            <ContactForm respuesta24h={respuesta24h} />
          </motion.div>
        )}

        {showInfoCard && (
        <motion.div variants={staggerItem}>
          <Card className={v1 ? undefined : "border-border/60 shadow-none"}>
          <CardHeader className={v1 ? undefined : "space-y-3"}>
            {!v1 && (
              <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                Oficina
              </span>
            )}
            <CardTitle className={v1 ? "font-semibold leading-none" : "text-2xl font-medium tracking-tight"}>Información de Contacto</CardTitle>
            <CardDescription className={v1 ? undefined : "text-base leading-relaxed"}>
              Comunícate con nosotros directamente o visita nuestra oficina.
            </CardDescription>

            {contactProps?.offices && contactProps.offices.length > 1 && (
              <div className="mt-4">
                <Select
                  value={selectedOfficeId}
                  onValueChange={setSelectedOfficeId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactProps.offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6">
            {address && selectedOffice?.address && (
              <div className="flex items-start" data-vesta="contacto.direccion" data-vesta-i={oficina}>
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <p className={itemLabel}>
                    Dirección de la Oficina
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(
                      `${selectedOffice.address.street}, ${selectedOffice.address.city}, ${selectedOffice.address.state}, ${selectedOffice.address.country}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm not-italic text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <address className="not-italic">
                      {selectedOffice.address.street}
                      <br />
                      {selectedOffice.address.postalCode
                        ? `${selectedOffice.address.postalCode} `
                        : ""}
                      {selectedOffice.address.city},{" "}
                      {selectedOffice.address.state}
                      <br />
                      {selectedOffice.address.country}
                    </address>
                  </a>
                </div>
              </div>
            )}

            {phone && selectedOffice?.phoneNumbers && (
              <div className="flex items-start" data-vesta="contacto.telefono" data-vesta-i={oficina}>
                <Phone className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <p className={itemLabel}>Teléfono</p>
                  <div className="text-sm text-muted-foreground">
                    <a
                      href={`tel:${selectedOffice.phoneNumbers.main}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {selectedOffice.phoneNumbers.sales
                        ? `Principal: ${selectedOffice.phoneNumbers.main}`
                        : selectedOffice.phoneNumbers.main}
                    </a>
                    {selectedOffice.phoneNumbers.sales && (
                      <>
                        <br />
                        <a
                          href={`tel:${selectedOffice.phoneNumbers.sales}`}
                          className="transition-colors hover:text-foreground"
                        >
                          Ventas: {selectedOffice.phoneNumbers.sales}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {mail && selectedOffice?.emailAddresses && (
              <div className="flex items-start" data-vesta="contacto.email" data-vesta-i={oficina}>
                <Mail className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <p className={itemLabel}>
                    Correo Electrónico
                  </p>
                  <div className="text-sm text-muted-foreground">
                    <a
                      href={`mailto:${selectedOffice.emailAddresses.info}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {selectedOffice.emailAddresses.info}
                    </a>
                    {selectedOffice.emailAddresses.sales && (
                      <>
                        <br />
                        <a
                          href={`mailto:${selectedOffice.emailAddresses.sales}`}
                          className="transition-colors hover:text-foreground"
                        >
                          {selectedOffice.emailAddresses.sales}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {schedule && selectedOffice?.scheduleInfo && (
              <div className="flex items-start" data-vesta="contacto.horario" data-vesta-i={oficina}>
                <Clock className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <p className={itemLabel}>
                    Horario de Atención
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOffice.scheduleInfo.weekdays}
                    <br />
                    {selectedOffice.scheduleInfo.saturday}
                    <br />
                    {selectedOffice.scheduleInfo.sunday}
                  </p>
                </div>
              </div>
            )}

            {instagramUrl && (
              <div className="flex items-start">
                <Instagram className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <p className={itemLabel}>
                    Instagram
                  </p>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {instagramHandle}
                  </a>
                </div>
              </div>
            )}

            {linkedinUrl && (
              <div className="flex items-start">
                <Linkedin className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <p className={itemLabel}>
                    LinkedIn
                  </p>
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Ver perfil
                  </a>
                </div>
              </div>
            )}
          </CardContent>

          {showMap && (
            <CardFooter data-vesta="contacto.mapa" data-vesta-i={oficina}>
              {storedEmbedUrl ? (
                <iframe
                  src={storedEmbedUrl}
                  width="100%"
                  height={v1 ? "150" : "180"}
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de la Oficina"
                  className={v1 ? "rounded-md" : "rounded-xl border border-border/60"}
                />
              ) : officeAddress ? (
                <OfficeLocationMap address={officeAddress} v1={v1} />
              ) : null}
            </CardFooter>
          )}
        </Card>
        </motion.div>
        )}
      </motion.div>
    </section>
  );
}
