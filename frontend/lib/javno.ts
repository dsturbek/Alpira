import { OSNOVICA, OSNOVICA_POSLUZITELJA } from "./osnovica";

function osnovica(): string {
  return typeof window === "undefined" ? OSNOVICA_POSLUZITELJA : OSNOVICA;
}

export type Tezina = "lagana" | "srednja" | "zahtjevna";

export type Ruta = {
  id: number;
  naziv: string;
  opis: string | null;
  tezina: Tezina;
};

export type Termin = {
  id: number;
  datum: string;
  kapacitet: number;
  status: "najavljen" | "zavrsen" | "otkazan";
  je_privatan: boolean;
  ruta: { id: number; naziv: string; tezina: Tezina };
  vodic: { id: number; ime: string; bio: string | null; certifikati: string | null };
  popunjenost: { potvrdenih: number; kapacitet: number };
};

export async function dohvatiJavno<T>(putanja: string): Promise<T> {
  const odgovor = await fetch(`${osnovica()}${putanja}`, {

    cache: "no-store",
  });

  if (!odgovor.ok) {
    throw new Error(`Backend je odgovorio ${odgovor.status}`);
  }

  return (await odgovor.json()) as T;
}

export type Recenzija = {
  id: number;
  ocjena: number;
  komentar: string | null;
  korisnik: { id: number; ime: string };
};

export type Organizator = {
  korisnik_id: number;

  ime?: string;
  bio: string | null;
  certifikati: string | null;
};

export async function dohvatiJavnoIliNull<T>(putanja: string): Promise<T | null> {
  const odgovor = await fetch(`${osnovica()}${putanja}`, { cache: "no-store" });

  if (odgovor.status === 404 || odgovor.status === 400) return null;
  if (!odgovor.ok) throw new Error(`Backend je odgovorio ${odgovor.status}`);

  return (await odgovor.json()) as T;
}

export function upit(filtri: Record<string, string | undefined>): string {
  const par = new URLSearchParams();

  for (const [kljuc, vrijednost] of Object.entries(filtri)) {
    if (vrijednost) par.set(kljuc, vrijednost);
  }

  const niz = par.toString();
  return niz ? `?${niz}` : "";
}
