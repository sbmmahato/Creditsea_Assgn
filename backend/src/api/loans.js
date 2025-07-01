const { Router } = require('express');
const { Kafka } = require('kafkajs');

const router = Router();

const kafka = new Kafka({
  clientId: 'loan-app-producer',
  // brokers: ['kafka:29092']
  brokers: ['localhost:9092', 'kafka:29092']
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
};

connectProducer().catch(console.error);

router.post('/loans', async (req, res) => {
  try {
    const loanData = req.body;
    
    await producer.send({
      topic: 'loan.incoming',
      messages: [{ value: JSON.stringify(loanData) }],
    });
    res.status(202).json({ message: 'Loan application received' });
  } catch (error) {
    console.error('Failed to send message to Kafka', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 