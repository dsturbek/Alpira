import { konfiguracija, type Konfiguracija } from "../konfiguracija.js";

export type GoogleProfil = {
  googleId: string;
  email: string;
  emailVerified: boolean;
};

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PROFIL_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

type SGoogleom = Konfiguracija & { googleClientId: string; googleClientSecret: string };

export function googleKonfiguriran(
  postavke: Konfiguracija = konfiguracija,
): postavke is SGoogleom {
  return Boolean(postavke.googleClientId && postavke.googleClientSecret);
}

export async function dohvatiGoogleProfil(
  kod: string,
  preusmjerenje: string,
): Promise<GoogleProfil | null> {
  if (!googleKonfiguriran(konfiguracija)) {
    throw new Error("Prijava Googleom nije konfigurirana.");
  }

  const odgovor = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: kod,
      client_id: konfiguracija.googleClientId,
      client_secret: konfiguracija.googleClientSecret,
      redirect_uri: preusmjerenje,
      grant_type: "authorization_code",
    }),
  });

  if (!odgovor.ok) return null;

  const { access_token } = (await odgovor.json()) as { access_token?: string };
  if (!access_token) return null;

  const profil = await fetch(PROFIL_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profil.ok) return null;

  const podaci = (await profil.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  };

  if (!podaci.sub || !podaci.email) return null;

  return {
    googleId: podaci.sub,
    email: podaci.email.toLowerCase(),
    emailVerified: podaci.email_verified === true,
  };
}
