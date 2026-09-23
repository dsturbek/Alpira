import {
  dohvatiPrijaveTermina,
  odluciOPrijavi as odluci,
  dohvatiPrijavu,
  dohvatiPrijaveKorisnika,
  obrisiPrijavu,
  postojiPrijava,
  stvoriPrijavu,
  type Prijava,
  type PrijavaSKorisnikom,
  type FilterPrijava,
  type OdlukaVodica,
  type PrijavaSTerminom,
} from "../dao/prijava.js";
import { dohvatiTermin } from "../dao/termin.js";
import {
  GreskaDvostrukaPrijava,
  GreskaNedopustenPrijelaz,
  GreskaNijePronadeno,
  GreskaTerminPopunjen,
  GreskaTudiResurs,
} from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";
import { osigurajVlasnistvoTermina } from "./vlasnistvo.js";

export async function posaljiPrijavu(
  korisnik: SadrzajTokena,
  terminId: number,
  napomena: string | null,
): Promise<Prijava> {
  const termin = await dohvatiTermin(terminId);

  if (!termin) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  if (termin.status !== "najavljen") {
    throw new GreskaNedopustenPrijelaz(
      `Termin je "${termin.status}" i na njega se više nije moguće prijaviti.`,
    );
  }

  if (await postojiPrijava(korisnik.korisnik_id, terminId)) {
    throw new GreskaDvostrukaPrijava();
  }

  return stvoriPrijavu(korisnik.korisnik_id, terminId, napomena);
}

export async function mojePrijave(
  korisnik: SadrzajTokena,
  filter: FilterPrijava = {},
): Promise<PrijavaSTerminom[]> {
  return dohvatiPrijaveKorisnika(korisnik.korisnik_id, filter);
}

export async function odjaviSe(korisnik: SadrzajTokena, prijavaId: number): Promise<void> {
  const prijava = await dohvatiPrijavu(prijavaId);

  if (!prijava) {
    throw new GreskaNijePronadeno("Prijava ne postoji.");
  }

  if (prijava.korisnik_id !== korisnik.korisnik_id) {
    throw new GreskaTudiResurs("Ta Prijava nije vaša.");
  }

  const termin = await dohvatiTermin(prijava.termin_id);

  if (termin?.status === "zavrsen") {
    throw new GreskaNedopustenPrijelaz("Termin je završen, odjava više nije moguća.");
  }

  await obrisiPrijavu(prijavaId);
}

export async function prijaveNaTermin(
  korisnik: SadrzajTokena,
  terminId: number,
): Promise<PrijavaSKorisnikom[]> {
  await osigurajVlasnistvoTermina(korisnik, terminId);

  return dohvatiPrijaveTermina(terminId);
}

export async function odluciOPrijavi(
  korisnik: SadrzajTokena,
  prijavaId: number,
  status: OdlukaVodica,
): Promise<Prijava> {
  const prijava = await dohvatiPrijavu(prijavaId);

  if (!prijava) {
    throw new GreskaNijePronadeno("Prijava ne postoji.");
  }

  await osigurajVlasnistvoTermina(korisnik, prijava.termin_id);

  const azurirana = await odluci(prijavaId, prijava.termin_id, status);

  if (!azurirana) {
    throw new GreskaTerminPopunjen();
  }

  return azurirana;
}
