const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const matchmaking = require('./sockets/matchmaking');

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

matchmaking(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 