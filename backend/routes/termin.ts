import { Router } from "express";
import {
  izmijeni,
  jedan,
  obrisi,
  poKodu,
  popis,
  privatniLink,
  promijeniStatus,
  trenutniLink,
  zakazi,
} from "../controllers/termin.js";
import { naTerminu } from "../controllers/prijava-na-termin.js";
import { naTerminu as recenzijeTermina } from "../controllers/recenzija.js";
import {
  procitajPrijavuAkoPostoji,
  zahtijevajPrijavu,
} from "../middleware/autentikacija.js";
import { zahtijevajUlogu, zahtijevajVerificiranEmail } from "../middleware/ovlasti.js";

export const terminRute = Router();

const smijeVoditi = [zahtijevajPrijavu, zahtijevajVerificiranEmail, zahtijevajUlogu("Vodic")];

terminRute.get("/", procitajPrijavuAkoPostoji, popis);

terminRute.get("/kod/:kod", poKodu);
terminRute.get("/:id", procitajPrijavuAkoPostoji, jedan);
terminRute.get("/:id/recenzije", recenzijeTermina);
terminRute.get("/:id/prijave", smijeVoditi, naTerminu);
terminRute.post("/", smijeVoditi, zakazi);
terminRute.put("/:id", smijeVoditi, izmijeni);
terminRute.get("/:id/privatni-link", smijeVoditi, trenutniLink);
terminRute.post("/:id/privatni-link", smijeVoditi, privatniLink);
terminRute.patch("/:id/status", smijeVoditi, promijeniStatus);
terminRute.delete("/:id", smijeVoditi, obrisi);
