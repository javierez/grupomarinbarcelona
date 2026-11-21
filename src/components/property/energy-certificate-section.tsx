interface EnergyCertificateSectionProps {
  energyConsumptionScale?: string | null;
  energyConsumptionValue?: string | null;
  emissionsScale?: string | null;
  emissionsValue?: string | null;
  propertyType?: string | null;
  /** `features_props.aspectoV1`: v1's bold titles, no kicker. */
  v1?: boolean;
}

function getEnergyCertificationColor(cert: string | null | undefined) {
  if (!cert) return "bg-gray-300";

  switch (cert) {
    case "A":
      return "bg-green-500";
    case "B":
      return "bg-green-400";
    case "C":
      return "bg-yellow-400";
    case "D":
      return "bg-yellow-500";
    case "E":
      return "bg-orange-400";
    case "F":
      return "bg-orange-500";
    case "G":
      return "bg-red-500";
    default:
      return "bg-gray-300";
  }
}

const ARROW_WIDTHS: Record<string, string> = {
  A: "w-20",
  B: "w-24",
  C: "w-28",
  D: "w-32",
  E: "w-36",
  F: "w-40",
  G: "w-44",
};

/** v1's arrows: taller and wider. */
const ARROW_WIDTHS_V1: Record<string, string> = {
  A: "w-32",
  B: "w-36",
  C: "w-40",
  D: "w-44",
  E: "w-48",
  F: "w-52",
  G: "w-56",
};

const RATINGS = ["A", "B", "C", "D", "E", "F", "G"] as const;

export function EnergyCertificateSection({
  energyConsumptionScale,
  energyConsumptionValue,
  emissionsScale,
  emissionsValue,
  propertyType,
  v1 = false,
}: EnergyCertificateSectionProps) {
  const anchos = v1 ? ARROW_WIDTHS_V1 : ARROW_WIDTHS;
  const caja = v1 ? "rounded-lg border bg-white p-4" : "rounded-xl border border-border/60 bg-card p-4";
  const flecha = v1 ? "h-8 text-sm" : "h-6 text-xs";
  const subtitulo = v1
    ? "text-center text-lg font-semibold"
    : "text-center text-xs font-medium uppercase tracking-eyebrow text-muted-foreground";
  if (propertyType === "solar" || propertyType === "garaje") {
    return null;
  }

  const hasScale = energyConsumptionScale || emissionsScale;

  return (
    <div>
      {v1 ? (
        <h2 className="mb-6 text-2xl font-bold">Certificación Energética</h2>
      ) : (
        <>
          <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Certificación
          </span>
          <h2 className="mb-6 text-xl font-medium tracking-tight text-foreground">
            Eficiencia Energética
          </h2>
        </>
      )}
      {hasScale ? (
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${v1 ? "gap-8" : "gap-6"}`}>
          {/* Energy Consumption Scale */}
          <div className="space-y-4">
            <h3 className={subtitulo}>
              Eficiencia de Consumo
            </h3>
            <div className={caja}>
              <div className={v1 ? "space-y-1" : "space-y-0.5"}>
                {RATINGS.map((rating) => {
                  const isCurrentRating =
                    energyConsumptionScale?.toUpperCase() === rating;
                  const backgroundColor =
                    getEnergyCertificationColor(rating);
                  const arrowWidth = anchos[rating] ?? "w-40";

                  return (
                    <div key={rating} className="relative flex">
                      <div
                        className={`flex items-center justify-start px-3 font-bold ${flecha} ${
                          isCurrentRating
                            ? `${backgroundColor} text-white ring-2 ring-blue-500 ring-offset-2`
                            : "bg-gray-200 text-gray-600"
                        } ${rating === "A" ? "rounded-tl-lg" : ""} ${rating === "G" ? "rounded-bl-lg" : ""} ${arrowWidth}`}
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                        }}
                      >
                        <span>
                          {rating}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {!!energyConsumptionValue && (
              <div className="text-center">
                <p className="text-sm font-medium">
                  Consumo: {energyConsumptionValue} kWh/m²
                  año
                </p>
              </div>
            )}
          </div>

          {/* Energy Emissions Scale */}
          <div className="space-y-4">
            <h3 className={subtitulo}>
              Eficiencia de Emisiones
            </h3>
            <div className={caja}>
              <div className={v1 ? "space-y-1" : "space-y-0.5"}>
                {RATINGS.map((rating) => {
                  const isCurrentRating =
                    emissionsScale?.toUpperCase() === rating;
                  const backgroundColor =
                    getEnergyCertificationColor(rating);
                  const arrowWidth = anchos[rating] ?? "w-40";

                  return (
                    <div key={rating} className="relative flex">
                      <div
                        className={`flex items-center justify-start px-3 font-bold ${flecha} ${
                          isCurrentRating
                            ? `${backgroundColor} text-white ring-2 ring-blue-500 ring-offset-2`
                            : "bg-gray-200 text-gray-600"
                        } ${rating === "A" ? "rounded-tl-lg" : ""} ${rating === "G" ? "rounded-bl-lg" : ""} ${arrowWidth}`}
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                        }}
                      >
                        <span>
                          {rating}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {!!emissionsValue && (
              <div className="text-center">
                <p className="text-sm font-medium">
                  Emisiones: {emissionsValue} kg CO₂/m² año
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${v1 ? "gap-8" : "gap-6"}`}>
          {/* Energy Consumption Scale - No color */}
          <div className="space-y-4">
            <h3 className={subtitulo}>
              Eficiencia de Consumo
            </h3>
            <div className={caja}>
              <div className={v1 ? "space-y-1" : "space-y-0.5"}>
                {RATINGS.map((rating) => {
                  const arrowWidth = anchos[rating] ?? "w-40";

                  return (
                    <div key={rating} className="relative flex">
                      <div
                        className={`flex items-center justify-start bg-gray-300 px-3 font-bold ${flecha} ${rating === "A" ? "rounded-tl-lg" : ""} ${rating === "G" ? "rounded-bl-lg" : ""} ${arrowWidth}`}
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                        }}
                      >
                        <span className="text-gray-700">
                          {rating}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                En trámite
              </p>
            </div>
          </div>

          {/* Energy Emissions Scale - No color */}
          <div className="space-y-4">
            <h3 className={subtitulo}>
              Eficiencia de Emisiones
            </h3>
            <div className={caja}>
              <div className={v1 ? "space-y-1" : "space-y-0.5"}>
                {RATINGS.map((rating) => {
                  const arrowWidth = anchos[rating] ?? "w-40";

                  return (
                    <div key={rating} className="relative flex">
                      <div
                        className={`flex items-center justify-start bg-gray-300 px-3 font-bold ${flecha} ${rating === "A" ? "rounded-tl-lg" : ""} ${rating === "G" ? "rounded-bl-lg" : ""} ${arrowWidth}`}
                        style={{
                          clipPath:
                            "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)",
                        }}
                      >
                        <span className="text-gray-700">
                          {rating}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                En trámite
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
