import {
  postaviAktivan,
  postojiKorisnik,
  promijeniUlogu,
  type JavniKorisnik,
  type NaziviUloga,
} from "../dao/korisnik.js";
import { GreskaNijePronadeno, GreskaRadnjaNadSobom } from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";

async function osigurajMetu(admin: SadrzajTokena, id: number): Promise<void> {
  if (admin.korisnik_id === id) {
    throw new GreskaRadnjaNadSobom();
  }

  if (!(await postojiKorisnik(id))) {
    throw new GreskaNijePronadeno("Korisnik ne postoji.");
  }
}

export async function postaviUlogu(
  admin: SadrzajTokena,
  id: number,
  uloga: NaziviUloga,
): Promise<JavniKorisnik> {
  await osigurajMetu(admin, id);

  const korisnik = await promijeniUlogu(id, uloga);

  if (!korisnik) {
    throw new GreskaNijePronadeno("Korisnik ne postoji.");
  }

  return korisnik;
}

export async function postaviAktivnost(
  admin: SadrzajTokena,
  id: number,
  aktivan: boolean,
): Promise<void> {
  await osigurajMetu(admin, id);

  await postaviAktivan(id, aktivan);
}
