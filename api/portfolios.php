<?php
require 'storage.php';

requireMethod(['GET', 'POST']);

// GET api/portfolios.php                  -> all Portfolios (with their Items)
// GET api/portfolios.php?id=p001          -> ONE Portfolio
// GET api/portfolios.php?export=1         -> download ALL Portfolios as my-portfolio.json
// GET api/portfolios.php?id=p001&export=1 -> download ONE Portfolio as my-portfolio.json
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $portfolios = readPortfolios();
    $id = $_GET['id'] ?? null;

    if ($id !== null) {
        $i = findPortfolioIndex($portfolios, $id);
        if ($i === -1) {
            sendJson(['error' => 'Portfolio not found'], 404);
        }
        $result = $portfolios[$i];
    } else {
        $result = $portfolios;
    }

    if (isset($_GET['export'])) {
        sendJsonDownload($result, 'my-portfolio.json');
    }
    sendJson($result);
}

// POST api/portfolios.php -> create ONE new Portfolio
// fetch() sends the form fields with FormData, so PHP reads them from $_POST
// (a JSON body works too). Field names follow create-portfolio.html / js/storage.js.
$data = getInput();

// "displayName" is accepted too, because the starter kit used that name
$name = textValue($data, 'name') !== '' ? textValue($data, 'name') : textValue($data, 'displayName');

if ($name === '') {
    sendJson(['error' => 'Display name is required'], 400);
}
if (textLength($name) > 60) {
    sendJson(['error' => 'Display name must be 60 characters or fewer'], 400);
}

$portfolios = readPortfolios();

$portfolio = [
    'id'      => generateId('p', array_column($portfolios, 'id')),   // p001, p002 ...
    'name'    => $name,
    'enjoy'   => textValue($data, 'enjoy')   !== '' ? textValue($data, 'enjoy')   : textValue($data, 'whatIEnjoy'),
    'tried'   => textValue($data, 'tried')   !== '' ? textValue($data, 'tried')   : textValue($data, 'whatIveTried'),
    'curious' => textValue($data, 'curious') !== '' ? textValue($data, 'curious') : textValue($data, 'whatImCuriousAbout'),
    'items'   => [],
];

$portfolios[] = $portfolio;          // add to the end of the list
writePortfolios($portfolios);

sendJson($portfolio, 201);           // 201 = Created