import type { Request, Response } from "express";
import { konfiguracija } from "../konfiguracija.js";

export const IME_KOLACICA = "osvjezavanje";

const PUTANJA = "/api/auth";

export function postaviRefreshKolacic(odgovor: Response, token: string, trajanjeDana: number): void {
  odgovor.cookie(IME_KOLACICA, token, {
    httpOnly: true,
    sameSite: "lax",
    path: PUTANJA,
    secure: konfiguracija.okolina === "production",
    maxAge: trajanjeDana * 24 * 60 * 60 * 1000,
  });
}

export function obrisiRefreshKolacic(odgovor: Response): void {
  odgovor.clearCookie(IME_KOLACICA, { path: PUTANJA });
}

export function procitajRefreshKolacic(zahtjev: Request): string | null {
  const zaglavlje = zahtjev.header("Cookie");
  if (!zaglavlje) return null;

  for (const dio of zaglavlje.split(";")) {
    const [ime, ...ostatak] = dio.trim().split("=");
    if (ime === IME_KOLACICA) return decodeURIComponent(ostatak.join("="));
  }

  return null;
}
