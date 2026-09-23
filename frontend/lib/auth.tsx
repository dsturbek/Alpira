"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { napraviKlijent, type Klijent } from "./klijent";
import { OSNOVICA } from "./osnovica";

export type Uloga = "Sudionik" | "Vodic" | "Admin";

export type IshodPrijave =
  | { trebaMfa: false }
  | { trebaMfa: true; prijelazniToken: string };

export type Identitet = {
  id: number;
  uloga: Uloga;
  email_verificiran: boolean;
};

type Stanje = {
  klijent: Klijent;
  korisnik: Identitet | null;

  ucitava: boolean;
  prijaviSe: (email: string, lozinka: string) => Promise<IshodPrijave>;
  dovrsiMfa: (prijelazniToken: string, kod: string) => Promise<void>;
  prijaviGoogleom: (kod: string) => Promise<IshodPrijave>;
  odjaviSe: () => Promise<void>;
  osvjeziIdentitet: () => Promise<void>;
};

const Kontekst = createContext<Stanje | null>(null);

export function PruzateljIdentiteta({ children }: { children: ReactNode }) {
  const [korisnik, postaviKorisnika] = useState<Identitet | null>(null);
  const [ucitava, postaviUcitava] = useState(true);

  const klijentRef = useRef<Klijent | null>(null);
  klijentRef.current ??= napraviKlijent({
    osnovica: OSNOVICA,
    naOdjavu: () => postaviKorisnika(null),
  });
  const klijent = klijentRef.current;

  async function dohvatiIdentitet(): Promise<void> {
    const odgovor = await klijent.get<{ korisnik: Identitet }>("/api/auth/ja");
    postaviKorisnika(odgovor.korisnik);
  }

  useEffect(() => {
    let otkazano = false;

    void (async () => {
      try {
        if (await klijent.obnoviPriPodizanju()) {
          await dohvatiIdentitet();
        }
      } catch {

      } finally {
        if (!otkazano) postaviUcitava(false);
      }
    })();

    return () => {
      otkazano = true;
    };

  }, []);

  async function prijaviSe(email: string, lozinka: string): Promise<IshodPrijave> {
    const odgovor = await klijent.post<{ pristupniToken?: string; prijelazniToken?: string }>(
      "/api/auth/prijava",
      { email, lozinka },
    );

    if (odgovor.prijelazniToken) {
      return { trebaMfa: true, prijelazniToken: odgovor.prijelazniToken };
    }

    klijent.postaviToken(odgovor.pristupniToken!);
    await dohvatiIdentitet();

    return { trebaMfa: false };
  }

  async function dovrsiMfa(prijelazniToken: string, kod: string): Promise<void> {
    const odgovor = await klijent.post<{ pristupniToken: string }>("/api/auth/prijava/mfa", {
      prijelazniToken,
      kod,
    });

    klijent.postaviToken(odgovor.pristupniToken);
    await dohvatiIdentitet();
  }

  async function prijaviGoogleom(kod: string): Promise<IshodPrijave> {
    const odgovor = await klijent.post<{ pristupniToken?: string; prijelazniToken?: string }>(
      "/api/auth/google",
      { kod },
    );

    if (odgovor.prijelazniToken) {
      return { trebaMfa: true, prijelazniToken: odgovor.prijelazniToken };
    }

    klijent.postaviToken(odgovor.pristupniToken!);
    await dohvatiIdentitet();

    return { trebaMfa: false };
  }

  async function odjaviSe(): Promise<void> {
    try {
      await klijent.post("/api/auth/odjava");
    } finally {

      klijent.postaviToken(null);
      postaviKorisnika(null);
    }
  }

  const vrijednost = useMemo<Stanje>(
    () => ({
      klijent,
      korisnik,
      ucitava,
      prijaviSe,
      dovrsiMfa,
      prijaviGoogleom,
      odjaviSe,
      osvjeziIdentitet: dohvatiIdentitet,
    }),
    [klijent, korisnik, ucitava],
  );

  return <Kontekst.Provider value={vrijednost}>{children}</Kontekst.Provider>;
}

export function koristiIdentitet(): Stanje {
  const stanje = useContext(Kontekst);

  if (!stanje) {
    throw new Error("koristiIdentitet se smije zvati samo unutar PruzateljaIdentiteta.");
  }

  return stanje;
}

const RANG: Record<Uloga, number> = { Sudionik: 1, Vodic: 2, Admin: 3 };

export function imaBarem(korisnik: Identitet | null, najmanja: Uloga): boolean {
  return korisnik !== null && RANG[korisnik.uloga] >= RANG[najmanja];
}
