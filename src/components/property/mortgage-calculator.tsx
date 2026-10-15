"use client";

import { useState } from "react";
import { monthlyMortgagePayment } from "~/lib/mortgage";

const num = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;

function Field({
  id,
  label,
  unit,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
      >
        {label}
      </label>
      <div className="flex h-11 items-center rounded-md border border-input bg-background px-4 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-foreground/30">
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-base focus:outline-none md:text-sm"
        />
        <span className="ml-2 text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

/** Cuota mensual orientativa. Sin impuestos: cambian por comunidad y comprador. */
export function MortgageCalculator({ price }: { price: number }) {
  const [savings, setSavings] = useState(
    Math.round(price * 0.2).toLocaleString("es-ES"),
  );
  const [years, setYears] = useState("30");
  const [rate, setRate] = useState("3,10");

  const principal = Math.max(0, price - num(savings));
  const payment = monthlyMortgagePayment(principal, num(rate), num(years));

  return (
    <div>
      <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Hipoteca
      </span>
      <h2 className="mb-5 text-2xl font-medium tracking-tight">
        ¿Cuánto pagarías al mes?
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
        <Field id="hipoteca-ahorro" label="Ahorro" unit="€" value={savings} onChange={setSavings} />
        <Field id="hipoteca-plazo" label="Plazo" unit="años" value={years} onChange={setYears} />
        <Field id="hipoteca-interes" label="Interés" unit="%" value={rate} onChange={setRate} />
        <div className="text-3xl font-medium tracking-tight text-foreground sm:text-right">
          {Math.round(payment).toLocaleString("es-ES")}€
          <span className="text-base font-normal text-muted-foreground">/mes</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Hipoteca de {Math.round(principal).toLocaleString("es-ES")} €. Cálculo
        orientativo.
      </p>
    </div>
  );
}
