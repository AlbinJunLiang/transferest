<?php
namespace App\Models;

use PDO;
use PDOException;
use Psr\Container\ContainerInterface;

class Transfer
{
    protected $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }

    /**
     * Para paginar los registros de las transferencias de un usario en un determinado rango
     * de registros pertenecientes a un usuario
     *
     * @param mixed $limit  Fin del registro (Hasta donde se quiere mostrar)
     * @param mixed $start  Inicio del registro
     * @param mixed $idUser
     * @return array{message: string, success: bool, total: int, transfers: array|array{success: bool, total: int, transfers: mixed}}
     */
    public function getTransfers($limit, $start, $idUser): array
    {
        try {
            $con = $this->container->get('bd');
            $stmt = $con->prepare("
    SELECT 
        t.amount, 
        t.transactionDateTime,
        t.referenceCode, 
        t.details,
        sender.phoneNumber AS senderPhone,
        receiver.phoneNumber AS receiverPhone
    FROM transfer t
    JOIN users sender ON t.idSender = sender.idUser
    JOIN users receiver ON t.idReceiver = receiver.idUser
    WHERE t.idSender = :idUser OR t.idReceiver = :idUser
    ORDER BY t.idTransfer DESC
    LIMIT :limit OFFSET :start
");

            $stmt->bindValue(':idUser', (int) $idUser, PDO::PARAM_INT);
            $stmt->bindValue(':limit', (int) $limit, PDO::PARAM_INT);
            $stmt->bindValue(':start', (int) $start, PDO::PARAM_INT);
            $stmt->execute();
            $transfers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Consulta del total de transferencias donde fue emisor o receptor
            $totalStmt = $con->prepare("
            SELECT COUNT(*) as total FROM transfer
            WHERE idSender = :idUser OR idReceiver = :idUser
        ");
            $totalStmt->bindValue(':idUser', (int) $idUser, PDO::PARAM_INT);
            $totalStmt->execute();
            $totalResult = $totalStmt->fetch(PDO::FETCH_ASSOC);
            $total = (int) $totalResult['total'];

            return [
                'success' => true,
                'transfers' => $transfers,
                'total' => $total,
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'message' => 'Error al consultar: ' . $e->getMessage(),
                'total' => 0,
                'transfers' => [],
            ];
        }
    }

}