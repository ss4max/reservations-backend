const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Schema = mongoose.Schema;

const DatesOccupiedSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    reservationId: {
        type: String,
        required: true
    }
})

const roomSchema = new Schema({
    roomName: {
        type: String,
        required: true
    },
    datesOccupied: [DatesOccupiedSchema],
    roomPrice: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('Room', roomSchema)