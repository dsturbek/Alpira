import { bazaPool } from "../db.js";

export type NaziviUloga = "Sudionik" | "Vodic" | "Admin";

export type JavniKorisnik = {
  id: number;
  ime: string;
  email: string;
  uloga: NaziviUloga;
};

export type ZapisZaStvaranje = {
  ime: string;
  email: string;
  lozinkaHash: string;
  uloga: NaziviUloga;
  emailVerificiran: boolean;
};

export async function stvoriKorisnika(zapis: ZapisZaStvaranje): Promise<JavniKorisnik> {
  const rezultat = await bazaPool.query<{ id: number; ime: string; email: string }>(
    `INSERT INTO korisnik (uloga_id, ime, email, lozinka_hash, email_verificiran)
     VALUES ((SELECT id FROM uloga WHERE naziv = $1), $2, $3, $4, $5)
     RETURNING id, ime, email`,
    [zapis.uloga, zapis.ime, zapis.email, zapis.lozinkaHash, zapis.emailVerificiran],
  );

  const redak = rezultat.rows[0];
  if (!redak) {
    throw new Error("Stvaranje Korisnika nije vratilo zapis.");
  }

  return { id: redak.id, ime: redak.ime, email: redak.email, uloga: zapis.uloga };
}

export type ZapisZaPrijavu = JavniKorisnik & {
  lozinkaHash: string | null;
  emailVerificiran: boolean;
  aktivan: boolean;
};

export async function dohvatiZaPrijavu(email: string): Promise<ZapisZaPrijavu | null> {
  const rezultat = await bazaPool.query<{
    id: number;
    ime: string;
    email: string;
    uloga: NaziviUloga;
    lozinka_hash: string | null;
    email_verificiran: boolean;
    aktivan: boolean;
  }>(
    `SELECT k.id, k.ime, k.email, u.naziv AS uloga,
            k.lozinka_hash, k.email_verificiran, k.aktivan
     FROM korisnik k
     JOIN uloga u ON u.id = k.uloga_id
     WHERE k.email = $1`,
    [email],
  );

  const redak = rezultat.rows[0];
  if (!redak) return null;

  return {
    id: redak.id,
    ime: redak.ime,
    email: redak.email,
    uloga: redak.uloga,
    lozinkaHash: redak.lozinka_hash,
    emailVerificiran: redak.email_verificiran,
    aktivan: redak.aktivan,
  };
}

export type KorisnikZaAdmina = JavniKorisnik & { aktivan: boolean };

export async function dohvatiSveKorisnike(): Promise<KorisnikZaAdmina[]> {

  const rezultat = await bazaPool.query<KorisnikZaAdmina>(
    `SELECT k.id, k.ime, k.email, u.naziv AS uloga, k.aktivan
     FROM korisnik k
     JOIN uloga u ON u.id = k.uloga_id
     ORDER BY k.id`,
  );

  return rezultat.rows;
}

export async function postojiEmail(email: string): Promise<boolean> {
  const rezultat = await bazaPool.query("SELECT 1 FROM korisnik WHERE email = $1", [email]);
  return rezultat.rowCount !== null && rezultat.rowCount > 0;
}

export async function oznaciEmailPotvrdenim(id: number): Promise<void> {
  await bazaPool.query("UPDATE korisnik SET email_verificiran = TRUE WHERE id = $1", [id]);
}

export async function dohvatiEmailKorisnika(id: number): Promise<string | null> {
  const rezultat = await bazaPool.query<{ email: string }>(
    "SELECT email FROM korisnik WHERE id = $1",
    [id],
  );

  return rezultat.rows[0]?.email ?? null;
}

export async function dohvatiIdPoEmailu(email: string): Promise<number | null> {
  const rezultat = await bazaPool.query<{ id: number }>(
    "SELECT id FROM korisnik WHERE email = $1 AND aktivan = TRUE",
    [email],
  );

  return rezultat.rows[0]?.id ?? null;
}

export async function postaviLozinku(id: number, lozinkaHash: string): Promise<void> {
  await bazaPool.query("UPDATE korisnik SET lozinka_hash = $2 WHERE id = $1", [id, lozinkaHash]);
}

export type StanjeMfa = {
  totpTajna: string | null;
  mfaAktivan: boolean;
  lozinkaHash: string | null;
};

