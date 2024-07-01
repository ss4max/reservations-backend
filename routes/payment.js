const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

router.route('/checkout-session')
    .post(paymentController.getSession)

router.route('/create-checkout-session')
    .post(paymentController.createSession)

router.route('/webhook')
    .post(paymentController.webhook)

module.exports = router
