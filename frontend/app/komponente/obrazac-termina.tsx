"use client";

import { useState } from "react";
import type { Ruta } from "../../lib/javno";
import type { PoPolju } from "../../lib/poruke";

export type PodaciTermina = {
  ruta_id: number;
  datum: string;
  kapacitet: number;
  je_privatan: boolean;
};

export function ObrazacTermina({
  rute,
  pocetni,
  natpis,
  radi,
  poPolju,
  naSpremi,
}: {
  rute: Ruta[];
  pocetni?: PodaciTermina;
  natpis: string;
  radi: boolean;
  poPolju: PoPolju;
  naSpremi: (podaci: PodaciTermina) => void;
}) {
  const [rutaId, postaviRutu] = useState(pocetni?.ruta_id ?? rute[0]?.id ?? 0);

  const [datum, postaviDatum] = useState(pocetni?.datum ?? "");
  const [kapacitet, postaviKapacitet] = useState(String(pocetni?.kapacitet ?? 10));
  const [jePrivatan, postaviPrivatnost] = useState(pocetni?.je_privatan ?? false);

  if (rute.length === 0) {
    return (
      <p className="prigusen">
        Katalog je prazan. Najprije unesite rutu, pa se na nju može zakazati izlet.
      </p>
    );
  }

  return (
    <form
      onSubmit={(dogadaj) => {
        dogadaj.preventDefault();

        naSpremi({
          ruta_id: rutaId,
          datum,
          kapacitet: Number(kapacitet),
          je_privatan: jePrivatan,
        });
      }}
    >
      <label htmlFor="termin-ruta">Ruta</label>
      <select
        id="termin-ruta"
        value={rutaId}
        onChange={(dogadaj) => postaviRutu(Number(dogadaj.target.value))}
      >
        {rute.map((ruta) => (
          <option key={ruta.id} value={ruta.id}>
            {ruta.naziv} ({ruta.tezina})
          </option>
        ))}
      </select>
      {poPolju.ruta_id && <p className="greska-polja">{poPolju.ruta_id}</p>}

      <label htmlFor="termin-datum">Datum</label>
      <input
        id="termin-datum"
        type="date"
        required
        value={datum}
        onChange={(dogadaj) => postaviDatum(dogadaj.target.value)}
      />
      {poPolju.datum && <p className="greska-polja">{poPolju.datum}</p>}

      <label htmlFor="termin-kapacitet">Broj mjesta</label>
      <input
        id="termin-kapacitet"
        type="number"
        min={1}
        max={1000}
        required
        value={kapacitet}
        onChange={(dogadaj) => postaviKapacitet(dogadaj.target.value)}
      />
      {poPolju.kapacitet && <p className="greska-polja">{poPolju.kapacitet}</p>}

      <label htmlFor="termin-privatan" className="sitno">
        <input
          id="termin-privatan"
          type="checkbox"
          checked={jePrivatan}
          onChange={(dogadaj) => postaviPrivatnost(dogadaj.target.checked)}
        />{" "}
        Privatan izlet, vidljiv samo preko poveznice
      </label>
      {poPolju.je_privatan && <p className="greska-polja">{poPolju.je_privatan}</p>}

      <button type="submit" disabled={radi}>
        {radi ? "Spremanje…" : natpis}
      </button>
    </form>
  );
}
