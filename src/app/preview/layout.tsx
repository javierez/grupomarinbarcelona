// Preview layout — strips chrome (the root layout's branch on `x-pathname`
// already drops Navbar/WhatsApp). This file ensures /preview/* is no-indexed.

export const metadata = {
  title: "Vesta · Vista previa",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
