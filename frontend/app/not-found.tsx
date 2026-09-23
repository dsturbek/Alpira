import Link from "next/link";

export default function NijePronadeno() {
  return (
    <section className="izgubljeno">
      <span className="izgubljeno-pecat" aria-hidden="true">
        404
      </span>

      <span className="biljeska">izgubljena staza?</span>
      <h1>Skrenuo si sa staze</h1>
      <p>
        Ova stranica ne postoji. Poveznica je kriva ili je staza u
        međuvremenu preimenovana. Vrati se na označeni put.
      </p>

      <svg className="izgubljeno-staza" viewBox="0 0 320 40" aria-hidden="true">
        <path
          d="M6 32 C 60 6, 110 38, 168 20 S 270 4, 314 26"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="1 10"
        />
      </svg>

      <p className="izgubljeno-poveznice">
        <Link href="/" className="gumb">
          Na početnu
        </Link>
        <Link href="/rute" className="editorial-cta">
          Katalog ruta <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
