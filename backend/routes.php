<?php

use App\Controllers\TransferController;
use App\Middlewares\MatchSenderMiddleware;
use Slim\Routing\RouteCollectorProxy;
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RateLimitMiddleware;
use App\Controllers\UserController;
use App\Controllers\AccountController;


require __DIR__ . '/../controllers/EmailController.php';
require __DIR__ . '/../controllers/AuthController.php';
require __DIR__ . '/../services/EmailService.php';

/**
 * Envío de correos
 */
$app->group('/email', function (RouteCollectorProxy $email) {
    $email->post('/send', EmailController::class . ':sendEmail')
        ->add(new AuthMiddleware(role: 'user'));
});


/**
 * Rutas para la autenticacion
 */

$app->group('/auth', function (RouteCollectorProxy $auth) {
    $auth->post('/register', AuthController::class . ':register')
        ->add(RateLimitMiddleware::class);

    $auth->patch('/reset-password', AuthController::class . ':resetPassword')
        ->add(RateLimitMiddleware::class);

    $auth->post('/recover-account', AuthController::class . ':requestAccountRecover')
        ->add(RateLimitMiddleware::class);

    $auth->post('/request-confirm', AuthController::class . ':requestConfirmation');
    $auth->patch('/confirm', AuthController::class . ':verifyAccount');
    $auth->patch('/change-password', AuthController::class . ':changePassword')
        ->add(new AuthMiddleware(role: 'user'));
    $auth->post('/login', AuthController::class . ':login')
        ->add(RateLimitMiddleware::class);
});

/**
 * Grupo de rutas
 * Para hacer la tramsferencia, consultar estado de la cuenta y consultar el saldo
 */
$app->group('/account', function (RouteCollectorProxy $account) {
    $account->post('/make-transfer', AccountController::class . ':transfer')
        ->add(new AuthMiddleware(role: 'user'))  // Primero: verifica token
        ->add(new MatchSenderMiddleware());  // Luego: compara userId

    $account->get('/status/{idUser}', AccountController::class . ':isAccountActive');
    $account->get('/balance/{phoneNumber}', AccountController::class . ':getBalance')
        ->add(new AuthMiddleware(role: 'user'));
});


/**
 * Para consultar la informacion del usuario beneficiario (Nombre, apelidos y etc)
 */
$app->group('/user', function (RouteCollectorProxy $user) {
    $user->get('/{phoneNumber}', UserController::class . ':getUserInfo')->add(new AuthMiddleware('user'));
});


/**
 * Obtener las transferencia hechas por un usuario en especifico
 */

$app->group('/transfer', function (RouteCollectorProxy $transfer) {
    $transfer->get('', TransferController::class . ':getTransfers')
        ->add(new AuthMiddleware(role: 'user'));  // Primero: verifica token
});