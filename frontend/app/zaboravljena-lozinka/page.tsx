"use client";

import { useState } from "react";
import Link from "next/link";
import { koristiIdentitet } from "../../lib/auth";

export default function ZaboravljenaLozinka() {
  const { klijent } = koristiIdentitet();

  const [email, postaviEmail] = useState("");
  const [poslano, postaviPoslano] = useState(false);
  const [salje, postaviSalje] = useState(false);

  async function posalji(dogadaj: React.FormEvent) {
    dogadaj.preventDefault();
    postaviSalje(true);

    try {
      await klijent.post("/api/auth/reset-lozinke", { email });
    } catch {

    } finally {
      postaviPoslano(true);
      postaviSalje(false);
    }
  }

  if (poslano) {
    return (
      <div className="usko">
        <h1>Provjerite sandučić</h1>
        <p>
          Ako račun s adresom <strong>{email}</strong> postoji, poslali smo poruku s poveznicom za
          postavljanje nove lozinke.
        </p>
        <p className="prigusen sitno">Poveznica vrijedi kratko, otvorite ju čim stigne.</p>
        <p>
          <Link href="/prijava">Natrag na prijavu</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="usko">
      <h1>Zaboravljena lozinka</h1>
      <p className="prigusen">Upišite adresu računa i poslat ćemo poveznicu za novu lozinku.</p>

      <form onSubmit={(d) => void posalji(d)}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(d) => postaviEmail(d.target.value)}
        />

        <button type="submit" disabled={salje}>
          {salje ? "Slanje…" : "Pošalji poveznicu"}
        </button>
      </form>
    </div>
  );
}
