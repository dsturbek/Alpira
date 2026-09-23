import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const KORAK_SEKUNDI = 30;
const ZNAMENKI = 6;

const ABECEDA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function uBase32(bajtovi: Buffer): string {
  let bitovi = 0;
  let vrijednost = 0;
  let izlaz = "";

  for (const bajt of bajtovi) {
    vrijednost = (vrijednost << 8) | bajt;
    bitovi += 8;

    while (bitovi >= 5) {
      izlaz += ABECEDA[(vrijednost >>> (bitovi - 5)) & 31];
      bitovi -= 5;
    }
  }

  if (bitovi > 0) {
    izlaz += ABECEDA[(vrijednost << (5 - bitovi)) & 31];
  }

  return izlaz;
}

export function izBase32(tekst: string): Buffer {
  let bitovi = 0;
  let vrijednost = 0;
  const bajtovi: number[] = [];

  for (const znak of tekst.toUpperCase().replace(/=+$/, "")) {
    const indeks = ABECEDA.indexOf(znak);
    if (indeks === -1) continue;

    vrijednost = (vrijednost << 5) | indeks;
    bitovi += 5;

    if (bitovi >= 8) {
      bajtovi.push((vrijednost >>> (bitovi - 8)) & 255);
      bitovi -= 8;
    }
  }

  return Buffer.from(bajtovi);
}

export function novaTajna(): string {
  return uBase32(randomBytes(20));
}

function hotp(tajna: Buffer, brojac: number, znamenki: number, algoritam: string): string {
  const poruka = Buffer.alloc(8);
  poruka.writeBigUInt64BE(BigInt(brojac));

  const sazetak = createHmac(algoritam, tajna).update(poruka).digest();
  const pomak = sazetak[sazetak.length - 1]! & 0x0f;

  const isjecak =
    ((sazetak[pomak]! & 0x7f) << 24) |
    ((sazetak[pomak + 1]! & 0xff) << 16) |
    ((sazetak[pomak + 2]! & 0xff) << 8) |
    (sazetak[pomak + 3]! & 0xff);

  return String(isjecak % 10 ** znamenki).padStart(znamenki, "0");
}

export function izracunajKod(
  tajnaBase32: string,
  trenutakSekundi: number = Math.floor(Date.now() / 1000),
  znamenki: number = ZNAMENKI,
  algoritam = "sha1",
): string {
  const brojac = Math.floor(trenutakSekundi / KORAK_SEKUNDI);

  return hotp(izBase32(tajnaBase32), brojac, znamenki, algoritam);
}

export function kodJeIspravan(
  tajnaBase32: string,
  kod: string,
  trenutakSekundi: number = Math.floor(Date.now() / 1000),
): boolean {
  for (const pomak of [-1, 0, 1]) {
    const ocekivani = izracunajKod(tajnaBase32, trenutakSekundi + pomak * KORAK_SEKUNDI);

    if (ocekivani.length === kod.length) {
      if (timingSafeEqual(Buffer.from(ocekivani), Buffer.from(kod))) return true;
    }
  }

  return false;
}

export function intervalKoda(trenutakSekundi: number = Math.floor(Date.now() / 1000)): number {
  return Math.floor(trenutakSekundi / KORAK_SEKUNDI);
}

export function otpauthUri(tajnaBase32: string, email: string, izdavatelj = "Planinarenje"): string {
  const oznaka = encodeURIComponent(`${izdavatelj}:${email}`);

  return `otpauth://totp/${oznaka}?secret=${tajnaBase32}&issuer=${encodeURIComponent(izdavatelj)}&algorithm=SHA1&digits=${ZNAMENKI}&period=${KORAK_SEKUNDI}`;
}
