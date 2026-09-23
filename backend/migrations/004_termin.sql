CREATE TABLE termin (
    id SERIAL PRIMARY KEY,
    ruta_id INT NOT NULL REFERENCES ruta(id),
    vodic_id INT NOT NULL REFERENCES korisnik(id),
    datum DATE NOT NULL,
    kapacitet INT NOT NULL CHECK (kapacitet > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'najavljen',
    je_privatan BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT status_poznat CHECK (status IN ('najavljen', 'zavrsen', 'otkazan'))
);

CREATE INDEX termin_vodic_idx ON termin (vodic_id);
CREATE INDEX termin_ruta_idx ON termin (ruta_id);
