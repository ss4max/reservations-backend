const domainURL = process.env.DOMAIN;

const allowedOrigins = [
    'https://checkout.stripe.com/c/pay/',
    'https://stripe.com',
    domainURL
    // 'https://dandrepairshop.com'
]

module.exports = allowedOrigins