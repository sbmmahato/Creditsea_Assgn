const { Kafka } = require('kafkajs');
const Loan = require('../models/Loan');
const ErrorLog = require('../models/ErrorLog');
const redis = require('redis');

const kafka = new Kafka({
  clientId: 'loan-processor',
  // brokers: ['kafka:29092']
  brokers: ['localhost:9092', 'kafka:29092']
});

const consumer = kafka.consumer({ groupId: 'loan-processing-group' });
// const redisClient = redis.createClient({ url: 'redis://redis:6379' });
const redisClient = redis.createClient({ url: 'redis://localhost:6379' });

const run = async () => {
  await consumer.connect();
  await redisClient.connect();
  await consumer.subscribe({ topic: 'loan.incoming', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const loanData = JSON.parse(message.value.toString());
      console.log(`Received loan application for applicant: ${loanData.applicantId}`);

      try {
        // 1. Validation
        if (!loanData.applicantId || !loanData.amount) {
          throw new Error('Missing required fields: applicantId or amount');
        }

        // 2. Enrichment 
        const enrichedData = await enrichData(loanData.applicantId);

        // 3. Store valid loan
        const loan = new Loan({
          ...loanData,
          enrichedData,
          status: 'processed' 
        });
        await loan.save();
        console.log(`Successfully processed and stored loan for applicant: ${loan.applicantId}`);
        await redisClient.incr('metrics:processed');


      } catch (error) {
        console.error(`Error processing loan for applicant ${loanData.applicantId}:`, error.message);
        
        // Log error to MongoDB
        const errorLog = new ErrorLog({
          applicantId: loanData.applicantId,
          errorType: 'processing_error',
          errorMessage: error.message,
          payload: loanData
        });
        await errorLog.save();
        await redisClient.incr('metrics:failed');
      }
      await redisClient.incr('metrics:incoming');
    },
  });
};

async function enrichData(applicantId) {
  console.log(`Enriching data for applicant: ${applicantId}`);
  // const creditScore = await redisClient.get(`creditScore:${applicantId}`);
  return {
    creditScore: Math.floor(Math.random() * (850 - 300 + 1)) + 300 // Random score between 300-850
  };
}


run().catch(console.error);

module.exports = { run }; 