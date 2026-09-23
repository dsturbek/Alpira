CREATE TABLE privatni_link (
    id SERIAL PRIMARY KEY,
    termin_id INT NOT NULL REFERENCES termin(id) ON DELETE CASCADE,
    kod VARCHAR(255) UNIQUE NOT NULL,
    aktivan BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX privatni_link_aktivan_idx ON privatni_link (kod) WHERE aktivan;
