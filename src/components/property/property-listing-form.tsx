"use client";

import { useState } from "react";
import { ContactLocationStep } from "./form-steps/contact-location-step";
import { PropertyPriceStep } from "./form-steps/property-price-step";
import { ReviewStep } from "./form-steps/review-step";
import { ProgressBar } from "./progress-bar";
import { Button } from "~/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { PropertyFormData } from "~/types/property-form";
import Link from "next/link";
import { submitPropertyListing } from "~/server/actions/property-listing";

type SimplifiedStep = "contact-location" | "property-price" | "review";

const initialFormData: PropertyFormData = {
  contactInfo: {
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
  },
  locationInfo: {
    direccion: "",
    numero: "",
    planta: "",
    puerta: "",
    codigoPostal: "",
    localidad: "",
    provincia: "",
  },
  propertyInfo: {
    tipo: "piso",
    superficie: "",
    habitaciones: "",
    banos: "",
    descripcion: "",
    caracteristicas: [],
  },
  economicInfo: {
    precioVenta: "",
    precioAlquiler: "",
    gastosComunitarios: "",
    ibi: "",
  },
  images: [],
  acceptTerms: false,
  honeypot: "",
};

const steps: SimplifiedStep[] = [
  "contact-location",
  "property-price",
  "review",
];

export function PropertyListingForm() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const updateFormData = (stepData: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    switch (steps[currentStep]) {
      case "contact-location":
        if (!formData.contactInfo.nombre) {
          newErrors.nombre = "El nombre es obligatorio";
          isValid = false;
        }
        if (!formData.contactInfo.telefono) {
          newErrors.telefono = "El teléfono es obligatorio";
          isValid = false;
        }
        if (
          formData.contactInfo.email &&
          !/\S+@\S+\.\S+/.test(formData.contactInfo.email)
        ) {
          newErrors.email = "El email no es válido";
          isValid = false;
        }
        if (!formData.locationInfo.direccion) {
          newErrors.direccion = "La dirección es obligatoria";
          isValid = false;
        }
        if (!formData.locationInfo.codigoPostal) {
          newErrors.codigoPostal = "El código postal es obligatorio";
          isValid = false;
        }
        if (!formData.locationInfo.localidad) {
          newErrors.localidad = "La localidad es obligatoria";
          isValid = false;
        }
        break;

      case "property-price":
        if (!formData.propertyInfo.superficie) {
          newErrors.superficie = "La superficie es obligatoria";
          isValid = false;
        }
        if (!formData.economicInfo.precioVenta) {
          newErrors.precioVenta = "El precio es obligatorio";
          isValid = false;
        }
        break;

      case "review":
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = "Debe aceptar los términos y condiciones";
          isValid = false;
        }
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        void handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    try {
      const result = await submitPropertyListing(formData);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setErrors({
          submit:
            result.error ||
            "Ha ocurrido un error al enviar el formulario. Por favor, inténtelo de nuevo.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({
        submit:
          "Ha ocurrido un error al enviar el formulario. Por favor, inténtelo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (steps[currentStep]) {
      case "contact-location":
        return (
          <ContactLocationStep
            contactData={formData.contactInfo}
            locationData={formData.locationInfo}
            updateContact={(data) =>
              updateFormData({
                contactInfo: { ...formData.contactInfo, ...data },
              })
            }
            updateLocation={(data) =>
              updateFormData({
                locationInfo: { ...formData.locationInfo, ...data },
              })
            }
            errors={errors}
          />
        );
      case "property-price":
        return (
          <PropertyPriceStep
            propertyData={formData.propertyInfo}
            economicData={formData.economicInfo}
            updateProperty={(data) =>
              updateFormData({
                propertyInfo: { ...formData.propertyInfo, ...data },
              })
            }
            updateEconomic={(data) =>
              updateFormData({
                economicInfo: { ...formData.economicInfo, ...data },
              })
            }
            errors={errors}
          />
        );
      case "review":
        return (
          <ReviewStep
            data={formData}
            updateTerms={(acceptTerms) => updateFormData({ acceptTerms })}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <Card className="mt-12 rounded-2xl border-border/60 shadow-none">
        <CardContent className="px-8 py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-100 bg-green-50">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Confirmación
          </span>
          <h2 className="mb-4 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            ¡Solicitud enviada con éxito!
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base leading-relaxed text-muted-foreground">
            Hemos recibido tus datos. Nuestro equipo se pondrá en contacto
            contigo para completar la información y publicar tu inmueble.
          </p>
          <Button size="pill" asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <ProgressBar currentStep={currentStep} totalSteps={steps.length} />

      <Card className="mt-12 rounded-2xl border-border/60 shadow-none">
        <CardContent className="px-7 py-9 sm:px-9 sm:py-10">
          {errors.submit && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Honeypot — hidden from real users, bots auto-fill it */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="honeypot"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData.honeypot ?? ""}
              onChange={(e) => updateFormData({ honeypot: e.target.value })}
            />
          </div>

          {renderStep()}

          <div className="mt-12 flex items-center justify-between border-t border-border/60 pt-8">
            <Button
              variant="outline"
              size="pill"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="border-border/60 disabled:opacity-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <Button size="pill" onClick={handleNext} disabled={isSubmitting}>
              {currentStep === steps.length - 1 ? (
                isSubmitting ? (
                  "Enviando..."
                ) : (
                  "Enviar solicitud"
                )
              ) : (
                <>
                  Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
