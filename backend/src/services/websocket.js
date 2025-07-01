const { WebSocketServer } = require('ws');
const redis = require('redis');
const ErrorLog = require('../models/ErrorLog');

const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server });
  // const redisClient = redis.createClient({ url: 'redis://redis:6379' });
  const redisClient = redis.createClient({ url: 'redis://localhost:6379' });
  redisClient.connect().catch(console.error);

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Broadcast metrics every second
  setInterval(async () => {
    try {
      const incoming = await redisClient.get('metrics:incoming') || 0;
      const processed = await redisClient.get('metrics:processed') || 0;
      const failed = await redisClient.get('metrics:failed') || 0;

      const metrics = {
        type: 'metrics',
        data: {
          incoming: parseInt(incoming),
          processed: parseInt(processed),
          failed: parseInt(failed)
        }
      };
      
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(metrics));
        }
      });
    } catch (error) {
      console.error('Error fetching metrics from Redis:', error);
    }
  }, 1000);

  // Watch for new error logs
  const errorLogStream = ErrorLog.watch();
  errorLogStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const errorLog = {
        type: 'errorLog',
        data: change.fullDocument
      };
      wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify(errorLog));
        }
      });
    }
  });

  console.log('WebSocket server created');
  return wss;
};

module.exports = { createWebSocketServer }; 