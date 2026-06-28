import { WebSocketServer } from 'ws';
import { wsArcjet } from '../arcjet.js';

const HEARTBEAT_INTERVAL_MS = 30_000;

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

function startHeartbeat(wss) {
  const interval = setInterval(() => {
    for (const socket of wss.clients) {
      if (socket.isAlive === false) {
        socket.terminate();
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);

  wss.on('close', () => clearInterval(interval));

  return interval;
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 1024 * 1024,
  });

  startHeartbeat(wss);

  wss.on('connection', async (socket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);

        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit()
            ? 'Rate limit exceeded'
            : 'Connection refused';
          socket.close(code, reason);
          return;
        }
      } catch (error) {
        console.error('Error processing WebSocket request:', error);
        socket.close(1011, 'Internal server error');
        return;
      }
    }

    socket.isAlive = true;

    sendJson(socket, {
      type: 'connected',
      message: 'Welcome to the WebSocket server',
    });

    socket.on('pong', () => {
      socket.isAlive = true;
    });

    socket.on('error', console.error);
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, { type: 'match-created', data: match });
  }

  return { broadcastMatchCreated };
}
