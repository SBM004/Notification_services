
````markdown
# 📢 Notification Services

A Node.js-based notification microservice that uses **Apache Kafka** for queuing and integrates with **SendGrid** (for emails) and **Twilio** (for SMS). It follows a modular architecture with controllers, services, and middleware for scalable notification delivery.  
The service can be tested locally using **LocalTunnel** for webhook integration.

---

## 📂 Directory Structure

- `controllers/` — Request handlers for various endpoints  
- `db/` — Database connection and configuration  
- `kafkaqueue/` — Kafka queue integration logic  
- `middleware/` — Request/response middleware (e.g., auth, logging)  
- `models/` — Data schemas and models  
- `routes/` — API endpoint definitions  
- `services/` — Business logic and notification workflows  
- `utils/` — Utility helper functions  
- `server.js` — App entry point  
- `.env` — Environment variables (not committed)  
- `package.json`, `package-lock.json` — Project metadata and dependencies  

---

## ⚙️ Prerequisites

- **Node.js** (v14 or later recommended)
-**express js**  
- **npm** (v6+) or Yarn  
- **Kafka** & **Zookeeper** (running locally or in Docker) 
**in this project I am running the kafka and Zookeper in Docker**
- **PostgreSQL** or your configured database  
- **SendGrid** API account for email  
- **Twilio** account for SMS  

---

## 🔐 Environment Variables (`.env`)

```env
PORT=3001
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=
SECRET_KEY=
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_NUMBER=
APP_URL="http://localhost:"
KAFKA_BROKER=localhost:xxxx
SENDGRID_API_KEY=
FROM_EMAIL=
````

---

## 📡 Third-Party Services

This service integrates with **SendGrid** and **Twilio** to send notifications.

### 1️⃣ SendGrid — Email Notifications

* Used for sending transactional and marketing emails.
* Requires a **verified sender email** for development/testing.
* Once deployed with a paid subscription, emails can be sent to any recipient.
* Supports **webhook tracking** for delivery, opens, clicks, bounces, etc.

**Setup:**

```bash
SENDGRID_API_KEY=<your_api_key>
FROM_EMAIL=<your_verified_sender_email>
```

---

### 2️⃣ Twilio — SMS Notifications

* Used for sending SMS messages.
* In trial mode, SMS can only be sent to verified numbers.
* Supports **status callbacks** for delivery tracking.

**Setup:**

```bash
TWILIO_SID=<your_sid>
TWILIO_AUTH_TOKEN=<your_auth_token>
TWILIO_NUMBER=<your_twilio_number>
```

---

## 🌍 LocalTunnel for Webhook Testing

LocalTunnel can be used to expose your local development server to the internet for webhook testing with SendGrid and Twilio.

**Installation:**

```bash
npm install -g localtunnel
```

**Usage:**

```bash
lt --port <server_port>
```

Copy the generated public URL and update it in **SendGrid Webhook Settings** or **Twilio Webhook Settings** to receive real-time tracking updates.

---

## 🚀 Installation & Running

```bash
git clone https://github.com/SBM004/Notification_services.git
cd Notification_services
npm install
nodemon server.js
```

---

## 🔄 Notification Flow

```mermaid
graph LR
  A[Client/App] --> B[Kafka Producer]
  B --> C[Kafka Topic / Queue]
  C --> D[Notification Service]
  D --> E1[SendGrid (Email)]
  D --> E2[Twilio (SMS)]
  E1 --> F[User]
  E2 --> F[User]
```

**Flow Description:**

1. **Client/App** sends a notification request to the service.
2. **Kafka Producer** publishes the request to a Kafka Topic.
3. **Kafka Queue** stores messages until consumed.
4. **Notification Service** processes each message and selects the channel (Email/SMS).
5. **SendGrid** or **Twilio** sends the notification.
6. **User** receives the notification.

---
