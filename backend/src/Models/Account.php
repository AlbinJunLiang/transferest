<?php
namespace App\Models;

use PDO;
use PDOException;
use Psr\Container\ContainerInterface;
class Account
{

    protected $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }
    /**
     * Summary of transfer
     * @param mixed $sender
     * @param mixed $receiver
     * @param mixed $amount
     * @param mixed $details
     * @return array{date: mixed, message: string, references: string, success: bool, time: mixed|array{message: string, success: bool}}
     */
    public function transfer($sender, $receiver, $amount, $details): array
    {
        $datetime = date("YmdHis");
        $random = mt_rand(100000, 999999);  // Genera un número aleatorio de 6 dígitos
        $reference = (string) ($datetime . $random);

        try {
            $con = $this->container->get('bd');
            $stmt = $con->prepare("CALL transfer(?,?,?,?,?)");
            $stmt->execute([$sender, $receiver, $amount, $details, $reference]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                'success' => true,
                'message' => 'Transferencia realizada con éxito',
                'references' => $reference,
                'date' => $result['date'],
                'time' => $result['time']
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Error en la transferencia: ' . $e->getMessage()];
        }
    }


    /**
     * Verificar si un usuario existe o no
     */

    public function verifyUser($phoneNumber): bool
    {
        try {
            $con = $this->container->get('bd');
            // Usamos un parámetro con nombre para mayor claridad
            $stmt = $con->prepare("SELECT idUser, name FROM users WHERE phoneNumber = :phoneNumber");

            // Vinculamos el parámetro con nombre de manera explícita
            $stmt->bindParam(':phoneNumber', $phoneNumber, PDO::PARAM_STR);

            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Retornamos true si el usuario existe, false si no
            return (bool) $user;
        } catch (PDOException $e) {
            // Registramos el error si es necesario
            // error_log($e->getMessage()); // Esto te ayudaría en la depuración
            return false;
        }
    }

/**
 * Verificar cuenta activa por numero de telefono
 */

    public function isAccountActive($phoneNumber): bool
    {
        try {
            $con = $this->container->get('bd');
            $stmt = $con->prepare("
            SELECT a.idAccount, a.status 
            FROM accounts a
            INNER JOIN users u ON a.fk_user_id = u.idUser
            WHERE u.phoneNumber = ?
        ");
            $stmt->execute([$phoneNumber]);
            $account = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($account) {
                if ($account['status'] === 'active') {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Verificar cuenta activa 
     * 
     * @param string $field
     * @param mixed $value
     * @return bool
     */
    public function isAccountActiveByField(string $field, $value): bool
    {
        $allowedFields = ['phoneNumber', 'idUser'];

        // Validar si el campo proporcionado es uno de los permitidos
        if (!in_array($field, $allowedFields)) {
            return false;
        }

        try {
            $con = $this->container->get('bd');

            // Usar el campo como parte de la consulta
            $stmt = $con->prepare("
                SELECT a.idAccount, a.status 
                FROM accounts a
                INNER JOIN users u ON a.fk_user_id = u.idUser
                WHERE u.$field = :value
            ");

            // Vincular el valor del parámetro de forma segura
            $stmt->bindParam(':value', $value);

            $stmt->execute();
            $account = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verificar si la cuenta está activa
            return $account && $account['status'] === 'active';
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Obtener o consultar el saldo
     */

    public function getBalance($phoneNumber): array
    {
        try {
            $con = $this->container->get('bd');
            $stmt = $con->prepare("
            SELECT a.balance
            FROM accounts a
            JOIN users u ON a.fk_user_id = u.idUser
            WHERE u.phoneNumber = ?");
            $stmt->execute([$phoneNumber]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: ['balance' => 0];
        } catch (PDOException $e) {
            return ['balance' => 0];
        }
    }


        /**
     * Compara si el saldo de un usuario es igual o mayor al monto que quiera enviar
     * 
     * @param mixed $phoneNumber
     * @param mixed $amount
     * @return bool
     */
    public function checkBalance($phoneNumber, $amount): bool
    {
        try {
            $con = $this->container->get('bd');
            $stmt = $con->prepare("
                SELECT a.balance
                FROM accounts a
                JOIN users u ON a.fk_user_id = u.idUser
                WHERE u.phoneNumber = ? AND a.balance >= ?");
            $stmt->execute([$phoneNumber, $amount]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            return false;
        }
    }

}