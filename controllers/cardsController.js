var omise = require('omise')({
    'secretKey': process.env.OMISE_TOKEN_SECRET,
    'omiseVersion': '2019-05-29'
})

const Transaction = require('../models/Transaction')

// @desc Get all cards
// @route GET /cards
// @access Private
const getAllCards = async (req, res) => {
    res.status(400).json({ message: 'Transactions found in /transactions' })
}

// @desc Create new card
// @route POST /cards
const createNewCard = async (req, res) => {
    const { token, reservationId, amount, currency } = req.body

    // Confirm data
    if (!token || !reservationId || !amount || !currency) {
        return res.status(400).json({ message: 'All fields required' })
    }

    //Credit Card
    let charge = await omise.charges.create({
        amount: `${amount * 100}`, // 0.01 * 100 = 1 Baht
        currency: currency,
        capture: false,
        card: token,
    })

    if (charge?.failure_message || charge?.failure_code) {
        return res.status(400).json({ message: `${charge?.failure_code}: ${charge?.failure_message}` })
    }

    const capture = await omise.charges.capture(charge?.id)

    if (!capture?.paid) {
        return res.status(400).json({ message: `Error during charge capture ${capture?.failure_code}: ${capture?.failure_message}` })
    }

    // Check for duplicate reservationId and charge
    const duplicateReservationId = await Transaction.findOne({ reservationId }).collation({ locale: 'en', strength: 2 }).lean().exec()
    const duplicateCharge = await Transaction.findOne({ charge: capture?.id }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicateReservationId || duplicateCharge) {
        return res.status(409).json({ message: 'Duplicate found' })
    }

    let transactionObject = new Transaction({
        token,
        reservationId,
        amount,
        currency,
        charge: capture
    })

    // Create and store new transaction 
    const transaction = await Transaction.create(transactionObject)

    if (transaction && capture?.paid) { //created 
        res.status(201).json({ message: `New transaction for Reservation ID: ${reservationId} created` })
    } else {
        res.status(400).json({ message: 'Invalid transaction data received' })
    }
}


// @desc Update a card
// @route PATCH /cards
// @access Private
const updateCard = async (req, res) => {
    res.json({ message: `Nothing to modify` })
}

// @desc Delete a card
// @route DELETE /cards
// @access Private
const deleteCard = async (req, res) => {
    res.json({ message: `Nothing to modify` })
}

module.exports = {
    getAllCards,
    createNewCard,
    updateCard,
    deleteCard
}