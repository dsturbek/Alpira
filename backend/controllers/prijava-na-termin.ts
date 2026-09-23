import type { RequestHandler } from "express";
import { z } from "zod";
import { ODLUKE_VODICA, STATUSI_PRIJAVE } from "../dao/prijava.js";
import * as servis from "../services/prijava-na-termin.js";
import { shemaIdIzPutanje, validiraj } from "../utils/validacija.js";

const shemaTijela = z.object({
  termin_id: z.coerce.number().int().positive("Termin je obavezan."),
  napomena: z.string().trim().max(1000, "Napomena je predugačka.").nullish().default(null),

});

export const posalji: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaTijela, zahtjev.body);

  const prijava = await servis.posaljiPrijavu(
    zahtjev.korisnik!,
    podaci.termin_id,
    podaci.napomena,
  );

  odgovor.status(201).json({ prijava });
};

const shemaFiltra = z.object({
  status: z.enum(STATUSI_PRIJAVE, { message: "Nepoznat status Prijave." }).optional(),

  nadolazeci: z.enum(["true", "false"], { message: 'Vrijednost mora biti "true" ili "false".' }).optional(),
});

export const moje: RequestHandler = async (zahtjev, odgovor) => {
  const filter = validiraj(shemaFiltra, zahtjev.query);

  const prijave = await servis.mojePrijave(zahtjev.korisnik!, {
    status: filter.status,
    nadolazeci: filter.nadolazeci === "true",
  });

  odgovor.status(200).json({ prijave });
};

export const odjava: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  await servis.odjaviSe(zahtjev.korisnik!, id);

  odgovor.status(204).end();
};

const shemaOdluke = z.object({

  status: z.enum(ODLUKE_VODICA, { message: "Odluka može biti potvrdeno ili odbijeno." }),
});

export const odluci: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);
  const { status } = validiraj(shemaOdluke, zahtjev.body);

  const prijava = await servis.odluciOPrijavi(zahtjev.korisnik!, id, status);

  odgovor.status(200).json({ prijava });
};

export const naTerminu: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  const prijave = await servis.prijaveNaTermin(zahtjev.korisnik!, id);

  odgovor.status(200).json({ prijave });
};
