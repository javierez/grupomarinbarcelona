import Image from "next/image";
import type { ContactProps } from "~/server/queries/contact";

interface ContactBrandBannerProps {
  contactProps: ContactProps | null;
  /** Account primary colour, used as the panel background. */
  brandColor: string;
  image: string;
}

/**
 * "Ven a vernos" panel of the editorial site style: the default office's
 * details on the brand colour beside a photo of the premises. Sits above the
 * regular contact form; rendered only when contact_props.image is set.
 */
export function ContactBrandBanner({
  contactProps,
  brandColor,
  image,
}: ContactBrandBannerProps) {
  const office =
    contactProps?.offices?.find((o) => o.isDefault) ??
    contactProps?.offices?.[0];
  if (!office) return null;

  const rows = [
    {
      label: "Dirección",
      value: [office.address?.street, office.address?.city]
        .filter(Boolean)
        .join(" · "),
    },
    { label: "Teléfono", value: office.phoneNumbers?.main ?? "" },
    {
      label: "Horario",
      value: [office.scheduleInfo?.weekdays, office.scheduleInfo?.saturday]
        .filter(Boolean)
        .join(" · "),
    },
  ].filter((row) => row.value);

  return (
    <div
      className="grid overflow-hidden text-white lg:grid-cols-2"
      style={{ backgroundColor: brandColor }}
    >
      <div className="px-6 py-14 sm:px-12 lg:py-20">
        <p className="text-xs font-medium uppercase tracking-eyebrow text-white/70">
          {office.name}
        </p>
        <h2 className="mt-3 text-4xl font-normal tracking-tight sm:text-5xl">
          Ven a vernos
        </h2>
        <dl className="mt-8 space-y-5">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs uppercase tracking-eyebrow text-white/60">
                {row.label}
              </dt>
              <dd className="mt-1 text-base">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="relative min-h-[18rem] lg:min-h-[26rem]">
        <Image
          src={image}
          alt={office.name}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
