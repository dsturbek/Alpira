export function PoderaniRub({ naVrhu = false }: { naVrhu?: boolean }) {
  return (
    <svg
      className={naVrhu ? "poderani-rub na-vrhu" : "poderani-rub"}
      viewBox="0 0 1200 44"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M0 44V25l28-6 23 9 34-13 26 8 39-11 31 12 27-15 36 9 29-6 33 13 41-16 24 10 38-8 27 12 35-14 30 7 42-10 25 13 37-9 28 5 32-12 39 14 26-8 34 10 29-13 36 6 31 11 38-15 27 9 33-5 40 12 24-10 35 7 30-11 37 13 28-7 34 9V44Z"
      />
    </svg>
  );
}

export function Zvjezdice({ ocjena }: { ocjena: number }) {
  return (
    <span className="zvjezdice" role="img" aria-label={`Ocjena ${ocjena} od 5`}>
      {[1, 2, 3, 4, 5].map((redna) => (
        <svg
          key={redna}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={redna <= ocjena ? undefined : "prazna"}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export function PostanskiZig({ natpis, datum }: { natpis: string; datum: string }) {
  return (
    <svg viewBox="0 0 136 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="32" cy="32" r="22.5" stroke="currentColor" strokeWidth="1" />
      <text
        x="32"
        y="29.5"
        textAnchor="middle"
        fill="currentColor"
        fontSize={natpis.length > 8 ? 6.2 : 7}
        fontWeight="700"
        letterSpacing="0.8"
        fontFamily="inherit"
      >
        {natpis}
      </text>
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fill="currentColor"
        fontSize="6.5"
        fontWeight="500"
        letterSpacing="0.5"
        fontFamily="inherit"
      >
        {datum}
      </text>
      <path
        d="M66 20q8 -5 16 0t16 0 16 0 16 0M66 32q8 -5 16 0t16 0 16 0 16 0M66 44q8 -5 16 0t16 0 16 0 16 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
