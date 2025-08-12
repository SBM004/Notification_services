



// kafkaqueue/producer.js

// kafkaqueue/producer.js

// import { Kafka } from 'kafkajs';
// import dotenv from 'dotenv';
// dotenv.config();

// // Create Kafka instance
// const kafka = new Kafka({
//   clientId: 'notification-service',
//   brokers: [process.env.KAFKA_BROKER],
// });
// console.log("producer")

// // Renamed from 'producer' to 'kafkaProducer'
// const kafkaProducer = kafka.producer();

// // Connect once during app startup
// export const initProducer = async () => {
//   await kafkaProducer.connect();
//   console.log('✅ Kafka Producer connected');
// };

// // Send message to Kafka
// export const sendToKafka = async (data) => {
//   await kafkaProducer.send({
//     topic: 'notifications',
//     messages: [{ value: JSON.stringify(data) }],
//   });
// };





import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER],
});

// Create different producers for different priority levels
const producers = {
    // ERROR - Highest priority (immediate sending)
    error: kafka.producer({
        maxInFlightRequests: 1,        // Send immediately
        idempotent: false,
        retry: { retries: 2 },         // Fail fast
        transactionTimeout: 5000
    }),
    
    // WARNING - High priority
    warning: kafka.producer({
        maxInFlightRequests: 2,
        idempotent: true,
        retry: { retries: 3 },
        transactionTimeout: 10000
    }),
    
    // INFO - Medium priority  
    info: kafka.producer({
        maxInFlightRequests: 3,
        idempotent: true,
        retry: { retries: 4 },
        transactionTimeout: 15000
    }),
    
    // REMINDER - Low priority (can batch)
    reminder: kafka.producer({
        maxInFlightRequests: 5,        // Allow batching
        idempotent: true,
        retry: { retries: 3 },
        transactionTimeout: 30000
    })
};

// Priority-based topic mapping
const PRIORITY_TOPICS = {
    error: 'notifications-error',
    warning: 'notifications-warning', 
    info: 'notifications-info',
    reminder: 'notifications-reminder'
};

// Connect all producers
export const initProducer = async () => {
    await Promise.all([
        producers.error.connect(),
        producers.warning.connect(),
        producers.info.connect(),
        producers.reminder.connect()
    ]);
    console.log('✅ All priority producers connected');
};

// Enhanced sendToKafka with priority routing
export const sendToKafka = async (data) => {
    // Determine notification type from data
    const notificationType = data.type ? data.type.toLowerCase() : 'info';
    
    // Map notification types to priority levels
    let priorityLevel = 'info'; // default
    
    switch(notificationType) {
        case 'error':
        case 'critical':
        case 'failure':
        case 'system_down':
            priorityLevel = 'error';
            break;
            
        case 'warning':
        case 'alert':
        case 'suspicious':
        case 'threshold':
            priorityLevel = 'warning';
            break;
            
        case 'info':
        case 'success':
        case 'update':
        case 'confirmation':
            priorityLevel = 'info';
            break;
            
        case 'reminder':
        case 'marketing':
        case 'promotion':
        case 'newsletter':
            priorityLevel = 'reminder';
            break;
    }
    
    // Add priority metadata to the message
    const enhancedData = {
        ...data,
        priority: priorityLevel,
        priority_level: getPriorityNumber(priorityLevel),
        timestamp: new Date().toISOString(),
        urgent: priorityLevel === 'error' || priorityLevel === 'warning'
    };
    
    // Send to appropriate producer and topic
    const producer = producers[priorityLevel];
    const topic = PRIORITY_TOPICS[priorityLevel];
    
    await producer.send({
        topic: topic,
        messages: [{
            key: data.sid || data.user_id, // Partition by user or notification ID
            value: JSON.stringify(enhancedData),
            headers: {
                priority: priorityLevel,
                type: notificationType,
                urgent: enhancedData.urgent.toString()
            }
        }]
    });
    
    console.log(`📤 ${priorityLevel.toUpperCase()} notification sent to ${topic}`);
};

// Helper function to get numeric priority
function getPriorityNumber(priorityLevel) {
    const priorities = { error: 1, warning: 2, info: 3, reminder: 4 };
    return priorities[priorityLevel] || 3;
}

// Graceful shutdown for all producers
export const disconnectProducers = async () => {
    await Promise.all([
        producers.error.disconnect(),
        producers.warning.disconnect(),
        producers.info.disconnect(),
        producers.reminder.disconnect()
    ]);
    console.log('🔌 All producers disconnected');
};