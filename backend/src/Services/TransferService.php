<?php
namespace App\Services;

use App\Models\Transfer;

class TransferService
{
    private $transferModel;

    public function __construct(Transfer $userModel)
    {
        $this->transferModel = $userModel;
    }

    public function getTransfers($limit, $start, $idUser): array
    {
        $result = $this->transferModel->getTransfers($limit, $start, $idUser);
        return $result;
    }
    

}
