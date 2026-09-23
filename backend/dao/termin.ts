import { bazaPool } from "../db.js";
import type { Tezina } from "./ruta.js";

export const STATUSI_TERMINA = ["najavljen", "zavrsen", "otkazan"] as const;
export type StatusTermina = (typeof STATUSI_TERMINA)[number];

export type Termin = {
  id: number;
  datum: string;
  kapacitet: number;
  status: StatusTermina;
  je_privatan: boolean;
  ruta: { id: number; naziv: string; tezina: Tezina };
  vodic: { id: number; ime: string; bio: string | null; certifikati: string | null };
};

export type PodaciTermina = {
  rutaId: number;
  datum: string;
  kapacitet: number;
  jePrivatan: boolean;
};

export type FilterTermina = {
  rutaId?: number;
  status?: StatusTermina;
  tezina?: Tezina;
  od?: string;
  do?: string;

  gledatelj?: { korisnikId: number; jeAdmin: boolean };
};

function uvjetVidljivosti(
  gledatelj: FilterTermina["gledatelj"],
  vrijednosti: unknown[],
): string | null {
  if (gledatelj?.jeAdmin) return null;

  if (gledatelj) {
    vrijednosti.push(gledatelj.korisnikId);
    return `(t.je_privatan = FALSE OR t.vodic_id = $${vrijednosti.length})`;
  }

  return "t.je_privatan = FALSE";
}

type RedakTermina = {
  id: number;
  datum: string;
  kapacitet: number;
  status: StatusTermina;
  je_privatan: boolean;
  ruta_id: number;
  ruta_naziv: string;
  ruta_tezina: Tezina;
  vodic_id: number;
  vodic_ime: string;
  vodic_bio: string | null;
  vodic_certifikati: string | null;
};

const ODABIR = `
  SELECT t.id, t.datum, t.kapacitet, t.status, t.je_privatan,
         r.id AS ruta_id, r.naziv AS ruta_naziv, r.tezina AS ruta_tezina,
         k.id AS vodic_id, k.ime AS vodic_ime,
         o.bio AS vodic_bio, o.certifikati AS vodic_certifikati
  FROM termin t
  JOIN ruta r ON r.id = t.ruta_id
  JOIN korisnik k ON k.id = t.vodic_id
  LEFT JOIN organizator o ON o.korisnik_id = k.id`;

function uTermin(redak: RedakTermina): Termin {
  return {
    id: redak.id,
    datum: redak.datum,
    kapacitet: redak.kapacitet,
    status: redak.status,
    je_privatan: redak.je_privatan,
    ruta: { id: redak.ruta_id, naziv: redak.ruta_naziv, tezina: redak.ruta_tezina },
    vodic: {
      id: redak.vodic_id,
      ime: redak.vodic_ime,
      bio: redak.vodic_bio,
      certifikati: redak.vodic_certifikati,
    },
  };
}

export async function dohvatiTermine(filter: FilterTermina): Promise<Termin[]> {
  const uvjeti: string[] = [];
  const vrijednosti: unknown[] = [];

  if (filter.rutaId !== undefined) {
    vrijednosti.push(filter.rutaId);
    uvjeti.push(`t.ruta_id = $${vrijednosti.length}`);
  }

  if (filter.status) {
    vrijednosti.push(filter.status);
    uvjeti.push(`t.status = $${vrijednosti.length}`);
  }

  if (filter.tezina) {
    vrijednosti.push(filter.tezina);
    uvjeti.push(`r.tezina = $${vrijednosti.length}`);
  }

  if (filter.od) {
    vrijednosti.push(filter.od);
    uvjeti.push(`t.datum >= $${vrijednosti.length}`);
  }

  if (filter.do) {
    vrijednosti.push(filter.do);
    uvjeti.push(`t.datum <= $${vrijednosti.length}`);
  }

  const vidljivost = uvjetVidljivosti(filter.gledatelj, vrijednosti);
  if (vidljivost) uvjeti.push(vidljivost);

  const gdje = uvjeti.length > 0 ? `WHERE ${uvjeti.join(" AND ")}` : "";

  const rezultat = await bazaPool.query<RedakTermina>(
    `${ODABIR} ${gdje} ORDER BY t.datum, t.id`,
    vrijednosti,
  );

  return rezultat.rows.map(uTermin);
}

export async function dohvatiTermin(id: number): Promise<Termin | null> {
  const rezultat = await bazaPool.query<RedakTermina>(`${ODABIR} WHERE t.id = $1`, [id]);

  const redak = rezultat.rows[0];
  return redak ? uTermin(redak) : null;
}

export async function dohvatiVlasnikaTermina(id: number): Promise<number | null> {
  const rezultat = await bazaPool.query<{ vodic_id: number }>(
    "SELECT vodic_id FROM termin WHERE id = $1",
    [id],
  );

  return rezultat.rows[0]?.vodic_id ?? null;
}

export async function stvoriTermin(vodicId: number, podaci: PodaciTermina): Promise<Termin> {
  const rezultat = await bazaPool.query<{ id: number }>(
    `INSERT INTO termin (ruta_id, vodic_id, datum, kapacitet, je_privatan)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [podaci.rutaId, vodicId, podaci.datum, podaci.kapacitet, podaci.jePrivatan],
  );

  const id = rezultat.rows[0]?.id;
  if (id === undefined) {
    throw new Error("Stvaranje Termina nije vratilo zapis.");
  }

  const termin = await dohvatiTermin(id);
  if (!termin) {
    throw new Error("Stvoreni Termin nije dohvatljiv.");
  }

  return termin;
}

export async function azurirajTermin(id: number, podaci: PodaciTermina): Promise<Termin | null> {

  await bazaPool.query(
    `UPDATE termin SET ruta_id = $2, datum = $3, kapacitet = $4, je_privatan = $5
     WHERE id = $1`,
    [id, podaci.rutaId, podaci.datum, podaci.kapacitet, podaci.jePrivatan],
  );

  return dohvatiTermin(id);
}

export async function obrisiTermin(id: number): Promise<boolean> {
  const rezultat = await bazaPool.query("DELETE FROM termin WHERE id = $1", [id]);

  return rezultat.rowCount !== null && rezultat.rowCount > 0;
}

export async function brojTerminaNaRuti(rutaId: number): Promise<number> {
  const rezultat = await bazaPool.query<{ broj: string }>(
    "SELECT COUNT(*)::text AS broj FROM termin WHERE ruta_id = $1",
    [rutaId],
  );

  return Number(rezultat.rows[0]?.broj ?? 0);
}

export async function postaviStatusTermina(
  id: number,
  status: StatusTermina,
): Promise<Termin | null> {
  await bazaPool.query("UPDATE termin SET status = $2 WHERE id = $1", [id, status]);

  return dohvatiTermin(id);
}

export async function brojPotvrdenihPoTerminu(): Promise<Map<number, number>> {
  const rezultat = await bazaPool.query<{ termin_id: number; broj: string }>(
    `SELECT termin_id, COUNT(*)::text AS broj
     FROM prijava WHERE status = 'potvrdeno' GROUP BY termin_id`,
  );

  return new Map(rezultat.rows.map((redak) => [redak.termin_id, Number(redak.broj)]));
}
