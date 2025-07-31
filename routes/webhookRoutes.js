const express = require('express')
const router = express.Router()
const webhooksController = require('../controllers/webhooksController')

router.route('/')
    .get(webhooksController.getAllWebhooks)
    .post(webhooksController.createNewWebhook)
    .patch(webhooksController.updateWebhook)
    .delete(webhooksController.deleteWebhook)

module.exports = router
