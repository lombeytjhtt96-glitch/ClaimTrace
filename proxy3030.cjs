const net = require('net');

const TARGET_PORT = 3000;
const LISTEN_PORT = 3030;
const HOST = '0.0.0.0';

const server = net.createServer((clientSocket) => {
  const targetSocket = net.createConnection({ host: '127.0.0.1', port: TARGET_PORT }, () => {
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  targetSocket.on('error', (err) => {
    clientSocket.destroy();
  });

  clientSocket.on('error', (err) => {
    targetSocket.destroy();
  });
});

server.listen(LISTEN_PORT, HOST, () => {
  console.log(`[ClaimTrace Proxy] Forwarding 0.0.0.0:${LISTEN_PORT} -> 127.0.0.1:${TARGET_PORT}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
