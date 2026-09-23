import rateLimit from "express-rate-limit";
import { GreskaPreviseZahtjeva } from "../utils/greske.js";

export const PRAG_POKUSAJA = 10;

export const PRAG_OBNOVE = 200;

const PROZOR_MINUTA = 15;

export function napraviOgranicenjePokusaja(prag: number) {
  return rateLimit({
    windowMs: PROZOR_MINUTA * 60 * 1000,
    limit: prag,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_zahtjev, _odgovor, sljedeci) => {
      sljedeci(new GreskaPreviseZahtjeva());
    },
  });
}

export const ogranicenjePokusaja = napraviOgranicenjePokusaja(PRAG_POKUSAJA);

export const ogranicenjeObnove = napraviOgranicenjePokusaja(PRAG_OBNOVE);
