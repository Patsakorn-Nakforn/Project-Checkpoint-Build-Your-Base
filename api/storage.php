<?php
// Shared helpers for all API files: require 'storage.php';
//
// Data Contract (same shape as js/storage.js and data/*.json):
//   Portfolio = { id: "p001", name, enjoy, tried, curious, items: [Item] }
//   Item      = { id: "item001", title, type, date, role, description,
//                 skills: [..], reflection: {whatIDid, whatILearned, challenge, nextStep},
//                 evidence: [url, ...] }

// Where the data files live:
// - on your laptop (php -S localhost:8000): the folder local-data/ in your project
//   (local-data/ is in .gitignore, so it is never pushed to GitHub)
// - on EC2 (Apache): /var/www/data, OUTSIDE the public web folder /var/www/html
if (php_sapi_name() === 'cli-server') {
    define('DATA_DIR', __DIR__ . '/../local-data');
    if (!is_dir(DATA_DIR)) {
        @mkdir(DATA_DIR);                      // create it the first time
    }
} else {
    define('DATA_DIR', '/var/www/data');
}

define('DATA_FILE', DATA_DIR . '/portfolios.json');

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

// Only ONE request at a time may use the data files.
// The lock is taken on the first read and released when the request ends,
// so "read -> add one thing -> write" can never be mixed up with another request.
function lockData() {
    static $lock = null;                       // keep it for the whole request
    if ($lock === null) {
        // @ = no PHP warning on the page; we send our own JSON error instead
        $lock = @fopen(DATA_DIR . '/data.lock', 'c');
        if ($lock === false) {
            cannotSave(DATA_DIR . '/data.lock');
        }
        flock($lock, LOCK_EX);                 // wait here until it is our turn
    }
}

// Read all Portfolios from the JSON file (empty list if no file yet)
function readPortfolios() {
    lockData();
    if (!file_exists(DATA_FILE)) {
        return [];
    }
    $raw = file_get_contents(DATA_FILE);
    if (trim((string) $raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    // Never treat a broken file as "empty": the next write would erase every Portfolio.
    if (!is_array($data)) {
        sendJson(['error' => 'Data file is not valid JSON, refusing to overwrite it: ' . DATA_FILE], 500);
    }
    return $data;
}

// Write all Portfolios back to the JSON file
function writePortfolios($portfolios) {
    $json = json_encode(array_values($portfolios),
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    // Write to a temp file first, then rename: the old data stays whole if writing fails halfway
    $tmp = DATA_FILE . '.tmp';
    if ($json === false || @file_put_contents($tmp, $json) === false || !@rename($tmp, DATA_FILE)) {
        @unlink($tmp);
        cannotSave(DATA_FILE);
    }
}

// Writing failed: tell the student how to fix it
function cannotSave($file) {
    if (php_sapi_name() === 'cli-server') {
        // laptop: usually this storage.php is an old copy, or the folder is read-only
        $fix = 'On your laptop: make sure api/storage.php is the newest one from the starter, '
             . 'and that your project folder is not read-only.';
    } else {
        // EC2: usually /var/www/data is missing or not owned by www-data
        $fix = 'On EC2 run: sudo mkdir -p /var/www/data && sudo chown www-data:www-data /var/www/data';
    }
    sendJson(['error' => 'Server cannot save to ' . $file . '. ' . $fix], 500);
}

// Find a Portfolio by id. Returns its index in the list, or -1 if it does not exist.
function findPortfolioIndex($portfolios, $id) {
    foreach ($portfolios as $i => $portfolio) {
        if (($portfolio['id'] ?? null) === $id) {
            return $i;
        }
    }
    return -1;
}

// ---------------------------------------------------------------------------
// IDs: same format as js/storage.js  ->  p001, p002 ... / item001, item002 ...
// ---------------------------------------------------------------------------

// $ids = the ids that already exist. Returns prefix + (highest number + 1), 3 digits.
function generateId($prefix, $ids) {
    $max = 0;
    foreach ($ids as $id) {
        if (preg_match('/^' . preg_quote($prefix, '/') . '(\d+)$/', (string) $id, $m)) {
            $max = max($max, (int) $m[1]);
        }
    }
    return $prefix . str_pad((string) ($max + 1), 3, '0', STR_PAD_LEFT);
}

// ---------------------------------------------------------------------------
// Request / response
// ---------------------------------------------------------------------------

// Read the fields sent by JavaScript.
// - fetch(url, {body: FormData})            -> PHP puts them in $_POST
// - fetch(url, {body: JSON.stringify(...)}) -> Content-Type: application/json (Import)
function getInput() {
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            sendJson(['error' => 'Request body is not valid JSON'], 400);
        }
        return $data;
    }
    return $_POST;
}

// Only allow the listed HTTP methods, e.g. requireMethod(['GET', 'POST'])
function requireMethod($allowed) {
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        sendJson(['error' => 'Method ' . $_SERVER['REQUEST_METHOD'] . ' not allowed. Use: ' . implode(', ', $allowed)], 405);
    }
}

// A value from the request as trimmed text ('' if missing or not text)
function textValue($data, $key) {
    $v = $data[$key] ?? '';
    return is_string($v) ? trim($v) : '';
}

// Send an answer back to JavaScript as JSON, then stop
function sendJson($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Send JSON as a downloaded file, e.g. my-portfolio.json
function sendJsonDownload($data, $filename) {
    http_response_code(200);
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Validation failed: one message per field, so JavaScript can show them under the inputs
function sendValidationError($errors) {
    sendJson(['error' => 'Please check the form: ' . implode(' ', $errors), 'errors' => $errors], 400);
}