export async function dohvatiStanjeMfa(id: number): Promise<StanjeMfa | null> {
  const rezultat = await bazaPool.query<{
    totp_tajna: string | null;
    mfa_aktivan: boolean;
    lozinka_hash: string | null;
  }>("SELECT totp_tajna, mfa_aktivan, lozinka_hash FROM korisnik WHERE id = $1", [id]);

  const redak = rezultat.rows[0];
  if (!redak) return null;

  return {
    totpTajna: redak.totp_tajna,
    mfaAktivan: redak.mfa_aktivan,
    lozinkaHash: redak.lozinka_hash,
  };
}

export async function postaviTotpTajnu(id: number, tajna: string | null): Promise<void> {
  await bazaPool.query("UPDATE korisnik SET totp_tajna = $2 WHERE id = $1", [id, tajna]);
}

export async function postaviMfa(id: number, aktivan: boolean): Promise<void> {
  await bazaPool.query("UPDATE korisnik SET mfa_aktivan = $2 WHERE id = $1", [id, aktivan]);
}

export async function zauzmiTotpInterval(id: number, interval: number): Promise<boolean> {
  const rezultat = await bazaPool.query(
    `UPDATE korisnik SET totp_zadnji_interval = $2
     WHERE id = $1 AND (totp_zadnji_interval IS NULL OR totp_zadnji_interval < $2)`,
    [id, interval],
  );

  return (rezultat.rowCount ?? 0) > 0;
}

export async function dohvatiZaPrijavuPoId(id: number): Promise<ZapisZaPrijavu | null> {
  const rezultat = await bazaPool.query<{
    id: number;
    ime: string;
    email: string;
    uloga: NaziviUloga;
    lozinka_hash: string | null;
    email_verificiran: boolean;
    aktivan: boolean;
  }>(
    `SELECT k.id, k.ime, k.email, u.naziv AS uloga,
            k.lozinka_hash, k.email_verificiran, k.aktivan
     FROM korisnik k JOIN uloga u ON u.id = k.uloga_id WHERE k.id = $1`,
    [id],
  );

  const redak = rezultat.rows[0];
  if (!redak) return null;

  return {
    id: redak.id,
    ime: redak.ime,
    email: redak.email,
    uloga: redak.uloga,
    lozinkaHash: redak.lozinka_hash,
    emailVerificiran: redak.email_verificiran,
    aktivan: redak.aktivan,
  };
}

export async function postojiKorisnik(id: number): Promise<boolean> {
  const rezultat = await bazaPool.query("SELECT 1 FROM korisnik WHERE id = $1", [id]);

  return (rezultat.rowCount ?? 0) > 0;
}

export async function promijeniUlogu(id: number, uloga: NaziviUloga): Promise<JavniKorisnik | null> {
  const rezultat = await bazaPool.query<JavniKorisnik>(
    `UPDATE korisnik SET uloga_id = (SELECT id FROM uloga WHERE naziv = $2) WHERE id = $1
     RETURNING id, ime, email, $2::text AS uloga`,
    [id, uloga],
  );

  return rezultat.rows[0] ?? null;
}

export async function postaviAktivan(id: number, aktivan: boolean): Promise<void> {
  const veza = await bazaPool.connect();

  try {
    await veza.query("BEGIN");
    await veza.query("UPDATE korisnik SET aktivan = $2 WHERE id = $1", [id, aktivan]);

    if (!aktivan) {
      await veza.query("UPDATE sesija SET opozvan = TRUE WHERE korisnik_id = $1 AND NOT opozvan", [
        id,
      ]);
    }

    await veza.query("COMMIT");
  } catch (greska) {
    await veza.query("ROLLBACK");
    throw greska;
  } finally {
    veza.release();
  }
}

export async function dohvatiPoGoogleId(googleId: string): Promise<ZapisZaPrijavu | null> {
  const rezultat = await bazaPool.query<{ id: number }>(
    "SELECT id FROM korisnik WHERE google_id = $1",
    [googleId],
  );

  const id = rezultat.rows[0]?.id;
  return id === undefined ? null : dohvatiZaPrijavuPoId(id);
}

export async function poveziGoogle(id: number, googleId: string): Promise<void> {
  await bazaPool.query("UPDATE korisnik SET google_id = $2 WHERE id = $1", [id, googleId]);
}

export async function stvoriGoogleKorisnika(
  ime: string,
  email: string,
  googleId: string,
): Promise<number> {
  const rezultat = await bazaPool.query<{ id: number }>(
    `INSERT INTO korisnik (uloga_id, ime, email, google_id, email_verificiran)
     VALUES ((SELECT id FROM uloga WHERE naziv = 'Sudionik'), $1, $2, $3, TRUE)
     RETURNING id`,
    [ime, email, googleId],
  );

  return rezultat.rows[0]!.id;
}
