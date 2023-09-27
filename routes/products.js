const express = require('express')
const router = express.Router()
const productsController = require('../controllers/productsController')
// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

router.route('/')
    .get(productsController.getProducts)
    .post(productsController.createProduct)
    .patch(productsController.updateProduct)
    .delete(productsController.deleteProduct)

module.exports = router
