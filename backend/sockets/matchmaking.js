const UserSession = require('../models/UserSession');
const Question = require('../models/Question');
const TempChat = require('../models/TempChat');
let queue = [];
let activeGames = {};
let lobbies = {};
// Track connected clients to emit live online user count
const connectedClients = new Set();

function generateLobbyCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Add to connected set and broadcast current online count
    connectedClients.add(socket.id);
    io.emit('online_count', connectedClients.size);
    // QUICK MATCH (unchanged)
    socket.on('find_match', async (userData) => {
      if (!userData || typeof userData !== 'object') {
        socket.emit('error', { message: 'Invalid user data for matchmaking.' });
        return;
      }
      console.log('User looking for match:', userData, socket.id);
      await UserSession.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: socket.id, name: userData.name, anonymous: userData.anonymous, answers: [] },
        { upsert: true }
      );
      queue.push({ ...userData, socketId: socket.id });
      console.log('Current queue:', queue.map(u => u.socketId));
      if (queue.length >= 2) {
        // Prevent matching the same user with themselves
        if (queue[0].socketId === queue[1].socketId) {
          // Remove the duplicate and do not match
          queue.splice(1, 1);
          return;
        }
        const [user1, user2] = queue.splice(0, 2);
        console.log('Matched:', user1.socketId, user2.socketId);
        const questions = await Question.aggregate([{ $sample: { size: 5 } }]);
        const gameId = user1.socketId + '_' + user2.socketId;
        const quickCode = generateLobbyCode(); // 6-char code
        activeGames[gameId] = {
          users: [user1.socketId, user2.socketId],
          questions,
          current: 0,
          answers: {},
          timers: {},
          quickCode,
        };
        io.to(user1.socketId).emit('start_questions', {
          questions,
          gameId,
          code: quickCode,
          myName: user1.name,
          myAnonymous: user1.anonymous,
          opponentName: user2.name,
          opponentAnonymous: user2.anonymous
        });
        io.to(user2.socketId).emit('start_questions', {
          questions,
          gameId,
          code: quickCode,
          myName: user2.name,
          myAnonymous: user2.anonymous,
          opponentName: user1.name,
          opponentAnonymous: user1.anonymous
        });
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
      // Notify both users lobby is ready, include userData for name display
      io.to(lobby.users[0]).emit('lobby_ready', { code, userData: lobby.userData });
      io.to(lobby.users[1]).emit('lobby_ready', { code, userData: lobby.userData });
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
      // Fetch user info for both users
      Promise.all([
        UserSession.findOne({ socketId: user1 }),
        UserSession.findOne({ socketId: user2 })
      ]).then(([user1Data, user2Data]) => {
        io.to(user1).emit('start_questions', {
          questions,
          gameId,
          myName: user1Data?.name,
          myAnonymous: user1Data?.anonymous,
          opponentName: user2Data?.name,
          opponentAnonymous: user2Data?.anonymous
        });
        io.to(user2).emit('start_questions', {
          questions,
          gameId,
          myName: user2Data?.name,
          myAnonymous: user2Data?.anonymous,
          opponentName: user1Data?.name,
          opponentAnonymous: user1Data?.anonymous
        });
        console.log('Emitting start_questions to', user1, user2);
        sendQuestion(io, gameId);
        delete lobbies[code];
      });
    });

    // Rejoin lobby event for reconnects
    socket.on('rejoin_lobby', async ({ code, userData }) => {
      const lobby = lobbies[code];
      if (!lobby) return;
      // Remove any previous entry for this user (by name or previous socketId)
      lobby.users = lobby.users.filter(id => id !== socket.id);
      lobby.users.push(socket.id);
      // Update userData if provided
      if (userData) {
        lobby.userData = lobby.userData.filter(u => u.name !== userData.name);
        lobby.userData.push(userData);
      }
      // Notify both users lobby is ready, include userData for name display
      io.to(lobby.users[0]).emit('lobby_ready', { code, userData: lobby.userData });
      if (lobby.users[1]) io.to(lobby.users[1]).emit('lobby_ready', { code, userData: lobby.userData });
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
            // Fetch user info for both users
            Promise.all([
              UserSession.findOne({ socketId: game.users[0] }),
              UserSession.findOne({ socketId: game.users[1] })
            ]).then(([user1, user2]) => {
              io.to(game.users[0]).emit('all_matched', {
                opponentSocketId: game.users[1],
                gameId,
                myName: user1?.name,
                myAnonymous: user1?.anonymous,
                opponentName: user2?.name,
                opponentAnonymous: user2?.anonymous
              });
              io.to(game.users[1]).emit('all_matched', {
                opponentSocketId: game.users[0],
                gameId,
                myName: user2?.name,
                myAnonymous: user2?.anonymous,
                opponentName: user1?.name,
                opponentAnonymous: user1?.anonymous
              });
              // Create temp chat
              TempChat.create({ gameId, messages: [] });
              delete activeGames[gameId];
            });
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
      // Send to receiver as 'stranger'
      io.to(to).emit('chat_message', { message, from: 'stranger' });
      // Send to sender as 'me'
      io.to(socket.id).emit('chat_message', { message, from: 'me' });
    });

    // Chat end handling
    socket.on('end_chat', ({ gameId, to }) => {
      io.to(to).emit('chat_ended');
      io.to(socket.id).emit('chat_ended');
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
      // Remove from connected clients and broadcast updated count
      connectedClients.delete(socket.id);
      io.emit('online_count', connectedClients.size);
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