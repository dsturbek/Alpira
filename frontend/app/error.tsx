"use client";

import Link from "next/link";

export default function Greska({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="izgubljeno">
      <span className="izgubljeno-pecat" aria-hidden="true">
        !
      </span>

      <span className="biljeska">nešto je zapelo</span>
      <h1>Zastoj na usponu</h1>
      <p>
        Greška je na našoj strani, ne na tvojoj. Pokušaj ponovno. Ako se
        zastoj ponavlja, vrati se malo kasnije.
      </p>

      <p className="izgubljeno-poveznice">
        <button type="button" onClick={() => reset()}>
          Pokušaj ponovno
        </button>
        <Link href="/" className="editorial-cta">
          Na početnu <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
