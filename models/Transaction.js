const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    token: {
        type: String,
    },
    source: {
        type: String,
    },
    reservationId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    charge: {
        type: Object,
        required: true
    }
},
    {
        timestamps: true
    })

module.exports = mongoose.model('Transaction', transactionSchema)