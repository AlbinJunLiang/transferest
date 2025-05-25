<?php



namespace App\Services;
use App\Models\Account;

class AccountService
{
    private $accountModel;

    public function __construct(Account $userModel)
    {
        $this->accountModel = $userModel;
    }

    public function transfer($sender, $receiver, $amount, $details): array
    {

        if (!$this->accountModel->isAccountActiveByField('phoneNumber', $sender)) {
            return ['success' => false, 'message' => 'La cuenta emisora no se encuentra activa'];

        }
        if (!$this->accountModel->verifyUser($sender)) {
            return ['success' => false, 'message' => 'No existe el emisor'];
        }

        if (!$this->accountModel->verifyUser($receiver)) {
            return ['success' => false, 'message' => 'No existe el destinatario'];
        }

        if ($sender == $receiver) {
            return ['success' => false, 'message' => 'No puede transferir al mismo número'];
        }


        if ($amount <= 0) {
            return ['success' => false, 'message' => 'Invalid amount'];
        }
        if (!$this->accountModel->checkBalance($sender, $amount)) {
            return ['success' => false, 'message' => 'Saldo insuficiente para realizar la transferencia'];
        }


        $result = $this->accountModel->transfer($sender, $receiver, $amount, $details);
        return $result;
    }

    public function isAccountActive($userId): bool
    {

        if (!$this->accountModel->isAccountActiveByField("idUser", $userId)) {
            return false;
        } else {
            return true;
        }
    }


    public function getBalance($phoneNumber): array
    {
        if (!$this->accountModel->verifyUser($phoneNumber)) {
            return [
                'success' => false,
                'message' => 'El usuario no existe',
                'balance' => null
            ];
        }

        $balanceData = $this->accountModel->getBalance($phoneNumber);

        return [
            'success' => true,
            'message' => 'Saldo obtenido correctamente',
            'balance' => $balanceData['balance'] ?? 0
        ];
    }






}
