const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getProducts = async (req, res) => {
    const products = await stripe.products.list();
    res.send(products);
}

const createProduct = async (req, res) => {
    const { name, price } = req.body

    // Confirm data
    if (!name || !price) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    //find duplicate
    const productDuplicate = await stripe.products.search({
        query: `active:\'true\' AND name:\'${name}\'`,
    });

    if (productDuplicate.data.length > 0) {
        return res.status(409).json({ message: `Duplicate found` })
    }

    // Create and store new product 
    const product = await stripe.products.create({
        name: name,
        default_price_data: {
            currency: 'thb',
            unit_amount: price * 100
        }
    });

    if (product) { //created 
        res.status(201).json({ message: `New product ${name} created` })
    } else {
        res.status(400).json({ message: 'Invalid room data received' })
    }
}

const updateProduct = async (req, res) => {
    const { id, name, price } = req.body

    if (!id || !name) {
        return res.status(400).json({ message: 'All fields required' })
    }

    //get product
    const product = await stripe.products.retrieve(id);

    //get defaultPrice
    const defaultPrice = await stripe.prices.retrieve(product.default_price);

    let productUpdated

    //if not price change don't add another price object
    if (defaultPrice.unit_amount / 100 === price) {
        productUpdated = await stripe.products.update(
            id,
            {
                name: name
            }
        );

        if (productUpdated) { //created 
            return res.status(201).json({ message: `Product ${name} updated` })
        } else {
            return res.status(400).json({ message: 'Invalid product data received' })
        }
    }

    const priceObj = await stripe.prices.create({
        unit_amount: price * 100,
        currency: 'thb',
        product: id,
    });

    productUpdated = await stripe.products.update(
        id,
        {
            name: name,
            default_price: priceObj.id
        }
    );

    if (productUpdated) { //updated 
        res.status(201).json({ message: `Product ${name} updated to ${price}` })
    } else {
        res.status(400).json({ message: 'Invalid product data received' })
    }
}

const deleteProduct = async (req, res) => {
    const { id } = req.body

    const product = await stripe.products.update(
        id,
        { active: false }
    );

    if (product) { //deleted 
        res.status(201).json({ message: `Product ID ${id} set inactive` })
    } else {
        res.status(400).json({ message: 'Invalid product data received' })
    }
}

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
}