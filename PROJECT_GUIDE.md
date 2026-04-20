# Trip Mate Backend: Zero to Hero Guide 🌍✈️

Welcome to the **Trip Mate** backend! This project is a comprehensive NestJS-based platform designed for travel management, connecting travelers with travel agencies (Offices) to book trips, manage offers, and handle real-time communications.

---

## 1. Project Overview 🎯
Trip Mate is a marketplace for travel and tourism. It facilitates:
- **User Side**: Travelers searching for offers, booking trips, paying securely, and chatting with agencies.
- **Office Side**: Travel agencies creating offers, managing bookings, handling subscriptions, and responding to user inquiries.
- **Admin Side**: Monitoring system performance, managing queues, and overseeing reports.

---

## 2. Tech Stack 🛠️
- **Framework**: [NestJS](https://nestjs.com/) (v11) - Node.js framework for scalable apps.
- **Language**: TypeScript.
- **Database**: PostgreSQL with [TypeORM](https://typeorm.io/).
- **Caching & Queues**: [Redis](https://redis.io/) & [Bull](https://optimalbits.github.io/bull/) for asynchronous background tasks.
- **Real-time**: [Socket.io](https://socket.io/) for high-performance chat.
- **Payments**: [PayTabs](https://www.paytabs.com/) for secure transaction processing.
- **Notifications**:
    - **Push**: [OneSignal](https://onesignal.com/).
    - **SMS**: [MSEGAT](https://www.msegat.com/en/).
    - **Email**: [Nodemailer](https://nodemailer.com/).
- **File Storage**: [ImageKit](https://imagekit.io/) for optimized image delivery.
- **Auth**: [Passport](http://www.passportjs.org/) with JWT (Access & Refresh tokens).
- **Documentation**: [Swagger](https://swagger.io/) (OpenAPI).

---

## 3. Architecture & Core Concepts 🏗️
The project follows a **Modular Architecture**, where each domain (Users, Bookings, Payments) is encapsulated in its own module.

### Key Architectural Layers:
1.  **Controllers**: Handle HTTP requests and define API endpoints.
2.  **Services**: Contain the core business logic.
3.  **Entities**: Define the database schema using TypeORM decorators.
4.  **DTOs (Data Transfer Objects)**: Define the structure of data sent/received.
5.  **Interceptors**: Handle global response formatting and role-based processing.
6.  **Guards**: Protect routes based on authentication and user roles.

---

## 4. Module Breakdown 📦

| Module | Description |
| :--- | :--- |
| **Auth** | Registration, Login (JWT), Refresh tokens, and OTP verification. |
| **User** | Management of traveler profiles and account settings. |
| **Office** | Management of travel agency profiles, their team, and permissions. |
| **Bookings** | The heart of the app. Handles booking creation, status updates, and history. |
| **Offers** | Trip packages created by offices (Trips, tours, activities). |
| **Payment** | Integration with PayTabs for processing user payments and wallet transactions. |
| **Chat** | Real-time WebSocket-based communication between Users and Offices. |
| **Notification** | Manages multi-channel alerts (Push, SMS, Email) using Bull queues. |
| **Wallet** | User/Office balance management, withdrawals, and top-ups. |
| **Subscription**| SaaS model for Offices to use the platform's advanced features. |
| **Coupon** | Discount system for users during booking. |
| **Review** | User feedback system for trips and agencies. |
| **Report** | Analytics and reporting for platform performance. |
| **FileUpload** | Centralized image/file handling using ImageKit. |

---

## 5. Core Functionalities & Flows 🔄

### 🌟 Booking Flow
1.  **Search**: User finds an **Offer** created by an **Office**.
2.  **Reserve**: User initiates a booking, applying a **Coupon** if available.
3.  **Payment**: System redirects to **PayTabs**. Upon success, the booking is confirmed.
4.  **Update**: The **Office** is notified via **OneSignal/Push** and manages the booking.

### 🌟 Authentication Flow
-   **Mobile/Email + Password**: Users can register/login.
-   **OTP**: Secure verification via MSEGAT SMS for registration or sensitive actions.
-   **JWT**: Stateless auth with short-lived access tokens and long-lived refresh tokens.

### 🌟 Communication (Chat)
-   Uses WebSockets for instant messaging.
-   Persistent storage of messages in PostgreSQL.
-   Real-time "seen" status and notifications for offline users.

---

## 6. API Documentation & Monitoring 📑
-   **Swagger UI**: Access comprehensive API docs at `/api/docs`.
-   **Bull Board**: Monitor background queues (Notifications, Jobs) at `/admin/queues`.
-   **Logs**: Winston logger tracks application activity and errors.

---

## 7. Getting Started 🚀

### Prerequisites:
-   Node.js (v20+)
-   PostgreSQL
-   Redis

### Installation:
1.  **Clone the repo**:
    ```bash
    git clone <repository-url>
    cd trip-mate-backend
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env` file based on the required services (Database, Redis, PayTabs, OneSignal, etc.).
4.  **Run migrations**:
    The system automatically syncs schemas in dev, but use TypeORM migrations for production.
5.  **Start the server**:
    ```bash
    npm run start:dev
    ```

---

## 8. Directory Structure 📁
```text
src/
├── common/          # Shared configs, guards, interceptors, exceptions
├── i18n/            # Internationalization (ar/en)
├── module/          # Domain-specific modules
│   ├── auth/
│   ├── bookings/
│   ├── chat/
│   └── ...
├── app.module.ts    # Main entry module
└── main.ts          # Application bootstrap
```

---

*This guide serves as a map for developers to navigate and understand the Trip Mate ecosystem.*
