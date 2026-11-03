<?php
/**
 * Migra los datos de backend/data (db.json + *.txt) a MySQL/MariaDB.
 *
 * Requisitos: PHP (incluido en XAMPP) y los archivos de datos originales.
 * Si los borraste, recupéralos del último commit:
 *   git show HEAD:backend/data/db.json           > backend/data/db.json
 *   git show HEAD:backend/data/artists.txt        > backend/data/artists.txt
 *   git show HEAD:backend/data/appointments.txt   > backend/data/appointments.txt
 *   git show HEAD:backend/data/requests.txt       > backend/data/requests.txt
 *
 * Uso (configurable por variables de entorno):
 *   php scripts/migrate-data-to-mysql.php
 *   MYSQL_HOST=localhost MYSQL_USER=root MYSQL_PASSWORD=secret php scripts/migrate-data-to-mysql.php
 *   php scripts/migrate-data-to-mysql.php --dry   (solo imprime los INSERT, no toca la BD)
 */

$host = getenv('MYSQL_HOST') ?: 'localhost';
$port = (int) (getenv('MYSQL_PORT') ?: 3306);
$user = getenv('MYSQL_USER') ?: 'root';
$password = getenv('MYSQL_PASSWORD');
if ($password === false) {
    $password = '';
}
$database = getenv('MYSQL_DATABASE') ?: 'realblack';
$dryRun = in_array('--dry', $argv, true);

$root = dirname(__DIR__);
$files = [
    'dbJson' => "$root/backend/data/db.json",
    'artists' => "$root/backend/data/artists.txt",
    'appointments' => "$root/backend/data/appointments.txt",
    'requests' => "$root/backend/data/requests.txt",
];

foreach ($files as $label => $path) {
    if (!is_file($path)) {
        fwrite(STDERR, "Falta $path.\nRecupéralo con: git show HEAD:backend/data/" . basename($path) . " > $path\n");
        exit(1);
    }
}

$dbJson = json_decode(file_get_contents($files['dbJson']), true);
$artists = json_decode(file_get_contents($files['artists']), true);
$appointments = json_decode(file_get_contents($files['appointments']), true);
$requests = json_decode(file_get_contents($files['requests']), true);
foreach (['dbJson' => $dbJson, 'artists' => $artists, 'appointments' => $appointments, 'requests' => $requests] as $label => $decoded) {
    if ($decoded === null) {
        fwrite(STDERR, "El contenido de {$files[$label]} no es JSON válido.\n");
        exit(1);
    }
}

function q($value): string
{
    if ($value === null || is_array($value)) {
        return 'NULL';
    }
    if (is_int($value) || is_float($value)) {
        return (string) $value;
    }
    return "'" . str_replace("'", "''", (string) $value) . "'";
}

function normalize(string $column, $value)
{
    if ($value === null) {
        return null;
    }
    if ($column === 'created_at' && is_string($value)) {
        return date('Y-m-d H:i:s', strtotime($value) ?: time());
    }
    if ($column === 'time' && is_string($value)) {
        return strlen($value) === 5 ? $value . ':00' : $value;
    }
    return $value;
}

function inserts(array $rows, string $table, array $map): array
{
    $out = [];
    foreach ($rows as $row) {
        $columns = [];
        $values = [];
        foreach ($map as $column => $key) {
            $columns[] = $column;
            $values[] = q(normalize($column, $row[$key] ?? null));
        }
        $out[] = "INSERT INTO `$table` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");";
    }
    return $out;
}

$all = [];

$all = array_merge($all, inserts(
    $dbJson['users'] ?? [],
    'users',
    ['id' => 'id', 'username' => 'username', 'password' => 'password', 'role' => 'role']
));
$all = array_merge($all, inserts(
    $artists,
    'artists',
    ['id' => 'id', 'name' => 'name', 'bio' => 'bio', 'specialty' => 'specialty', 'image' => 'image', 'created_at' => 'createdAt']
));
$all = array_merge($all, inserts(
    $dbJson['portfolio'] ?? [],
    'portfolio',
    ['id' => 'id', 'title' => 'title', 'description' => 'description', 'artist_id' => 'artistId', 'image' => 'image']
));
$all = array_merge($all, inserts(
    $dbJson['videos'] ?? [],
    'videos',
    ['id' => 'id', 'title' => 'title', 'url' => 'url']
));
$all = array_merge($all, inserts(
    $dbJson['blog'] ?? [],
    'blog',
    ['id' => 'id', 'title' => 'title', 'summary' => 'summary', 'content' => 'content', 'date' => 'date']
));
$all = array_merge($all, inserts(
    $requests,
    'requests',
    ['id' => 'id', 'name' => 'name', 'email' => 'email', 'phone' => 'phone', 'artist' => 'artist',
     'style' => 'style', 'body_part' => 'bodyPart', 'size' => 'size', 'idea' => 'idea',
     'observations' => 'observations', 'status' => 'status', 'created_at' => 'createdAt']
));
$all = array_merge($all, inserts(
    $appointments,
    'appointments',
    ['id' => 'id', 'client_name' => 'clientName', 'client_email' => 'clientEmail', 'client_phone' => 'clientPhone',
     'artist_name' => 'artistName', 'style' => 'style', 'date' => 'date', 'time' => 'time',
     'notes' => 'notes', 'request_id' => 'requestId', 'status' => 'status', 'created_at' => 'createdAt']
));

foreach (['users' => $dbJson['users'] ?? [], 'artists' => $artists, 'portfolio' => $dbJson['portfolio'] ?? [],
          'videos' => $dbJson['videos'] ?? [], 'blog' => $dbJson['blog'] ?? [], 'requests' => $requests,
          'appointments' => $appointments] as $table => $rows) {
    $max = 0;
    foreach ($rows as $row) {
        $max = max($max, (int) ($row['id'] ?? 0));
    }
    $all[] = "ALTER TABLE `$table` AUTO_INCREMENT = " . ($max + 1) . ";";
}

if ($dryRun) {
    echo implode("\n", $all), "\n";
    exit(0);
}

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4", $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (PDOException $exception) {
    fwrite(STDERR, "No se pudo conectar a MySQL ($host:$port/$database): {$exception->getMessage()}\n");
    fwrite(STDERR, "Comprueba que MySQL/MariaDB esté arrancado en el panel de XAMPP.\n");
    exit(1);
}

$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$imported = 0;
foreach ($all as $statement) {
    $pdo->exec($statement);
    $imported++;
}
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

echo "Migración completada: $imported sentencias ejecutadas en $database.\n";
