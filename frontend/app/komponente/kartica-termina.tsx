import Image from "next/image";
import { hrvatskiDatum } from "../../lib/datum";
import type { Termin } from "../../lib/javno";
import { OznakaTezine, slikaRute } from "./tezina";

export function Popunjenost({ termin }: { termin: Termin }) {
  const { potvrdenih, kapacitet } = termin.popunjenost;
  const slobodno = kapacitet - potvrdenih;

  return (
    <span className={slobodno === 0 ? "popunjeno" : "slobodno"}>
      {slobodno === 0 ? "Popunjeno" : `Slobodnih mjesta: ${slobodno} od ${kapacitet}`}
    </span>
  );
}

export function KarticaTermina({ termin }: { termin: Termin }) {
  return (
    <article className="kartica foto-kartica">
      <div className="foto-kartica-slika">
        <Image
          src={slikaRute(termin.ruta.id, termin.ruta.tezina)}
          alt=""
          fill
          sizes="(max-width: 48rem) 100vw, 21rem"
        />
        <h2>{termin.ruta.naziv}</h2>
      </div>

      <div className="foto-kartica-tijelo">
        <dl>
          <dt>Datum</dt>
          <dd>{hrvatskiDatum(termin.datum)}</dd>

          <dt>Težina</dt>
          <dd>
            <OznakaTezine tezina={termin.ruta.tezina} />
          </dd>

          <dt>Vodič</dt>
          <dd>{termin.vodic.ime}</dd>
        </dl>

        <Popunjenost termin={termin} />
      </div>
    </article>
  );
}
