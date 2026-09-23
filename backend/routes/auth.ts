import { Router } from "express";
import {
  iskljuciMfa,
  ja,
  mojeSesije,
  odjava,
  odjavaSvugdje,
  opoziviSesiju,
  potvrdiMfa,
  pripremiMfa,
  stanjeMfa,
  ponoviKod,
  potvrdiEmail,
  prijava,
  googleKonfiguracija,
  prijavaGoogle,
  prijavaMfa,
  postaviNovuLozinku,
  refresh,
  registracija,
  zatraziReset,
} from "../controllers/auth.js";
import { zahtijevajPrijavu } from "../middleware/autentikacija.js";
import { ogranicenjeObnove, ogranicenjePokusaja } from "../middleware/ogranicenje.js";

export const authRute = Router();

authRute.post("/registracija", ogranicenjePokusaja, registracija);
authRute.post("/prijava", ogranicenjePokusaja, prijava);

authRute.post("/prijava/mfa", ogranicenjePokusaja, prijavaMfa);

authRute.get("/google", googleKonfiguracija);
authRute.post("/google", ogranicenjePokusaja, prijavaGoogle);

authRute.post("/refresh", ogranicenjeObnove, refresh);

authRute.post("/odjava", odjava);
authRute.post("/odjava-svugdje", zahtijevajPrijavu, odjavaSvugdje);
authRute.get("/sesije", zahtijevajPrijavu, mojeSesije);

authRute.get("/mfa", zahtijevajPrijavu, stanjeMfa);
authRute.post("/mfa/priprema", zahtijevajPrijavu, pripremiMfa);
authRute.post("/mfa/potvrda", zahtijevajPrijavu, ogranicenjePokusaja, potvrdiMfa);
authRute.post("/mfa/iskljucivanje", zahtijevajPrijavu, ogranicenjePokusaja, iskljuciMfa);
authRute.delete("/sesije/:id", zahtijevajPrijavu, opoziviSesiju);
authRute.post("/reset-lozinke", ogranicenjePokusaja, zatraziReset);
authRute.post("/nova-lozinka", ogranicenjePokusaja, postaviNovuLozinku);
authRute.get("/ja", zahtijevajPrijavu, ja);

authRute.post("/verifikacija", ogranicenjePokusaja, potvrdiEmail);
authRute.post("/verifikacija/ponovno", zahtijevajPrijavu, ogranicenjePokusaja, ponoviKod);
