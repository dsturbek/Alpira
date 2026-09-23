import { Router } from "express";
import { izmijeni, napisi, obrisi } from "../controllers/recenzija.js";
import { zahtijevajPrijavu } from "../middleware/autentikacija.js";
import { zahtijevajUlogu, zahtijevajVerificiranEmail } from "../middleware/ovlasti.js";

export const recenzijaRute = Router();

recenzijaRute.use(zahtijevajPrijavu, zahtijevajVerificiranEmail, zahtijevajUlogu("Sudionik"));

recenzijaRute.post("/", napisi);
recenzijaRute.put("/:id", izmijeni);
recenzijaRute.delete("/:id", obrisi);
