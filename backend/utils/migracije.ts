import { readdir, readFile } from "node:fs/promises";
import type { Pool } from "pg";

export type Migracija = {
  naziv: string;
  sql: string;
};

const MAPA_MIGRACIJA = new URL("../migrations/", import.meta.url);

export async function ucitajMigracije(): Promise<Migracija[]> {
  const datoteke = (await readdir(MAPA_MIGRACIJA))
    .filter((naziv) => naziv.endsWith(".sql"))
    .sort();

  return Promise.all(
    datoteke.map(async (naziv) => ({
      naziv,
      sql: await readFile(new URL(naziv, MAPA_MIGRACIJA), "utf8"),
    })),
  );
}

export async function pokreniMigracije(pool: Pool, migracije?: Migracija[]): Promise<string[]> {
  const sve = migracije ?? (await ucitajMigracije());

  await pool.query(`
    CREATE TABLE IF NOT EXISTS migracija (
      naziv TEXT PRIMARY KEY,
      primijenjena_u TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  const vecPrimijenjene = await pool.query<{ naziv: string }>("SELECT naziv FROM migracija");
  const preskoci = new Set(vecPrimijenjene.rows.map((redak) => redak.naziv));

  const primijenjene: string[] = [];

  for (const migracija of sve) {
    if (preskoci.has(migracija.naziv)) continue;

    const klijent = await pool.connect();
    try {
      await klijent.query("BEGIN");
      await klijent.query(migracija.sql);
      await klijent.query("INSERT INTO migracija (naziv) VALUES ($1)", [migracija.naziv]);
      await klijent.query("COMMIT");
      primijenjene.push(migracija.naziv);
    } catch (greska) {
      await klijent.query("ROLLBACK");
      throw new Error(
        `Migracija "${migracija.naziv}" nije uspjela: ${
          greska instanceof Error ? greska.message : String(greska)
        }`,
      );
    } finally {
      klijent.release();
    }
  }

  return primijenjene;
}
