<?php


// src/EmailService.php
namespace App;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    public function sendEmail($to, $subject, $body)
    {
        $mail = new PHPMailer(true);
        $email = $_ENV['EMAIL'];
        $password = $_ENV['EMAIL_PASSW'];

        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.zoho.com';
            $mail->SMTPAuth = true;
            $mail->Username = $email;  // Tu correo electrónico
            $mail->Password = $password;  // Tu contraseña
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;
            $mail->CharSet = 'UTF-8';
            $mail->isHTML(true); // Habilitar formato HTML

            $mail->setFrom($email, 'Bank Test');
            $mail->addAddress($to);
            $mail->Subject = $subject;
            $mail->Body = $body;

            $mail->send();
            return ['success' => 'Correo enviado correctamente'];
        } catch (Exception $e) {
            return ['error' => 'Error al enviar el correo: ' . $e->getMessage()];
        }
    }
}
