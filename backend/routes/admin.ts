import { Router } from "express";
import { popisKorisnika, postaviAktivnost, postaviUlogu } from "../controllers/admin.js";
import { zahtijevajPrijavu } from "../middleware/autentikacija.js";
import { zahtijevajUlogu, zahtijevajVerificiranEmail } from "../middleware/ovlasti.js";

export const adminRute = Router();

adminRute.use(zahtijevajPrijavu, zahtijevajVerificiranEmail, zahtijevajUlogu("Admin"));

adminRute.get("/korisnici", popisKorisnika);
adminRute.patch("/korisnici/:id/uloga", postaviUlogu);
adminRute.patch("/korisnici/:id/aktivan", postaviAktivnost);
