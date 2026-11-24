<?php
// api/sync.php
// ที่เก็บข้อมูล Portfolio กลาง ให้ทุกเครื่องเห็นข้อมูลชุดเดียวกัน
//   GET  api/sync.php -> { version, portfolios }  (ข้อมูลทั้งหมดบน server)
//   POST api/sync.php  body: { baseVersion, portfolios }  -> บันทึกทั้งชุด
//        baseVersion = version ที่ได้จาก GET ล่าสุด
//        ถ้าระหว่างนั้นมีคนอื่นบันทึกไปก่อน จะตอบ 409 พร้อมข้อมูลล่าสุด (ข้อมูลของคนอื่นจึงไม่ถูกเขียนทับ)
// js/storage.js เป็นตัวเรียกไฟล์นี้
require 'storage.php';

requireMethod(['GET', 'POST']);
header('Cache-Control: no-store');

const MAX_BODY_BYTES = 2 * 1024 * 1024;   // 2 MB
const MAX_PORTFOLIOS = 200;
const MAX_ITEMS = 500;                    // ต่อ 1 Portfolio

// เลขเวอร์ชันของข้อมูล: เปลี่ยนทุกครั้งที่ข้อมูลเปลี่ยน
function dataVersion($portfolios) {
    return md5(json_encode(array_values($portfolios), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function validId($id) {
    return is_string($id) && preg_match('/^[A-Za-z0-9_-]{1,40}$/', $id) === 1;
}

// ตรวจโครงสร้างคร่าว ๆ (เนื้อหาแต่ละช่องตรวจที่ฝั่งหน้าเว็บ) คืนข้อความ error หรือ null ถ้าผ่าน
function checkPortfolios($list) {
    if (count($list) > MAX_PORTFOLIOS) {
        return 'Too many portfolios';
    }
    $ids = [];
    foreach ($list as $p) {
        if (!is_array($p)) {
            return 'Portfolio must be an object';
        }
        if (!validId($p['id'] ?? null)) {
            return 'Portfolio id is invalid';
        }
        if (isset($ids[$p['id']])) {
            return 'Duplicate portfolio id: ' . $p['id'];
        }
        $ids[$p['id']] = true;

        if (isset($p['name']) && !is_string($p['name'])) {
            return 'Portfolio name must be text';
        }
        $items = $p['items'] ?? [];
        if (!is_array($items) || count($items) > MAX_ITEMS) {
            return 'Portfolio items are invalid';
        }
        $itemIds = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                return 'Item must be an object';
            }
            if (!validId($item['id'] ?? null)) {
                return 'Item id is invalid';
            }
            if (isset($itemIds[$item['id']])) {
                return 'Duplicate item id: ' . $item['id'];
            }
            $itemIds[$item['id']] = true;
        }
    }
    return null;
}

// ---- GET: ส่งข้อมูลทั้งหมดให้หน้าเว็บ ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $portfolios = readPortfolios();
    sendJson(['version' => dataVersion($portfolios), 'portfolios' => array_values($portfolios)]);
}

// ---- POST: บันทึกทั้งชุด ----
$raw = file_get_contents('php://input');
if (strlen($raw) > MAX_BODY_BYTES) {
    sendJson(['error' => 'Data is too large'], 413);
}
$body = json_decode($raw, true);
if (!is_array($body) || !isset($body['portfolios']) || !is_array($body['portfolios'])) {
    sendJson(['error' => 'Body must be {"baseVersion": "...", "portfolios": [...]}'], 400);
}

$incoming = array_values($body['portfolios']);
$error = checkPortfolios($incoming);
if ($error !== null) {
    sendJson(['error' => $error], 400);
}
foreach ($incoming as $i => $p) {
    $incoming[$i]['items'] = array_values($p['items'] ?? []);
}

// อ่านข้อมูลปัจจุบัน (ล็อกไว้ จนจบคำขอ) แล้วเทียบเวอร์ชันก่อนเขียน
$current = readPortfolios();
$version = dataVersion($current);
$base = is_string($body['baseVersion'] ?? null) ? $body['baseVersion'] : '';

if ($base !== $version) {
    sendJson([
        'error'      => 'Data was changed by someone else. Please try again.',
        'version'    => $version,
        'portfolios' => array_values($current),
    ], 409);
}

writePortfolios($incoming);
$saved = readPortfolios();
sendJson(['version' => dataVersion($saved), 'portfolios' => array_values($saved)]);