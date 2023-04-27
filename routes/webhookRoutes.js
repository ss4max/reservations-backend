const express = require('express')
const router = express.Router()
const webhooksController = require('../controllers/webhooksController')
// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

router.route('/')
    .get(webhooksController.getAllWebhooks)
    .post(webhooksController.createNewWebhook)
    .patch(webhooksController.updateWebhook)
    .delete(webhooksController.deleteWebhook)

module.exports = router
