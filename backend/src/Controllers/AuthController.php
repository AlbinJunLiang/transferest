<?php

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\EmailService;


class AuthController
{
    protected $container;

    public function __construct(ContainerInterface $c)
    {
        $this->container = $c;
    }


    /**
     * 
     * Valida los siguientes datos de registros que no esten vacios
     * @param mixed $email
     * @param mixed $password
     * @param mixed $name
     * @param mixed $lastName
     * @param mixed $phoneNumber
     * @return bool
     */
    function validateRegisterForm($email, $password, $name, $lastName, $phoneNumber): bool
    {
        return !empty($email) && !empty($password) && !empty($name) && !empty($lastName) && !empty($phoneNumber);
    }

    /**
     * Envía correo
     * 
     * @param mixed $tempCode
     * @param mixed $email
     * @return array{error: string|array{success: string}}
     */

    function sendEmailRegister($tempCode, $email)
    {
        $htmlMessage = "
        <div style='font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 400px; margin: auto; background: #f9f9f9;'>
            <h2 style='color: #007BFF;'>Confirmación de Cuenta</h2>
            <p style='font-size: 16px; color: #333;'>Tu código de verificación es:</p>
            <p style='font-size: 24px; font-weight: bold; color: #007BFF; background: #e9ecef; display: inline-block; padding: 10px 20px; border-radius: 5px;'>
                $tempCode
            </p>
            <p style='font-size: 14px; color: #666;'>Este código expirará en <strong>5 minutos</strong>. Usa el código antes de que expire.</p>
        </div>
        ";

        // Enviar email
        $emailService = new EmailService();
        return $emailService->sendEmail($email, "Confirmación de cuenta", $htmlMessage);
    }

