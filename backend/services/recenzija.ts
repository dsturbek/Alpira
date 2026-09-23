import {
  azurirajRecenziju,
  dohvatiRecenziju,
  dohvatiRecenzijeTermina,
  obrisiRecenziju,
  postojiRecenzija,
  statusPrijaveNaTerminu,
  stvoriRecenziju,
  type Recenzija,
  type RecenzijaSAutorom,
} from "../dao/recenzija.js";
import { dohvatiTermin } from "../dao/termin.js";
import {
  GreskaNijePronadeno,
  GreskaRecenzijaNijeDopustena,
  GreskaTudiResurs,
} from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";
import { jeAdmin } from "./vlasnistvo.js";

export async function recenzijeTermina(terminId: number): Promise<RecenzijaSAutorom[]> {
  if (!(await dohvatiTermin(terminId))) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  return dohvatiRecenzijeTermina(terminId);
}

export async function napisiRecenziju(
  korisnik: SadrzajTokena,
  terminId: number,
  ocjena: number,
  komentar: string | null,
): Promise<Recenzija> {
  const termin = await dohvatiTermin(terminId);

  if (!termin) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  if (termin.status !== "zavrsen") {
    throw new GreskaRecenzijaNijeDopustena("Termin još nije završen.");
  }

  if ((await statusPrijaveNaTerminu(korisnik.korisnik_id, terminId)) !== "potvrdeno") {
    throw new GreskaRecenzijaNijeDopustena("Recenziju smije napisati samo potvrđen Sudionik.");
  }

  if (await postojiRecenzija(korisnik.korisnik_id, terminId)) {
    throw new GreskaRecenzijaNijeDopustena("Taj Termin ste već recenzirali.");
  }

  return stvoriRecenziju(korisnik.korisnik_id, terminId, ocjena, komentar);
}

async function dohvatiVlastitu(korisnik: SadrzajTokena, id: number): Promise<Recenzija> {
  const recenzija = await dohvatiRecenziju(id);

  if (!recenzija) {
    throw new GreskaNijePronadeno("Recenzija ne postoji.");
  }

  if (recenzija.korisnik_id !== korisnik.korisnik_id) {
    throw new GreskaTudiResurs("Ta Recenzija nije vaša.");
  }

  return recenzija;
}

export async function izmijeniRecenziju(
  korisnik: SadrzajTokena,
  id: number,
  ocjena: number,
  komentar: string | null,
): Promise<Recenzija> {
  await dohvatiVlastitu(korisnik, id);

  const azurirana = await azurirajRecenziju(id, ocjena, komentar);

  if (!azurirana) {
    throw new GreskaNijePronadeno("Recenzija ne postoji.");
  }

  return azurirana;
}

export async function ukloniRecenziju(korisnik: SadrzajTokena, id: number): Promise<void> {
  const recenzija = await dohvatiRecenziju(id);

  if (!recenzija) {
    throw new GreskaNijePronadeno("Recenzija ne postoji.");
  }

  const jeAutor = recenzija.korisnik_id === korisnik.korisnik_id;

  if (!jeAutor && !jeAdmin(korisnik)) {
    throw new GreskaTudiResurs("Ta Recenzija nije vaša.");
  }

  await obrisiRecenziju(id);
}
