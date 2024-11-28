const express = require('express')
const router = express.Router()
const i18nextController = require('../controllers/i18nextController')
const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

router.route('/:language')
    .get(i18nextController.getTranslation)
    .post(i18nextController.createNewTranslation)
    .patch(i18nextController.updateTranslation)
    .delete(i18nextController.deleteTranslation)

module.exports = router
