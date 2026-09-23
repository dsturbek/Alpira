import type { RequestHandler } from "express";
import { z } from "zod";
import { registrirajKorisnika } from "../services/registracija.js";
import { prijaviKorisnika } from "../services/prijava.js";
import { validiraj } from "../utils/validacija.js";
import * as verifikacija from "../services/verifikacija.js";
import { dovrsiPrijavuMfa, obnoviPristup } from "../services/prijava.js";
import * as reset from "../services/reset-lozinke.js";
import * as sesije from "../services/sesije.js";
import * as mfa from "../services/mfa.js";
import { dohvatiStanjeMfa } from "../dao/korisnik.js";
import { javniDioKonfiguracije, prijaviGoogleom } from "../services/google.js";
import { obrisiRefreshKolacic } from "../utils/kolacici.js";
import { shemaIdIzPutanje } from "../utils/validacija.js";
import { konfiguracija } from "../konfiguracija.js";
import { postaviRefreshKolacic, procitajRefreshKolacic } from "../utils/kolacici.js";

const shemaRegistracije = z.object({
  ime: z.string().trim().min(1, "Ime je obavezno.").max(100, "Ime je predugo."),
  email: z.string().trim().toLowerCase().email("E-mail adresa nije ispravna.").max(255),
  lozinka: z.string().min(10, "Lozinka mora imati barem 10 znakova."),

});

export const registracija: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaRegistracije, zahtjev.body);

  const korisnik = await registrirajKorisnika(podaci);

  odgovor.status(201).json({ korisnik });
};

const shemaPrijave = z.object({
  email: z.string().trim().toLowerCase().min(1, "E-mail je obavezan.").max(255),
  lozinka: z.string().min(1, "Lozinka je obavezna."),

});

export const prijava: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaPrijave, zahtjev.body);

  const rezultat = await prijaviKorisnika(podaci);

  if ("trebaMfa" in rezultat) {
    odgovor.status(200).json(rezultat);
    return;
  }

  const { refreshToken, ...javno } = rezultat;

  postaviRefreshKolacic(odgovor, refreshToken, konfiguracija.trajanjeSesijeDana);

  odgovor.status(200).json(javno);
};

export const ja: RequestHandler = (zahtjev, odgovor) => {
  odgovor.status(200).json({
    korisnik: {
      id: zahtjev.korisnik!.korisnik_id,
      uloga: zahtjev.korisnik!.uloga,
      email_verificiran: zahtjev.korisnik!.email_verificiran,
    },
  });
};

const shemaKoda = z.object({
  kod: z.string().trim().min(1, "Kod je obavezan.").max(255),
});

export const potvrdiEmail: RequestHandler = async (zahtjev, odgovor) => {
  const { kod } = validiraj(shemaKoda, zahtjev.body);

  await verifikacija.potvrdiEmail(kod);

  odgovor.status(200).json({ potvrdeno: true });
};

export const ponoviKod: RequestHandler = async (zahtjev, odgovor) => {
  await verifikacija.ponoviKodZaPotvrdu(zahtjev.korisnik!);

  odgovor.status(202).json({ poslano: true });
};

export const refresh: RequestHandler = async (zahtjev, odgovor) => {
  const { pristupniToken, noviRefreshToken } = await obnoviPristup(procitajRefreshKolacic(zahtjev));

  postaviRefreshKolacic(odgovor, noviRefreshToken, konfiguracija.trajanjeSesijeDana);

  odgovor.status(200).json({ pristupniToken });
};

const shemaZahtjevaZaReset = z.object({
  email: z.string().trim().toLowerCase().min(1, "E-mail je obavezan.").max(255),
});

const shemaNoveLozinke = z.object({
  kod: z.string().trim().min(1, "Kod je obavezan.").max(255),
  lozinka: z.string().min(10, "Lozinka mora imati barem 10 znakova."),
});

