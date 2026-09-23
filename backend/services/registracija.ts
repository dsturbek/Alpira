import { postojiEmail, stvoriKorisnika, type JavniKorisnik } from "../dao/korisnik.js";
import { hashirajLozinku } from "../utils/lozinke.js";
import { GreskaEmailZauzet } from "../utils/greske.js";
import { posaljiKodZaPotvrdu } from "./verifikacija.js";

export type PodaciZaRegistraciju = {
  ime: string;
  email: string;
  lozinka: string;
};

export async function registrirajKorisnika(podaci: PodaciZaRegistraciju): Promise<JavniKorisnik> {
  if (await postojiEmail(podaci.email)) {
    throw new GreskaEmailZauzet();
  }

  const lozinkaHash = await hashirajLozinku(podaci.lozinka);

  const korisnik = await stvoriKorisnika({
    ime: podaci.ime,
    email: podaci.email,
    lozinkaHash,

    uloga: "Sudionik",

    emailVerificiran: false,
  });

  await posaljiKodZaPotvrdu(korisnik.id, korisnik.email);

  return korisnik;
}
