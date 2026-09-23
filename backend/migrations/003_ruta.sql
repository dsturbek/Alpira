CREATE TABLE ruta (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(255) NOT NULL,
    opis TEXT,
    tezina VARCHAR(50) NOT NULL,
    CONSTRAINT tezina_poznata CHECK (tezina IN ('lagana', 'srednja', 'zahtjevna'))
);
