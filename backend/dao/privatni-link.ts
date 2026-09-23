import { randomBytes } from "node:crypto";
import { bazaPool } from "../db.js";

export type PrivatniLink = {
  id: number;
  termin_id: number;
  kod: string;
  aktivan: boolean;
};

function noviKod(): string {
  return randomBytes(32).toString("base64url");
}

export async function generirajLink(terminId: number): Promise<PrivatniLink> {
  const veza = await bazaPool.connect();

  try {
    await veza.query("BEGIN");
    await veza.query("UPDATE privatni_link SET aktivan = FALSE WHERE termin_id = $1", [terminId]);

    const rezultat = await veza.query<PrivatniLink>(
      `INSERT INTO privatni_link (termin_id, kod) VALUES ($1, $2)
       RETURNING id, termin_id, kod, aktivan`,
      [terminId, noviKod()],
    );

    await veza.query("COMMIT");

    const redak = rezultat.rows[0];
    if (!redak) {
      throw new Error("Stvaranje PrivatnogLinka nije vratilo zapis.");
    }

    return redak;
  } catch (greska) {
    await veza.query("ROLLBACK");
    throw greska;
  } finally {
    veza.release();
  }
}

export async function aktivniLink(terminId: number): Promise<PrivatniLink | null> {
  const rezultat = await bazaPool.query<PrivatniLink>(
    `SELECT id, termin_id, kod, aktivan FROM privatni_link
     WHERE termin_id = $1 AND aktivan = TRUE`,
    [terminId],
  );

  return rezultat.rows[0] ?? null;
}

export async function terminPoKodu(kod: string): Promise<number | null> {
  const rezultat = await bazaPool.query<{ termin_id: number }>(
    "SELECT termin_id FROM privatni_link WHERE kod = $1 AND aktivan = TRUE",
    [kod],
  );

  return rezultat.rows[0]?.termin_id ?? null;
}
