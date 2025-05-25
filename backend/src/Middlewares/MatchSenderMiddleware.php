<?php
namespace App\Middlewares;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;
use Psr\Http\Message\RequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

/**
 * Verifica si el que esta ejecutando (Token) la solictud es el mismo al que quiere acceder al recurso.
 * 
 * Esto es para que solamente el token solo pueda acceder al recurso que le pertence
 * 
 * Summary of MatchSenderMiddleware
 */
class MatchSenderMiddleware implements MiddlewareInterface
{
    public function __construct()
    {
    }
    public function process(Request $request, RequestHandler $handler): Response
    {
        $key = $_ENV['API_KEY'] ?? ''; // Clave secreta para JWT

        $authHeader = $request->getHeader('Authorization');
        if (empty($authHeader)) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Token no proporcionado']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $token = str_replace('Bearer ', '', $authHeader[0]);

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            $phoneNumberFromToken = $decoded->data->phoneNumber ?? null; // Extrae phoneNumber del token

            if (!$phoneNumberFromToken) {
                $response = new \Slim\Psr7\Response();
                $response->getBody()->write(json_encode(['error' => 'Token no contiene el número de teléfono']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $data = json_decode($request->getBody()->getContents(), true);
            $phoneNumberFromRequest = $data['sender'] ?? null; // Busca phoneNumber en el cuerpo

            if (!$phoneNumberFromRequest) {
                $response = new \Slim\Psr7\Response();
                $response->getBody()->write(json_encode(['error' => 'Número de teléfono no proporcionado en el cuerpo']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            if ($phoneNumberFromToken != $phoneNumberFromRequest) {
                $response = new \Slim\Psr7\Response();
                $response->getBody()->write(json_encode([
                    'error' => 'El número de teléfono del token no coincide',
                ]));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            // Si todo está bien, pasa al siguiente middleware
            return $handler->handle($request);

        } catch (Exception $e) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Token inválido o expirado: ' . $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }
}