CREATE TABLE organizator (
    id SERIAL PRIMARY KEY,
    korisnik_id INT UNIQUE NOT NULL REFERENCES korisnik(id) ON DELETE CASCADE,
    bio TEXT,
    certifikati TEXT
);
