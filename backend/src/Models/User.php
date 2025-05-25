<?php

namespace App\Models;
use PDO;
use PDOException;
use Psr\Container\ContainerInterface;




class User
{


    protected $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

/**
 * Obtener los datos de un usuario por el numero de telefono
 */

    public function getUserInfo($phoneNumber): array
{
    try {
        $con = $this->container->get('bd');
        $stmt = $con->prepare("
            SELECT idUser, name, middleName, firstSurname, lastName, phoneNumber 
            FROM users 
            WHERE phoneNumber = ?
        ");
        $stmt->execute([$phoneNumber]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            return ['success' => true, 'user' => $user];
        } else {
            return ['success' => false, 'message' => 'El usuario no existe'];
        }
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Error al consultar el usuario: ' . $e->getMessage()];
    }
}

}
