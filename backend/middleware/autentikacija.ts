import type { RequestHandler } from "express";
import { procitajPristupniToken, type SadrzajTokena } from "../utils/jwt.js";
import { GreskaNeautenticiran } from "../utils/greske.js";

declare global {

  namespace Express {
    interface Request {
      korisnik?: SadrzajTokena;
    }
  }
}

export const zahtijevajPrijavu: RequestHandler = (zahtjev, _odgovor, sljedeci) => {
  const zaglavlje = zahtjev.header("Authorization");

  if (!zaglavlje?.startsWith("Bearer ")) {
    sljedeci(new GreskaNeautenticiran());
    return;
  }

  const sadrzaj = procitajPristupniToken(zaglavlje.slice("Bearer ".length).trim());

  if (!sadrzaj) {
    sljedeci(new GreskaNeautenticiran());
    return;
  }

  zahtjev.korisnik = sadrzaj;
  sljedeci();
};

export const procitajPrijavuAkoPostoji: RequestHandler = (zahtjev, _odgovor, sljedeci) => {
  const zaglavlje = zahtjev.header("Authorization");

  if (zaglavlje?.startsWith("Bearer ")) {
    const sadrzaj = procitajPristupniToken(zaglavlje.slice("Bearer ".length).trim());
    if (sadrzaj) zahtjev.korisnik = sadrzaj;
  }

  sljedeci();
};
