import { Router } from "express";
import { moje, odjava, odluci, posalji } from "../controllers/prijava-na-termin.js";
import { zahtijevajPrijavu } from "../middleware/autentikacija.js";
import { zahtijevajUlogu, zahtijevajVerificiranEmail } from "../middleware/ovlasti.js";

export const prijavaRute = Router();

prijavaRute.use(zahtijevajPrijavu, zahtijevajVerificiranEmail, zahtijevajUlogu("Sudionik"));

prijavaRute.get("/moje", moje);
prijavaRute.post("/", posalji);
prijavaRute.patch("/:id", odluci);
prijavaRute.delete("/:id", odjava);
