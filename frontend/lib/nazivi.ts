import type { Termin } from "./javno";

export const NAZIV_STATUSA_TERMINA: Record<Termin["status"], string> = {
  najavljen: "Najavljen",
  zavrsen: "Završen",
  otkazan: "Otkazan",
};

export const NAZIV_ULOGE: Record<"Sudionik" | "Vodic" | "Admin", string> = {
  Sudionik: "Sudionik",
  Vodic: "Vodič",
  Admin: "Admin",
};

export type StatusPrijave = "na_cekanju" | "potvrdeno" | "odbijeno";

export const NAZIV_STATUSA_PRIJAVE: Record<StatusPrijave, string> = {
  na_cekanju: "čeka odluku",
  potvrdeno: "potvrđena",
  odbijeno: "odbijena",
};
