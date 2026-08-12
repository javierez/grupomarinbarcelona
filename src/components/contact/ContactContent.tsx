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
import { useMinimalHeaders } from "~/components/header-style-context";
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
}: ContactContentProps) {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    contactProps?.offices?.find((office) => office.isDefault)?.id ||
      contactProps?.offices?.[0]?.id ||
      "",
  );

  const selectedOffice = contactProps?.offices?.find(
    (office) => office.id === selectedOfficeId,
  );

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
  const minimal = useMinimalHeaders();
  // Account 139: tighter rhythm and no contact heading block at the very bottom.
  const tight = isAccount139();

  return (
    <section
      className={
        tight
          ? `container ${ACCOUNT_139_SECTION_PADDING}`
          : "container py-24 sm:py-28 lg:py-32"
      }
      id="contact"
    >
      {!tight && (
      <motion.div
        className="mb-16 flex flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeInUp}
      >
        {!minimal && (
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
          className="mb-6 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {title}
        </motion.h2>
        {!minimal && (
          <motion.p
            className="mx-auto max-w-2xl px-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
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
        className="grid gap-6 sm:gap-8 lg:grid-cols-2"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {messageForm && (
          <motion.div variants={staggerItem}>
            <ContactForm />
          </motion.div>
        )}

        <motion.div variants={staggerItem}>
          <Card className="border-border/60 shadow-none">
          <CardHeader className="space-y-3">
            <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              Oficina
            </span>
            <CardTitle className="text-2xl font-medium tracking-tight">Información de Contacto</CardTitle>
            <CardDescription className="text-base leading-relaxed">
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
              <div className="flex items-start">
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Dirección de la Oficina
                  </h4>
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
              <div className="flex items-start">
                <Phone className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">Teléfono</h4>
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
              <div className="flex items-start">
                <Mail className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Correo Electrónico
                  </h4>
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
              <div className="flex items-start">
                <Clock className="mr-2 h-4 w-4 flex-shrink-0 text-foreground/70 sm:mr-3 sm:h-5 sm:w-5" />
                <div>
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Horario de Atención
                  </h4>
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
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Instagram
                  </h4>
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
                  <h4 className="mb-1 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    LinkedIn
                  </h4>
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
            <CardFooter>
              {storedEmbedUrl ? (
                <iframe
                  src={storedEmbedUrl}
                  width="100%"
                  height="180"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación de la Oficina"
                  className="rounded-xl border border-border/60"
                />
              ) : officeAddress ? (
                <OfficeLocationMap address={officeAddress} />
              ) : null}
            </CardFooter>
          )}
        </Card>
        </motion.div>
      </motion.div>
    </section>
  );
}
