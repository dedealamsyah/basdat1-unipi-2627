<?php
/**
 * Info sesi saat ini + status progresi.
 * GET /api/me.php
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

$u = current_user();
if (!$u) {
    json_out(array('ok' => true, 'data' => array(
        'logged_in' => false,
        'user' => null,
        'progress' => new stdClass(),
        'roles' => array(),
    )));
}

json_out(array('ok' => true, 'data' => array(
    'logged_in' => true,
    'user' => $u,
    'progress' => status_map($u['nim']),
    'active' => active_pertemuan(),
)));