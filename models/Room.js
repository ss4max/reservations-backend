const mongoose = require('mongoose')

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
    },
    roomDescription: {
        type: String,
        required: true
    },
    roomImages: {
        type: [String],
        required: true
    },
    imageLabels: {
        type: [String],
        required: true
    },
})

module.exports = mongoose.model('Room', roomSchema)