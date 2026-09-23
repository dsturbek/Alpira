import { dohvatiVlasnikaTermina } from "../dao/termin.js";
import { GreskaNijePronadeno, GreskaTudiResurs } from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";

export function smijeUrediti(korisnik: SadrzajTokena, vlasnikId: number): boolean {
  return korisnik.korisnik_id === vlasnikId || jeAdmin(korisnik);
}

export function jeAdmin(korisnik: SadrzajTokena): boolean {
  return korisnik.uloga === "Admin";
}

export async function osigurajVlasnistvoTermina(
  korisnik: SadrzajTokena,
  terminId: number,
): Promise<void> {
  const vlasnikId = await dohvatiVlasnikaTermina(terminId);

  if (vlasnikId === null) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  if (!smijeUrediti(korisnik, vlasnikId)) {
    throw new GreskaTudiResurs("Taj Termin vodi netko drugi.");
  }
}
