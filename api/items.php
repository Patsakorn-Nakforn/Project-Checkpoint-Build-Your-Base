<?php
require 'storage.php';

requireMethod(['GET', 'POST']);

// GET api/items.php                  -> the Items of EVERY Portfolio, grouped by Portfolio
// GET api/items.php?portfolioId=p001 -> all Items of ONE Portfolio
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $portfolios = readPortfolios();
    $portfolioId = $_GET['portfolioId'] ?? '';

    if ($portfolioId === '') {
        $all = [];
        foreach ($portfolios as $portfolio) {
            $all[] = [
                'portfolioId'   => $portfolio['id'] ?? '',
                'portfolioName' => $portfolio['name'] ?? '',
                'items'         => $portfolio['items'] ?? [],
            ];
        }
        sendJson($all);
    }

    $p = findPortfolioIndex($portfolios, $portfolioId);
    if ($p === -1) {
        sendJson(['error' => 'Portfolio not found'], 404);
    }
    sendJson($portfolios[$p]['items'] ?? []);
}

// ---------------------------------------------------------------------------
// POST api/items.php -> add ONE Item (or several, see below) to ONE Portfolio
//
//  1) Add Item / Challenge_Page form: fetch() + FormData  -> fields in $_POST
//       portfolioId, title, type, date, role, description, skills ("HTML, CSS"),
//       whatIDid, whatILearned, challenge, nextStep, evidence1, evidence2, evidence3
//  2) Import (JSON body, Content-Type: application/json):
//       { "portfolioId": "p001", ...one Item like data/challenge-item.json... }
//       { "portfolioId": "p001", "items": [ Item, Item ] }  -> add many, all or nothing
//     Here skills is a list, reflection is an object and evidence is a list.
// ---------------------------------------------------------------------------
$data = getInput();

$portfolioId = textValue($data, 'portfolioId');
if ($portfolioId === '') {
    sendJson(['error' => 'portfolioId is required'], 400);
}

// One Item, or a list of Items (Import)
if (isset($data['items'])) {
    if (!is_array($data['items']) || count($data['items']) === 0) {
        sendJson(['error' => 'items must be a non-empty list'], 400);
    }
    $incoming = $data['items'];
    $isBatch = true;
} else {
    $incoming = [$data];
    $isBatch = false;
}

