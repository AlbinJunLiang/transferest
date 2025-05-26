const jwt = require('jsonwebtoken');
const NotificationService = require('./notificationService');

class MessageHandler {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.SECRET = process.env.SECRET;
    this.notificationService = new NotificationService(connectionManager);
  }

  async handleMessage(ws, raw) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return this._sendError(ws, 'JSON inválido');
    }

    try {
      switch (data.type) {
        case 'register':
          await this._handleRegister(ws, data);
          break;
        case 'transfer':
          await this._handleTransfer(ws, data);
          break;
        default:
          this._sendError(ws, 'Tipo de mensaje no soportado');
      }
    } catch (error) {
      console.error(error);
      this._sendError(ws, error.message || 'Error procesando mensaje');
    }
  }

  async _handleRegister(ws, data) {
    this._validateRegisterData(data);
    this._verifyToken(data.token, data.id);
    
    ws.emit('authenticate', data.id, data.name);
    this._sendSuccess(ws, 'Registro exitoso');
  }

  async _handleTransfer(ws, data) {
    this._validateTransferData(data);
    const payload = this._verifyToken(data.token, data.senderId);
    
    await this.notificationService.processTransfer({
      senderId: data.senderId,
      recipientId: data.recipientId,
      amount: data.amount,
      referenceCode: data.referenceCode
    });
    
    this._sendSuccess(ws, `Notificación enviada para referencia ${data.referenceCode}`);
  }

  _validateRegisterData(data) {
    if (!data.id || !data.name) {
      throw new Error('Faltan id o name');
    }
  }

  _validateTransferData(data) {
    if (!data.referenceCode) {
      throw new Error('Falta referenceCode');
    }
  }

  _verifyToken(token, expectedId) {
    if (!token) throw new Error('Token JWT requerido');
    
    const payload = jwt.verify(token, this.SECRET);
    if (String(expectedId) !== String(payload.sub)) {
      throw new Error('ID no coincide con token');
    }
    
    return payload;
  }

  _sendError(ws, message) {
    ws.send(JSON.stringify({ type: 'error', message }));
  }

  _sendSuccess(ws, message) {
    ws.send(JSON.stringify({ type: 'success', message }));
  }
}

module.exports = MessageHandler;