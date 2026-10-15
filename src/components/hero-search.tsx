"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

const slugifyQuery = (raw: string) =>
  raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

interface HeroSearchProps {
  placeholder?: string;
}

export function HeroSearch({
  placeholder = "¿Dónde quieres vivir?",
}: HeroSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const slug = slugifyQuery(query);
    const target = slug
      ? `/venta-propiedades/${slug}`
      : "/venta-propiedades/todas-ubicaciones";
    router.push(target);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-xl items-center overflow-hidden rounded-full bg-white/15 pl-6 pr-1.5 backdrop-blur-md transition-colors focus-within:bg-white/25"
      role="search"
    >
      <Search className="h-5 w-5 flex-shrink-0 text-white/80" aria-hidden />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-14 flex-1 border-0 bg-transparent px-4 text-base text-white outline-none ring-0 placeholder:text-white/70 focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="my-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-foreground transition-colors hover:bg-white/90"
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  );
}
