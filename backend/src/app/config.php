<?php
/**
 * Obtener los parametros de conexion
 */
use Dotenv\Dotenv;
$dotenv = Dotenv::createImmutable('../' );
$dotenv->load();

$container->set('config_bd', function(){
    return (object) [
        "host" => $_ENV['HOST'],
        "db" => $_ENV['DB'],
        "usr" => $_ENV['USER'],
        "passw" => $_ENV['DB_PASS'],
        "charset" => "utf8mb4"
    ];
});

