import { WebSocketServer, WebSocket } from 'ws';

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  const message = JSON.stringify(payload);

  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(message);
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024,
  });

  wss.on('connection', (socket) => {
    sendJson(socket, { message: 'Welcome to the WebSocket server' });
    socket.on('error', console.error);
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: 'match-created', data: match });
  }

  return { broadcastMatchCreated };
}
