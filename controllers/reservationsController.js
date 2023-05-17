const Reservation = require('../models/Reservation')
const Room = require('../models/Room')

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

// @desc Get all reservations
// @route GET /reservations
// @access Private
const getAllReservations = async (req, res) => {
    // Get all reservations from MongoDB
    const reservations = await Reservation.find().lean()

    // If no reservations 
    if (!reservations?.length) {
        return res.status(400).json({ message: 'No reservations found' })
    }

    res.json(reservations)
}

// @desc Create new reservation
// @route POST /reservation
// @access Private
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

// @desc Update a reservation
// @route PATCH /reservations
// @access Private
const updateReservation = async (req, res) => {
    const { id, room, name, email, phone, adults, kids, checkInDate, checkOutDate, paymentStatus, paymentAmount, note } = req.body

    // Confirm data 
    if (!id) {
        return res.status(400).json({ message: 'ID is required' })
    }

    // Does the reservation exist to update?
    const reservation = await Reservation.findById(id).exec()

    if (!reservation) {
        return res.status(400).json({ message: 'Reservation not found' })
    }

    const roomModel = await Room.findOne({ roomName: room }).exec();

    if (!roomModel) {
        return res.status(400).json({ message: 'Room not found' })
    }

    //remove original dates
    let date1 = new Date(reservation.checkInDate)
    let date2 = new Date(reservation.checkOutDate)
    let currentCheckedInDates = createCheckedInDates(date1, date2);
    roomModel.datesOccupied = deleteDates(roomModel.datesOccupied, currentCheckedInDates)

    //new dates
    let date3 = new Date(checkInDate)
    let date4 = new Date(checkOutDate)
    let newCheckedInDates = createCheckedInDates(date3, date4);

    //new check out date
    if (hasDate(roomModel.datesOccupied, newCheckedInDates)) {
        return res.status(409).json({ message: 'Double booked room' })
    }

    const newCheckedInDateObjects = addReservationId(newCheckedInDates, id)

    roomModel.datesOccupied.push(...newCheckedInDateObjects)

    const updatedRoom = await roomModel.save()

    reservation.room = room
    reservation.guest.name = name
    reservation.guest.email = email
    reservation.guest.phone = phone
    reservation.guest.adults = adults
    reservation.guest.kids = kids
    reservation.checkInDate = checkInDate
    reservation.checkOutDate = checkOutDate
    reservation.paymentStatus = paymentStatus
    reservation.paymentAmount = paymentAmount
    reservation.note = note

    const updatedReservation = await reservation.save()

    if (updatedReservation && updatedRoom) { //created 
        res.json({ message: `${updatedReservation.guest.name} updated` })
    }
}

// @desc Delete a reservation
// @route DELETE /reservations
// @access Private
const deleteReservation = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Reservation ID Required' })
    }

    // Does the user exist to delete?
    const reservation = await Reservation.findById(id).exec()

    if (!reservation) {
        return res.status(400).json({ message: 'Reservation not found' })
    }

    const result = await reservation.deleteOne()

    //delete dates from room
    let date1 = new Date(reservation.checkInDate)
    let date2 = new Date(reservation.checkOutDate)
    let currentCheckedInDates = createCheckedInDates(date1, date2);
    const roomModel = await Room.findOne({ roomName: result.room }).exec();
    roomModel.datesOccupied = deleteDates(roomModel.datesOccupied, currentCheckedInDates)

    const updatedRoom = await roomModel.save()

    if (!updatedRoom) {
        res.json({ message: `${result.room} dates not updated` })
    }

    const reply = `Reservation with ${result.guest.name} with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllReservations,
    createNewReservation,
    updateReservation,
    deleteReservation
}