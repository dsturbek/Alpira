import { bazaPool } from "../db.js";
import type { StatusPrijave } from "./prijava.js";

export type Recenzija = {
  id: number;
  termin_id: number;
  korisnik_id: number;
  ocjena: number;
  komentar: string | null;
};

export type RecenzijaSAutorom = Recenzija & {
  korisnik: { id: number; ime: string };
};

const STUPCI = "id, termin_id, korisnik_id, ocjena, komentar";

export async function stvoriRecenziju(
  korisnikId: number,
  terminId: number,
  ocjena: number,
  komentar: string | null,
): Promise<Recenzija> {
  const rezultat = await bazaPool.query<Recenzija>(
    `INSERT INTO recenzija (korisnik_id, termin_id, ocjena, komentar)
     VALUES ($1, $2, $3, $4) RETURNING ${STUPCI}`,
    [korisnikId, terminId, ocjena, komentar],
  );

  const redak = rezultat.rows[0];
  if (!redak) {
    throw new Error("Stvaranje Recenzije nije vratilo zapis.");
  }

  return redak;
}

export async function dohvatiRecenziju(id: number): Promise<Recenzija | null> {
  const rezultat = await bazaPool.query<Recenzija>(
    `SELECT ${STUPCI} FROM recenzija WHERE id = $1`,
    [id],
  );

  return rezultat.rows[0] ?? null;
}

export async function postojiRecenzija(korisnikId: number, terminId: number): Promise<boolean> {
  const rezultat = await bazaPool.query(
    "SELECT 1 FROM recenzija WHERE korisnik_id = $1 AND termin_id = $2",
    [korisnikId, terminId],
  );

  return rezultat.rowCount !== null && rezultat.rowCount > 0;
}

export async function dohvatiRecenzijeTermina(terminId: number): Promise<RecenzijaSAutorom[]> {
  type Redak = Recenzija & { ime: string };

  const rezultat = await bazaPool.query<Redak>(
    `SELECT r.id, r.termin_id, r.korisnik_id, r.ocjena, r.komentar, k.ime
     FROM recenzija r
     JOIN korisnik k ON k.id = r.korisnik_id
     WHERE r.termin_id = $1
     ORDER BY r.created_at DESC, r.id DESC`,
    [terminId],
  );

  return rezultat.rows.map((redak) => ({
    id: redak.id,
    termin_id: redak.termin_id,
    korisnik_id: redak.korisnik_id,
    ocjena: redak.ocjena,
    komentar: redak.komentar,
    korisnik: { id: redak.korisnik_id, ime: redak.ime },
  }));
}

export async function azurirajRecenziju(
  id: number,
  ocjena: number,
  komentar: string | null,
): Promise<Recenzija | null> {
  const rezultat = await bazaPool.query<Recenzija>(
    `UPDATE recenzija SET ocjena = $2, komentar = $3 WHERE id = $1 RETURNING ${STUPCI}`,
    [id, ocjena, komentar],
  );

  return rezultat.rows[0] ?? null;
}

export async function obrisiRecenziju(id: number): Promise<boolean> {
  const rezultat = await bazaPool.query("DELETE FROM recenzija WHERE id = $1", [id]);

  return rezultat.rowCount !== null && rezultat.rowCount > 0;
}

export async function statusPrijaveNaTerminu(
  korisnikId: number,
  terminId: number,
): Promise<StatusPrijave | null> {
  const rezultat = await bazaPool.query<{ status: StatusPrijave }>(
    "SELECT status FROM prijava WHERE korisnik_id = $1 AND termin_id = $2",
    [korisnikId, terminId],
  );

  return rezultat.rows[0]?.status ?? null;
}
