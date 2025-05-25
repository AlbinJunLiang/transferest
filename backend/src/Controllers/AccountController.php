<?php
namespace App\Controllers;
use App\Services\AccountService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AccountController
{
    private $accountService;

    public function __construct(AccountService $userService)
    {
        $this->accountService = $userService;
    }

    /**
     * Para transferir daldo
     */
    public function transfer(Request $request, Response $response)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $sender = $data['sender'] ?? '';
        $receiver = $data['receiver'] ?? '';
        $amount = $data['amount'] ?? '';
        $details = $data['details'] ?? '';
        $message = $this->accountService->transfer($sender, $receiver, $amount, $details);

        if ($amount <= 0) {
            $message = "Invalid amount";
            $response->getBody()->write(json_encode(['error' => $message]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        if ($message['success'] == false) {
            $response->getBody()->write(json_encode(value: ['error' => $message]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        $response->getBody()->write(json_encode(value: ['data' => $message]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    /**
     * 
     * Verificar si la cuenta esta activa
     * 
     * @param \Psr\Http\Message\ServerRequestInterface $request
     * @param \Psr\Http\Message\ResponseInterface $response
     * @param mixed $args
     * @return Response
     */
    public function isAccountActive(Request $request, Response $response, $args)
    {
        $userId = $args['idUser'];
        $isActive = $this->accountService->isAccountActive($userId);

        $response->getBody()->write(json_encode(['success' => $isActive]));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($isActive ? 200 : 404);
    }

    /**
     * 
     * Obtener el saldo
     * @param \Psr\Http\Message\ServerRequestInterface $request
     * @param \Psr\Http\Message\ResponseInterface $response
     * @param mixed $args
     * @return Response
     */

    public function getBalance(Request $request, Response $response, $args)
    {
        $phoneNumber = $args['phoneNumber'];
        $balanceData = $this->accountService->getBalance($phoneNumber);
        $attributePhoneNumber = $request->getAttribute('user')->phoneNumber; // el sub del token

        if ($attributePhoneNumber !== $phoneNumber) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no autorizado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401); // Status 401 para no autorizado

        }

        $response->getBody()->write(json_encode($balanceData));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($balanceData['success'] ? 200 : 404);
    }
}
