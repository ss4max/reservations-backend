const express = require('express')
const router = express.Router()
const promptPaysController = require('../controllers/promptPaysController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(promptPaysController.getAllPromptPays)
    .post(promptPaysController.createNewPromptPay)
    .patch(promptPaysController.updatePromptPay)
    .delete(promptPaysController.deletePromptPay)

module.exports = router
