import "dotenv/config";
import { z } from "zod";

const shema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL je obavezan"),
  JWT_TAJNA: z.string().min(32, "JWT_TAJNA mora imati barem 32 znaka"),
  TRAJANJE_TOKENA: z.string().min(1).default("15m"),
  TRAJANJE_KODA_MINUTA: z.coerce.number().int().positive().default(1440),
  TRAJANJE_RESET_KODA_MINUTA: z.coerce.number().int().positive().default(30),
  TRAJANJE_SESIJE_DANA: z.coerce.number().int().positive().default(30),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  DOPUSTENO_PODRIJETLO: z.string().min(1).default("http://localhost:3000"),
  GOOGLE_PREUSMJERENJE: z.string().min(1).default("http://localhost:3000/prijava/google"),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_KORISNIK: z.string().min(1).optional(),
  SMTP_LOZINKA: z.string().min(1).optional(),
  SMTP_POSILJATELJ: z.string().min(1).optional(),
  BREVO_API_KEY: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().min(1, "ADMIN_EMAIL je obavezan"),
  ADMIN_LOZINKA: z.string().min(10, "ADMIN_LOZINKA mora imati barem 10 znakova"),
});

export type Konfiguracija = {
  okolina: "development" | "production";
  port: number;
  urlBaze: string;
  jwtTajna: string;
  trajanjeTokena: string;
  trajanjeKodaMinuta: number;
  trajanjeResetKodaMinuta: number;
  trajanjeSesijeDana: number;
  googleClientId?: string;
  googleClientSecret?: string;
  googlePreusmjerenje: string;
  dopustenoPodrijetlo: string;
  smtpHost?: string;
  smtpPort: number;
  smtpKorisnik?: string;
  smtpLozinka?: string;
  smtpPosiljatelj?: string;
  brevoApiKljuc?: string;
  adminEmail: string;
  adminLozinka: string;
};

export function procitajKonfiguraciju(izvor: Record<string, string | undefined>): Konfiguracija {
  const rezultat = shema.safeParse(izvor);

  if (!rezultat.success) {
    const problemi = rezultat.error.issues
      .map((problem) => `${problem.path.join(".")}: ${problem.message}`)
      .join("; ");
    throw new Error(`Neispravna konfiguracija: ${problemi}`);
  }

  const vrijednosti = rezultat.data;

  return {
    okolina: vrijednosti.NODE_ENV,
    port: vrijednosti.PORT,
    urlBaze: vrijednosti.DATABASE_URL,
    jwtTajna: vrijednosti.JWT_TAJNA,
    trajanjeTokena: vrijednosti.TRAJANJE_TOKENA,
    trajanjeKodaMinuta: vrijednosti.TRAJANJE_KODA_MINUTA,
    trajanjeResetKodaMinuta: vrijednosti.TRAJANJE_RESET_KODA_MINUTA,
    trajanjeSesijeDana: vrijednosti.TRAJANJE_SESIJE_DANA,
    googleClientId: vrijednosti.GOOGLE_CLIENT_ID,
    googleClientSecret: vrijednosti.GOOGLE_CLIENT_SECRET,
    googlePreusmjerenje: vrijednosti.GOOGLE_PREUSMJERENJE,
    dopustenoPodrijetlo: vrijednosti.DOPUSTENO_PODRIJETLO,
    smtpHost: vrijednosti.SMTP_HOST,
    smtpPort: vrijednosti.SMTP_PORT,
    smtpKorisnik: vrijednosti.SMTP_KORISNIK,
    smtpLozinka: vrijednosti.SMTP_LOZINKA,
    smtpPosiljatelj: vrijednosti.SMTP_POSILJATELJ,
    brevoApiKljuc: vrijednosti.BREVO_API_KEY,
    adminEmail: vrijednosti.ADMIN_EMAIL,
    adminLozinka: vrijednosti.ADMIN_LOZINKA,
  };
}

export const konfiguracija = procitajKonfiguraciju(process.env);
