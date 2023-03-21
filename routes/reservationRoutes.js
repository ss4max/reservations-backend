const express = require('express')
const router = express.Router()
const reservationsController = require('../controllers/reservationsController')

router.route('/')
    .get(reservationsController.getAllReservations)
    .post(reservationsController.createNewReservation)
    .patch(reservationsController.updateReservation)
    .delete(reservationsController.deleteReservation)

module.exports = router
