CREATE TABLE korisnik (
    id SERIAL PRIMARY KEY,
    uloga_id INT NOT NULL REFERENCES uloga(id),
    ime VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    lozinka_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    totp_tajna VARCHAR(255),
    mfa_aktivan BOOLEAN NOT NULL DEFAULT FALSE,
    email_verificiran BOOLEAN NOT NULL DEFAULT FALSE,
    aktivan BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT barem_jedna_metoda_prijave
        CHECK (lozinka_hash IS NOT NULL OR google_id IS NOT NULL)
);
