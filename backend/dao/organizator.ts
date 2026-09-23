import { bazaPool } from "../db.js";

export type Organizator = {
  korisnik_id: number;
  bio: string | null;
  certifikati: string | null;
};

export type JavniOrganizator = Organizator & { ime: string };

export async function dohvatiProfil(korisnikId: number): Promise<Organizator | null> {
  const rezultat = await bazaPool.query<Organizator>(
    "SELECT korisnik_id, bio, certifikati FROM organizator WHERE korisnik_id = $1",
    [korisnikId],
  );

  return rezultat.rows[0] ?? null;
}

export async function dohvatiJavniProfil(korisnikId: number): Promise<JavniOrganizator | null> {

  const rezultat = await bazaPool.query<JavniOrganizator>(
    `SELECT k.id AS korisnik_id, k.ime, o.bio, o.certifikati
     FROM korisnik k
     LEFT JOIN organizator o ON o.korisnik_id = k.id
     WHERE k.id = $1`,
    [korisnikId],
  );

  return rezultat.rows[0] ?? null;
}

export async function spremiProfil(
  korisnikId: number,
  bio: string | null,
  certifikati: string | null,
): Promise<Organizator> {
  const rezultat = await bazaPool.query<Organizator>(
    `INSERT INTO organizator (korisnik_id, bio, certifikati) VALUES ($1, $2, $3)
     ON CONFLICT (korisnik_id) DO UPDATE SET bio = EXCLUDED.bio, certifikati = EXCLUDED.certifikati
     RETURNING korisnik_id, bio, certifikati`,
    [korisnikId, bio, certifikati],
  );

  const redak = rezultat.rows[0];
  if (!redak) {
    throw new Error("Spremanje profila Organizatora nije vratilo zapis.");
  }

  return redak;
}
