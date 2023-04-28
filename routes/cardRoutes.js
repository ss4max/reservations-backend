const express = require('express')
const router = express.Router()
const cardsController = require('../controllers/cardsController')
// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

router.route('/')
    .get(cardsController.getAllCards)
    .post(cardsController.createNewCard)
    .patch(cardsController.updateCard)
    .delete(cardsController.deleteCard)

module.exports = router
