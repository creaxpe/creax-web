<?php
/* =============================================================================
   contacto.php · recibe el formulario "Contáctanos por mail" de la portada y lo
   manda como correo a admin@creax.net.pe, para atender a la persona como un lead.

   Solo funciona en creax.net.pe (Hostinger, con PHP y el correo del dominio).
   En el borrador de GitHub Pages no corre: ahí el formulario ofrece el correo
   o WhatsApp para escribirnos directo.

   No guarda nada en el servidor ni usa claves: envía con la función mail() de
   Hostinger. Contra el spam: campo trampa, tiempo mínimo en la página, solo
   peticiones desde la propia web y un límite de envíos por hora.
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
date_default_timezone_set('America/Lima');

const DESTINO = 'admin@creax.net.pe';
const REMITENTE = 'admin@creax.net.pe';
const ORIGENES = ['https://creax.net.pe', 'https://www.creax.net.pe'];
const MAXIMO_POR_HORA = 5;

function responder($codigo, $datos)
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Una sola línea, sin saltos ni espacios de más, y con un largo máximo
function linea($valor, $maximo)
{
    $texto = trim(preg_replace('/\s+/u', ' ', (string) $valor));
    return mb_substr($texto, 0, $maximo, 'UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'metodo']);
}

// Solo desde la propia web
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origen, ORIGENES, true)) {
    responder(403, ['ok' => false, 'error' => 'origen']);
}

$crudo = file_get_contents('php://input', false, null, 0, 20000);
$datos = json_decode((string) $crudo, true);
if (!is_array($datos)) {
    responder(400, ['ok' => false, 'error' => 'datos']);
}

// El campo trampa lo llena un robot: se le contesta que salió bien y no se envía nada
if (!empty($datos['sitio'])) {
    responder(200, ['ok' => true]);
}
// Una persona tarda unos segundos en llenar el formulario
if ((int) ($datos['tiempo'] ?? 0) < 3000) {
    responder(400, ['ok' => false, 'error' => 'rapido']);
}

$nombre = linea($datos['nombre'] ?? '', 60);
$empresa = linea($datos['empresa'] ?? '', 80);
$rubro = linea($datos['rubro'] ?? '', 80);
$correo = filter_var(linea($datos['correo'] ?? '', 120), FILTER_VALIDATE_EMAIL);
$celular = preg_replace('/[^\d+]/', '', (string) ($datos['celular'] ?? ''));
$ideas = mb_substr(trim(str_replace("\r", '', (string) ($datos['ideas'] ?? ''))), 0, 2000, 'UTF-8');
$acepta = !empty($datos['acepta']);

$PERMITIDOS = ['Página web', 'Automatización con IA', 'Agente de IA', 'Referencias y más información'];
$intereses = array_values(array_intersect($PERMITIDOS, is_array($datos['intereses'] ?? null) ? $datos['intereses'] : []));

// Las mismas reglas que revisa la página antes de enviar
$celularValido = preg_match('/^(\+?51)?9\d{8}$/', $celular) || preg_match('/^\+\d{8,15}$/', $celular);
if (mb_strlen($nombre, 'UTF-8') < 2 || mb_strlen($empresa, 'UTF-8') < 2 || mb_strlen($rubro, 'UTF-8') < 2
    || !$correo || !$celularValido || !$acepta || (!$intereses && mb_strlen($ideas, 'UTF-8') < 10)) {
    responder(422, ['ok' => false, 'error' => 'datos']);
}

// Límite de envíos por hora desde una misma conexión
$ip = $_SERVER['REMOTE_ADDR'] ?? 'sin-ip';
$registro = sys_get_temp_dir() . '/creax-contacto-' . hash('sha256', $ip) . '.json';
$ahora = time();
$envios = [];
if (is_readable($registro)) {
    $envios = json_decode((string) @file_get_contents($registro), true) ?: [];
}
$envios = array_values(array_filter($envios, function ($t) use ($ahora) { return $ahora - (int) $t < 3600; }));
if (count($envios) >= MAXIMO_POR_HORA) {
    responder(429, ['ok' => false, 'error' => 'muchos']);
}

// El correo: texto simple, fácil de leer en el celular
$celularMostrado = $celular;
$whatsapp = '';
if (preg_match('/^(?:\+?51)?(9\d{8})$/', $celular, $m)) {
    $celularMostrado = substr($m[1], 0, 3) . ' ' . substr($m[1], 3, 3) . ' ' . substr($m[1], 6);
    $whatsapp = 'https://wa.me/51' . $m[1];
}
$lineas = [
    'Nuevo contacto desde la web de CreaX (formulario «Contáctanos por mail»).',
    '',
    'Nombre: ' . $nombre,
    'Empresa: ' . $empresa,
    'A qué se dedica: ' . $rubro,
    'Celular: ' . $celularMostrado,
    'Correo: ' . $correo,
    'Le interesa: ' . ($intereses ? implode(', ', $intereses) : '(no marcó opciones)'),
    '',
    'Sus ideas:',
    $ideas !== '' ? $ideas : '(no escribió nada)',
    '',
    '—',
    'Para responder, contesta este correo: va directo a ' . $correo . '.',
];
if ($whatsapp) {
    $lineas[] = 'WhatsApp directo: ' . $whatsapp;
}
$lineas[] = 'Recibido el ' . date('d/m/Y') . ' a las ' . date('H:i') . ' (hora de Lima).';

$asunto = 'Nuevo contacto web: ' . $empresa . ' (' . $nombre . ')';
$cabeceras = implode("\r\n", [
    'From: CreaX web <' . REMITENTE . '>',
    'Reply-To: ' . $correo,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: creax.net.pe',
]);
$asuntoCodificado = '=?UTF-8?B?' . base64_encode($asunto) . '?=';
$cuerpo = implode("\n", $lineas);

$enviado = @mail(DESTINO, $asuntoCodificado, $cuerpo, $cabeceras, '-f' . REMITENTE);
if (!$enviado) {
    // algunos servidores no aceptan el remitente explícito: se prueba sin él
    $enviado = @mail(DESTINO, $asuntoCodificado, $cuerpo, $cabeceras);
}
if (!$enviado) {
    responder(500, ['ok' => false, 'error' => 'envio']);
}

$envios[] = $ahora;
@file_put_contents($registro, json_encode($envios), LOCK_EX);
responder(200, ['ok' => true]);
