import {
  dohvatiEmailKorisnika,
  dohvatiStanjeMfa,
  postaviMfa,
  postaviTotpTajnu,
} from "../dao/korisnik.js";
import { izracunajKod, kodJeIspravan, novaTajna, otpauthUri } from "../utils/totp.js";
import { provjeriLozinku } from "../utils/lozinke.js";
import {
  GreskaKodNijeValjan,
  GreskaNeispravniPodaciPrijave,
  GreskaNijePronadeno,
} from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";

export async function pripremiMfa(
  korisnik: SadrzajTokena,
): Promise<{ tajna: string; uri: string }> {
  const email = await dohvatiEmailKorisnika(korisnik.korisnik_id);

  if (!email) {
    throw new GreskaNijePronadeno("Korisnik ne postoji.");
  }

  const tajna = novaTajna();

  await postaviTotpTajnu(korisnik.korisnik_id, tajna);

  return { tajna, uri: otpauthUri(tajna, email) };
}

export async function potvrdiMfa(korisnik: SadrzajTokena, kod: string): Promise<void> {
  const stanje = await dohvatiStanjeMfa(korisnik.korisnik_id);

  if (!stanje?.totpTajna) {
    throw new GreskaKodNijeValjan("Nema pripremljene tajne za dvofaktorsku prijavu.");
  }

  if (!kodJeIspravan(stanje.totpTajna, kod)) {
    throw new GreskaKodNijeValjan("Kod nije ispravan.");
  }

  await postaviMfa(korisnik.korisnik_id, true);
}

export async function iskljuciMfa(korisnik: SadrzajTokena, lozinka: string): Promise<void> {
  const stanje = await dohvatiStanjeMfa(korisnik.korisnik_id);

  if (!stanje?.lozinkaHash || !(await provjeriLozinku(stanje.lozinkaHash, lozinka))) {
    throw new GreskaNeispravniPodaciPrijave();
  }

  await postaviMfa(korisnik.korisnik_id, false);
  await postaviTotpTajnu(korisnik.korisnik_id, null);
}

export { izracunajKod };
