const UserSession = require('../models/UserSession');
const Question = require('../models/Question');
let queue = [];
let activeGames = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('find_match', async (userData) => {
      console.log('User looking for match:', userData, socket.id);
      // Create or update user session
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
        // Fetch 5 random questions
        const questions = await Question.aggregate([{ $sample: { size: 5 } }]);
        // Create a game session
        const gameId = user1.socketId + '_' + user2.socketId;
        activeGames[gameId] = {
          users: [user1.socketId, user2.socketId],
          questions,
          current: 0,
          answers: {},
          timers: {},
        };
        // Send questions to both users (only send the first question)
        io.to(user1.socketId).emit('start_questions', { questions, gameId });
        io.to(user2.socketId).emit('start_questions', { questions, gameId });
        sendQuestion(io, gameId);
      }
    });

    socket.on('question_answered', ({ gameId, answer }) => {
      const game = activeGames[gameId];
      if (!game) return;
      game.answers[socket.id] = answer;
      // If both answered
      if (Object.keys(game.answers).length === 2) {
        clearTimeout(game.timers[game.current]);
        const [a1, a2] = Object.values(game.answers);
        if (a1 === a2) {
          // Next question or end
          game.current++;
          if (game.current < game.questions.length) {
            game.answers = {};
            sendQuestion(io, gameId);
          } else {
            // All matched, allow chat
            io.to(game.users[0]).emit('all_matched', { opponentSocketId: game.users[1] });
            io.to(game.users[1]).emit('all_matched', { opponentSocketId: game.users[0] });
            delete activeGames[gameId];
          }
        } else {
          // Answers differ, end game
          io.to(game.users[0]).emit('end_game');
          io.to(game.users[1]).emit('end_game');
          delete activeGames[gameId];
        }
      }
    });

    socket.on('disconnect', async () => {
      queue = queue.filter(u => u.socketId !== socket.id);
      await UserSession.deleteOne({ socketId: socket.id });
      // Clean up active games
      for (const gameId in activeGames) {
        if (activeGames[gameId].users.includes(socket.id)) {
          clearTimeout(activeGames[gameId].timers[activeGames[gameId].current]);
          const other = activeGames[gameId].users.find(u => u !== socket.id);
          io.to(other).emit('end_game');
          delete activeGames[gameId];
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
  // Start 20s timer
  game.timers[game.current] = setTimeout(() => {
    io.to(game.users[0]).emit('end_game');
    io.to(game.users[1]).emit('end_game');
    delete activeGames[gameId];
  }, 20000);
} 