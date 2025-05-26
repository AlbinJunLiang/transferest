require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const MessageHandler = require('./messageHandler');
const ConnectionManager = require('./connectionManager');

const PORT = process.env.PORT;

class WebSocketServer {
  constructor() {
    this.server = http.createServer(this._createHttpServer());
    this.wss = new WebSocket.Server({ server: this.server });
    this.connectionManager = new ConnectionManager();
    this.messageHandler = new MessageHandler(this.connectionManager);
    
    this._setupEventListeners();
  }

  _createHttpServer() {
    return (_, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Servidor WebSocket activo\n');
    };
  }

  _setupEventListeners() {
    this.wss.on('connection', (ws) => {
      this.connectionManager.addConnection(ws);
      
      ws.on('message', (raw) => this.messageHandler.handleMessage(ws, raw));
      ws.on('close', () => this.connectionManager.removeConnection(ws));
    });
  }

  start() {
    this.server.listen(PORT, () => {
      console.log(`Servidor WS escuchando en ws://localhost:${PORT}`);
    });
  }
}

module.exports = WebSocketServer;