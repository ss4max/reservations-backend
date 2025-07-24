const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema(
    {
        room: {
            type: String,
            required: true
        },
        guest: {
            name: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            adults: {
                type: Number,
                required: true
            },
            kids: {
                type: Number,
                default: 0
            }
        },
        checkInDate: {
            type: Date,
            required: true
        },
        checkOutDate: {
            type: Date,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['paid', 'pending', 'canceled', 'onProperty'],
            default: 'pending'
        },
        paymentAmount: {
            type: Number,
            required: true
        },
        note: {
            type: String,
            default: 'None'
        },
        createdAt: { type: Date, default: Date.now },
    }
)

reservationSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 900, // 15 minutes = 900 seconds
        partialFilterExpression: { paymentStatus: 'pending' }
    }
);

module.exports = mongoose.model('Reservation', reservationSchema)