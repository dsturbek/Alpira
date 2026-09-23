import { bazaPool } from "../db.js";
import type { StatusTermina } from "./termin.js";

export const STATUSI_PRIJAVE = ["na_cekanju", "potvrdeno", "odbijeno"] as const;
export type StatusPrijave = (typeof STATUSI_PRIJAVE)[number];

export const ODLUKE_VODICA = ["potvrdeno", "odbijeno"] as const;
export type OdlukaVodica = (typeof ODLUKE_VODICA)[number];

export type Prijava = {
  id: number;
  termin_id: number;
  korisnik_id: number;
  status: StatusPrijave;
  napomena: string | null;
};

export type PrijavaSTerminom = Prijava & {
  termin: { id: number; datum: string; status: StatusTermina; ruta_naziv: string };
};

export type PrijavaSKorisnikom = Prijava & {
  korisnik: { id: number; ime: string };
};

const STUPCI = "id, termin_id, korisnik_id, status, napomena";

export async function stvoriPrijavu(
  korisnikId: number,
  terminId: number,
  napomena: string | null,
): Promise<Prijava> {
  const rezultat = await bazaPool.query<Prijava>(
    `INSERT INTO prijava (korisnik_id, termin_id, napomena)
     VALUES ($1, $2, $3) RETURNING ${STUPCI}`,
    [korisnikId, terminId, napomena],
  );

  const redak = rezultat.rows[0];
  if (!redak) {
    throw new Error("Stvaranje Prijave nije vratilo zapis.");
  }

  return redak;
}

export async function dohvatiPrijavu(id: number): Promise<Prijava | null> {
  const rezultat = await bazaPool.query<Prijava>(`SELECT ${STUPCI} FROM prijava WHERE id = $1`, [
    id,
  ]);

  return rezultat.rows[0] ?? null;
}

export async function postojiPrijava(korisnikId: number, terminId: number): Promise<boolean> {
  const rezultat = await bazaPool.query(
    "SELECT 1 FROM prijava WHERE korisnik_id = $1 AND termin_id = $2",
    [korisnikId, terminId],
  );

  return rezultat.rowCount !== null && rezultat.rowCount > 0;
}

export type FilterPrijava = {
  status?: StatusPrijave;

  nadolazeci?: boolean;
};

export async function dohvatiPrijaveKorisnika(
  korisnikId: number,
  filter: FilterPrijava = {},
): Promise<PrijavaSTerminom[]> {
  type Redak = Prijava & {
    datum: string;
    termin_status: StatusTermina;
    ruta_naziv: string;
  };

  const uvjeti = ["p.korisnik_id = $1"];
  const vrijednosti: unknown[] = [korisnikId];

  if (filter.status) {
    vrijednosti.push(filter.status);
    uvjeti.push(`p.status = $${vrijednosti.length}`);
  }

  if (filter.nadolazeci) {

    uvjeti.push("t.datum >= CURRENT_DATE AND t.status = 'najavljen'");
  }

  const rezultat = await bazaPool.query<Redak>(
    `SELECT p.id, p.termin_id, p.korisnik_id, p.status, p.napomena,
            t.datum, t.status AS termin_status, r.naziv AS ruta_naziv
     FROM prijava p
     JOIN termin t ON t.id = p.termin_id
     JOIN ruta r ON r.id = t.ruta_id
     WHERE ${uvjeti.join(" AND ")}
     ORDER BY t.datum, p.id`,
    vrijednosti,
  );

  return rezultat.rows.map((redak) => ({
    id: redak.id,
    termin_id: redak.termin_id,
    korisnik_id: redak.korisnik_id,
    status: redak.status,
    napomena: redak.napomena,
    termin: {
      id: redak.termin_id,
      datum: redak.datum,
      status: redak.termin_status,
      ruta_naziv: redak.ruta_naziv,
    },
  }));
}

export async function obrisiPrijavu(id: number): Promise<boolean> {
  const rezultat = await bazaPool.query("DELETE FROM prijava WHERE id = $1", [id]);

  return rezultat.rowCount !== null && rezultat.rowCount > 0;
}

export async function dohvatiPrijaveTermina(terminId: number): Promise<PrijavaSKorisnikom[]> {
  type Redak = Prijava & { ime: string };

  const rezultat = await bazaPool.query<Redak>(
    `SELECT p.id, p.termin_id, p.korisnik_id, p.status, p.napomena, k.ime
     FROM prijava p
     JOIN korisnik k ON k.id = p.korisnik_id
     WHERE p.termin_id = $1
     ORDER BY p.created_at, p.id`,
    [terminId],
  );

  return rezultat.rows.map((redak) => ({
    id: redak.id,
    termin_id: redak.termin_id,
    korisnik_id: redak.korisnik_id,
    status: redak.status,
    napomena: redak.napomena,
    korisnik: { id: redak.korisnik_id, ime: redak.ime },
  }));
}

export async function odluciOPrijavi(
  prijavaId: number,
  terminId: number,
  status: StatusPrijave,
): Promise<Prijava | null> {
  const veza = await bazaPool.connect();

  try {
    await veza.query("BEGIN");
    await veza.query("SELECT id FROM termin WHERE id = $1 FOR UPDATE", [terminId]);

    if (status === "potvrdeno") {
      const stanje = await veza.query<{ potvrdenih: string; kapacitet: number }>(
        `SELECT COUNT(p.id) FILTER (WHERE p.status = 'potvrdeno' AND p.id <> $2)::text AS potvrdenih,
                t.kapacitet
         FROM termin t
         LEFT JOIN prijava p ON p.termin_id = t.id
         WHERE t.id = $1
         GROUP BY t.kapacitet`,
        [terminId, prijavaId],
      );

      const redak = stanje.rows[0];
      if (redak && Number(redak.potvrdenih) >= redak.kapacitet) {
        await veza.query("ROLLBACK");
        return null;
      }
    }

    const rezultat = await veza.query<Prijava>(
      `UPDATE prijava SET status = $2 WHERE id = $1 RETURNING ${STUPCI}`,
      [prijavaId, status],
    );

    await veza.query("COMMIT");
    return rezultat.rows[0] ?? null;
  } catch (greska) {
    await veza.query("ROLLBACK");
    throw greska;
  } finally {
    veza.release();
  }
}
