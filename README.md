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