    /**
     * Para crear o registrar un nuevo usuario, tambien se envia un código para activar la cuenta
     * despues de haber validado al formulario
     * 
     * @param Psr\Http\Message\ServerRequestInterface $request
     * @param Psr\Http\Message\ResponseInterface $response
     * @return Response
     */
    public function register(Request $request, Response $response)
    {
        try {
            $con = $this->container->get('bd'); // Conexión a la BD
            $con->beginTransaction(); // 🔹 Iniciar transacción

            $data = json_decode($request->getBody()->getContents(), true);
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            $name = $data['name'] ?? '';
            $middleName = $data['middleName'] ?? '';
            $lastName = $data['lastName'] ?? '';
            $firstSurname = $data['firstSurname'] ?? '';
            $phoneNumber = $data['phoneNumber'] ?? '';

            if (!$this->validateRegisterForm($email, $password, $name, $lastName, $phoneNumber)) {
                $response->getBody()->write(json_encode([
                    'error' => 'Email, contraseña, nombre, apellido y teléfono requeridos'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Verificar si el usuario ya existe
            $stmt = $con->prepare("SELECT idUser FROM users WHERE email = ? OR phoneNumber = ?");
            $stmt->execute([$email, $phoneNumber]);
            if ($stmt->fetch()) {
                $response->getBody()->write(json_encode([
                    'error' => 'El correo o número de teléfono ya está registrado.'
                ]));
                return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
            }

            // Hashear la contraseña
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Insertar usuario
            $stmt = $con->prepare("INSERT INTO users (name, middleName, lastName, firstSurname, email, 
            phoneNumber, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $middleName, $lastName, $firstSurname, $email, $phoneNumber, $hashedPassword, 'user', 'active']);

            $userId = $con->lastInsertId();

            // Insertar cuenta
            $stmt = $con->prepare("INSERT INTO accounts (fk_user_id, balance, status) VALUES (?, ?, ?)");
            $stmt->execute([$userId, 5000.0, 'inactive']);

            // Código de verificación
            $tempCode = rand(100000, 999999);
            $expiration = time() + 300; // El código expirará en 5 minutos

            $stmt = $con->prepare("INSERT INTO confirmations (fk_user_id, tempCode, expirationTime, status) VALUES (?, ?, ?, ?)");
            $stmt->execute([$userId, $tempCode, $expiration, "active"]);

            // Generar JWT
            $token = $this->generateJWT(
                $userId,
                $email,
                'user',
                $name,
                $middleName,
                $lastName,
                $firstSurname,
                $phoneNumber
            );
            $result = $this->sendEmailRegister($tempCode, $email);

            if (!isset($result['success'])) {
                $con->rollBack();
                $response->getBody()->write(json_encode(['error' => 'No se pudo enviar correctamente el código de verificación']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $con->commit();

            $response->getBody()->write(json_encode([
                'token' => $token,
                'message' => 'Usuario registrado y cuenta creada exitosamente. Se ha enviado un código de activación a tu correo.'
            ]));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $con->rollBack();
            $response->getBody()->write(json_encode(['error' => 'Ha ocurrido un error: ' . $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Para inciar la sesion
     * 
     * @param Psr\Http\Message\ServerRequestInterface $request
     * @param Psr\Http\Message\ResponseInterface $response
     * @return Response
     */
    public function login(Request $request, Response $response)
    {
        $data = json_decode($request->getBody()->getContents(), associative: true);
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        $con = $this->container->get('bd');
        $stmt = $con->prepare("SELECT idUser, name, middleName, lastName ,firstSurname, 
        role, password, phoneNumber FROM users WHERE email = ?");
        $stmt->execute([$email]);

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            $token = $this->generateJWT(
                $user['idUser'],
                $email,
                $user['role']
                ,
                $user['name'],
                $user['middleName'],
                $user['lastName'],
                $user['firstSurname'],
                $user['phoneNumber'],

            );

            $response->getBody()->write(json_encode(['token' => $token]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }

        // ✅ Corregido: Usamos getBody()->write()
        $response->getBody()->write(json_encode(['error' => 'Credenciales incorrectas']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }

    /**
     * Para actializar o cambiar la contraseña
     * 
     * @param Psr\Http\Message\ServerRequestInterface $request
     * @param Psr\Http\Message\ResponseInterface $response
     * @param mixed $args
     * @return Response
     */
    public function changePassword(Request $request, Response $response, $args)
    {
        $token = $request->getHeaderLine('Authorization');
        $key = $_ENV['API_KEY'];


        $data = json_decode($request->getBody()->getContents(), true);
        $newPassword = $data['newPassword'] ?? '';
        $password = $data['password'] ?? '';


        if (!$token) {
            $response->getBody()->write(json_encode(['error' => 'Token no proporcionado']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $token = str_replace('Bearer ', '', $token);

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
            $email = $decoded->data->email;
            $body = json_decode($request->getBody());

            // Validar que la nueva contraseña fue proporcionada
            if (empty($body->newPassword)) {
                // Si no se proporciona la nueva contraseña
                $response->getBody()->write(json_encode(['error' => 'Nueva contraseña requerida']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $con = $this->container->get('bd');

            $stmt = $con->prepare("SELECT email, password FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);


            if (!$user) {
                $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }


            if (!password_verify($password, $user['password'])) {
                $response->getBody()->write(json_encode(['error' => 'Contraseña actual no válida']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');

            }

            // Hashear la nueva contraseña
            $newPassword = password_hash($newPassword, PASSWORD_DEFAULT);

            // Actualizar la contraseña en la base de datos
            $query = $con->prepare("UPDATE users SET password = ? WHERE email = ?");
            $query->execute([$newPassword, $email]);

            if ($query->rowCount() > 0) {
                $response->getBody()->write(json_encode(['message' => 'Contraseña actualizada exitosamente']));
                return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode(['error' => 'No se pudo actualizar la contraseña. Verifique si la contraseña es diferente a la actual.']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        } catch (Exception $e) {
            // Si el token no es válido o ha expirado
            $response->getBody()->write(json_encode(['error' => 'Token no válido o expirado']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }
    /**
     * 
     * 
     * @param Psr\Http\Message\ServerRequestInterface $request
     * @param Psr\Http\Message\ResponseInterface $response
     * @param mixed $args
     * @throws \Exception
     * @return Response
     */
    function verifyAccount(Request $request, Response $response, $args)
    {
        $token = $request->getHeaderLine('Authorization');
        $key = $_ENV['API_KEY'];
        $data = json_decode($request->getBody()->getContents(), true);
        $code = $data['verificationCode'] ?? '';

        if (!$token) {
            $response->getBody()->write(json_encode(['error' => 'Token no proporcionado']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $token = str_replace('Bearer ', '', $token);

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            // Verificar que el token tenga la estructura esperada
            if (!isset($decoded->sub)) {
                throw new Exception('Estructura del token inválida');
            }

            $idUser = $decoded->sub;
            $con = $this->container->get('bd');

            // Opción 1: Si expirationTime es UNIX timestamp
            $sql = "SELECT * FROM confirmations
                    WHERE fk_user_id = ? 
                    AND tempCode = ? 
                    AND expirationTime > ?  
                    ORDER BY idConfirmation DESC
                    LIMIT 1";

            $query = $con->prepare($sql);
            $query->execute([$idUser, $code, time()]);  // Pasamos el timestamp actual


            if ($query->rowCount() > 0) {
                // Actualizar cuenta
                $con->beginTransaction();
                try {
                    $stmt = $con->prepare("UPDATE accounts SET status = 'active' WHERE fk_user_id = ?");
                    $stmt->execute([$idUser]);

                    $stmt = $con->prepare("UPDATE confirmations SET status = 'used' WHERE fk_user_id = ? AND tempCode = ?");
                    $stmt->execute([$idUser, $code]);

                    $con->commit();

                    $response->getBody()->write(json_encode(['success' => 'Cuenta activada exitosamente']));
                    return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
                } catch (Exception $e) {
                    $con->rollBack();
                    throw $e;
                }
            } else {
                $response->getBody()->write(json_encode(['error' => 'Código de verificación inválido o expirado']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Error de verificación: ' . $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }

    /**
     * Solicita la recuperacion de la cuenta
     */

    public function requestAccountRecover(Request $request, Response $response)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $email = $data['email'] ?? '';

        // Validar si se proporcionó un email
        if (empty($email)) {
            $response->getBody()->write(json_encode(['error' => 'Email requerido']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $con = $this->container->get('bd');

        // Verificar si el email existe en la base de datos
        $stmt = $con->prepare("SELECT idUser FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Generar un código de verificación temporal
        $tempCode = rand(100000, 999999);
        $expiration = time() + 300; // El código expirará en 5 minutos

        // Insertar el código de verificación en la base de datos
        $stmt = $con->prepare("INSERT INTO confirmations (fk_user_id, tempCode, expirationTime, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user['idUser'], $tempCode, $expiration, 'active']);

        // Enviar el código de verificación al correo electrónico
        $htmlMessage = "
    <div style='font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 400px; margin: auto; background: #f9f9f9;'>
        <h2 style='color: #007BFF;'>Recuperación de Contraseña</h2>
        <p style='font-size: 16px; color: #333;'>Tu código de verificación es:</p>
        <p style='font-size: 24px; font-weight: bold; color: #007BFF; background: #e9ecef; display: inline-block; padding: 10px 20px; border-radius: 5px;'>$tempCode</p>
        <p style='font-size: 14px; color: #666;'>Este código expirará en <strong>5 minutos</strong>. Usa el código antes de que expire.</p>
    </div>
    ";

        $emailService = new EmailService();
        $result = $emailService->sendEmail($email, "Recuperación de Contraseña", $htmlMessage);

        if (!isset($result['success'])) {
            $response->getBody()->write(json_encode(['error' => 'No se pudo enviar el código de verificación']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['message' => 'Se ha enviado un código de verificación a tu correo.']));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }


    /**
     * Solicita la confirmacion de la cuenta
     * 
     * @param Psr\Http\Message\ServerRequestInterface $request
     * @param Psr\Http\Message\ResponseInterface $response
     * @return Response
     */
    public function requestConfirmation(Request $request, Response $response)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $email = $data['email'] ?? '';

        // Validar si se proporcionó un email
        if (empty($email)) {
            $response->getBody()->write(json_encode(['error' => 'Email requerido']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $con = $this->container->get('bd');

        // Verificar si el email existe en la base de datos
        $stmt = $con->prepare("SELECT idUser FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Verificar si la cuenta ya está activa
        $stmt = $con->prepare("SELECT status FROM accounts WHERE fk_user_id = ?");
        $stmt->execute([$user['idUser']]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($account && $account['status'] === 'active') {
            $response->getBody()->write(json_encode(['message' => 'La cuenta ya está activa. No es necesario enviar el código de verificación.']));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        }

        // Generar un código de verificación temporal
        $tempCode = rand(100000, 999999);
        $expiration = time() + 300; // El código expirará en 5 minutos

        // Insertar el código de verificación en la base de datos
        $stmt = $con->prepare("INSERT INTO confirmations (fk_user_id, tempCode, expirationTime, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user['idUser'], $tempCode, $expiration, 'active']);

        // Enviar el código de verificación al correo electrónico
        $htmlMessage = "
    <div style='font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 400px; margin: auto; background: #f9f9f9;'>
        <h2 style='color: #007BFF;'>Solicitud de verificación</h2>
        <p style='font-size: 16px; color: #333;'>Tu código de verificación es:</p>
        <p style='font-size: 24px; font-weight: bold; color: #007BFF; background: #e9ecef; display: inline-block; padding: 10px 20px; border-radius: 5px;'>$tempCode</p>
        <p style='font-size: 14px; color: #666;'>Este código expirará en <strong>5 minutos</strong>. Usa el código antes de que expire.</p>
    </div>
    ";

        $emailService = new EmailService();
        $result = $emailService->sendEmail($email, "Solicitud de verificación", $htmlMessage);

        if (!isset($result['success'])) {
            $response->getBody()->write(json_encode(['error' => 'No se pudo enviar el código de verificación']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['message' => 'Se ha enviado un código de verificación a tu correo.']));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    /**
     * Actualiza la contraseña verificando con un codigo enviado por correo
     * 
     * @param Psr\Http\Message\ServerRequestInterface $request
     * @param Psr\Http\Message\ResponseInterface $response
     * @return Response
     */
    public function resetPassword(Request $request, Response $response)
    {
        $data = json_decode($request->getBody()->getContents(), true);
        $email = $data['email'] ?? '';
        $verificationCode = $data['verificationCode'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        // Validaciones
        if (empty($email) || empty($verificationCode) || empty($newPassword)) {
            $response->getBody()->write(json_encode(['error' => 'Email, código de verificación y nueva contraseña son requeridos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Conexión a la base de datos
        $con = $this->container->get('bd');

        // Verificar si el email existe en la base de datos
        $stmt = $con->prepare("SELECT idUser FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $sql = "SELECT * FROM confirmations
        WHERE fk_user_id = ? 
        AND tempCode = ? 
        AND expirationTime > ?  
        ORDER BY idConfirmation DESC
        LIMIT 1";

        // Verificar si el código de verificación es válido
        $stmt = $con->prepare($sql);
        $stmt->execute([$user['idUser'], $verificationCode, time()]); // Usamos time() para verificar si el código ha expirado

        $confirmation = $stmt->fetch(PDO::FETCH_ASSOC);


        if (!$confirmation || $confirmation['fk_user_id'] != $user['idUser']) {
            $response->getBody()->write(json_encode(['error' => 'Código no coincide con el usuario']));
            return $response->withStatus(400);
        }
        if (!$confirmation) {
            $response->getBody()->write(json_encode(['error' => 'Código de verificación inválido o expirado']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Actualizar la contraseña
        $newHashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $con->prepare("UPDATE users SET password = ? WHERE idUser = ?");
        $stmt->execute([$newHashedPassword, $user['idUser']]);

        // Marcar el código como usado
        $stmt = $con->prepare("UPDATE confirmations SET status = 'used' WHERE fk_user_id = ? AND tempCode = ?");
        $stmt->execute([$user['idUser'], $verificationCode]);

        $response->getBody()->write(json_encode(['message' => 'Contraseña recuperada exitosamente']));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }


    /**
     * 
     * Genera la estructura del JWT
     * 
     * @param mixed $userId
     * @param mixed $email
     * @param mixed $rol
     * @param mixed $name
     * @param mixed $middleName
     * @param mixed $lastName
     * @param mixed $firstSurname
     * @param mixed $phoneNumber
     * @return string
     */
    private function generateJWT(
        $userId,
        $email,
        $rol,
        $name,
        $middleName,
        $lastName,
        $firstSurname,
        $phoneNumber
    ) {
        $key = $_ENV['API_KEY'];
        $payload = [
            'iss' => "localhost",
            'aud' => "localhost",
            'iat' => time(),
            'exp' => time() + 3600,
            'sub' => $userId,  // Aquí agregas el ID del usuario como el "subject"
            'data' => [
                'email' => $email,
                'rol' => $rol,
                'name' => $name,
                'middleName' => $middleName,
                'lastName' => $lastName,
                'firstSurname' => $firstSurname,
                'phoneNumber' => $phoneNumber

            ]
        ];

        return JWT::encode($payload, $key, 'HS256');
    }
}
