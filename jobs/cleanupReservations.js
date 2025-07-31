const Reservation = require('../models/Reservation')
const Room = require('../models/Room')

const deleteExpiredPendingReservations = async () => {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago

    console.log('cutoff', cutoff)

    const expiredReservations = await Reservation.find({
        paymentStatus: 'pending',
        createdAt: { $lt: cutoff }
    })

    console.log('expiredReservations', expiredReservations)

    for (const reservation of expiredReservations) {
        console.log(`Deleting expired reservation: ${reservation._id}`)

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
