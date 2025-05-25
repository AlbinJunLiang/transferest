<?php
namespace App\Controllers;

use App\Services\UserService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;



class UserController
{
    private $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }


    public function getUserInfo(Request $request, Response $response, $args)
    {
        $phoneNumber = $args['phoneNumber'];
        $result = $this->userService->getUserInfo($phoneNumber);
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(!$result['success'] ? 404 : 200);
    }

    

}