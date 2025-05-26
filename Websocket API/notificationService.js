const pool = require('./db');

class NotificationService {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
  }

  async processTransfer({ senderId, recipientId, amount, referenceCode }) {
    const conn = await pool.getConnection();
    
    try {
      const [rows] = await conn.execute(
        `SELECT * FROM Notificacion WHERE referenceCode = ? LIMIT 1`,
        [referenceCode]
      );

      if (rows.length === 0) {
        await this._createNewNotification(conn, referenceCode, senderId);
        this._notifyParties(senderId, recipientId, amount, referenceCode);
        console.log(`✅ Notificación creada para referencia ${referenceCode}`);
      } else {
        console.log(`ℹ️ Notificación para referencia ${referenceCode} ya existe`);
      }
    } finally {
      conn.release();
    }
  }

  async _createNewNotification(conn, referenceCode, senderId) {
    await conn.execute(
      `INSERT INTO Notificacion (referenceCode, idSender) VALUES (?, ?)`,
      [referenceCode, senderId]
    );
  }

  _notifyParties(senderId, recipientId, amount, referenceCode) {
    const recipient = this.connectionManager.getClient(recipientId);
    const sender = this.connectionManager.getClient(senderId);
    const senderName = sender ? sender.name : 'Desconocido';

    if (recipient) {
      this.connectionManager.broadcastTo(recipientId, {
        type: 'transfer',
        from: senderName,
        amount
      });
    }

    if (sender) {
      this.connectionManager.broadcastTo(senderId, {
        type: 'ack',
        message: `Notificación enviada para referencia ${referenceCode}`
      });
    }
  }
}

module.exports = NotificationService;