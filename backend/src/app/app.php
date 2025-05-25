<?php

use Slim\Factory\AppFactory;
use DI\Container;
require __DIR__ . '/../../vendor/autoload.php';
$container = new Container();
AppFactory::setContainer($container);
$app = AppFactory::create();

$app->addRoutingMiddleware();

require 'conexion.php';
require 'config.php';
require_once 'routes.php';

// Primer parametro false 37:14 se ponde falsa en produccion
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

$app->run();
