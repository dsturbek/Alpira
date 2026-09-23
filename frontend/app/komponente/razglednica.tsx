import Image from "next/image";
import Link from "next/link";
import { danIKratkiMjesec } from "../../lib/datum";
import { NAZIV_STATUSA_TERMINA } from "../../lib/nazivi";
import type { Termin } from "../../lib/javno";
import { IkonaTezine, slikaRute } from "./tezina";

export function Razglednica({ termin }: { termin: Termin }) {
  const { dan, mjesec } = danIKratkiMjesec(termin.datum);
  const slobodno = termin.popunjenost.kapacitet - termin.popunjenost.potvrdenih;
  const najavljen = termin.status === "najavljen";

  return (
    <Link
      href={`/termini/${termin.id}`}
      className={najavljen ? "razglednica" : "razglednica prosla"}
    >
      <span className="razglednica-slika">
        <Image src={slikaRute(termin.ruta.id, termin.ruta.tezina)} alt="" fill sizes="10rem" />
      </span>

      <span className="razglednica-tijelo">
        <span className="biljeska">
          {dan}. {mjesec}
        </span>
        <h3>{termin.ruta.naziv}</h3>
        <p>
          vodi {termin.vodic.ime}
          {termin.je_privatan && " · privatan"}
        </p>
      </span>

      <span className="razglednica-adresa">
        <span className={`pecat tezina-${termin.ruta.tezina}`}>
          <IkonaTezine tezina={termin.ruta.tezina} />
          {termin.ruta.tezina}
        </span>

        {najavljen ? (
          <>
            <span className={slobodno === 0 ? "popunjeno" : "slobodno"}>
              {slobodno === 0 ? "Popunjeno" : `${slobodno} slobodnih mjesta`}
            </span>
            <span className="razglednica-cta">
              Pogledaj termin
              <svg viewBox="0 0 16 12" fill="none" aria-hidden="true">
                <path
                  d="M1 6h13m0 0L9.5 1.5M14 6l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </>
        ) : (
          <span className="razglednica-status">{NAZIV_STATUSA_TERMINA[termin.status]}</span>
        )}
      </span>
    </Link>
  );
}
