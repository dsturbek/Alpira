import type { RequestHandler } from "express";
import { z } from "zod";
import * as servis from "../services/organizator.js";
import { validiraj } from "../utils/validacija.js";

const shemaKorisnika = z.object({
  korisnikId: z.coerce.number().int().positive("ID mora biti pozitivan cijeli broj."),
});

const shemaProfila = z.object({
  bio: z.string().trim().max(5000, "Biografija je predugačka.").nullish().default(null),
  certifikati: z.string().trim().max(2000, "Popis certifikata je predugačak.").nullish().default(null),
});

export const moj: RequestHandler = async (zahtjev, odgovor) => {
  const organizator = await servis.mojProfil(zahtjev.korisnik!);

  odgovor.status(200).json({ organizator });
};

export const spremiMoj: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaProfila, zahtjev.body);

  const organizator = await servis.spremiMojProfil(zahtjev.korisnik!, podaci.bio, podaci.certifikati);

  odgovor.status(200).json({ organizator });
};

export const javni: RequestHandler = async (zahtjev, odgovor) => {
  const { korisnikId } = validiraj(shemaKorisnika, zahtjev.params);

  const organizator = await servis.javniProfil(korisnikId);

  odgovor.status(200).json({ organizator });
};
