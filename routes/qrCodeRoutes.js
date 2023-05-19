const express = require('express')
const router = express.Router()
const qrCodesController = require('../controllers/qrCodesController')
const verifyJWT = require('../middleware/verifyJWT')

router.use(verifyJWT)

router.route('/')
    .get(qrCodesController.getAllQrCodes)
    .post(qrCodesController.createNewQrCode)
    .patch(qrCodesController.updateQrCode)
    .delete(qrCodesController.deleteQrCode)

module.exports = router
