const UserSession = require('../models/UserSession');
const Question = require('../models/Question');
const TempChat = require('../models/TempChat');
let queue = [];
let activeGames = {};
let lobbies = {};

function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    // QUICK MATCH (unchanged)
    socket.on('find_match', async (userData) => {
      console.log('User looking for match:', userData, socket.id);
      await UserSession.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: socket.id, name: userData.name, anonymous: userData.anonymous, answers: [] },
        { upsert: true }
      );
      queue.push({ ...userData, socketId: socket.id });
      console.log('Current queue:', queue.map(u => u.socketId));
      if (queue.length >= 2) {
        const [user1, user2] = queue.splice(0, 2);
        console.log('Matched:', user1.socketId, user2.socketId);
        const questions = await Question.aggregate([{ $sample: { size: 5 } }]);
        const gameId = user1.socketId + '_' + user2.socketId;
        activeGames[gameId] = {
          users: [user1.socketId, user2.socketId],
          questions,
          current: 0,
          answers: {},
          timers: {},
        };
        io.to(user1.socketId).emit('start_questions', { questions, gameId });
        io.to(user2.socketId).emit('start_questions', { questions, gameId });
        sendQuestion(io, gameId);
      }
    });

    // LOBBY SYSTEM
    socket.on('create_lobby', async (userData, cb) => {
      let code;
      do {
        code = generateLobbyCode();
      } while (lobbies[code]);
      lobbies[code] = { users: [socket.id], userData: [userData] };
      await UserSession.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: socket.id, name: userData.name, anonymous: userData.anonymous, answers: [] },
        { upsert: true }
      );
      cb && cb({ code });
    });

    socket.on('join_lobby', async ({ code, userData }, cb) => {
      const lobby = lobbies[code];
      if (!lobby) return cb && cb({ error: 'Lobby not found' });
      if (lobby.users.length >= 2) return cb && cb({ error: 'Lobby full' });
      lobby.users.push(socket.id);
      lobby.userData.push(userData);
      await UserSession.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: socket.id, name: userData.name, anonymous: userData.anonymous, answers: [] },
        { upsert: true }
      );
      // Notify both users lobby is ready
      io.to(lobby.users[0]).emit('lobby_ready', { code });
      io.to(lobby.users[1]).emit('lobby_ready', { code });
      cb && cb({ success: true });
    });

    socket.on('start_lobby_game', async ({ code }) => {
      const lobby = lobbies[code];
      if (!lobby || lobby.users.length < 2) return;
      const [user1, user2] = lobby.users;
      const questions = await Question.aggregate([{ $sample: { size: 5 } }]);
      const gameId = user1 + '_' + user2;
      activeGames[gameId] = {
        users: [user1, user2],
        questions,
        current: 0,
        answers: {},
        timers: {},
      };
      io.to(user1).emit('lobby_game_started', { questions, gameId });
      io.to(user2).emit('lobby_game_started', { questions, gameId });
      sendQuestion(io, gameId);
      delete lobbies[code];
    });

    // ...rest of the code (question_answered, disconnect, sendQuestion)
    socket.on('question_answered', ({ gameId, answer }) => {
      const game = activeGames[gameId];
      if (!game) return;
      game.answers[socket.id] = answer;
      if (Object.keys(game.answers).length === 2) {
        clearTimeout(game.timers[game.current]);
        const [a1, a2] = Object.values(game.answers);
        if (a1 === a2) {
          game.current++;
          if (game.current < game.questions.length) {
            game.answers = {};
            sendQuestion(io, gameId);
          } else {
            // All matched, allow chat
            io.to(game.users[0]).emit('all_matched', { opponentSocketId: game.users[1], gameId });
            io.to(game.users[1]).emit('all_matched', { opponentSocketId: game.users[0], gameId });
            // Create temp chat
            TempChat.create({ gameId, messages: [] });
            delete activeGames[gameId];
          }
        } else {
          io.to(game.users[0]).emit('end_game');
          io.to(game.users[1]).emit('end_game');
          delete activeGames[gameId];
        }
      }
    });

    // Chat message handling
    socket.on('chat_message', async ({ gameId, message, from, to }) => {
      if (!message || !gameId) return;
      // Save to temp chat
      await TempChat.findOneAndUpdate(
        { gameId },
        { $push: { messages: { from, text: message, timestamp: new Date() } } }
      );
      io.to(to).emit('chat_message', { message, from });
    });

    // Request chat on refresh
    socket.on('request_chat', async ({ gameId }) => {
      const chat = await TempChat.findOne({ gameId });
      if (chat) {
        socket.emit('chat_history', { messages: chat.messages });
        await TempChat.deleteOne({ gameId }); // Delete after sending
      }
    });

    socket.on('disconnect', async () => {
      queue = queue.filter(u => u.socketId !== socket.id);
      await UserSession.deleteOne({ socketId: socket.id });
      for (const gameId in activeGames) {
        if (activeGames[gameId].users.includes(socket.id)) {
          clearTimeout(activeGames[gameId].timers[activeGames[gameId].current]);
          const other = activeGames[gameId].users.find(u => u !== socket.id);
          io.to(other).emit('end_game');
          delete activeGames[gameId];
        }
      }
      // Remove from lobbies
      for (const code in lobbies) {
        if (lobbies[code].users.includes(socket.id)) {
          lobbies[code].users = lobbies[code].users.filter(u => u !== socket.id);
          lobbies[code].userData = lobbies[code].userData.filter((_, i) => lobbies[code].users[i] !== socket.id);
          if (lobbies[code].users.length === 0) delete lobbies[code];
        }
      }
    });
  });
};

function sendQuestion(io, gameId) {
  const game = activeGames[gameId];
  if (!game) return;
  const q = game.questions[game.current];
  io.to(game.users[0]).emit('question', { question: q, index: game.current });
  io.to(game.users[1]).emit('question', { question: q, index: game.current });
  game.timers[game.current] = setTimeout(() => {
    io.to(game.users[0]).emit('end_game');
    io.to(game.users[1]).emit('end_game');
    delete activeGames[gameId];
  }, 20000);
} 