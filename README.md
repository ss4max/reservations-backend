# Reservations System Backend (MERN Stack)

A robust backend service for a hotel/accommodation reservation platform, built with **Node.js**, **Express**, and **MongoDB**. This project demonstrates a clean MVC (Model-View-Controller) architecture, secure authentication, and scalable API design.

## 🚀 Features

- **RESTful API Design:** Clean and predictable endpoints for managing rooms, users, and reservations.
- **MVC Architecture:** Separation of concerns using Models, Views, Controllers, and Routes for high maintainability.
- **Secure Authentication:** Implementation of JWT (JSON Web Tokens) or session-based security.
- **Database Management:** Optimized MongoDB schemas using Mongoose for handling complex reservation logic.
- **Middleware Integration:** Custom error handling and request validation.

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Architecture:** Model-View-Controller (MVC)

## 📁 Project Structure

```text
├── config/          # Database connection and environment configurations
├── controllers/     # Business logic for each route
├── models/          # Mongoose schemas (User, Reservation, Room)
├── routes/          # API endpoint definitions
├── middleware/      # Authentication and validation logic
├── jobs/            # Scheduled tasks (e.g., cleaning up expired reservations)
└── server.js        # Entry point of the application