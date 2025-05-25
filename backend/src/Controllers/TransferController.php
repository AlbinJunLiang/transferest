<?php
namespace App\Controllers;

use App\Services\TransferService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Para manejar el recurso de la transferencias
 */

class TransferController
{
    private $transferService;

    public function __construct(TransferService $transferService)
    {
        $this->transferService = $transferService;
    }
    /**
     * 
     * Obtiene las transferencias
     * 
     * @param \Psr\Http\Message\ServerRequestInterface $request
     * @param \Psr\Http\Message\ResponseInterface $response
     * @return Response
     */
    public function getTransfers(Request $request, Response $response)
    {

        $userId = $request->getAttribute('userId'); // el sub del token

        $limit = (int) $request->getQueryParams()['limit'] ?? 10; // valor predeterminado 10
        $start = (int) $request->getQueryParams()['start'] ?? 0;   // valor predeterminado 0
        $idUser = (int) $request->getQueryParams()['idUser'] ?? -1; // valor predeterminado 0 si no está presente
        if ($userId !== $idUser) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no autorizado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401); // Status 401 para no autorizado

        }
        // Llama al servicio con los valores de limit, start y idSender
        $result = $this->transferService->getTransfers($limit, $start, $idUser);

        // Escribe la respuesta JSON
        $response->getBody()->write(json_encode($result));

        // Devuelve la respuesta con el código de estado adecuado
        return $response->withHeader('Content-Type', 'application/json')->withStatus(!$result['success'] ? 404 : 200);
    }




}