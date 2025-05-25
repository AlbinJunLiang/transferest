<?php
namespace App\Controllers;

use App\EmailService;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;


class EmailController
{

    protected $container;
    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }
    /**
     * Para enviar correos
     * 
     * @param Psr\Http\Message\ServerRequestInterface $request
     * @param Psr\Http\Message\ResponseInterface $response
     * @param mixed $args
     * @return Response
     */
    public function sendEmail(Request $request, Response $response, $args)
    
        {
            $data = json_decode($request->getBody()->getContents(), true);
    
            if (!isset($data['to']) || !isset($data['subject']) || !isset($data['message'])) {
                $response->getBody()->write(json_encode(['error' => 'Faltan parámetros']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }
    
            if (empty($data['to']) || empty($data['subject']) || empty($data['message'])) {
                $response->getBody()->write(json_encode(['error' => 'Los campos no pueden estar vacíos']));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }
    
            $emailService = new EmailService();
            $result = $emailService->sendEmail($data['to'], $data['subject'], $data['message']);
    
            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(isset($result['success']) ? 200 : 500);
        }
    
}