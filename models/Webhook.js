const mongoose = require('mongoose')

const webhookSchema = new mongoose.Schema({
    sourceId: String,
    data: Object,
    key: String,
    completed: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    })

module.exports = mongoose.model('Webhook', webhookSchema)