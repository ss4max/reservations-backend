const express = require('express')
const router = express.Router()
const publicController = require('../controllers/publicController')

router.route('/')
    .get(publicController.getAllRooms)

router.route('/payment')
    .get(publicController.getAllReservations)
    .post(publicController.createNewPayment)

router.route('/reservation')
    .post(publicController.createNewReservation)

module.exports = router