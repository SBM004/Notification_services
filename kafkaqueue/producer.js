// // kafka/producer.js
// import { Kafka } from 'kafkajs';
// // import { producer } from './kafkaClient.js';
// // dotenv.config();
// import dotenv from 'dotenv';
// dotenv.config();  // ✅ This must be at the very top
// console.log("kafka_broker",process.env.KAFKA_BROKER)
// const kafka = new Kafka({
//   clientId: 'notification-service',
//   brokers: [process.env.KAFKA_BROKER], // adjust as per your setup
//   //change the env to your ipconfig
// });
// const producer = kafka.producer();
// // const producer = kafka.producer();
// export const initProducer = async () => {
//   // console.log("kafka_broker",process.env.KAFKA_BROKER)
  
//   await producer.connect();
//   console.log(' Kafka Producer connected');
// };
// export const sendToKafka = async (data) => {
//   await producer.connect();
//   await producer.send({
//     topic: 'sms-notifications',
//     messages: [{ value: JSON.stringify(data) }],
//   });
//   await producer.disconnect();
// };


// kafkaqueue/producer.js

// import { Kafka } from 'kafkajs';
// import dotenv from 'dotenv';
// dotenv.config();

// console.log("kafka_broker", process.env.KAFKA_BROKER);

// const kafka = new Kafka({
//   clientId: 'notification-service',
//   brokers: [process.env.KAFKA_BROKER],
// });

// const producer = kafka.producer();  // <-- Define it ONCE at the top

// export const initProducer = async () => {
//   await producer.connect();
//   console.log('✅ Kafka Producer connected');
// };

// export const sendToKafka = async (data) => {
//   if (!producer) {
//     throw new Error("Kafka producer is not initialized");
//   }

//   await producer.send({
//     topic: 'sms-notifications',
//     messages: [{ value: JSON.stringify(data) }],
//   });
// };




// kafkaqueue/producer.js

// kafkaqueue/producer.js

import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

// Create Kafka instance
const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER],
});
console.log("producer")

// Renamed from 'producer' to 'kafkaProducer'
const kafkaProducer = kafka.producer();

// Connect once during app startup
export const initProducer = async () => {
  await kafkaProducer.connect();
  console.log('✅ Kafka Producer connected');
};

// Send message to Kafka
export const sendToKafka = async (data) => {
  await kafkaProducer.send({
    topic: 'notifications',
    messages: [{ value: JSON.stringify(data) }],
  });
};


