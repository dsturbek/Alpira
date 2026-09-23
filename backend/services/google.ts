import {
  dohvatiIdPoEmailu,
  dohvatiPoGoogleId,
  dohvatiStanjeMfa,
  dohvatiZaPrijavuPoId,
  poveziGoogle,
  stvoriGoogleKorisnika,
  type ZapisZaPrijavu,
} from "../dao/korisnik.js";
import { dohvatiGoogleProfil, googleKonfiguriran } from "../utils/google.js";
import { otvoriSesiju } from "../dao/sesija.js";
import { potpisiPrijelazniToken, potpisiPristupniToken } from "../utils/jwt.js";
import { GreskaGooglePovezivanje, GreskaNeispravniPodaciPrijave } from "../utils/greske.js";
import { konfiguracija, type Konfiguracija } from "../konfiguracija.js";
import type { TrebaMfa, UspjesnaPrijava } from "./prijava.js";

export type JavniGoogleDio = {
  dostupno: boolean;
  clientId: string | null;
  preusmjerenje: string | null;
};

export function javniDioKonfiguracije(postavke: Konfiguracija = konfiguracija): JavniGoogleDio {
  if (!googleKonfiguriran(postavke)) {
    return { dostupno: false, clientId: null, preusmjerenje: null };
  }

  return {
    dostupno: true,
    clientId: postavke.googleClientId,
    preusmjerenje: postavke.googlePreusmjerenje,
  };
}

async function izdajPristup(zapis: ZapisZaPrijavu): Promise<UspjesnaPrijava | TrebaMfa> {
  if ((await dohvatiStanjeMfa(zapis.id))?.mfaAktivan) {
    return { trebaMfa: true, prijelazniToken: potpisiPrijelazniToken(zapis.id) };
  }

  return {
    korisnik: { id: zapis.id, ime: zapis.ime, email: zapis.email, uloga: zapis.uloga },
    refreshToken: await otvoriSesiju(zapis.id, konfiguracija.trajanjeSesijeDana),
    pristupniToken: potpisiPristupniToken({
      korisnik_id: zapis.id,
      uloga: zapis.uloga,
      email_verificiran: zapis.emailVerificiran,
    }),
  };
}

export async function prijaviGoogleom(kod: string): Promise<UspjesnaPrijava | TrebaMfa> {
  const profil = await dohvatiGoogleProfil(kod, konfiguracija.googlePreusmjerenje);

  if (!profil || !profil.emailVerified) {
    throw new GreskaNeispravniPodaciPrijave();
  }

  const postojeci = await dohvatiPoGoogleId(profil.googleId);

  if (postojeci) {
    if (!postojeci.aktivan) {
      throw new GreskaNeispravniPodaciPrijave();
    }

    return izdajPristup(postojeci);
  }

  const idPoEmailu = await dohvatiIdPoEmailu(profil.email);

  if (idPoEmailu !== null) {
    const zapis = await dohvatiZaPrijavuPoId(idPoEmailu);

    if (!zapis?.aktivan) {
      throw new GreskaNeispravniPodaciPrijave();
    }

    if (!zapis.emailVerificiran) {
      throw new GreskaGooglePovezivanje();
    }

    await poveziGoogle(zapis.id, profil.googleId);

    return izdajPristup(zapis);
  }

  const noviId = await stvoriGoogleKorisnika(profil.email.split("@")[0]!, profil.email, profil.googleId);
  const novi = await dohvatiZaPrijavuPoId(noviId);

  return izdajPristup(novi!);
}
