-- Datos de ejemplo de RealBlack Tattoo (usuarios, tatuadores, portfolio, vídeos,
-- blog y una cita de ejemplo). No incluye solicitudes: para eso, exporta la base
-- de datos real desde phpMyAdmin (Exportar → SQL) e impórtala en el otro equipo.
-- IMPORTANTE: importa primero schema.sql (pestaña Importar de phpMyAdmin con la base
-- "realblack" seleccionada) y después este archivo.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2a$10$lfAKbYs/elmY05n0D8YuHe68VJbiusniYBj8N/8V0pYNKjobEtDtO', 'admin'),
(2, 'manager', '$2a$10$j6e/tfqNEfHGm1PGDdO8muUGgIcySQ4IB2nJnOZ/LDE0p83xOICnK', 'manager');

INSERT INTO `artists` (`id`, `name`, `bio`, `specialty`, `image`, `created_at`) VALUES
(1, 'Nick', 'Tatuador especializado en realismo.', 'Realismo', '', '2026-10-30 16:32:04'),
(2, 'Alba', 'Tatuadora especializada en fineline.', 'Fineline', '', '2026-10-30 16:32:04'),
(5, 'Carla', 'Tatuadora especializada en fineline.', 'Fineline', '', '2026-10-30 16:32:04'),
(6, 'Gaby', 'Tatuador especializado en realismo.', 'Realismo', '', '2026-10-30 16:32:04'),
(7, 'Iris', 'Tatuadora especializada en fineline.', 'Fineline', '', '2026-10-30 16:32:04'),
(8, 'Alex', 'Tatuador especializado en realismo.', 'Realismo', '', '2026-11-02 15:23:53');

INSERT INTO `portfolio` (`id`, `title`, `description`, `artist_id`, `image`) VALUES
(1, 'Trabajo de ejemplo 1', 'Aquí aparecerá la fotografía del tatuaje y su descripción.', 1, ''),
(2, 'Trabajo de ejemplo 2', 'Aquí aparecerá la fotografía del tatuaje y su descripción.', 2, ''),
(3, 'Trabajo de ejemplo 3', 'Aquí aparecerá la fotografía del tatuaje y su descripción.', 5, '');

INSERT INTO `videos` (`id`, `title`, `url`) VALUES
(1, 'Vídeo de ejemplo', '');

INSERT INTO `appointments` (`id`, `client_name`, `client_email`, `client_phone`, `artist_name`, `style`, `date`, `time`, `notes`, `request_id`, `status`, `created_at`) VALUES
(1, 'Ana', '', '', 'Nick', '', '2026-11-05', '17:00:00', '', NULL, 'confirmada', '2026-10-30 16:32:05');

ALTER TABLE `users` AUTO_INCREMENT = 3;
ALTER TABLE `artists` AUTO_INCREMENT = 9;
ALTER TABLE `portfolio` AUTO_INCREMENT = 4;
ALTER TABLE `videos` AUTO_INCREMENT = 2;
ALTER TABLE `appointments` AUTO_INCREMENT = 2;

SET FOREIGN_KEY_CHECKS = 1;
