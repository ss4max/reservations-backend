const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction')
const Reservation = require('../models/Reservation')

const fee = process.env.PERCENT_FEE
const feePercentage = fee * 0.01

const getSession = async (req, res) => {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const reservationId = session.metadata.reservationId
    //confirm data
    if (!reservationId) {
        return res.status(400).json({ message: 'No reservation ID found' })
    }

    //find reservation and update to paid
    // const reservation = await Reservation.findOne({ id: reservationId })
    const reservation = await Reservation.findOne({ _id: reservationId })

    if (!reservation) return res.status(400).json({ message: 'Reservation not found' })

    reservation.paymentStatus = 'paid'

    const updatedReservation = await reservation.save()

    //get payment intent object
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

    //check for duplicate transaction
    const duplicateCharge = await Transaction.findOne({ reservationId }).lean().exec()

    if (duplicateCharge && updatedReservation) {
        return res.send({ message: reservationId });
    }

    //create transaction on success
    let transactionObject = new Transaction({
        reservationId,
        amount: session.amount_total / 100,
        paymentIntent
    })

    // Create and store new transaction 
    const transaction = await Transaction.create(transactionObject)

    if (transaction && updatedReservation) res.send({ message: reservationId });
    else res.status(400).json({ message: 'Something went wrong' })
}

const createSession = async (req, res) => {
    const { roomName, amount, nights, reservationId, language } = req.body;
    const domainURL = process.env.DOMAIN;

    console.log('language', language)

    const allowedLocales = [
        'auto', 'bg', 'cs', 'da', 'de', 'el', 'en', 'en-GB', 'es', 'es-419',
        'et', 'fi', 'fil', 'fr', 'fr-CA', 'hr', 'hu', 'id', 'it', 'ja', 'ko',
        'lt', 'lv', 'ms', 'mt', 'nb', 'nl', 'pl', 'pt', 'pt-BR', 'ro', 'ru',
        'sk', 'sl', 'sv', 'th', 'tr', 'vi', 'zh', 'zh-HK', 'zh-TW'
    ];

    let languageChecked = language

    if (!allowedLocales.includes(language)) {
        languageChecked = 'auto'; // fallback default
    }

    //get product
    const products = await stripe.products.search({
        query: `active:\'true\' AND name:\'${roomName}\'`,
    });

    const product = products.data[0]

    //get default price
    const price = product.default_price

    // Create new Checkout Session for the order
    // Other optional params include:
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',

        line_items: [
            {
                price: price,
                quantity: nights,
            },
        ],

        payment_intent_data: {
            application_fee_amount: amount * 100 * feePercentage,
            transfer_data: {
                destination: process.env.OWNER_ACCOUNT,
            },
        },
        metadata: {
            reservationId: reservationId
        },
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}/dash/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/dash/payment/canceled?reservation_id=${reservationId}`,
        // automatic_tax: { enabled: true }
        locale: languageChecked,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60 // 30 minutes
    });

    console.log('session.url', session.url)

    return res.status(200).json({ message: session.url })
}

const webhook = async (req, res) => {

    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const reservationId = session.metadata.reservationId

    //confirm data
    if (!reservationId) {
        return res.status(400).json({ message: 'No reservation ID found' })
    }

    //find reservation and update to paid
    const reservation = await Reservation.findOne({ id: reservationId })

    if (!reservation) return res.status(400).json({ message: 'Reservation not found' })

    reservation.paymentStatus = 'paid'

    const updatedReservation = await reservation.save()

    //get payment intent object
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

    //check for duplicate transaction
    const duplicateCharge = await Transaction.findOne({ paymentIntent: { id: paymentIntent.id } }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicateCharge) return res.status(409).json({ message: 'Duplicate found' })

    //create transaction on success
    let transactionObject = new Transaction({
        reservationId,
        amount: session.amount_total / 100,
        paymentIntent
    })

    // Create and store new transaction 
    const transaction = await Transaction.create(transactionObject)

    if (transaction && updatedReservation) res.send(session);
    else res.status(400).json({ message: 'Something went wrong' })

    res.sendStatus(200);
}

module.exports = {
    getSession,
    createSession,
    webhook
}