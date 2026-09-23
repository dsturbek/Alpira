import {
  dohvatiJavniProfil,
  dohvatiProfil,
  spremiProfil,
  type JavniOrganizator,
  type Organizator,
} from "../dao/organizator.js";
import { GreskaNijePronadeno } from "../utils/greske.js";
import type { SadrzajTokena } from "../utils/jwt.js";

export async function mojProfil(korisnik: SadrzajTokena): Promise<Organizator> {
  const profil = await dohvatiProfil(korisnik.korisnik_id);

  return profil ?? { korisnik_id: korisnik.korisnik_id, bio: null, certifikati: null };
}

export async function spremiMojProfil(
  korisnik: SadrzajTokena,
  bio: string | null,
  certifikati: string | null,
): Promise<Organizator> {
  return spremiProfil(korisnik.korisnik_id, bio, certifikati);
}

export async function javniProfil(korisnikId: number): Promise<JavniOrganizator> {
  const profil = await dohvatiJavniProfil(korisnikId);

  if (!profil) {
    throw new GreskaNijePronadeno("Korisnik ne postoji.");
  }

  return profil;
}
