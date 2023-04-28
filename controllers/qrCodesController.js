var omise = require('omise')({
    'secretKey': process.env.OMISE_TOKEN_SECRET,
    'omiseVersion': '2019-05-29'
})

// @desc Get all qrCodes
// @route GET /qrCodes
const getAllQrCodes = async (req, res) => {
    res.status(400).json({ message: 'This is for qr code generation' })
}

// @desc Create new qrCode
// @route POST /qrCodes
const createNewQrCode = async (req, res) => {
    const { source, amount, currency } = req.body

    // Confirm data
    if (!source || !amount || !currency) {
        return res.status(400).json({ message: 'All fields required' })
    }

    //QrCode
    let charge = await omise.charges.create({
        amount: `${amount * 100}`, // 0.01 * 100 = 1 Baht
        currency: currency,
        capture: false,
        source: source,
    })

    const qrCode = charge?.source?.scannable_code?.image.download_uri

    if (qrCode) { //created 
        res.json({
            qrCode: qrCode,
            charge: charge.id
        });
    } else {
        res.status(400).json({ message: 'Invalid transaction data received' })
    }
}


// @desc Update a qrCode
// @route PATCH /qrCodes
const updateQrCode = async (req, res) => {
    res.json({ message: `Nothing to modify` })
}

// @desc Delete a qrCode
// @route DELETE /qrCodes
const deleteQrCode = async (req, res) => {
    res.json({ message: `Nothing to modify` })
}

module.exports = {
    getAllQrCodes,
    createNewQrCode,
    updateQrCode,
    deleteQrCode
}