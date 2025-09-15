<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$whitelist = ['BTC-USD'];
$allowed_intervals = ['1h','1d','1w','1wk','1mo'];

$symbol   = $_GET['symbol']   ?? 'BTC-USD';
$interval = $_GET['interval'] ?? '1d';
$range    = $_GET['range']    ?? '1mo';

if (!in_array($symbol, $whitelist)) { http_response_code(400); echo json_encode(['error'=>'symbol_not_allowed']); exit; }
if (!in_array($interval, $allowed_intervals)) { http_response_code(400); echo json_encode(['error'=>'interval_not_allowed']); exit; }

$yInterval = ($interval === '1w') ? '1wk' : $interval;

/* ----- Clamp de RANGE por INTERVAL ----- */
$validRangesByInterval = [
  '1h'  => ['1mo','3mo','6mo','1y','2y'],         // intraday/hora: até ~2 anos é o máximo seguro
  '1d'  => ['1mo','3mo','6mo','1y','2y','5y','10y','ytd','max'],
  '1wk' => ['1mo','3mo','6mo','1y','2y','5y','10y','ytd','max'],
  '1mo' => ['1y','2y','5y','10y','ytd','max'],
];

$valid = $validRangesByInterval[$yInterval] ?? $validRangesByInterval['1d'];
$adjusted = false;
if (!in_array($range, $valid)) {
  // escolhe o maior range permitido para o intervalo solicitado
  $range = end($valid);
  $adjusted = true;
}
if ($adjusted) header('X-Range-Adjusted: 1'); else header('X-Range-Adjusted: 0');
/* --------------------------------------- */

$cacheDir  = __DIR__ . '/cache';
if (!is_dir($cacheDir)) { @mkdir($cacheDir, 0777, true); }
$cacheFile = $cacheDir . '/' . $symbol . '_' . $yInterval . '_' . $range . '.json';

/* TTLs mínimos */
switch ($yInterval) {
  case '1h':  $ttl = 2*60*60;  break; // 2h
  case '1d':  $ttl = 2*60*60;  break; // 2h
  case '1wk': $ttl = 6*60*60;  break; // 6h
  case '1mo': $ttl = 12*60*60; break; // 12h
  default:    $ttl = 2*60*60;  break;
}

/* Cache HIT */
if ($ttl > 0 && file_exists($cacheFile)) {
  $age = time() - filemtime($cacheFile);
  if ($age < $ttl) {
    header('X-Cache: HIT'); header('X-Cache-Age: '.$age); header('X-Cache-TTL: '.$ttl);
    readfile($cacheFile); exit;
  }
}

/* Fetch Yahoo */
$url = "https://query1.finance.yahoo.com/v8/finance/chart/" . urlencode($symbol)
     . "?interval=" . urlencode($yInterval) . "&range=" . urlencode($range);

$ctx = stream_context_create([
  'http' => ['method'=>'GET','timeout'=>8,'header'=>"User-Agent: oraculum\r\nAccept: application/json\r\n"]
]);

$data = @file_get_contents($url, false, $ctx);
if ($data === false) {
  if (file_exists($cacheFile)) {
    header('X-Cache: STALE'); header('X-Cache-Age: '.(time()-filemtime($cacheFile))); header('X-Cache-TTL: '.$ttl);
    readfile($cacheFile); exit;
  }
  http_response_code(502); echo json_encode(['error'=>'upstream_unavailable_and_no_cache']); exit;
}

/* Cache MISS */
@file_put_contents($cacheFile, $data);
header('X-Cache: MISS'); header('X-Cache-Age: 0'); header('X-Cache-TTL: '.$ttl);
echo $data;