export const zatraziReset: RequestHandler = async (zahtjev, odgovor) => {
  const { email } = validiraj(shemaZahtjevaZaReset, zahtjev.body);

  await reset.zatraziReset(email);

  odgovor.status(202).json({ poslano: true });
};

export const postaviNovuLozinku: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaNoveLozinke, zahtjev.body);

  await reset.postaviNovuLozinku(podaci.kod, podaci.lozinka);

  odgovor.status(200).json({ promijenjeno: true });
};

export const odjava: RequestHandler = async (zahtjev, odgovor) => {
  await sesije.odjavi(procitajRefreshKolacic(zahtjev));

  obrisiRefreshKolacic(odgovor);

  odgovor.status(200).json({ odjavljeno: true });
};

export const odjavaSvugdje: RequestHandler = async (zahtjev, odgovor) => {
  await sesije.odjaviSvugdje(zahtjev.korisnik!);

  obrisiRefreshKolacic(odgovor);

  odgovor.status(200).json({ odjavljeno: true });
};

export const mojeSesije: RequestHandler = async (zahtjev, odgovor) => {
  const popis = await sesije.mojeSesije(zahtjev.korisnik!, procitajRefreshKolacic(zahtjev));

  odgovor.status(200).json({ sesije: popis });
};

export const opoziviSesiju: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  await sesije.opoziviMojuSesiju(zahtjev.korisnik!, id);

  odgovor.status(204).end();
};

const shemaMfaKoda = z.object({
  kod: z.string().trim().min(1, "Kod je obavezan.").max(16),
});

const shemaLozinke = z.object({
  lozinka: z.string().min(1, "Lozinka je obavezna."),
});

export const pripremiMfa: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = await mfa.pripremiMfa(zahtjev.korisnik!);

  odgovor.status(200).json(podaci);
};

export const potvrdiMfa: RequestHandler = async (zahtjev, odgovor) => {
  const { kod } = validiraj(shemaMfaKoda, zahtjev.body);

  await mfa.potvrdiMfa(zahtjev.korisnik!, kod);

  odgovor.status(200).json({ mfaAktivan: true });
};

export const iskljuciMfa: RequestHandler = async (zahtjev, odgovor) => {
  const { lozinka } = validiraj(shemaLozinke, zahtjev.body);

  await mfa.iskljuciMfa(zahtjev.korisnik!, lozinka);

  odgovor.status(200).json({ mfaAktivan: false });
};

const shemaDrugogKoraka = z.object({
  prijelazniToken: z.string().min(1, "Prijelazni token je obavezan."),
  kod: z.string().trim().min(1, "Kod je obavezan.").max(16),
});

export const prijavaMfa: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaDrugogKoraka, zahtjev.body);

  const { refreshToken, ...javno } = await dovrsiPrijavuMfa(podaci.prijelazniToken, podaci.kod);

  postaviRefreshKolacic(odgovor, refreshToken, konfiguracija.trajanjeSesijeDana);

  odgovor.status(200).json(javno);
};

export const googleKonfiguracija: RequestHandler = (_zahtjev, odgovor) => {
  odgovor.status(200).json(javniDioKonfiguracije());
};

const shemaGoogle = z.object({
  kod: z.string().trim().min(1, "Kod je obavezan.").max(2048),
});

export const prijavaGoogle: RequestHandler = async (zahtjev, odgovor) => {
  const { kod } = validiraj(shemaGoogle, zahtjev.body);

  const rezultat = await prijaviGoogleom(kod);

  if ("trebaMfa" in rezultat) {
    odgovor.status(200).json(rezultat);
    return;
  }

  const { refreshToken, ...javno } = rezultat;

  postaviRefreshKolacic(odgovor, refreshToken, konfiguracija.trajanjeSesijeDana);

  odgovor.status(200).json(javno);
};

export const stanjeMfa: RequestHandler = async (zahtjev, odgovor) => {
  const stanje = await dohvatiStanjeMfa(zahtjev.korisnik!.korisnik_id);

  odgovor.status(200).json({ mfaAktivan: stanje?.mfaAktivan ?? false });
};
