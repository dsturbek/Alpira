CREATE TABLE recenzija (
    id SERIAL PRIMARY KEY,
    korisnik_id INT NOT NULL REFERENCES korisnik(id),
    termin_id INT NOT NULL REFERENCES termin(id) ON DELETE CASCADE,
    ocjena INT NOT NULL CHECK (ocjena BETWEEN 1 AND 5),
    komentar TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (korisnik_id, termin_id)
);

CREATE INDEX recenzija_termin_idx ON recenzija (termin_id);