// Turn the fields from the form OR from an imported JSON file into the shape of the Data Contract.
// Returns [item, errors]; the "id" is added later, when we know the ids already in the Portfolio.
function buildItem($in) {
    if (!is_array($in)) {
        return [null, ['item' => 'Item must be an object']];
    }
    $r = (isset($in['reflection']) && is_array($in['reflection'])) ? $in['reflection'] : [];

    // skills: "HTML, CSS" (form) or ["HTML", "CSS"] (JSON)
    $skills = $in['skills'] ?? [];
    if (is_string($skills)) {
        $skills = explode(',', $skills);
    }
    $skills = is_array($skills) ? array_values(array_filter(array_map(
        fn($s) => is_string($s) ? trim($s) : '', $skills), fn($s) => $s !== '')) : [];

    // evidence: evidence1..3 (form) or evidence: [...] (JSON)
    $evidence = [];
    if (isset($in['evidence']) && is_array($in['evidence'])) {
        $evidence = $in['evidence'];
    } else {
        foreach (['evidence1', 'evidence2', 'evidence3'] as $key) {
            $evidence[] = $in[$key] ?? '';
        }
    }
    $evidence = array_values(array_filter(array_map(
        fn($u) => is_string($u) ? trim($u) : '', $evidence), fn($u) => $u !== ''));

    // reflection fields come from the nested object (JSON) or from the flat form fields
    $field = fn($key) => isset($r[$key]) && is_string($r[$key]) ? trim($r[$key]) : textValue($in, $key);

    $item = [
        'title'       => textValue($in, 'title'),
        'type'        => textValue($in, 'type'),
        'date'        => textValue($in, 'date'),
        'role'        => textValue($in, 'role'),
        'description' => textValue($in, 'description'),
        'skills'      => $skills,
        'reflection'  => [
            'whatIDid'     => $field('whatIDid'),
            'whatILearned' => $field('whatILearned'),
            'challenge'    => $field('challenge'),
            'nextStep'     => $field('nextStep'),
        ],
        'evidence'    => $evidence,
    ];

    $errors = [];
    foreach (['title', 'type', 'role', 'description'] as $key) {
        if ($item[$key] === '') {
            $errors[$key] = "$key is required.";
        }
    }
    if (!isset($errors['title']) && textLength($item['title']) > 60) {
        $errors['title'] = 'title must be 60 characters or fewer.';
    }

    // YYYY-MM-DD and a real calendar date. A future date is allowed:
    // an Item can describe an activity that is scheduled later (e.g. the Challenge).
    $d = DateTime::createFromFormat('!Y-m-d', $item['date']);
    if ($item['date'] === '') {
        $errors['date'] = 'date is required.';
    } elseif (!$d || $d->format('Y-m-d') !== $item['date']) {
        $errors['date'] = 'date must be a real date in the form YYYY-MM-DD.';
    }

    if (count($item['skills']) === 0) {
        $errors['skills'] = 'At least one skill is required.';
    }
    foreach (['whatIDid', 'whatILearned'] as $key) {
        if ($item['reflection'][$key] === '') {
            $errors[$key] = "$key is required.";
        }
    }

    if (count($item['evidence']) < 1 || count($item['evidence']) > 3) {
        $errors['evidence'] = 'Add 1 to 3 evidence links.';
    } else {
        foreach ($item['evidence'] as $url) {
            $parts = parse_url($url);
            $host = $parts['host'] ?? '';
            if (!preg_match('#^https?://#i', $url) || !preg_match('/^([a-z0-9-]+\.)+[a-z]{2,63}$/i', $host)) {
                $errors['evidence'] = 'Evidence must be a valid http(s) URL: ' . $url;
                break;
            }
        }
    }

    return [$item, $errors];
}

// Check every incoming Item BEFORE touching the data file
$built = [];
$allErrors = [];
foreach ($incoming as $n => $in) {
    [$item, $errors] = buildItem($in);
    if ($errors) {
        // for a list, say which Item is wrong: "items[2].date"
        foreach ($errors as $field => $message) {
            $allErrors[$isBatch ? "items[$n].$field" : $field] = $message;
        }
    }
    // an id sent in the file is kept only if it is not used yet (checked below)
    $item['_wantedId'] = is_array($in) && isset($in['id']) && is_string($in['id']) ? trim($in['id']) : '';
    $built[] = $item;
}
if ($allErrors) {
    sendValidationError($allErrors);
}

// Read -> add -> write, all while holding the lock from readPortfolios()
$portfolios = readPortfolios();
$p = findPortfolioIndex($portfolios, $portfolioId);
if ($p === -1) {
    sendJson(['error' => 'Portfolio not found'], 404);
}
if (!isset($portfolios[$p]['items']) || !is_array($portfolios[$p]['items'])) {
    $portfolios[$p]['items'] = [];
}

$saved = [];
foreach ($built as $item) {
    $usedIds = array_column($portfolios[$p]['items'], 'id');   // includes Items added a moment ago
    $wanted = $item['_wantedId'];
    unset($item['_wantedId']);

    // Item ids must be unique inside the Portfolio: keep the imported id only if it is free
    $id = ($wanted !== '' && !in_array($wanted, $usedIds, true))
        ? $wanted
        : generateId('item', $usedIds);                        // item001, item002 ...

    $item = ['id' => $id] + $item;                             // id first, like the Data Contract
    $portfolios[$p]['items'][] = $item;                        // existing Items stay untouched
    $saved[] = $item;
}

writePortfolios($portfolios);

// One Item -> the Item itself. Import of a list -> { portfolioId, count, items }
sendJson($isBatch ? ['portfolioId' => $portfolioId, 'count' => count($saved), 'items' => $saved] : $saved[0], 201);