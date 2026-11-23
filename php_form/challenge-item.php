<?php
// php_form/challenge-item.php
// รับข้อมูลจาก Challenge Form (POST) -> ตรวจสอบ -> สร้าง Portfolio Item JSON -> ตอบกลับเป็น JSON
// (การบันทึกลง Portfolio เป็นหน้าที่ของ api/ ไม่ใช่ไฟล์นี้)

header('Content-Type: application/json; charset=utf-8');

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

// อ่านค่าจากฟอร์มแบบปลอดภัย (ถ้าไม่ใช่ string ให้ถือว่าว่าง)
function field($key) {
    $v = $_POST[$key] ?? '';
    return is_string($v) ? trim($v) : '';
}

// นับจำนวนตัวอักษร (ใช้ได้แม้ไม่ได้เปิด mbstring)
function textLength($s) {
    if (function_exists('mb_strlen')) return mb_strlen($s);
    $n = preg_match_all('/./us', $s);
    return $n === false ? strlen($s) : $n;
}

function isValidDate($s) {
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return $d && $d->format('Y-m-d') === $s;   // กันวันที่ที่ไม่มีจริง เช่น 2026-02-31
}

function isValidUrl($s) {
    if (preg_match('#^https?://#i', $s) !== 1) return false;
    $host = parse_url($s, PHP_URL_HOST) ?: '';
    return preg_match('/^([a-z0-9-]+\.)+[a-z]{2,63}$/i', $host) === 1;
}

// รับเฉพาะ POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    sendJson(['ok' => false, 'errors' => ['method' => 'ใช้ได้เฉพาะ POST']], 405);
}

$errors = [];

// 1) ช่องข้อความที่ต้องกรอก
$required = [
    'title'        => 'ชื่อผลงาน',
    'type'         => 'ประเภท',
    'role'         => 'บทบาท',
    'description'  => 'รายละเอียด',
    'whatIDid'     => 'สิ่งที่ทำ',
    'whatILearned' => 'สิ่งที่ได้เรียนรู้',
];
foreach ($required as $key => $label) {
    if (field($key) === '') {
        $errors[$key] = 'กรุณากรอก' . $label;
    }
}
// title ไม่เกิน 60 ตัวอักษร (เท่ากับ api/items.php)
if (!isset($errors['title']) && textLength(field('title')) > 60) {
    $errors['title'] = 'ชื่อผลงานต้องไม่เกิน 60 ตัวอักษร';
}

// 2) วันที่ (อนุญาตวันในอนาคต เพราะอาจเป็นวันจัดกิจกรรม)
if (field('date') === '') {
    $errors['date'] = 'กรุณากรอกวันที่';
} elseif (!isValidDate(field('date'))) {
    $errors['date'] = 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD และเป็นวันที่ที่มีอยู่จริง';
}

// 3) skills: "HTML, CSS" -> ["HTML", "CSS"]
$skills = array_values(array_filter(array_map('trim', explode(',', field('skills'))), 'strlen'));
if (count($skills) === 0) {
    $errors['skills'] = 'กรุณากรอกทักษะอย่างน้อย 1 อย่าง';
}

// 4) evidence 1-3 ลิงก์ (ช่องที่เว้นว่างไม่นับ)
$evidence = [];
$evidenceBad = false;
foreach (['evidence1', 'evidence2', 'evidence3'] as $key) {
    $url = field($key);
    if ($url === '') continue;
    if (!isValidUrl($url)) {
        $errors[$key] = 'ลิงก์ไม่ถูกต้อง ต้องขึ้นต้นด้วย http:// หรือ https:// และมีโดเมน เช่น https://example.com';
        $evidenceBad = true;
    } else {
        $evidence[] = $url;
    }
}
if (count($evidence) === 0 && !$evidenceBad) {
    $errors['evidence1'] = 'กรุณาใส่ลิงก์หลักฐานอย่างน้อย 1 ลิงก์';
}

// 5) ถ้ามี error ให้หยุด ไม่สร้างอะไร
if ($errors) {
    sendJson(['ok' => false, 'errors' => $errors], 422);
}

// 6) สร้าง Portfolio Item ตาม Data Contract
$item = [
    'id'          => 'item' . bin2hex(random_bytes(4)),   // สุ่ม เช่น item9f3a1c2e (ไม่ซ้ำกัน)
    'title'       => field('title'),
    'type'        => field('type'),
    'date'        => field('date'),
    'role'        => field('role'),
    'description' => field('description'),
    'skills'      => $skills,
    'reflection'  => [
        'whatIDid'     => field('whatIDid'),
        'whatILearned' => field('whatILearned'),
        'challenge'    => field('challenge'),
        'nextStep'     => field('nextStep'),
    ],
    'evidence'    => $evidence,
];

sendJson(['ok' => true, 'item' => $item], 201);