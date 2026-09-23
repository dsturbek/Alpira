import Link from "next/link";
import { ZnakAlpire } from "./znak";

function Konture() {
  return (
    <svg className="podnozje-konture" viewBox="0 0 600 260" preserveAspectRatio="none" aria-hidden="true">
      {[
        "M0 60 C 90 30, 200 85, 310 55 S 520 20, 600 50",
        "M0 120 C 110 85, 230 140, 340 110 S 540 75, 600 105",
        "M0 180 C 100 145, 220 200, 330 170 S 530 135, 600 165",
        "M0 240 C 120 205, 240 255, 350 225 S 550 195, 600 225",
      ].map((staza) => (
        <path key={staza} d={staza} fill="none" stroke="currentColor" strokeWidth="1" />
      ))}
    </svg>
  );
}

export function Podnozje() {
  return (
    <footer className="podnozje">
      <Konture />

      <div className="podnozje-sadrzaj">
        <div className="podnozje-marka">
          <Link href="/" className="marka">
            <ZnakAlpire />
            <span className="logo">Alpira</span>
          </Link>
          <p>
            Organizirani planinarski izleti s provjerenim vodičima. Ti biraš
            planinu, o svemu ostalom brine vodič.
          </p>
        </div>

        <nav className="podnozje-kolona" aria-label="Istraži">
          <h3>Istraži</h3>
          <Link href="/rute">Rute</Link>
          <Link href="/termini">Raspored</Link>
          <Link href="/galerija">Galerija</Link>
          <Link href="/#vodici">Vodiči</Link>
          <Link href="/#pitanja">Česta pitanja</Link>
        </nav>

        <nav className="podnozje-kolona" aria-label="Račun">
          <h3>Račun</h3>
          <Link href="/prijava">Prijava</Link>
          <Link href="/registracija">Registracija</Link>
          <Link href="/prijave">Moje prijave</Link>
        </nav>
      </div>

      <div className="podnozje-dno">
        <p>
          © {new Date().getFullYear()} Alpira · Dorian Šturbek
        </p>

        <svg className="podnozje-crta" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M4 12 C 40 2, 80 14, 120 7 S 180 3, 196 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="1 7"
          />
        </svg>

        <p className="podnozje-moto">Iznad oblaka se ide pješice.</p>
      </div>
    </footer>
  );
}
