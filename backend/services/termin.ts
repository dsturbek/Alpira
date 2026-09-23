import {
  azurirajTermin,
  brojPotvrdenihPoTerminu,
  dohvatiTermin,
  dohvatiTermine,
  dohvatiVlasnikaTermina,
  obrisiTermin,
  postaviStatusTermina,
  stvoriTermin,
  type FilterTermina,
  type PodaciTermina,
  type StatusTermina,
  type Termin,
} from "../dao/termin.js";
import { dohvatiRutu } from "../dao/ruta.js";
import {
  aktivniLink,
  generirajLink,
  terminPoKodu,
  type PrivatniLink,
} from "../dao/privatni-link.js";
import {
  GreskaNedopustenPrijelaz,
  GreskaNijePronadeno,
  GreskaTudiResurs,
} from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";
import { jeAdmin, osigurajVlasnistvoTermina } from "./vlasnistvo.js";

export type TerminSPopunjenoscu = Termin & {
  popunjenost: { potvrdenih: number; kapacitet: number };
};

async function sPopunjenoscu(termini: Termin[]): Promise<TerminSPopunjenoscu[]> {
  const potvrdeni = await brojPotvrdenihPoTerminu();

  return termini.map((termin) => ({
    ...termin,
    popunjenost: {
      potvrdenih: potvrdeni.get(termin.id) ?? 0,
      kapacitet: termin.kapacitet,
    },
  }));
}

export async function popisTermina(
  filter: FilterTermina,
  gledatelj?: SadrzajTokena,
): Promise<TerminSPopunjenoscu[]> {
  return sPopunjenoscu(
    await dohvatiTermine({
      ...filter,
      gledatelj: gledatelj
        ? { korisnikId: gledatelj.korisnik_id, jeAdmin: jeAdmin(gledatelj) }
        : undefined,
    }),
  );
}

function smijeVidjeti(termin: Termin, gledatelj?: SadrzajTokena): boolean {
  if (!termin.je_privatan) return true;
  if (!gledatelj) return false;

  return jeAdmin(gledatelj) || gledatelj.korisnik_id === termin.vodic.id;
}

export async function jedanTermin(
  id: number,
  gledatelj?: SadrzajTokena,
): Promise<TerminSPopunjenoscu> {
  const termin = await dohvatiTermin(id);

  if (!termin || !smijeVidjeti(termin, gledatelj)) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  return (await sPopunjenoscu([termin]))[0]!;
}

export async function terminKodom(kod: string): Promise<TerminSPopunjenoscu> {
  const terminId = await terminPoKodu(kod);

  if (terminId === null) {
    throw new GreskaNijePronadeno("Taj pristupni kod ne vrijedi.");
  }

  const termin = await dohvatiTermin(terminId);

  if (!termin) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  return (await sPopunjenoscu([termin]))[0]!;
}

export async function noviPrivatniLink(
  korisnik: SadrzajTokena,
  terminId: number,
): Promise<PrivatniLink> {
  await osigurajVlasnistvoTermina(korisnik, terminId);

  return generirajLink(terminId);
}

export async function trenutniPrivatniLink(
  korisnik: SadrzajTokena,
  terminId: number,
): Promise<PrivatniLink | null> {
  await osigurajVlasnistvoTermina(korisnik, terminId);

  return aktivniLink(terminId);
}

export async function zakaziTermin(
  korisnik: SadrzajTokena,
  podaci: PodaciTermina,
): Promise<Termin> {
  if (!(await dohvatiRutu(podaci.rutaId))) {
    throw new GreskaNijePronadeno("Ruta ne postoji.");
  }

  return stvoriTermin(korisnik.korisnik_id, podaci);
}

export async function izmijeniTermin(
  korisnik: SadrzajTokena,
  id: number,
  podaci: PodaciTermina,
): Promise<Termin> {
  await osigurajVlasnistvoTermina(korisnik, id);

  if (!(await dohvatiRutu(podaci.rutaId))) {
    throw new GreskaNijePronadeno("Ruta ne postoji.");
  }

  const termin = await azurirajTermin(id, podaci);

  if (!termin) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  return termin;
}

export async function ukloniTermin(korisnik: SadrzajTokena, id: number): Promise<void> {
  await osigurajVlasnistvoTermina(korisnik, id);

  await obrisiTermin(id);
}

const DOPUSTENI_PRIJELAZI: Record<StatusTermina, StatusTermina[]> = {
  najavljen: ["zavrsen", "otkazan"],
  zavrsen: [],
  otkazan: [],
};

export async function promijeniStatusTermina(
  korisnik: SadrzajTokena,
  id: number,
  noviStatus: StatusTermina,
): Promise<Termin> {
  await osigurajVlasnistvoTermina(korisnik, id);

  const termin = await dohvatiTermin(id);
  if (!termin) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  if (!DOPUSTENI_PRIJELAZI[termin.status].includes(noviStatus)) {
    throw new GreskaNedopustenPrijelaz(
      `Termin je "${termin.status}" i ne može prijeći u "${noviStatus}".`,
    );
  }

  const azuriran = await postaviStatusTermina(id, noviStatus);
  if (!azuriran) {
    throw new GreskaNijePronadeno("Termin ne postoji.");
  }

  return azuriran;
}
