<?php
namespace App\Services;

use App\Models\User;

class UserService
{
    private $userModel;

    public function __construct(User $userModel)
    {
        $this->userModel = $userModel;
    }

    public function getUserInfo($phoneNumber): array
    {
        $result = $this->userModel->getUserInfo($phoneNumber);
        return $result;
    }

}
