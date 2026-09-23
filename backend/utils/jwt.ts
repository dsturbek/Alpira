import jwt from "jsonwebtoken";
import { konfiguracija } from "../konfiguracija.js";
import type { NaziviUloga } from "../dao/korisnik.js";

export type SadrzajTokena = {
  korisnik_id: number;
  uloga: NaziviUloga;
  email_verificiran: boolean;
};

export function potpisiPristupniToken(sadrzaj: SadrzajTokena): string {
  return jwt.sign(sadrzaj, konfiguracija.jwtTajna, {
    expiresIn: konfiguracija.trajanjeTokena,
  } as jwt.SignOptions);
}

export function procitajPristupniToken(token: string): SadrzajTokena | null {
  try {
    const sadrzaj = jwt.verify(token, konfiguracija.jwtTajna);
    if (typeof sadrzaj === "string") return null;

    if (sadrzaj.svrha) return null;

    return {
      korisnik_id: sadrzaj.korisnik_id as number,
      uloga: sadrzaj.uloga as NaziviUloga,
      email_verificiran: sadrzaj.email_verificiran as boolean,
    };
  } catch {
    return null;
  }
}

const SVRHA_MFA = "mfa";

export function potpisiPrijelazniToken(korisnikId: number): string {
  return jwt.sign({ korisnik_id: korisnikId, svrha: SVRHA_MFA }, konfiguracija.jwtTajna, {
    expiresIn: "5m",
  });
}

export function procitajPrijelazniToken(token: string): number | null {
  try {
    const sadrzaj = jwt.verify(token, konfiguracija.jwtTajna);
    if (typeof sadrzaj === "string" || sadrzaj.svrha !== SVRHA_MFA) return null;

    return sadrzaj.korisnik_id as number;
  } catch {
    return null;
  }
}
