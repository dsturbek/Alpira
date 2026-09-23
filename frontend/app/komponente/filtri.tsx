"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

export function Filtar({
  ime,
  oznaka,
  children,
}: {
  ime: string;
  oznaka: string;
  children: ReactNode;
}) {
  const usmjerivac = useRouter();
  const putanja = usePathname();
  const parametri = useSearchParams();

  function promijeni(vrijednost: string) {
    const novi = new URLSearchParams(parametri.toString());

    if (vrijednost) {
      novi.set(ime, vrijednost);
    } else {
      novi.delete(ime);
    }

    usmjerivac.push(`${putanja}${novi.toString() ? `?${novi}` : ""}`);
  }

  return (
    <label className="filtar">
      <span>{oznaka}</span>
      <select value={parametri.get(ime) ?? ""} onChange={(d) => promijeni(d.target.value)}>
        {children}
      </select>
    </label>
  );
}

export function Pretraga({ ime, oznaka }: { ime: string; oznaka: string }) {
  const usmjerivac = useRouter();
  const putanja = usePathname();
  const parametri = useSearchParams();

  function posalji(dogadaj: React.FormEvent<HTMLFormElement>) {
    dogadaj.preventDefault();

    const podaci = new FormData(dogadaj.currentTarget);
    const vrijednost = String(podaci.get(ime) ?? "").trim();
    const novi = new URLSearchParams(parametri.toString());

    if (vrijednost) {
      novi.set(ime, vrijednost);
    } else {
      novi.delete(ime);
    }

    usmjerivac.push(`${putanja}${novi.toString() ? `?${novi}` : ""}`);
  }

  return (
    <form className="pretraga" onSubmit={posalji}>
      <label htmlFor={ime}>{oznaka}</label>
      <input id={ime} name={ime} defaultValue={parametri.get(ime) ?? ""} />
      <button type="submit">Traži</button>
    </form>
  );
}

export function FiltarDatuma({ ime, oznaka }: { ime: string; oznaka: string }) {
  const usmjerivac = useRouter();
  const putanja = usePathname();
  const parametri = useSearchParams();

  function promijeni(vrijednost: string) {
    const novi = new URLSearchParams(parametri.toString());

    if (vrijednost) {
      novi.set(ime, vrijednost);
    } else {
      novi.delete(ime);
    }

    usmjerivac.push(`${putanja}${novi.toString() ? `?${novi}` : ""}`);
  }

  return (
    <label className="filtar">
      <span>{oznaka}</span>
      <input
        type="date"
        value={parametri.get(ime) ?? ""}
        onChange={(d) => promijeni(d.target.value)}
      />
    </label>
  );
}
