<?php
/**
 * Pustaka opsional: unggah otomatis ke Google Drive (Service Account, PHP murni).
 *
 * Cara aktifkan:
 * 1. Buat service account di Google Cloud Console, unduh JSON kredensial.
 * 2. Letakkan di /htdocs/api/gdrive-service.json (disarankan di luar repo).
 * 3. Bagikan folder Drive tujuan ke email service account sebagai Editor.
 * 4. Tanpa file ini, unggahan cukup tersimpan di server (uploads/tugas).
 */

/** Ambil access token via JWT (RS256) + endpoint OAuth2. */
function gdrive_token(string $jsonPath): ?string
{
    $json = file_get_contents($jsonPath);
    if ($json === false) {
        return null;
    }
    $s = json_decode($json, true);
    if (!is_array($s) || empty($s['client_email']) || empty($s['private_key'])) {
        return null;
    }
    $now = time();
    $header = array('alg' => 'RS256', 'typ' => 'JWT');
    $claims = array(
        'iss'   => $s['client_email'],
        'scope' => 'https://www.googleapis.com/auth/drive.file',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
    );
    $b64 = function (array $a) {
        return rtrim(strtr(base64_encode(json_encode($a)), '+/', '-_'), '=');
    };
    $signingInput = $b64($header) . '.' . $b64($claims);
    $signature = '';
    openssl_sign($signingInput, $signature, $s['private_key'], 'sha256');
    $jwt = $signingInput . '.' . rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 25,
        CURLOPT_POSTFIELDS => http_build_query(array(
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        )),
    ));
    $res = curl_exec($ch);
    curl_close($ch);
    $data = json_decode((string) $res, true);
    return isset($data['access_token']) ? $data['access_token'] : null;
}

/** Upload file ke folder Drive (uploadType=multipart). Return file id atau null. */
function gdrive_upload(string $accessToken, string $folderId, string $path, string $name, string $mime): ?string
{
    $meta = json_encode(array('name' => $name, 'parents' => array($folderId)));
    $file = file_get_contents($path);
    if ($file === false) {
        return null;
    }
    $boundary = 'UNIPI_BASDAT_' . uniqid('', true);
    $body = '--' . $boundary . "\r\n"
        . "Content-Type: application/json; charset=UTF-8\r\n\r\n"
        . $meta . "\r\n"
        . '--' . $boundary . "\r\n"
        . 'Content-Type: ' . $mime . "\r\n\r\n"
        . $file . "\r\n"
        . '--' . $boundary . "--\r\n";

    $ch = curl_init('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_HTTPHEADER => array(
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: multipart/related; boundary=' . $boundary,
        ),
        CURLOPT_POSTFIELDS => $body,
    ));
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode((string) $res, true);
    return ($code >= 200 && $code < 300 && isset($data['id'])) ? $data['id'] : null;
}

/** Titik masuk: unggah ke Drive bila kredensial ada, kembalikan file id (atau null). */
function gdrive_upload_if_configured(string $folderId, string $path, string $name, string $mime): ?string
{
    $cred = __DIR__ . '/gdrive-service.json';
    if (!is_file($cred) || $folderId === '') {
        return null;
    }
    $token = gdrive_token($cred);
    if (!$token) {
        return null;
    }
    return gdrive_upload($token, $folderId, $path, $name, $mime);
}