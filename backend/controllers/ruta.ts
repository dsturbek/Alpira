import type { RequestHandler } from "express";
import { z } from "zod";
import { TEZINE } from "../dao/ruta.js";
import * as servis from "../services/ruta.js";
import { shemaIdIzPutanje, validiraj } from "../utils/validacija.js";

const shemaTijela = z.object({
  naziv: z.string().trim().min(1, "Naziv je obavezan.").max(255, "Naziv je predug."),
  opis: z.string().trim().max(5000, "Opis je predug.").nullish().default(null),
  tezina: z.enum(TEZINE, { message: `Težina mora biti jedna od: ${TEZINE.join(", ")}.` }),
});

const shemaFiltra = z.object({

  tezina: z.enum(TEZINE, { message: `Težina mora biti jedna od: ${TEZINE.join(", ")}.` }).optional(),
  q: z.string().trim().min(1).max(255).optional(),
});

export const popis: RequestHandler = async (zahtjev, odgovor) => {
  const filter = validiraj(shemaFiltra, zahtjev.query);

  const rute = await servis.popisRuta({ tezina: filter.tezina, naziv: filter.q });

  odgovor.status(200).json({ rute });
};

export const jedna: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  const ruta = await servis.jednaRuta(id);

  odgovor.status(200).json({ ruta });
};

export const stvori: RequestHandler = async (zahtjev, odgovor) => {
  const podaci = validiraj(shemaTijela, zahtjev.body);

  const ruta = await servis.unesiRutu(podaci);

  odgovor.status(201).json({ ruta });
};

export const izmijeni: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);
  const podaci = validiraj(shemaTijela, zahtjev.body);

  const ruta = await servis.izmijeniRutu(id, podaci);

  odgovor.status(200).json({ ruta });
};

export const obrisi: RequestHandler = async (zahtjev, odgovor) => {
  const { id } = validiraj(shemaIdIzPutanje, zahtjev.params);

  await servis.ukloniRutu(id);

  odgovor.status(204).end();
};
