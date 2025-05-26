class ConnectionManager {
  constructor() {
    this.clients = new Map();
  }

  addConnection(ws) {
    ws.on('authenticate', (userId, name) => {
      this.clients.set(userId, { ws, name });
      ws.userId = userId;
      console.log(`✔ Usuario ${name} (${userId}) registrado`);
    });
  }

  removeConnection(ws) {
    if (ws.userId) {
      this.clients.delete(ws.userId);
      console.log(`⛔ Usuario desconectado: ${ws.userId}`);
    }
  }

  getClient(userId) {
    return this.clients.get(userId);
  }

  broadcastTo(userId, message) {
    const client = this.getClient(userId);
    if (client) {
      client.ws.send(JSON.stringify(message));
    }
  }
}

module.exports = ConnectionManager;