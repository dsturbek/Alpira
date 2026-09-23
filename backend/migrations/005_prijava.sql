CREATE TABLE prijava (
    id SERIAL PRIMARY KEY,
    korisnik_id INT NOT NULL REFERENCES korisnik(id),
    termin_id INT NOT NULL REFERENCES termin(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'na_cekanju',
    napomena TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (korisnik_id, termin_id),
    CONSTRAINT status_prijave_poznat CHECK (status IN ('na_cekanju', 'potvrdeno', 'odbijeno'))
);

CREATE INDEX prijava_termin_idx ON prijava (termin_id);
