import { createHash, randomBytes } from "node:crypto";
import { bazaPool } from "../db.js";
import type { NaziviUloga } from "./korisnik.js";

export type VlasnikSesije = {
  sesijaId: number;
  korisnikId: number;
  uloga: NaziviUloga;
  emailVerificiran: boolean;
};

function hashiraj(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function otvoriSesiju(korisnikId: number, trajanjeDana: number): Promise<string> {
  const token = randomBytes(48).toString("base64url");

  await bazaPool.query(
    `INSERT INTO sesija (korisnik_id, refresh_token_hash, istice)
     VALUES ($1, $2, NOW() + ($3 || ' days')::interval)`,
    [korisnikId, hashiraj(token), String(trajanjeDana)],
  );

  return token;
}

export async function rotirajSesiju(
  stariToken: string,
  trajanjeDana: number,
): Promise<{ noviToken: string; vlasnik: VlasnikSesije } | null> {
  const veza = await bazaPool.connect();

  try {
    await veza.query("BEGIN");

    const opoziv = await veza.query<{ korisnik_id: number }>(
      `UPDATE sesija SET opozvan = TRUE
       WHERE refresh_token_hash = $1 AND NOT opozvan AND istice > NOW()
       RETURNING korisnik_id`,
      [hashiraj(stariToken)],
    );

    const korisnikId = opoziv.rows[0]?.korisnik_id;
    if (korisnikId === undefined) {
      await veza.query("ROLLBACK");
      return null;
    }

    const korisnik = await veza.query<{
      uloga: NaziviUloga;
      email_verificiran: boolean;
      aktivan: boolean;
    }>(
      `SELECT u.naziv AS uloga, k.email_verificiran, k.aktivan
       FROM korisnik k JOIN uloga u ON u.id = k.uloga_id WHERE k.id = $1`,
      [korisnikId],
    );

    const redak = korisnik.rows[0];
    if (!redak || !redak.aktivan) {

      await veza.query("COMMIT");
      return null;
    }

    const noviToken = randomBytes(48).toString("base64url");
    const nova = await veza.query<{ id: number }>(
      `INSERT INTO sesija (korisnik_id, refresh_token_hash, istice)
       VALUES ($1, $2, NOW() + ($3 || ' days')::interval) RETURNING id`,
      [korisnikId, hashiraj(noviToken), String(trajanjeDana)],
    );

    await veza.query("COMMIT");

    return {
      noviToken,
      vlasnik: {
        sesijaId: nova.rows[0]!.id,
        korisnikId,
        uloga: redak.uloga,
        emailVerificiran: redak.email_verificiran,
      },
    };
  } catch (greska) {
    await veza.query("ROLLBACK");
    throw greska;
  } finally {
    veza.release();
  }
}

export async function opoziviSveSesije(korisnikId: number): Promise<number> {
  const rezultat = await bazaPool.query(
    "UPDATE sesija SET opozvan = TRUE WHERE korisnik_id = $1 AND NOT opozvan",
    [korisnikId],
  );

  return rezultat.rowCount ?? 0;
}

export type AktivnaSesija = {
  id: number;
  created_at: string;
  istice: string;
};

export async function aktivneSesije(korisnikId: number): Promise<AktivnaSesija[]> {
  const rezultat = await bazaPool.query<AktivnaSesija>(
    `SELECT id, created_at, istice FROM sesija
     WHERE korisnik_id = $1 AND NOT opozvan AND istice > NOW()
     ORDER BY created_at DESC, id DESC`,
    [korisnikId],
  );

  return rezultat.rows;
}

export async function idSesijePoTokenu(token: string): Promise<number | null> {
  const rezultat = await bazaPool.query<{ id: number }>(
    "SELECT id FROM sesija WHERE refresh_token_hash = $1 AND NOT opozvan",
    [hashiraj(token)],
  );

  return rezultat.rows[0]?.id ?? null;
}

export async function opoziviPoTokenu(token: string): Promise<void> {
  await bazaPool.query("UPDATE sesija SET opozvan = TRUE WHERE refresh_token_hash = $1", [
    hashiraj(token),
  ]);
}

export async function vlasnikSesije(id: number): Promise<number | null> {
  const rezultat = await bazaPool.query<{ korisnik_id: number }>(
    "SELECT korisnik_id FROM sesija WHERE id = $1",
    [id],
  );

  return rezultat.rows[0]?.korisnik_id ?? null;
}

export async function opoziviSesiju(id: number): Promise<void> {
  await bazaPool.query("UPDATE sesija SET opozvan = TRUE WHERE id = $1", [id]);
}
