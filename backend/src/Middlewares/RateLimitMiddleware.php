<?php
/**
 * 
 * 
 * Summary of namespace App\Middlewares
 */
namespace App\Middlewares;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Psr\Container\ContainerInterface;
/**
 * 
 *  Limita los intentos de una solicitud
 * Summary of RateLimitMiddleware
 */
class RateLimitMiddleware
{
    protected $container;
    protected $limit = 5; // Límite de solicitudes
    protected $interval = 300; // Intervalo en segundos

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

    public function __invoke(Request $request, RequestHandler $handler): Response
    {
        // Obtener la IP del cliente y validarla
        $serverParams = $request->getServerParams();
        $ip = filter_var($serverParams['REMOTE_ADDR'] ?? 'unknown', FILTER_VALIDATE_IP);

        // Si la IP no es válida, respondemos con un error
        if (!$ip) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'IP inválida.']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Obtener la conexión de la base de datos
        $con = $this->container->get('bd');
        $currentTime = time();

        // Iniciar una transacción
        $con->beginTransaction();

        try {
            // Usamos una consulta preparada para contar las solicitudes recientes de la misma IP
            $stmt = $con->prepare("SELECT COUNT(*) FROM request_logs WHERE ip_address = :ip AND request_time > NOW() - INTERVAL :interval SECOND");
            $stmt->execute([':ip' => $ip, ':interval' => $this->interval]);
            
            $requestCount = $stmt->fetchColumn();

            // Verificar si se ha superado el límite de solicitudes
            if ($requestCount >= $this->limit) {
                $response = new \Slim\Psr7\Response(); // Crear una nueva respuesta
                $response->getBody()->write(json_encode(['error' => 'Demasiadas solicitudes, intente más tarde.']));
                $con->rollBack(); // Revertir la transacción
                return $response->withStatus(429)->withHeader('Content-Type', 'application/json');
            }

            // Registrar la solicitud en la base de datos usando una consulta preparada
            $stmt = $con->prepare("INSERT INTO request_logs (ip_address) VALUES (:ip)");
            $stmt->execute([':ip' => $ip]);

            // Eliminar registros antiguos
            $stmt = $con->prepare("DELETE FROM request_logs WHERE request_time < NOW() - INTERVAL 1 HOUR");
            $stmt->execute();
            // Confirmar la transacción
            $con->commit();
            return $handler->handle($request);

        } catch (\Exception $e) {
            // Si ocurre un error, revertir la transacción
            $con->rollBack();
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write(json_encode(['error' => 'Error interno']));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}
