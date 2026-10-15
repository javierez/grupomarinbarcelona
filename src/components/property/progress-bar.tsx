import { cn } from "~/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const steps = [
    { name: "Contacto y ubicación", description: "Tus datos y la dirección" },
    { name: "Datos y precio", description: "Tipo, superficie y precio" },
    { name: "Revisión", description: "Confirmar y enviar" },
  ];

  const percentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="flex h-1 overflow-hidden rounded-full bg-border/60">
          <div
            style={{ width: `${percentage}%` }}
            className="bg-foreground transition-all duration-500 ease-in-out"
          />
        </div>
      </div>

      <div className="hidden justify-between md:flex">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center text-center",
              index <= currentStep ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                index < currentStep
                  ? "bg-foreground text-background"
                  : index === currentStep
                    ? "border border-foreground text-foreground"
                    : "border border-border text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <div className="text-xs font-medium uppercase tracking-eyebrow">{step.name}</div>
            <div className="mt-1 hidden text-xs text-muted-foreground lg:block">{step.description}</div>
          </div>
        ))}
      </div>

      <div className="md:hidden">
        <div className="flex items-center">
          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
            {currentStep + 1}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-eyebrow text-foreground">
              {steps[currentStep]!.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {steps[currentStep]!.description}
            </div>
          </div>
          <div className="ml-auto text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            {currentStep + 1} / {totalSteps}
          </div>
        </div>
      </div>
    </div>
  );
}
