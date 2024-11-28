const Room = require('../models/Room')
const Reservation = require('../models/Reservation')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const fee = process.env.PERCENT_FEE
const feePercentage = fee * 0.01

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

const getDatesArray = (datesArrayObj) => {
    return datesArrayObj.map((obj) => obj.date);
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
        res.status(201).json({ message: reservation.id })
    } else {
        res.status(400).json({ message: 'Invalid reservation data received' })
    }
}

const createNewPayment = async (req, res) => {
    const { room, name, email, phone, adults, kids, checkInDate, checkOutDate, paymentStatus, paymentAmount, note, nights, language } = req.body

    //create new reservation
    // Confirm data
    if (!room || !name || !email || !phone || !adults || !checkInDate || !checkOutDate || !paymentAmount || !nights) {
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

    //create session
    const domainURL = process.env.DOMAIN;

    //get product
    const products = await stripe.products.search({
        query: `active:\'true\' AND name:\'${room}\'`,
    });

    const product = products.data[0]

    //get default price
    const price = product.default_price

    // Create new Checkout Session for the order
    // Other optional params include:
    // For full details see https://stripe.com/docs/api/checkout/sessions/create

    const amount = paymentAmount

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',

        line_items: [
            {
                price: price,
                quantity: nights,
            },
        ],

        payment_intent_data: {
            application_fee_amount: amount * 100 * feePercentage,
            transfer_data: {
                destination: process.env.OWNER_ACCOUNT,
            },
        },
        metadata: {
            reservationId: reservation.id
        },
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}/book/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/book/payment/canceled?reservation_id=${reservation?.id}`,
        // automatic_tax: { enabled: true }
        locale: language
    });

    if (reservation && updatedRoom) { //created 
        res.status(200).json({ message: session.url })

    } else {
        res.status(400).json({ message: 'Invalid reservation data received' })
    }
}

const deleteNewReservation = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Reservation ID Required' })
    }

    // Does the reservation exist to delete?
    const reservation = await Reservation.findById(id).exec()

    if (!reservation) {
        return res.status(400).json({ message: 'Reservation not found' })
    }

    //delete dates from room
    let date1 = new Date(reservation.checkInDate)
    let date2 = new Date(reservation.checkOutDate)
    let currentCheckedInDates = createCheckedInDates(date1, date2);
    const roomModel = await Room.findOne({ roomName: reservation.room }).exec();
    roomModel.datesOccupied = deleteDates(roomModel.datesOccupied, currentCheckedInDates)

    const result = await reservation.deleteOne()

    const updatedRoom = await roomModel.save()

    if (!updatedRoom) {
        res.json({ message: `${result.room} dates not updated` })
    }

    const reply = `Reservation with ${result.guest.name} with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllRooms,
    getAllReservations,
    createNewReservation,
    createNewPayment,
    deleteNewReservation
}