const Room = require('../models/Room')
const Reservation = require('../models/Reservation')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function hasDate(occupiedDateObjects, reservationDates) {

    //create an array of dates (no reservationId)
    const occupiedDates = getDatesArray(occupiedDateObjects)

    let foundBoolean = false

    reservationDates.forEach(date => {
        let found = occupiedDates.find(occupiedDate => occupiedDate.getTime() === date.getTime())
        if (found) {
            foundBoolean = true
        }
    });

    return foundBoolean
}

function createCheckedInDates(checkIn, checkOut) {
    let dates = []
    let newDate = new Date(checkIn)
    while (checkIn.getTime() !== checkOut.getTime()) {
        dates.push(newDate)
        newDate = new Date(checkIn.setDate(checkIn.getDate() + 1))
    }
    return dates
}

function getTimes(datesArray) {
    let tempArray = []
    for (let i = 0; i < datesArray.length; i++) {
        tempArray[i] = datesArray[i].getTime()
    }

    return tempArray
}

function getDates(times) {
    let tempArray = []
    for (let i = 0; i < times.length; i++) {
        tempArray[i] = new Date(times[i])
    }
    return tempArray
}

const getDatesArray = (datesArrayObj) => {
    return datesArrayObj.map((obj) => obj.date);
}

function deleteDates(datesArrayOfObjects, deleteTheseDates) {

    const reservationId = datesArrayOfObjects[0]?.reservationId

    //create an array of dates (no reservationId)
    const dates = getDatesArray(datesArrayOfObjects)

    //deletes dates of different time
    const arrayOfDifferentTimes = getTimes(dates).filter((x) => !getTimes(deleteTheseDates).includes(x));

    const arrayOfDates = getDates(arrayOfDifferentTimes)

    //add reservationId back to each date
    const datesOccupiedArrayOfObjects = arrayOfDates.map(date => tempObj = { date: date, reservationId: reservationId });

    return datesOccupiedArrayOfObjects
}

function addReservationId(dates, reservationId) {
    const datesOccupiedArrayOfObjects = dates.map(date => tempObj = { date: date, reservationId: reservationId });
    return datesOccupiedArrayOfObjects
}

// @desc Get all rooms 
// @route GET /rooms
// @access Private
const getAllRooms = async (req, res) => {
    // Get all rooms from MongoDB
    const rooms = await Room.find().lean()

    // If no rooms 
    if (!rooms?.length) {
        return res.status(400).json({ message: 'No rooms found' })
    }

    res.json(rooms)
}

const getAllReservations = async (req, res) => {
    // Get all reservations from MongoDB
    const reservations = await Reservation.find().lean()

    // If no reservations 
    if (!reservations?.length) {
        return res.status(400).json({ message: 'No reservations found' })
    }

    res.json(reservations)
}

const createNewReservation = async (req, res) => {
    const { room, name, email, phone, adults, kids, checkInDate, checkOutDate, paymentStatus, paymentAmount, note } = req.body

    // Confirm data
    if (!room || !name || !email || !phone || !adults || !checkInDate || !checkOutDate || !paymentAmount) {
        return res.status(400).json({ message: 'All fields required.' })
    }

    const date1 = new Date(checkInDate)
    const date2 = new Date(checkOutDate)

    let checkedInDates = createCheckedInDates(date1, date2);

    const roomModel = await Room.findOne({ roomName: room }).exec();

    if (!roomModel) {
        return res.status(400).json({ message: 'Room not found' })
    }

    if (hasDate(roomModel.datesOccupied, checkedInDates)) {
        return res.status(409).json({ message: 'Double booked room' })
    }

    const reservationObject = { room, guest: { name, email, phone, adults, kids }, checkInDate, checkOutDate, paymentStatus, paymentAmount, note }

    // Create and store new reservation 
    const reservation = await Reservation.create(reservationObject)

    const checkedInDatesObjects = addReservationId(checkedInDates, reservation.id)

    roomModel.datesOccupied.push(...checkedInDatesObjects)

    const updatedRoom = await roomModel.save()

    if (reservation && updatedRoom) { //created 
        res.status(201).json({ message: `New reservation for ${name} created` })
    } else {
        res.status(400).json({ message: 'Invalid reservation data received' })
    }
}


module.exports = {
    getAllRooms,
    getAllReservations,
    createNewReservation,
}