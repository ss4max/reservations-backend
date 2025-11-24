// server.js

// 1. Revert to CommonJS require() for all dependencies
require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
// Import the logger using the new .js file extension
const { logger, logEvents } = require('./middleware/logger.js')
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const cron = require('node-cron') // Revert to CommonJS for node-cron
const deleteExpiredPendingReservations = require('./jobs/cleanupReservations') // Revert to CommonJS

// --- Route Imports (Revert to require()) ---
const rootRoute = require('./routes/root')
const publicRoutes = require('./routes/publicRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const reservationRoutes = require('./routes/reservationRoutes')
const roomRoutes = require('./routes/roomRoutes')
const transactionRoutes = require('./routes/transactionRoutes')
const webhookRoutes = require('./routes/webhookRoutes')
const qrCodeRoutes = require('./routes/qrCodeRoutes')
const paymentRoutes = require('./routes/payment')
const productsRoutes = require('./routes/products')
const translationRoutes = require('./routes/translationRoutes')

// Remove the ESM path definitions (import.meta.url, etc.)
// __dirname is automatically available again in CommonJS

mongoose.set('strictQuery', false)
const PORT = process.env.PORT || 3500

console.log(process.env.NODE_ENV)

connectDB()

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json())

app.use(cookieParser())

// Use global __dirname for static path
app.use('/', express.static(path.join(__dirname, 'public')))

// 2. Fix: Use the router objects via app.use()
app.use('/', rootRoute)
app.use('/book', publicRoutes)
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/reservations', reservationRoutes)
app.use('/rooms', roomRoutes)
app.use('/transactions', transactionRoutes)
app.use('/' + process.env.WEBHOOK_URL, webhookRoutes)
app.use('/qrCodes', qrCodeRoutes)
app.use('/payment', paymentRoutes)
app.use('/products', productsRoutes)
app.use('/translation', translationRoutes)

// 3. Fix: Revert the catch-all route back to the simpler '*' syntax (which works in Express 4/5 CommonJS)
app.all('/{*any}', (req, res) => {
    res.status(404);

    if (req.accepts('html')) {
        // Use global __dirname for file path
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' });
    } else {
        res.type('txt').send('404 Not Found');
    }
});

app.use(errorHandler)

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})

// Run every minute
cron.schedule('* * * * *', async () => {
    await deleteExpiredPendingReservations()
})