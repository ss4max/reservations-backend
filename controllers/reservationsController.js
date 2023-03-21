const Reservation = require('../models/Reservation')
const asyncHandler = require('express-async-handler')
const Room = require('../models/Room')
const bcrypt = require('bcrypt')

function hasDate(occupiedDates, reservationDates) {

    let foundBoolean = false

    reservationDates.forEach(date => {
        let found = occupiedDates.find(occupiedDate => occupiedDate.getTime() === date.getTime())
        if (found) {
            foundBoolean = true
        }
    });

    return foundBoolean
}

function deleteDates(dates, deleteTheseDates) {

    console.log(dates)
    console.log(deleteTheseDates)

    let filteredDates = dates

    deleteTheseDates.forEach(deleteThisDate => {
        filteredDates = filteredDates.filter(date => date !== deleteThisDate)
    });

    console.log(filteredDates)

    return filteredDates
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

function deleteDates(dates, deleteTheseDates) {
    const arrayOfDifferentTimes = getTimes(dates).filter((x) => !getTimes(deleteTheseDates).includes(x));
    return getDates(arrayOfDifferentTimes)
}

// @desc Get all reservations
// @route GET /reservations
// @access Private
const getAllReservations = asyncHandler(async (req, res) => {
    // Get all reservations from MongoDB
    const reservations = await Reservation.find().lean()

    // If no reservations 
    if (!reservations?.length) {
        return res.status(400).json({ message: 'No reservations found' })
    }

    res.json(reservations)
})

// @desc Create new reservation
// @route POST /reservation
// @access Private
const createNewReservation = asyncHandler(async (req, res) => {
    const { room, name, email, phone, howMany, checkInDate, checkOutDate, paymentStatus, paymentAmount, note } = req.body

    // Confirm data
    if (!room || !name || !email || !phone || !howMany || !checkInDate || !checkOutDate || !paymentStatus || !paymentAmount) {
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

    roomModel.datesOccupied.push(...checkedInDates)

    const updatedRoom = await roomModel.save()

    const reservationObject = { room, guest: { name, email, phone, howMany }, checkInDate, checkOutDate, paymentStatus, paymentAmount, note }

    // Create and store new reservation 
    const reservation = await Reservation.create(reservationObject)

    if (reservation && updatedRoom) { //created 
        res.status(201).json({ message: `New reservation for ${name} created` })
    } else {
        res.status(400).json({ message: 'Invalid reservation data received' })
    }
})

// @desc Update a reservation
// @route PATCH /reservations
// @access Private
const updateReservation = asyncHandler(async (req, res) => {
    const { id, room, name, email, phone, howMany, checkInDate, checkOutDate, paymentStatus, paymentAmount, note } = req.body

    // Confirm data 
    if (!id) {
        return res.status(400).json({ message: 'ID is required' })
    }

    // Does the reservation exist to update?
    const reservation = await Reservation.findById(id).exec()

    if (!reservation) {
        return res.status(400).json({ message: 'Reservation not found' })
    }

    let date1 = new Date(reservation.checkInDate)
    let date2 = new Date(reservation.checkOutDate)

    let currentCheckedInDates = createCheckedInDates(date1, date2);

    const roomModel = await Room.findOne({ roomName: room }).exec();

    if (!roomModel) {
        return res.status(400).json({ message: 'Room not found' })
    }

    //remove original dates
    roomModel.datesOccupied = deleteDates(roomModel.datesOccupied, currentCheckedInDates)

    let date3 = new Date(checkInDate)
    let date4 = new Date(checkOutDate)

    let newCheckedInDates = createCheckedInDates(date3, date4);

    //new check out date
    if (hasDate(roomModel.datesOccupied, newCheckedInDates)) {
        return res.status(409).json({ message: 'Double booked room' })
    }

    roomModel.datesOccupied.push(...newCheckedInDates)

    const updatedRoom = await roomModel.save()

    reservation.room = room
    reservation.guest.name = name
    reservation.guest.email = email
    reservation.guest.phone = phone
    reservation.guest.howMany = howMany
    reservation.checkInDate = checkInDate
    reservation.checkOutDate = checkOutDate
    reservation.paymentStatus = paymentStatus
    reservation.paymentAmount = paymentAmount
    reservation.note = note

    const updatedReservation = await reservation.save()

    if (updatedReservation && updatedRoom) { //created 
        res.json({ message: `${updatedReservation.guest.name} updated` })
    }
})

// @desc Delete a reservation
// @route DELETE /reservations
// @access Private
const deleteReservation = asyncHandler(async (req, res) => {
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

    const reply = `Reservation with ${result.name} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllReservations,
    createNewReservation,
    updateReservation,
    deleteReservation
}