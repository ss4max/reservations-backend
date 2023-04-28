var omise = require('omise')({
    'secretKey': process.env.OMISE_TOKEN_SECRET,
    'omiseVersion': '2019-05-29'
})

const Transaction = require('../models/Transaction')
const Webhook = require('../models/Webhook')

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
    const { token, source, reservationId, amount, currency } = req.body

    // Confirm data
    if (!reservationId || !amount || !currency) {
        return res.status(400).json({ message: 'All fields required' })
    }

    // Check for duplicate token or source
    const duplicateToken = await Transaction.findOne({ token }).collation({ locale: 'en', strength: 2 }).lean().exec()
    const duplicateReservationId = await Transaction.findOne({ reservationId }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicateToken || duplicateReservationId) {
        return res.status(409).json({ message: 'Duplicate found' })
    }

    //Credit Card
    let charge = await omise.charges.create({
        amount: `${amount * 100}`, // 0.01 * 100 = 1 Baht
        currency: currency,
        capture: false,
        card: token,
        source: source
    })

    const qrCode = charge?.source?.scannable_code?.image.download_uri

    let webhook = await Webhook.findOne({ sourceId: charge?.source?.id, key: "charge.complete" }).lean().exec()

    while (!webhook) {
        webhook = await Webhook.findOne({ sourceId: charge?.source?.id, key: "charge.complete" }).lean().exec()
    }

    //what to do with charge?
    charge = await omise.charges.retrieve(webhook?.data?.id);

    console.log(charge);

    if (charge?.failure_message || charge?.failure_code) {
        return res.status(400).json({ message: `${charge?.failure_code}: ${charge?.failure_message}` })
    }

    const capture = await omise.charges.capture(charge?.id)

    if (!capture?.paid) {
        return res.status(400).json({ message: `Error during charge capture ${capture?.failure_code}: ${capture?.failure_message}` })
    }

    // //PromptPay
    // const chargeQR = await omise.charges.create({
    //     amount: `${amount * 100}`, // 0.01 * 100 = 1 Baht
    //     currency: currency,
    //     capture: false,
    //     card: token
    // })

    // if (chargeQR?.failure_message || chargeQR?.failure_code) {
    //     return res.status(400).json({ message: `${chargeQR?.failure_code}: ${chargeQR?.failure_message}` })
    // }

    // const captureQR = await omise.charges.capture(chargeQR?.id)

    // if (!captureQR?.paid) {
    //     return res.status(400).json({ message: `Error during charge captureQR ${captureQR?.failure_code}: ${captureQR?.failure_message}` })
    // }

    let transactionObject = new Transaction({
        token,
        source,
        reservationId,
        amount,
        currency,
        charge: capture
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
    // const { id, token, source, reservationId, amount, currency } = req.body

    // // Confirm data 
    // if (reservationId) {
    //     return res.status(400).json({ message: 'Reservation ID required' })
    // }

    // // Does the transaction exist to update?
    // const transaction = await Transaction.findById(id).exec()

    // if (!transaction) {
    //     return res.status(400).json({ message: 'Transaction not found' })
    // }

    // // Check for duplicate token
    // const duplicateToken = await Transaction.findOne({ token }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // // Allow updates to the original transaction 
    // if (duplicateToken && duplicateToken?._id.toString() !== id) {
    //     return res.status(409).json({ message: 'Duplicate token' })
    // }

    // // Check for duplicate source
    // const duplicateSource = await Transaction.findOne({ token }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // // Allow updates to the original transaction 
    // if (duplicateSource && duplicateSource?._id.toString() !== id) {
    //     return res.status(409).json({ message: 'Duplicate source' })
    // }

    // transaction.token = token
    // transaction.source = source
    // transaction.reservationId = reservationId
    // transaction.amount = amount
    // transaction.currency = currency

    // const updatedTransaction = await transaction.save()

    // res.json({ message: `Reservation ID: ${updatedTransaction.reservationId} updated` })
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