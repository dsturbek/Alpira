"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export function Karusel({ children }: { children: ReactNode }) {
  const traka = useRef<HTMLDivElement>(null);
  const [mozeLijevo, postaviLijevo] = useState(false);
  const [mozeDesno, postaviDesno] = useState(false);

  const izmjeri = useCallback(() => {
    const element = traka.current;
    if (!element) return;

    postaviLijevo(element.scrollLeft > 8);
    postaviDesno(element.scrollLeft + element.clientWidth < element.scrollWidth - 8);
  }, []);

  useEffect(() => {
    izmjeri();

    window.addEventListener("resize", izmjeri);
    return () => window.removeEventListener("resize", izmjeri);
  }, [izmjeri]);

  function pomakni(smjer: -1 | 1) {
    const element = traka.current;
    if (!element) return;

    const kartica = element.firstElementChild;
    const korak = kartica instanceof HTMLElement ? kartica.offsetWidth + 20 : element.clientWidth * 0.8;
    const glatko = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    element.scrollBy({ left: smjer * korak, behavior: glatko ? "smooth" : "auto" });
  }

  return (
    <div className="karusel-omot">
      <button
        type="button"
        className="karusel-strelica lijevo"
        aria-label="Prethodne rute"
        disabled={!mozeLijevo}
        onClick={() => pomakni(-1)}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 2.5 4.5 8 10 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="karusel" ref={traka} onScroll={izmjeri}>
        {children}
      </div>

      <button
        type="button"
        className="karusel-strelica desno"
        aria-label="Sljedeće rute"
        disabled={!mozeDesno}
        onClick={() => pomakni(1)}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 2.5 11.5 8 6 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
