const Reservation = require('../models/Reservation')
const Room = require('../models/Room')

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

function getTimes(datesArray) {
    let tempArray = []
    for (let i = 0; i < datesArray.length; i++) {
        tempArray[i] = datesArray[i].getTime()
    }

    return tempArray
}

const deleteExpiredPendingReservations = async () => {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000) // 15 minutes ago

    const expiredReservations = await Reservation.find({
        paymentStatus: 'pending',
        createdAt: { $lt: cutoff }
    })

    for (const reservation of expiredReservations) {

        // Cleanup room occupancy
        const roomModel = await Room.findOne({ roomName: reservation.room }).exec()
        if (roomModel) {
            const checkInDate = new Date(reservation.checkInDate)
            const checkOutDate = new Date(reservation.checkOutDate)
            const occupiedDates = createCheckedInDates(checkInDate, checkOutDate)
            roomModel.datesOccupied = deleteDates(roomModel.datesOccupied, occupiedDates)
            await roomModel.save()
        }

        // Delete the reservation
        await reservation.deleteOne()
    }
}

module.exports = deleteExpiredPendingReservations
