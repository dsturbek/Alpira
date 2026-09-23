import type { RequestHandler } from "express";
import { z } from "zod";
import { TEZINE } from "../dao/ruta.js";
import { STATUSI_TERMINA } from "../dao/termin.js";
import * as servis from "../services/termin.js";
import { shemaIdIzPutanje, validiraj } from "../utils/validacija.js";

const datum = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum mora biti oblika YYYY-MM-DD.")
  .refine((vrijednost) => {
    const razlozen = new Date(`${vrijednost}T00:00:00Z`);
    return !Number.isNaN(razlozen.getTime()) && razlozen.toISOString().startsWith(vrijednost);
  }, "Taj datum ne postoji u kalendaru.");

const shemaTijela = z.object({
  ruta_id: z.coerce.number().int().positive("Ruta je obavezna."),
  datum,
  kapacitet: z.coerce
    .number()
    .int()
    .positive("Kapacitet mora biti veći od nule.")
    .max(1000, "Kapacitet je nerazumno velik."),
  je_privatan: z.coerce.boolean().default(false),

});

const shemaFiltra = z.object({
  ruta_id: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUSI_TERMINA, { message: "Nepoznat status Termina." }).optional(),
  tezina: z.enum(TEZINE, { message: "Nepoznata težina." }).optional(),
  od: datum.optional(),
  do: datum.optional(),
});

export const popis: RequestHandler = async (zahtjev, odgovor) => {
  const filter = validiraj(shemaFiltra, zahtjev.query);

  const termini = await servis.popisTermina(
    {
      rutaId: filter.ruta_id,
      status: filter.status,
      tezina: filter.tezina,
      od: filter.od,
      do: filter.do,
    },
    zahtjev.korisnik,
  );

  odgovor.status(200).json({ termini });
};

export const jedan: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  const termin = await servis.jedanTermin(id, zahtjev.korisnik);

  odgovor.status(200).json({ termin });
};

export const zakazi: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaTijela, zahtjev.body);

  const termin = await servis.zakaziTermin(zahtjev.korisnik!, {
    rutaId: podaci.ruta_id,
    datum: podaci.datum,
    kapacitet: podaci.kapacitet,
    jePrivatan: podaci.je_privatan,
  });

  odgovor.status(201).json({ termin });
};

export const izmijeni: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);
  const podaci = validiraj(shemaTijela, zahtjev.body);

  const termin = await servis.izmijeniTermin(zahtjev.korisnik!, id, {
    rutaId: podaci.ruta_id,
    datum: podaci.datum,
    kapacitet: podaci.kapacitet,
    jePrivatan: podaci.je_privatan,
  });

  odgovor.status(200).json({ termin });
};

const shemaStatusa = z.object({
  status: z.enum(STATUSI_TERMINA, { message: "Nepoznat status Termina." }),
});

export const promijeniStatus: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);
  const { status } = validiraj(shemaStatusa, zahtjev.body);

  const termin = await servis.promijeniStatusTermina(zahtjev.korisnik!, id, status);

  odgovor.status(200).json({ termin });
};

export const obrisi: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  await servis.ukloniTermin(zahtjev.korisnik!, id);

  odgovor.status(204).end();
};

const shemaKoda = z.object({
  kod: z.string().trim().min(1).max(255),
});

export const poKodu: RequestHandler = async (zahtjev, odgovor) => {
  const { kod } = validiraj(shemaKoda, zahtjev.params);

  const termin = await servis.terminKodom(kod);

  odgovor.status(200).json({ termin });
};

export const privatniLink: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  const link = await servis.noviPrivatniLink(zahtjev.korisnik!, id);

  odgovor.status(201).json({ privatniLink: link });
};

export const trenutniLink: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  const link = await servis.trenutniPrivatniLink(zahtjev.korisnik!, id);

  odgovor.status(200).json({ privatniLink: link });
};
