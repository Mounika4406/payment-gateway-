# Payment Gateway System

This project is a simplified payment gateway application that allows
merchants to create orders, customers to complete payments via a checkout
page, and merchants to track transactions in a dashboard.

---

## Features

- Merchant authentication using API Key and Secret
- Order creation API
- Public checkout page using order ID
- UPI and Card payment methods
- Asynchronous payment processing
- Merchant dashboard with analytics
- Transactions listing page
- Dockerized setup

---

## Tech Stack

- Backend: Node.js, Express
- Frontend: React + Vite
- Database: PostgreSQL
- Containerization: Docker, Docker Compose

---

## How to Run the Project

```bash
docker-compose up -d --build
Services
API Server: http://localhost:8000

Checkout Page: http://localhost:3001

Merchant Dashboard: http://localhost:3000

Payment Flow
Merchant creates an order using API credentials

Checkout page is opened using order_id

User selects UPI or Card and completes payment

Payment is processed asynchronously

Merchant views transactions in the dashboard

Sample URLs
Checkout:

ruby
Copy code
http://localhost:3001/?order_id=ORDER_ID
Dashboard:

bash
Copy code
http://localhost:3000/dashboard
Screenshots
Checkout – UPI

Checkout – Card

Payment Success

Merchant Login

Merchant Dashboard

Transactions

Note:
The merchant dashboard UI is demonstrated via screenshots.
The Docker container serves a placeholder page as per assignment setup.
