const domain = process.env.DOMAIN

console.log(domain)

const allowedOrigins = [
    domain,
    'https://checkout.stripe.com/c/pay/',
    'https://stripe.com',
]

module.exports = allowedOrigins