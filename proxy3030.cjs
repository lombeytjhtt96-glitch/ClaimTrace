const net = require('net');

const TARGET_PORT = 3000;
const LISTEN_PORT = 3030;

const server = net.createServer((clientSocket) => {
  const targetSocket = net.createConnection({ host: '127.0.0.1', port: TARGET_PORT }, () => {
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });

  targetSocket.on('error', () => {
    clientSocket.destroy();
  });

  clientSocket.on('error', () => {
    targetSocket.destroy();
  });
});

// Listening without specifying '0.0.0.0' binds to '::' with dual-stack support (IPv4 & IPv6 localhost)
server.listen(LISTEN_PORT, () => {
  console.log(`[ClaimTrace Proxy] Forwarding dual-stack port ${LISTEN_PORT} -> 127.0.0.1:${TARGET_PORT}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
