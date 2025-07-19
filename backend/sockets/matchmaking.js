const UserSession = require('../models/UserSession');
let queue = [];

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('find_match', async (userData) => {
      queue.push({ ...userData, socketId: socket.id });
      if (queue.length >= 2) {
        const [user1, user2] = queue.splice(0, 2);
        io.to(user1.socketId).emit('match_found', { opponent: user2 });
        io.to(user2.socketId).emit('match_found', { opponent: user1 });
      }
    });

    socket.on('submit_answers', async ({ answers, opponentSocketId }) => {
      await UserSession.findOneAndUpdate(
        { socketId: socket.id },
        { answers },
        { upsert: true }
      );
      const opponent = await UserSession.findOne({ socketId: opponentSocketId });
      if (opponent && opponent.answers) {
        const user = await UserSession.findOne({ socketId: socket.id });
        const matched = JSON.stringify(user.answers) === JSON.stringify(opponent.answers);
        io.to(socket.id).emit('match_result', { matched });
        io.to(opponentSocketId).emit('match_result', { matched });
        if (matched) {
          io.to(socket.id).emit('start_chat', { opponentSocketId });
          io.to(opponentSocketId).emit('start_chat', { opponentSocketId: socket.id });
        }
      }
    });

    socket.on('chat_message', ({ message, to }) => {
      if (message.length <= 20) {
        io.to(to).emit('chat_message', { message, from: socket.id });
      }
    });

    socket.on('disconnect', async () => {
      queue = queue.filter(u => u.socketId !== socket.id);
      await UserSession.deleteOne({ socketId: socket.id });
    });
  });
}; 