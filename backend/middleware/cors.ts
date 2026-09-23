import type { RequestHandler } from "express";
import { konfiguracija } from "../konfiguracija.js";

const METODE = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ZAGLAVLJA = "Content-Type, Authorization";

export const cors: RequestHandler = (zahtjev, odgovor, sljedeci) => {
  const podrijetlo = zahtjev.header("Origin");

  if (podrijetlo === konfiguracija.dopustenoPodrijetlo) {
    odgovor.setHeader("Access-Control-Allow-Origin", podrijetlo);
    odgovor.setHeader("Access-Control-Allow-Credentials", "true");
    odgovor.setHeader("Access-Control-Allow-Methods", METODE);
    odgovor.setHeader("Access-Control-Allow-Headers", ZAGLAVLJA);

    odgovor.setHeader("Vary", "Origin");
  }

  if (zahtjev.method === "OPTIONS") {
    odgovor.status(204).end();
    return;
  }

  sljedeci();
};
