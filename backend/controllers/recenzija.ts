import type { RequestHandler } from "express";
import { z } from "zod";
import * as servis from "../services/recenzija.js";
import { shemaIdIzPutanje, validiraj } from "../utils/validacija.js";

const ocjena = z.coerce
  .number()
  .int("Ocjena mora biti cijeli broj.")
  .min(1, "Ocjena je od 1 do 5.")
  .max(5, "Ocjena je od 1 do 5.");

const komentar = z.string().trim().max(2000, "Komentar je predugačak.").nullish().default(null);

const shemaStvaranja = z.object({ termin_id: z.coerce.number().int().positive(), ocjena, komentar });
const shemaIzmjene = z.object({ ocjena, komentar });

export const napisi: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaStvaranja, zahtjev.body);

  const recenzija = await servis.napisiRecenziju(
    zahtjev.korisnik!,
    podaci.termin_id,
    podaci.ocjena,
    podaci.komentar,
  );

  odgovor.status(201).json({ recenzija });
};

export const izmijeni: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);
  const podaci = validiraj(shemaIzmjene, zahtjev.body);

  const recenzija = await servis.izmijeniRecenziju(
    zahtjev.korisnik!,
    id,
    podaci.ocjena,
    podaci.komentar,
  );

  odgovor.status(200).json({ recenzija });
};

export const obrisi: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  await servis.ukloniRecenziju(zahtjev.korisnik!, id);

  odgovor.status(204).end();
};

export const naTerminu: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  const recenzije = await servis.recenzijeTermina(id);

  odgovor.status(200).json({ recenzije });
};
