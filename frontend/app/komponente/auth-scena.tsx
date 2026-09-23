import Image from "next/image";
import type { ReactNode } from "react";
import { dohvatiJavno, type Recenzija, type Termin } from "../../lib/javno";

export async function AuthScena({ children }: { children: ReactNode }) {
  let citat: Recenzija | null = null;

  try {
    const { termini } = await dohvatiJavno<{ termini: Termin[] }>("/api/termini?status=zavrsen");
    const prvi = termini[0];
    if (prvi) {
      const { recenzije } = await dohvatiJavno<{ recenzije: Recenzija[] }>(
        `/api/termini/${prvi.id}/recenzije`,
      );
      citat = recenzije.find((recenzija) => recenzija.komentar) ?? null;
    }
  } catch {

  }

  return (
    <div className="auth-scena">
      <div className="auth-obrazac">{children}</div>

      <aside className="auth-panel">
        <figure className="auth-otisak">
          <span className="auth-foto">
            <Image
              src="/slike/magla-planine.webp"
              alt="Snježni vrhovi u plavom sumraku iznad mora magle"
              fill
              sizes="(max-width: 56rem) 0px, 24rem"
            />
          </span>
          <figcaption className="biljeska">vidimo se na vrhu →</figcaption>
        </figure>

        {citat?.komentar && (
          <figure className="auth-citat">
            <blockquote className="biljeska">„{citat.komentar}”</blockquote>
            <figcaption>{citat.korisnik.ime}, nakon izleta</figcaption>
          </figure>
        )}
      </aside>
    </div>
  );
}
