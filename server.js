import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket, request) => {
  const ip = request.socket.remoteAddress;
  socket.on('message', (message) => {
    const updatedMessage = message.toString().toUpperCase();
    console.log({ message });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN)
        client.send(`SERVER BROADCAST: ${updatedMessage}`);
    });
  });

  socket.on('error', (error) => {
    console.error({ error });
  });

  socket.on('close', () => {
    console.log(`Client disconnected: ${ip}`);
  });
});
