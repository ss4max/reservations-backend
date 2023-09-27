var omise = require('omise')({
    'secretKey': process.env.OMISE_TOKEN_SECRET,
    'omiseVersion': '2019-05-29'
})

const Transaction = require('../models/Transaction')
const Reservation = require('../models/Reservation')


// @desc Get all transactions
// @route GET /transactions
// @access Private
const getAllTransactions = async (req, res) => {
    // Get all transactions from MongoDB
    const transactions = await Transaction.find().lean()

    // If no transactions 
    if (!transactions?.length) {
        return res.status(400).json({ message: 'No transactions found' })
    }

    res.json(transactions)
}

// @desc Create new transaction
// @route POST /transactions
const createNewTransaction = async (req, res) => {
    const { reservationId, amount, currency, charge } = req.body

    // Confirm data
    if (!reservationId || !amount || !currency || !charge) {
        return res.status(400).json({ message: 'All fields required' })
    }

    // Check for duplicate reservationId and charge
    const duplicateCharge = await Transaction.findOne({ charge: charge?.id }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicateCharge) {
        return res.status(409).json({ message: 'Duplicate found' })
    }

    //find reservation
    const reservation = await Reservation.findOne({ id: reservationId })

    if (!reservation) return res.status(400).json({ message: 'Reservation not found' })

    reservation.paymentStatus = 'paid'

    const updatedReservation = await reservation.save()

    if (!updatedReservation) return res.status(400).json({ message: 'Reservation not paid' })

    let transactionObject = new Transaction({
        reservationId,
        amount,
        currency,
        charge
    })

    // Create and store new transaction 
    const transaction = await Transaction.create(transactionObject)

    if (transaction) { //created 
        res.status(201).json({ message: `New transaction for Reservation ID: ${reservationId} created` })
    } else {
        res.status(400).json({ message: 'Invalid transaction data received' })
    }
}

// @desc Update a transaction
// @route PATCH /transactions
// @access Private
const updateTransaction = async (req, res) => {
    res.json({ message: `Not allowed to modify transactions. Nothing changed` })
}

// @desc Delete a transaction
// @route DELETE /transactions
// @access Private
const deleteTransaction = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Transaction ID Required' })
    }

    // Does the transaction exist to delete?
    const transaction = await Transaction.findById(id).exec()

    if (!transaction) {
        return res.status(400).json({ message: 'Transaction not found' })
    }

    const result = await transaction.deleteOne()

    const reply = `Reservation ID: ${result.reservationId} with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllTransactions,
    createNewTransaction,
    updateTransaction,
    deleteTransaction
}