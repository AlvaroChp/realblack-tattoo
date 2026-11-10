-- Esquema RealBlack Tattoo para MySQL / MariaDB (importable desde phpMyAdmin).
-- Crea la base de datos y todas las tablas. Idempotente: puede ejecutarse varias veces.

CREATE DATABASE IF NOT EXISTS realblack
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE realblack;

CREATE TABLE IF NOT EXISTS users (
    id       BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role     VARCHAR(20)  NOT NULL DEFAULT 'manager'
             CHECK (role IN ('admin', 'manager'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS artists (
    id         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    bio        TEXT        NOT NULL,
    specialty  VARCHAR(120) NOT NULL DEFAULT '',
    image      LONGTEXT    NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS portfolio (
    id          BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT        NOT NULL,
    artist_id   BIGINT      NULL,
    image       LONGTEXT    NOT NULL,
    CONSTRAINT fk_portfolio_artist FOREIGN KEY (artist_id)
        REFERENCES artists(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS videos (
    id    BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    url   TEXT        NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS requests (
    id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    email        VARCHAR(200) NOT NULL,
    phone        VARCHAR(50)  NOT NULL,
    artist       VARCHAR(120) NULL,
    style        VARCHAR(150) NOT NULL DEFAULT '',
    body_part    VARCHAR(150) NOT NULL DEFAULT '',
    size         VARCHAR(100) NOT NULL DEFAULT '',
    idea         TEXT        NOT NULL,
    observations TEXT        NOT NULL,
    reference_image LONGTEXT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente', 'aceptada', 'rechazada')),
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
    id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    client_name  VARCHAR(150) NOT NULL,
    client_email VARCHAR(200) NOT NULL DEFAULT '',
    client_phone VARCHAR(50)  NOT NULL DEFAULT '',
    artist_name  VARCHAR(120) NOT NULL,
    style        VARCHAR(150) NOT NULL DEFAULT '',
    date         DATE        NULL,
    time         TIME        NULL,
    notes        TEXT        NOT NULL,
    request_id   BIGINT      NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'confirmada'
                 CHECK (status IN ('confirmada', 'pendiente', 'cancelada', 'completada')),
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointments_request FOREIGN KEY (request_id)
        REFERENCES requests(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Migración para tablas creadas con un esquema antiguo ──────────────────
-- `CREATE TABLE IF NOT EXISTS` no añade columnas nuevas a tablas ya existentes.
-- Ejecuta esto una vez si tu base de datos es previa a la migración a MySQL.
-- En bases de datos recién creadas arriba, estas líneas fallan con "Duplicate
-- column name": ignóralo o ejecútalas una a una.
ALTER TABLE requests     ADD COLUMN reference_image LONGTEXT NULL AFTER observations;
ALTER TABLE artists      MODIFY COLUMN image LONGTEXT NULL;
ALTER TABLE portfolio    MODIFY COLUMN image LONGTEXT NULL;
ALTER TABLE appointments ADD COLUMN client_email VARCHAR(200) NOT NULL DEFAULT '' AFTER client_name;
ALTER TABLE appointments ADD COLUMN client_phone VARCHAR(50)  NOT NULL DEFAULT '' AFTER client_email;
ALTER TABLE appointments ADD COLUMN style        VARCHAR(150) NOT NULL DEFAULT '' AFTER artist_name;
ALTER TABLE appointments ADD COLUMN request_id   BIGINT NULL AFTER notes;

-- ── Nota para producción / otros equipos ─────────────────────────────────
-- Las imágenes se guardan en la base de datos como texto Base64 (LONGTEXT),
-- por lo que MySQL/MariaDB necesita un `max_allowed_packet` mayor que el
-- valor por defecto (1 MB). Añádelo en el [mysqld] de tu my.cnf, p. ej. en
-- XAMPP: /opt/lampp/etc/my.cnf  →  max_allowed_packet=64M
-- (en la sesión actual ya está aplicado con SET GLOBAL; se pierde al reiniciar).
