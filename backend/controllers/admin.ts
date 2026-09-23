import type { RequestHandler } from "express";
import { z } from "zod";
import { dohvatiSveKorisnike } from "../dao/korisnik.js";
import * as servis from "../services/admin.js";
import { shemaIdIzPutanje, validiraj } from "../utils/validacija.js";

const ULOGE = ["Sudionik", "Vodic", "Admin"] as const;

export const popisKorisnika: RequestHandler = async (_zahtjev, odgovor) => {
  const korisnici = await dohvatiSveKorisnike();

  odgovor.status(200).json({ korisnici });
};

const shemaUloge = z.object({
  uloga: z.enum(ULOGE, { message: "Nepoznata Uloga." }),
});

const shemaAktivnosti = z.object({
  aktivan: z.boolean({ message: "Zastavica mora biti true ili false." }),
});

export const postaviUlogu: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);
  const { uloga } = validiraj(shemaUloge, zahtjev.body);

  const korisnik = await servis.postaviUlogu(zahtjev.korisnik!, id, uloga);

  odgovor.status(200).json({ korisnik });
};

export const postaviAktivnost: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);
  const { aktivan } = validiraj(shemaAktivnosti, zahtjev.body);

  await servis.postaviAktivnost(zahtjev.korisnik!, id, aktivan);

  odgovor.status(204).end();
};
