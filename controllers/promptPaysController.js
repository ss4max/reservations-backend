var omise = require('omise')({
    'secretKey': process.env.OMISE_SOURCE_SECRET,
    'omiseVersion': '2019-05-29'
})

const Transaction = require('../models/Transaction')

// @desc Get all promptPays
// @route GET /promptPays
// @access Private
const getAllPromptPays = async (req, res) => {
    res.status(400).json({ message: 'Transactions found in /transactions' })
}

// @desc Create new promptPay
// @route POST /promptPays
const createNewPromptPay = async (req, res) => {
    const { source, reservationId, amount, currency } = req.body

    // Confirm data
    if (!source || !reservationId || !amount || !currency) {
        return res.status(400).json({ message: 'All fields required' })
    }

    //Credit PromptPay
    let charge = await omise.charges.create({
        amount: `${amount * 100}`, // 0.01 * 100 = 1 Baht
        currency: currency,
        capture: false,
        source: source,
    })

    if (charge?.failure_message || charge?.failure_code) {
        return res.status(400).json({ message: `${charge?.failure_code}: ${charge?.failure_message}` })
    }

    const capture = await omise.charges.capture(charge?.id)

    if (!capture?.paid) {
        return res.status(400).json({ message: `Error during charge capture ${capture?.failure_code}: ${capture?.failure_message}` })
    }

    //return res.status(400).json({ message: `Testing` })

    let transactionObject = new Transaction({
        source,
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