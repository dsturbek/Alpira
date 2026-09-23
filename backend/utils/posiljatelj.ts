import nodemailer, { type Transporter } from "nodemailer";
import { konfiguracija } from "../konfiguracija.js";

export type Poruka = {
  prima: string;
  predmet: string;
  kod: string;
  poveznica?: string;
};

let prijenosnik: Transporter | null = null;

function dohvatiPrijenosnik(): Transporter | null {
  if (!konfiguracija.smtpHost || !konfiguracija.smtpKorisnik || !konfiguracija.smtpLozinka) {
    return null;
  }

  prijenosnik ??= nodemailer.createTransport({
    host: konfiguracija.smtpHost,
    port: konfiguracija.smtpPort,
    secure: konfiguracija.smtpPort === 465,
    auth: {
      user: konfiguracija.smtpKorisnik,
      pass: konfiguracija.smtpLozinka,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return prijenosnik;
}

function tekstPoruke(poruka: Poruka): string {
  return poruka.poveznica
    ? `Vaš kod: ${poruka.kod}\n\nIli otvorite poveznicu:\n${poruka.poveznica}\n`
    : `Vaš kod: ${poruka.kod}\n`;
}

function pobjegniHtml(tekst: string): string {
  return tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlPoruke(poruka: Poruka): string {
  const kod = `<p>Vaš kod: <strong>${pobjegniHtml(poruka.kod)}</strong></p>`;

  if (!poruka.poveznica) return kod;

  const adresa = pobjegniHtml(poruka.poveznica);

  return `${kod}<p>Ili otvorite poveznicu:</p><p><a href="${adresa}">${adresa}</a></p>`;
}

function razlozenPosiljatelj(): { name?: string; email: string } {
  const sirovo = konfiguracija.smtpPosiljatelj ?? konfiguracija.smtpKorisnik ?? "";
  const dijelovi = /^(.*)<(.+)>$/.exec(sirovo);
  const ime = dijelovi?.[1]?.trim();
  const adresa = dijelovi?.[2]?.trim() ?? sirovo;

  return ime ? { name: ime, email: adresa } : { email: adresa };
}

async function posaljiPrekoApija(kljuc: string, poruka: Poruka): Promise<void> {
  const odgovor = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": kljuc, "content-type": "application/json" },
    body: JSON.stringify({
      sender: razlozenPosiljatelj(),
      to: [{ email: poruka.prima }],
      subject: poruka.predmet,
      textContent: tekstPoruke(poruka),
      htmlContent: htmlPoruke(poruka),
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!odgovor.ok) {
    throw new Error(`Brevo API je odgovorio ${odgovor.status}: ${await odgovor.text()}`);
  }
}

export async function posaljiEmail(poruka: Poruka): Promise<void> {
  if (konfiguracija.brevoApiKljuc) {
    await posaljiPrekoApija(konfiguracija.brevoApiKljuc, poruka);
    return;
  }

  const prijenos = dohvatiPrijenosnik();

  if (prijenos) {
    await prijenos.sendMail({
      from: konfiguracija.smtpPosiljatelj ?? konfiguracija.smtpKorisnik,
      to: poruka.prima,
      subject: poruka.predmet,
      text: tekstPoruke(poruka),
      html: htmlPoruke(poruka),
    });
    return;
  }

  if (konfiguracija.okolina === "production") {
    throw new Error("Slanje e-maila nije konfigurirano.");
  }

  console.log(`[e-mail] ${poruka.prima}, ${poruka.predmet}: ${poruka.poveznica ?? poruka.kod}`);
}
