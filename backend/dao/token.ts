import { createHash, randomBytes } from "node:crypto";
import { bazaPool } from "../db.js";

export const TIPOVI_TOKENA = ["reset_lozinke", "verifikacija_emaila"] as const;
export type TipTokena = (typeof TIPOVI_TOKENA)[number];

export type NalazTokena =
  | { ishod: "valjan"; korisnikId: number }
  | { ishod: "istekao" }
  | { ishod: "nepoznat" };

function hashiraj(kod: string): string {
  return createHash("sha256").update(kod).digest("hex");
}

export async function izdajToken(
  korisnikId: number,
  tip: TipTokena,
  trajanjeMinuta: number,
): Promise<string> {
  const kod = randomBytes(32).toString("base64url");

  const veza = await bazaPool.connect();
  try {
    await veza.query("BEGIN");

    await veza.query(
      "UPDATE token SET iskoristen = TRUE WHERE korisnik_id = $1 AND tip = $2 AND iskoristen = FALSE",
      [korisnikId, tip],
    );
    await veza.query(
      `INSERT INTO token (korisnik_id, tip, kod_hash, istice)
       VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::interval)`,
      [korisnikId, tip, hashiraj(kod), String(trajanjeMinuta)],
    );
    await veza.query("COMMIT");
  } catch (greska) {
    await veza.query("ROLLBACK");
    throw greska;
  } finally {
    veza.release();
  }

  return kod;
}

export async function potrosiToken(kod: string, tip: TipTokena): Promise<NalazTokena> {
  const rezultat = await bazaPool.query<{ korisnik_id: number }>(
    `UPDATE token SET iskoristen = TRUE
     WHERE kod_hash = $1 AND tip = $2 AND iskoristen = FALSE AND istice > NOW()
     RETURNING korisnik_id`,
    [hashiraj(kod), tip],
  );

  const redak = rezultat.rows[0];
  if (redak) return { ishod: "valjan", korisnikId: redak.korisnik_id };

  const postoji = await bazaPool.query(
    "SELECT 1 FROM token WHERE kod_hash = $1 AND tip = $2 AND iskoristen = FALSE",
    [hashiraj(kod), tip],
  );

  return postoji.rowCount ? { ishod: "istekao" } : { ishod: "nepoznat" };
}
