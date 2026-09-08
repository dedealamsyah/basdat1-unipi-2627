<?php
/**
 * Logout. GET /api/logout.php
 */
declare(strict_types=1);
require __DIR__ . '/config.php';

start_session();
$_SESSION = array();
if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}
session_destroy();

json_out(array('ok' => true, 'data' => array('logout' => true)));