import type { RequestHandler } from "express";
import type { NaziviUloga } from "../dao/korisnik.js";
import { GreskaEmailNijeVerificiran, GreskaNedovoljnaOvlast } from "../utils/greske.js";

const RANG: Record<NaziviUloga, number> = {
  Sudionik: 1,
  Vodic: 2,
  Admin: 3,
};

export function zahtijevajUlogu(najmanja: NaziviUloga): RequestHandler {
  return (zahtjev, _odgovor, sljedeci) => {
    const uloga = zahtjev.korisnik?.uloga;

    if (!uloga || RANG[uloga] < RANG[najmanja]) {
      sljedeci(new GreskaNedovoljnaOvlast());
      return;
    }

    sljedeci();
  };
}

export const zahtijevajVerificiranEmail: RequestHandler = (zahtjev, _odgovor, sljedeci) => {
  if (!zahtjev.korisnik?.email_verificiran) {
    sljedeci(new GreskaEmailNijeVerificiran());
    return;
  }

  sljedeci();
};
