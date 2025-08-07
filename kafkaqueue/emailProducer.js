// src/kafkaqueue/emailProducer.js

import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

// Create Kafka instance
const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER],
});

const emailProducer = kafka.producer();

// Initialize once at app startup
export const initEmailProducer = async () => {
  await emailProducer.connect();
  console.log('Email Kafka Producer connected');
};

// Send message to email topic
export const sendEmailToKafka = async (emailData) => {
  try {

    if (!emailData || !emailData.sid || !emailData.to) {
  throw new Error('Invalid emailData: missing sid or recipient');
}

    await emailProducer.send({
      topic: 'sendgrid-email-notifications',
      messages: [{ value: JSON.stringify(emailData) }],
    });
    console.log(`Email queued to Kafka for: ${emailData.to}`);
  } catch (err) {
    console.error('Failed to send email to Kafka:', err.message);
    throw err;
  }
};
