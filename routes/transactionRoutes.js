const express = require('express')
const router = express.Router()
const transactionsController = require('../controllers/transactionsController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(transactionsController.getAllTransactions)
    .post(transactionsController.createNewTransaction)
    .patch(transactionsController.updateTransaction)
    .delete(transactionsController.deleteTransaction)

module.exports = router
