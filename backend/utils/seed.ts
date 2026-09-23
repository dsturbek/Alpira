import { bazaPool } from "../db.js";
import { konfiguracija } from "../konfiguracija.js";
import { hashirajLozinku } from "./lozinke.js";

export async function seedajPrvogAdmina(): Promise<boolean> {
  const postoji = await bazaPool.query(
    `SELECT 1 FROM korisnik k JOIN uloga u ON u.id = k.uloga_id WHERE u.naziv = 'Admin' LIMIT 1`,
  );

  if (postoji.rowCount && postoji.rowCount > 0) return false;

  const lozinkaHash = await hashirajLozinku(konfiguracija.adminLozinka);

  await bazaPool.query(
    `INSERT INTO korisnik (uloga_id, ime, email, lozinka_hash, email_verificiran)
     VALUES ((SELECT id FROM uloga WHERE naziv = 'Admin'), $1, $2, $3, TRUE)
     ON CONFLICT (email) DO NOTHING`,
    ["Administrator", konfiguracija.adminEmail.toLowerCase(), lozinkaHash],
  );

  return true;
}
