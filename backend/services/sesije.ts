import {
  aktivneSesije,
  idSesijePoTokenu,
  opoziviPoTokenu,
  opoziviSesiju,
  opoziviSveSesije,
  vlasnikSesije,
  type AktivnaSesija,
} from "../dao/sesija.js";
import { GreskaNijePronadeno, GreskaTudiResurs } from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";

export type SesijaZaPrikaz = AktivnaSesija & { trenutna: boolean };

export async function odjavi(refreshToken: string | null): Promise<void> {
  if (refreshToken) {
    await opoziviPoTokenu(refreshToken);
  }
}

export async function odjaviSvugdje(korisnik: SadrzajTokena): Promise<void> {
  await opoziviSveSesije(korisnik.korisnik_id);
}

export async function mojeSesije(
  korisnik: SadrzajTokena,
  refreshToken: string | null,
): Promise<SesijaZaPrikaz[]> {
  const trenutnaId = refreshToken ? await idSesijePoTokenu(refreshToken) : null;
  const sesije = await aktivneSesije(korisnik.korisnik_id);

  return sesije.map((sesija) => ({ ...sesija, trenutna: sesija.id === trenutnaId }));
}

export async function opoziviMojuSesiju(korisnik: SadrzajTokena, id: number): Promise<void> {
  const vlasnikId = await vlasnikSesije(id);

  if (vlasnikId === null) {
    throw new GreskaNijePronadeno("Sesija ne postoji.");
  }

  if (vlasnikId !== korisnik.korisnik_id) {
    throw new GreskaTudiResurs("Ta Sesija nije vaša.");
  }

  await opoziviSesiju(id);
}
