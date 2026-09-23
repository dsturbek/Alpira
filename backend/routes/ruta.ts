import { Router } from "express";
import { izmijeni, jedna, obrisi, popis, stvori } from "../controllers/ruta.js";
import { zahtijevajPrijavu } from "../middleware/autentikacija.js";
import { zahtijevajUlogu, zahtijevajVerificiranEmail } from "../middleware/ovlasti.js";

export const rutaRute = Router();

const smijeUnositi = [zahtijevajPrijavu, zahtijevajVerificiranEmail, zahtijevajUlogu("Vodic")];

const smijeOdrzavati = [zahtijevajPrijavu, zahtijevajVerificiranEmail, zahtijevajUlogu("Admin")];

rutaRute.get("/", popis);
rutaRute.get("/:id", jedna);
rutaRute.post("/", smijeUnositi, stvori);
rutaRute.put("/:id", smijeOdrzavati, izmijeni);
rutaRute.delete("/:id", smijeOdrzavati, obrisi);
