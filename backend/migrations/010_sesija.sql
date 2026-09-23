CREATE TABLE sesija (
    id SERIAL PRIMARY KEY,
    korisnik_id INT NOT NULL REFERENCES korisnik(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    istice TIMESTAMP NOT NULL,
    opozvan BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX sesija_hash_idx ON sesija (refresh_token_hash) WHERE NOT opozvan;
CREATE INDEX sesija_korisnik_idx ON sesija (korisnik_id);
