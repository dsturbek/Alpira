import { bazaPool } from "../db.js";

export const TEZINE = ["lagana", "srednja", "zahtjevna"] as const;
export type Tezina = (typeof TEZINE)[number];

export type Ruta = {
  id: number;
  naziv: string;
  opis: string | null;
  tezina: Tezina;
};

export type PodaciRute = {
  naziv: string;
  opis: string | null;
  tezina: Tezina;
};

export type FilterRuta = {
  tezina?: Tezina;
  naziv?: string;
};

const STUPCI = "id, naziv, opis, tezina";

function maskirajDzokere(tekst: string): string {
  return tekst.replace(/[\\%_]/g, (znak) => `\\${znak}`);
}

export async function dohvatiRute(filter: FilterRuta): Promise<Ruta[]> {
  const uvjeti: string[] = [];
  const vrijednosti: unknown[] = [];

  if (filter.tezina) {
    vrijednosti.push(filter.tezina);
    uvjeti.push(`tezina = $${vrijednosti.length}`);
  }

  if (filter.naziv) {
    vrijednosti.push(`%${maskirajDzokere(filter.naziv)}%`);
    uvjeti.push(`naziv ILIKE $${vrijednosti.length}`);
  }

  const gdje = uvjeti.length > 0 ? `WHERE ${uvjeti.join(" AND ")}` : "";

  const rezultat = await bazaPool.query<Ruta>(
    `SELECT ${STUPCI} FROM ruta ${gdje} ORDER BY naziv`,
    vrijednosti,
  );

  return rezultat.rows;
}

export async function dohvatiRutu(id: number): Promise<Ruta | null> {
  const rezultat = await bazaPool.query<Ruta>(`SELECT ${STUPCI} FROM ruta WHERE id = $1`, [id]);

  return rezultat.rows[0] ?? null;
}

export async function stvoriRutu(podaci: PodaciRute): Promise<Ruta> {
  const rezultat = await bazaPool.query<Ruta>(
    `INSERT INTO ruta (naziv, opis, tezina) VALUES ($1, $2, $3) RETURNING ${STUPCI}`,
    [podaci.naziv, podaci.opis, podaci.tezina],
  );

  const redak = rezultat.rows[0];
  if (!redak) {
    throw new Error("Stvaranje Rute nije vratilo zapis.");
  }

  return redak;
}

export async function azurirajRutu(id: number, podaci: PodaciRute): Promise<Ruta | null> {
  const rezultat = await bazaPool.query<Ruta>(
    `UPDATE ruta SET naziv = $2, opis = $3, tezina = $4 WHERE id = $1 RETURNING ${STUPCI}`,
    [id, podaci.naziv, podaci.opis, podaci.tezina],
  );

  return rezultat.rows[0] ?? null;
}

export async function obrisiRutu(id: number): Promise<boolean> {
  const rezultat = await bazaPool.query("DELETE FROM ruta WHERE id = $1", [id]);

  return rezultat.rowCount !== null && rezultat.rowCount > 0;
}
