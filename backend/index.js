const express = require('express');
const mongoose = require('mongoose');
const loanRoutes = require('./src/api/loans');
require('./src/consumers/loanProcessor');
const { createWebSocketServer } = require('./src/services/websocket');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/loan-app';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/loan-app';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api', loanRoutes);

app.get('/', (req, res) => {
  res.send('Loan processing service is running');
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

createWebSocketServer(server); 