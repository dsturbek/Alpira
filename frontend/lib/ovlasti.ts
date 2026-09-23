import { imaBarem, type Identitet } from "./auth";
import type { Termin } from "./javno";

export function jeAdmin(korisnik: Identitet | null): boolean {
  return imaBarem(korisnik, "Admin");
}

export function smijeUrediti(korisnik: Identitet | null, termin: Termin): boolean {
  return korisnik !== null && (jeAdmin(korisnik) || termin.vodic.id === korisnik.id);
}
