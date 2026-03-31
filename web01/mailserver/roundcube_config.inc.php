<?php
/**
 * Roundcube Custom Configuration for Alvarez Placas
 * VERSION 13 - POWER USER STACK (ROOT)
 */

$config = [];

// Base connection settings
$config['default_host'] = 'tls://mailserver'; 
$config['default_port'] = 143;
$config['smtp_server'] = 'tls://mailserver';
$config['smtp_port'] = 587;

// CRITICAL: Bypass Peer Verification (Needed for Internal Docker Mailserver)
$config['imap_conn_options'] = [
    'ssl' => [
        'verify_peer'       => false,
        'verify_peer_name'  => false,
        'allow_self_signed' => true,
    ],
];

$config['smtp_conn_options'] = [
    'ssl' => [
        'verify_peer'       => false,
        'verify_peer_name'  => false,
        'allow_self_signed' => true,
    ],
];

// PHP Error Logging & DB (Standard paths, root will have access)
$config['db_dsnw'] = 'sqlite:////var/www/html/db/sqlite.db?mode=0646';
$config['log_dir'] = '/var/www/html/logs/';

// Proxy & Session Fixes
$config['ip_check'] = false;
$config['referer_check'] = false;
$config['use_https'] = false;

// UI & General
$config['product_name'] = 'Alvarez Placas Webmail FINAL v13';
$config['des_key'] = 'rcmail-alvarez-root-2026';
$config['skin'] = 'elastic';
