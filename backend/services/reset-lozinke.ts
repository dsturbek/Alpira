import { izdajToken, potrosiToken } from "../dao/token.js";
import { dohvatiIdPoEmailu, postaviLozinku } from "../dao/korisnik.js";
import { opoziviSveSesije } from "../dao/sesija.js";
import { hashirajLozinku } from "../utils/lozinke.js";
import { posaljiEmail } from "../utils/posiljatelj.js";
import { GreskaKodIstekao, GreskaKodNijeValjan } from "../utils/greske.js";
import { konfiguracija } from "../konfiguracija.js";

export async function zatraziReset(email: string): Promise<void> {
  const korisnikId = await dohvatiIdPoEmailu(email);

  if (!korisnikId) {

    return;
  }

  const kod = await izdajToken(korisnikId, "reset_lozinke", konfiguracija.trajanjeResetKodaMinuta);

  await posaljiEmail({
    prima: email,
    predmet: "Postavljanje nove lozinke",
    kod,
    poveznica: `${konfiguracija.dopustenoPodrijetlo}/nova-lozinka?kod=${encodeURIComponent(kod)}`,
  });
}

export async function postaviNovuLozinku(kod: string, lozinka: string): Promise<void> {
  const nalaz = await potrosiToken(kod, "reset_lozinke");

  if (nalaz.ishod === "istekao") {
    throw new GreskaKodIstekao();
  }

  if (nalaz.ishod === "nepoznat") {
    throw new GreskaKodNijeValjan();
  }

  await postaviLozinku(nalaz.korisnikId, await hashirajLozinku(lozinka));

  await opoziviSveSesije(nalaz.korisnikId);
}
