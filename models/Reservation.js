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
            howMany: {
                type: Number,
                required: true
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
            enum: ['paid', 'pending', 'canceled'],
            default: 'pending'
        },
        paymentAmount: {
            type: Number,
            required: true
        },
        note: {
            type: String,
            default: 'None'
        }
    }
)

module.exports = mongoose.model('Reservation', reservationSchema)