import { izdajToken, potrosiToken } from "../dao/token.js";
import { oznaciEmailPotvrdenim, dohvatiEmailKorisnika } from "../dao/korisnik.js";
import { posaljiEmail } from "../utils/posiljatelj.js";
import { GreskaKodIstekao, GreskaKodNijeValjan, GreskaNijePronadeno } from "../utils/greske.js";
import { konfiguracija } from "../konfiguracija.js";
import type { SadrzajTokena } from "../utils/jwt.js";

export async function posaljiKodZaPotvrdu(korisnikId: number, email: string): Promise<void> {
  const kod = await izdajToken(korisnikId, "verifikacija_emaila", konfiguracija.trajanjeKodaMinuta);

  await posaljiEmail({
    prima: email,
    predmet: "Potvrda e-mail adrese",
    kod,
    poveznica: `${konfiguracija.dopustenoPodrijetlo}/potvrda?kod=${encodeURIComponent(kod)}`,
  });
}

export async function ponoviKodZaPotvrdu(korisnik: SadrzajTokena): Promise<void> {
  const email = await dohvatiEmailKorisnika(korisnik.korisnik_id);

  if (!email) {
    throw new GreskaNijePronadeno("Korisnik ne postoji.");
  }

  await posaljiKodZaPotvrdu(korisnik.korisnik_id, email);
}

export async function potvrdiEmail(kod: string): Promise<void> {
  const nalaz = await potrosiToken(kod, "verifikacija_emaila");

  if (nalaz.ishod === "istekao") {
    throw new GreskaKodIstekao();
  }

  if (nalaz.ishod === "nepoznat") {
    throw new GreskaKodNijeValjan();
  }

  await oznaciEmailPotvrdenim(nalaz.korisnikId);
}
