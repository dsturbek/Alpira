import { Router } from "express";
import { javni, moj, spremiMoj } from "../controllers/organizator.js";
import { zahtijevajPrijavu } from "../middleware/autentikacija.js";
import { zahtijevajUlogu, zahtijevajVerificiranEmail } from "../middleware/ovlasti.js";

export const organizatorRute = Router();

const smijeImatiProfil = [zahtijevajPrijavu, zahtijevajVerificiranEmail, zahtijevajUlogu("Vodic")];

organizatorRute.get("/moj", smijeImatiProfil, moj);
organizatorRute.put("/moj", smijeImatiProfil, spremiMoj);
organizatorRute.get("/:korisnikId", javni);
