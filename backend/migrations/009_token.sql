CREATE TABLE token (
    id SERIAL PRIMARY KEY,
    korisnik_id INT NOT NULL REFERENCES korisnik(id) ON DELETE CASCADE,
    tip VARCHAR(50) NOT NULL,
    kod_hash VARCHAR(255) NOT NULL,
    istice TIMESTAMP NOT NULL,
    iskoristen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT tip_tokena_poznat CHECK (tip IN ('reset_lozinke', 'verifikacija_emaila'))
);

CREATE INDEX token_hash_idx ON token (kod_hash, tip);
