<?php
namespace App\Middlewares;

use Firebase\JWT\ExpiredException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;
/**
 * 
 * Para autenticar el rol del usuario que quiera acceder tal recurso 
 * Summary of AuthMiddleware
 */
class AuthMiddleware implements MiddlewareInterface
{
    protected $role;

    public function __construct($role)
    {
        $this->role = $role;
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $token = $request->getHeaderLine('Authorization');
        $key = $_ENV['API_KEY']; // La clave secreta para JWT

        if (!$token) {
            // Crear una respuesta directamente usando el $response que se pasa como parámetro
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Token no proporcionado']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        try {
            // Limpiar el token, eliminando el prefijo 'Bearer'
            $token = str_replace('Bearer ', '', $token);

            // Decodificar el token
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            // Verificar el rol
            if ($decoded->data->rol !== $this->role) {
                $response = new \Slim\Psr7\Response();
                $response->getBody()->write(json_encode(['error' => 'Acceso denegado. Rol no autorizado']));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }


            // Agregar los datos del usuario decodificados al request para su uso posterior
            $request = $request->withAttribute('user', $decoded->data);
            $request = $request->withAttribute('userId', $decoded->sub);


            // Continuar con la siguiente parte del pipeline
            $response = $handler->handle($request);

        } catch (ExpiredException $e) {
            // Si el token ha expirado, se lanza una excepción ExpiredException
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Token ha expirado. Por favor, inicie sesión de nuevo.']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Token inválido: ' . $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        return $response;
    }



}
