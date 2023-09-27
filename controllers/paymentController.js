const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('../models/Transaction')
const Reservation = require('../models/Reservation')

const fee = 10
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
    const reservation = await Reservation.findOne({ id: reservationId })

    if (!reservation) return res.status(400).json({ message: 'Reservation not found' })

    reservation.paymentStatus = 'paid'

    const updatedReservation = await reservation.save()

    //get payment intent object
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

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
}

const createSession = async (req, res) => {
    const { roomName, amount, nights, reservationId } = req.body;
    const domainURL = process.env.DOMAIN;

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
        success_url: `${domainURL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/payment/canceled`,
        // automatic_tax: { enabled: true }
    });

    return res.status(200).json({ message: session.url })
}

const webhook = async (req, res) => {
    let event;

    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        // Retrieve the event by verifying the signature using the raw body and secret.
        let signature = req.headers['stripe-signature'];

        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `.env`,
        // retrieve the event data directly from the request body.
        event = req.body;
    }

    if (event.type === 'checkout.session.completed') {
        console.log(`🔔  Payment received!`);

        // Note: If you need access to the line items, for instance to
        // automate fullfillment based on the the ID of the Price, you'll
        // need to refetch the Checkout Session here, and expand the line items:
        //
        // const session = await stripe.checkout.sessions.retrieve(
        //   'cs_test_KdjLtDPfAjT1gq374DMZ3rHmZ9OoSlGRhyz8yTypH76KpN4JXkQpD2G0',
        //   {
        //     expand: ['line_items'],
        //   }
        // );
        //
        // const lineItems = session.line_items;
    }

    res.sendStatus(200);
}



module.exports = {
    getSession,
    createSession,
    webhook
}