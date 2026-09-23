import {
  dohvatiZaPrijavu,
  dohvatiStanjeMfa,
  dohvatiZaPrijavuPoId,
  zauzmiTotpInterval,
  type JavniKorisnik,
} from "../dao/korisnik.js";
import { intervalKoda, kodJeIspravan } from "../utils/totp.js";
import { hashirajLozinku, provjeriLozinku } from "../utils/lozinke.js";
import { potpisiPristupniToken, potpisiPrijelazniToken, procitajPrijelazniToken } from "../utils/jwt.js";
import { GreskaNeautenticiran, GreskaNeispravniPodaciPrijave } from "../utils/greske.js";
import { otvoriSesiju, rotirajSesiju } from "../dao/sesija.js";
import { konfiguracija } from "../konfiguracija.js";

let lazniHash: Promise<string> | null = null;

function dohvatiLazniHash(): Promise<string> {
  lazniHash ??= hashirajLozinku("lazna-vrijednost-za-izjednacavanje-trajanja");
  return lazniHash;
}

export type PodaciZaPrijavu = {
  email: string;
  lozinka: string;
};

export type TrebaMfa = { trebaMfa: true; prijelazniToken: string };

export type UspjesnaPrijava = {
  korisnik: JavniKorisnik;
  pristupniToken: string;

  refreshToken: string;
};

export async function prijaviKorisnika(
  podaci: PodaciZaPrijavu,
): Promise<UspjesnaPrijava | TrebaMfa> {
  const zapis = await dohvatiZaPrijavu(podaci.email);

  if (!zapis || !zapis.lozinkaHash) {
    await provjeriLozinku(await dohvatiLazniHash(), podaci.lozinka);
    throw new GreskaNeispravniPodaciPrijave();
  }

  const lozinkaTocna = await provjeriLozinku(zapis.lozinkaHash, podaci.lozinka);
  if (!lozinkaTocna || !zapis.aktivan) {
    throw new GreskaNeispravniPodaciPrijave();
  }

  if ((await dohvatiStanjeMfa(zapis.id))?.mfaAktivan) {
    return { trebaMfa: true, prijelazniToken: potpisiPrijelazniToken(zapis.id) };
  }

  const korisnik: JavniKorisnik = {
    id: zapis.id,
    ime: zapis.ime,
    email: zapis.email,
    uloga: zapis.uloga,
  };

  return {
    korisnik,
    refreshToken: await otvoriSesiju(zapis.id, konfiguracija.trajanjeSesijeDana),
    pristupniToken: potpisiPristupniToken({
      korisnik_id: zapis.id,
      uloga: zapis.uloga,
      email_verificiran: zapis.emailVerificiran,
    }),
  };
}

export async function obnoviPristup(
  stariToken: string | null,
): Promise<{ pristupniToken: string; noviRefreshToken: string }> {
  if (!stariToken) {
    throw new GreskaNeautenticiran();
  }

  const ishod = await rotirajSesiju(stariToken, konfiguracija.trajanjeSesijeDana);

  if (!ishod) {
    throw new GreskaNeautenticiran();
  }

  return {
    pristupniToken: potpisiPristupniToken({
      korisnik_id: ishod.vlasnik.korisnikId,
      uloga: ishod.vlasnik.uloga,
      email_verificiran: ishod.vlasnik.emailVerificiran,
    }),
    noviRefreshToken: ishod.noviToken,
  };
}

export async function dovrsiPrijavuMfa(
  prijelazniToken: string,
  kod: string,
): Promise<UspjesnaPrijava> {
  const korisnikId = procitajPrijelazniToken(prijelazniToken);

  if (korisnikId === null) {
    throw new GreskaNeispravniPodaciPrijave();
  }

  const stanje = await dohvatiStanjeMfa(korisnikId);
  const zapis = await dohvatiZaPrijavuPoId(korisnikId);

  if (!stanje?.totpTajna || !stanje.mfaAktivan || !zapis?.aktivan) {
    throw new GreskaNeispravniPodaciPrijave();
  }

  if (!kodJeIspravan(stanje.totpTajna, kod)) {
    throw new GreskaNeispravniPodaciPrijave();
  }

  if (!(await zauzmiTotpInterval(korisnikId, intervalKoda()))) {
    throw new GreskaNeispravniPodaciPrijave();
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
