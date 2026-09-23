CREATE TABLE uloga (
    id SERIAL PRIMARY KEY,
    naziv VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO uloga (naziv) VALUES ('Sudionik'), ('Vodic'), ('Admin');
