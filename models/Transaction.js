const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    reservationId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentIntent: {
        type: Object,
        required: true
    }
},
    {
        timestamps: true
    })

module.exports = mongoose.model('Transaction', transactionSchema)