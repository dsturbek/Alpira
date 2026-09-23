import type { ErrorRequestHandler, RequestHandler } from "express";
import { GreskaAplikacije, GreskaNijePronadeno, GreskaValidacije } from "../utils/greske.js";

export const nepoznataRuta: RequestHandler = (_zahtjev, _odgovor, sljedeci) => {
  sljedeci(new GreskaNijePronadeno("Tražena ruta ne postoji."));
};

export const obradaGresaka: ErrorRequestHandler = (greska, _zahtjev, odgovor, _sljedeci) => {
  if (greska instanceof GreskaValidacije) {
    odgovor.status(greska.status).json({
      greska: { kod: greska.kod, poruka: greska.message, detalji: greska.detalji },
    });
    return;
  }

  if (greska instanceof GreskaAplikacije) {
    odgovor.status(greska.status).json({
      greska: { kod: greska.kod, poruka: greska.message },
    });
    return;
  }

  const detalj = greska instanceof Error ? (greska.stack ?? greska.message) : String(greska);
  console.error("Neuhvaćena greška:", detalj);

  odgovor.status(500).json({
    greska: {
      kod: "INTERNA_GRESKA",
      poruka: "Došlo je do neočekivane greške.",
    },
  });
};
