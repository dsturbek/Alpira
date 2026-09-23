"use client";

import { useEffect, useState } from "react";
import { dohvatiJavno } from "./javno";

export type GoogleKonfiguracija = {
  dostupno: boolean;
  clientId: string | null;
  preusmjerenje: string | null;
};

const AUTORIZACIJA = "https://accounts.google.com/o/oauth2/v2/auth";

const KLJUC_STANJA = "google-state";

const NEDOSTUPNO: GoogleKonfiguracija = { dostupno: false, clientId: null, preusmjerenje: null };

export function koristiGoogleKonfiguraciju(): GoogleKonfiguracija | null {
  const [konfiguracija, postaviKonfiguraciju] = useState<GoogleKonfiguracija | null>(null);

  useEffect(() => {
    let otkazano = false;

    void dohvatiJavno<GoogleKonfiguracija>("/api/auth/google").then(
      (podaci) => {
        if (!otkazano) postaviKonfiguraciju(podaci);
      },
      () => {
        if (!otkazano) postaviKonfiguraciju(NEDOSTUPNO);
      },
    );

    return () => {
      otkazano = true;
    };
  }, []);

  return konfiguracija;
}

export function posaljiNaGoogle(konfiguracija: GoogleKonfiguracija): void {
  if (!konfiguracija.dostupno || !konfiguracija.clientId || !konfiguracija.preusmjerenje) return;

  const stanje = crypto.randomUUID();
  sessionStorage.setItem(KLJUC_STANJA, stanje);

  const parametri = new URLSearchParams({
    client_id: konfiguracija.clientId,
    redirect_uri: konfiguracija.preusmjerenje,
    response_type: "code",
    scope: "openid email",
    state: stanje,

    prompt: "select_account",
  });

  window.location.assign(`${AUTORIZACIJA}?${parametri.toString()}`);
}

export function zaboraviStanje(): void {
  sessionStorage.removeItem(KLJUC_STANJA);
}

export function potrosiStanje(izUrla: string | null): boolean {
  const zapamceno = sessionStorage.getItem(KLJUC_STANJA);
  zaboraviStanje();

  return izUrla !== null && zapamceno !== null && izUrla === zapamceno;
}
