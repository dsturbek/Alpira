# Alpira

Web aplikacija za organizirane planinarske izlete. Vodiči objavljuju termine
izleta po rutama, sudionici se prijavljuju, a vodič svaku prijavu potvrđuje
ili odbija. Nakon izleta sudionici mogu ostaviti recenziju.

Praktični dio završnog rada "Usporedba metoda autentikacije i autorizacije
za web aplikacije i servise" (FOI, 2026).

## Tehnologije

- Backend: Node.js, Express, TypeScript, PostgreSQL
- Frontend: Next.js, React, TypeScript
- Autentikacija: Argon2id, JWT, sesije s rotacijom, TOTP (2FA), OAuth 2.0 (Google)

## Autentikacija i autorizacija

Tema rada je usporedba metoda, pa aplikacija ne bira jednu nego ih
implementira više usporedno i pušta ih raditi zajedno. To što na prvi pogled
izgleda kao višak — i JWT i sesije u istoj aplikaciji — predmet je usporedbe:
svaka metoda pokriva dio problema koji druga ne pokriva, a tek se u kodu koji
radi vidi gdje su im granice.

| Metoda | Kako je izvedena | Gdje |
| --- | --- | --- |
| Lozinke | Argon2id, 19 MiB memorije, 2 iteracije, 1 dretva (parametri po OWASP preporuci) | `backend/utils/lozinke.ts` |
| Pristupni token | JWT, simetrično potpisan, traje 15 minuta; putuje u `Authorization: Bearer` zaglavlju, a na klijentu živi samo u memoriji — nikad u `localStorage` | `backend/utils/jwt.ts`, `frontend/lib/klijent.ts` |
| Sesija i obnova | Neproziran slučajan token od 48 bajtova; u bazi se čuva samo SHA-256 otisak, kod klijenta je u `httpOnly` kolačiću ograničenom na `/api/auth`. Pri svakoj obnovi rotira se u jednoj transakciji: stari se opoziva, novi izdaje | `backend/dao/sesija.ts` |
| Dvofaktorska prijava | TOTP po RFC 6238, implementiran ručno (30 s, 6 znamenki, usporedba kroz `timingSafeEqual`). Između lozinke i koda stoji prijelazni JWT sa svrhom `mfa` koji vrijedi 5 minuta | `backend/utils/totp.ts` |
| OAuth 2.0 | Prijava Googleom, authorization code tok; kod se razmjenjuje na poslužitelju pa `client_secret` nikad ne dođe u preglednik, a `state` parametar štiti od CSRF-a | `backend/utils/google.ts`, `frontend/lib/google.ts` |

Autorizacija je razdvojena na tri neovisna sloja, svaki sa svojim middlewareom:

- **Uloge (RBAC)** — Sudionik, Vodič i Admin poredani su po rangu, pa ruta
  traži najmanju potrebnu ulogu umjesto da nabraja dopuštene
  (`backend/middleware/ovlasti.ts`)
- **Verificiran e-mail** — zasebna provjera, jer neke radnje traže potvrđenu
  adresu neovisno o ulozi
- **Vlasništvo nad resursom** — vodič smije uređivati samo svoje termine,
  admin sve (`backend/services/vlasnistvo.ts`)

Uz to, rute za prijavu, registraciju i 2FA ograničene su na 10 pokušaja u 15
minuta (`backend/middleware/ogranicenje.ts`).

Aplikacija i komentari u kodu pisani su hrvatski, pa su takvi i nazivi
funkcija i varijabli.

## Pokretanje

Treba PostgreSQL 16 i Node.js 22 ili noviji.

Backend:

    cd backend
    npm install
    copy .env.example .env      (pa urediti vrijednosti)
    npm run postavi-baze
    npm run migriraj
    npm run dev

Frontend (u drugom terminalu):

    cd frontend
    npm install
    copy .env.example .env.local      (nije nužno za lokalno pokretanje)
    npm run dev

Aplikacija je na http://localhost:3000, API na http://localhost:4000.

Migracije uz prvo pokretanje stvaraju administratorski račun iz
ADMIN_EMAIL i ADMIN_LOZINKA varijabli u .env datoteci.

Prijava Googleom radi tek kad se popune GOOGLE_CLIENT_ID i
GOOGLE_CLIENT_SECRET; bez njih se ta opcija jednostavno ne prikaže.

## Licencija

MIT — vidi [LICENSE](LICENSE).
