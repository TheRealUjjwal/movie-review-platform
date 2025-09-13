// Entry point for backend server

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const watchlistRoutes = require('./routes/watchlist');
const http = require('http');
const WebSocket = require('ws');

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Map userId to ws connection
const wsClients = new Map();

wss.on('connection', (ws, req) => {
  // Expect client to send userId after connecting
  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);
      if (data.userId) {
        wsClients.set(data.userId, ws);
        ws.userId = data.userId;
      }
    } catch {}
  });
  ws.on('close', () => {
    if (ws.userId) wsClients.delete(ws.userId);
  });
});

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/watchlist', watchlistRoutes);

app.get('/', (req, res) => {
  res.send('Movie Review Platform API');
});


// Serve frontend build in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Export wsClients for use in review routes
module.exports = { wsClients };
