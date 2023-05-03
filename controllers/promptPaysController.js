var omise = require('omise')({
    'secretKey': process.env.OMISE_TOKEN_SECRET,
    'omiseVersion': '2019-05-29'
})

const Transaction = require('../models/Transaction')
const Webhook = require('../models/Webhook')
const Reservation = require('../models/Reservation')

// @desc Get all promptPays
// @route GET /promptPays
// @access Private
const getAllPromptPays = async (req, res) => {
    res.status(400).json({ message: 'Transactions found in /transactions' })
}

// @desc Create new promptPay
// @route POST /promptPays
const createNewPromptPay = async (req, res) => {
    const { charge, reservationId } = req.body

    // Confirm data
    if (!charge || !reservationId) {
        return res.status(400).json({ message: 'All fields required' })
    }

    const webhook = await Webhook.findOne({ charge: charge, key: "charge.complete" })

    if (!webhook) return res.status(400).json({ message: 'Payment not completed' })

    webhook.completed = true

    const updatedWebhook = await webhook.save()

    if (!updatedWebhook) return res.status(400).json({ message: 'Updating webhook failed' })

    chargeCompleted = await omise.charges.retrieve(webhook?.data?.id);

    if (chargeCompleted?.failure_message || chargeCompleted?.failure_code) {
        return res.status(400).json({ message: `${chargeCompleted?.failure_code}: ${chargeCompleted?.failure_message}` })
    }

    if (!chargeCompleted?.paid) {
        return res.status(400).json({ message: `Error during transaction ${chargeCompleted?.failure_code}: ${chargeCompleted?.failure_message}` })
    }

    // Check for duplicate reservationId and charge
    const duplicateCharge = await Transaction.findOne({ charge: charge?.id }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicateCharge) {
        return res.status(409).json({ message: 'Duplicate found' })
    }

    const reservation = await Reservation.findOne({ id: reservationId })

    if (!reservation) return res.status(400).json({ message: 'Reservation not found' })

    reservation.paymentStatus = 'paid'

    const updatedReservation = await reservation.save()

    if (!updatedReservation) return res.status(400).json({ message: 'Reservation not paid' })


    let transactionObject = new Transaction({
        reservationId,
        amount: chargeCompleted?.amount / 100,
        currency: chargeCompleted?.currency,
        charge: chargeCompleted
    })

    // Create and store new transaction 
    const transaction = await Transaction.create(transactionObject)

    if (transaction && chargeCompleted?.paid) { //created 
        res.status(201).json({ message: `New transaction for Reservation ID: ${reservationId} created` })
    } else {
        res.status(400).json({ message: 'Invalid transaction data received' })
    }
}


// @desc Update a promptPay
// @route PATCH /promptPays
// @access Private
const updatePromptPay = async (req, res) => {
    res.json({ message: `Nothing to modify` })
}

// @desc Delete a promptPay
// @route DELETE /promptPays
// @access Private
const deletePromptPay = async (req, res) => {
    res.json({ message: `Nothing to modify` })
}

module.exports = {
    getAllPromptPays,
    createNewPromptPay,
    updatePromptPay,
    deletePromptPay
}