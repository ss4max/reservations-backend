const Room = require('../models/Room')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc Get all rooms 
// @route GET /rooms
// @access Private
const getAllRooms = async (req, res) => {
    // Get all rooms from MongoDB
    const rooms = await Room.find().lean()

    // If no rooms 
    if (!rooms?.length) {
        return res.status(400).json({ message: 'No rooms found' })
    }

    res.json(rooms)
}

// @desc Create new room
// @route POST /rooms
// @access Private
const createNewRoom = async (req, res) => {
    const { roomName, roomPrice, roomDescription, roomImages, imageLabels } = req.body

    // Confirm data
    if (!roomName || !roomPrice || !roomDescription || !roomImages || !imageLabels) {
        return res.status(400).json({ message: 'All fields required' })
    }

    // Check for duplicate room and product
    const duplicate = await Room.findOne({ roomName }).collation({ locale: 'en', strength: 2 }).lean().exec()
    const productDuplicate = await stripe.products.search({
        query: `active:\'true\' AND name:\'${roomName}\'`,
    });

    if (duplicate || productDuplicate.data.length > 0) {
        return res.status(409).json({ message: 'Duplicate room' })
    }

    // Create objects with date and reservationId for datesOccupied array
    // const datesOccupiedArray = datesOccupied.map(date => tempObj = { date: date, reservationId: reservationId });

    //Create new product
    const product = await stripe.products.create({
        name: roomName,
        default_price_data: {
            currency: 'thb',
            unit_amount: roomPrice * 100
        }
    });

    const myDocument = new Room({
        roomName: roomName,
        productId: product.id,
        reservationId: null,
        datesOccupied: [],
        roomPrice: roomPrice,
        roomDescription: roomDescription,
        roomImages: roomImages,
        imageLabels: imageLabels
    });

    // Create and store the new room 
    const newRoom = await Room.create(myDocument)

    if (newRoom && product) { // Created 
        return res.status(201).json({ message: 'New room created' })
    } else {
        return res.status(400).json({ message: 'Invalid room data received' })
    }

}

// @desc Update a room
// @route PATCH /rooms
// @access Private
const updateRoom = async (req, res) => {
    const { id, roomName, reservationId, datesOccupied, roomPrice, roomDescription, roomImages, imageLabels } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'ID required' })
    }

    // Confirm room exists to update
    const room = await Room.findById(id).exec()

    if (!room) {
        return res.status(400).json({ message: 'Room not found' })
    }

    // Check for duplicate title
    const duplicate = await Room.findOne({ roomName }).collation({ locale: 'en', strength: 2 }).lean().exec()

    const productDuplicate = await stripe.products.search({
        query: `active:\'true\' AND name:\'${roomName}\'`,
    });

    // Allow renaming of the original room 
    if (duplicate && duplicate?._id.toString() !== id || productDuplicate.data.length > 0) {
        return res.status(409).json({ message: 'Duplicate room' })
    }

    // Create objects with date and reservationId for datesOccupied array
    const datesOccupiedArray = datesOccupied.map(date => tempObj = { date: date, reservationId: reservationId });

    room.roomName = roomName
    room.datesOccupied = datesOccupiedArray
    room.roomPrice = roomPrice
    room.roomDescription = roomDescription
    room.roomImages = roomImages
    room.imageLabels = imageLabels

    const updatedRoom = await room.save()

    const productId = room.productId

    //get product
    const product = await stripe.products.retrieve(productId);

    //get defaultPrice
    const defaultPrice = await stripe.prices.retrieve(product.default_price);

    let productUpdated

    //if not price change don't add another price object
    if (defaultPrice.unit_amount / 100 === roomPrice) {
        productUpdated = await stripe.products.update(
            productId,
            {
                name: roomName
            }
        );

        if (productUpdated) { //created 
            return res.json(`'${updatedRoom.roomName}' updated`)
        } else {
            return res.status(400).json({ message: 'Invalid product data received' })
        }
    }

    const priceObj = await stripe.prices.create({
        unit_amount: roomPrice * 100,
        currency: 'thb',
        product: productId,
    });

    productUpdated = await stripe.products.update(
        productId,
        {
            name: roomName,
            default_price: priceObj.id
        }
    );

    if (productUpdated) { //created 
        return res.json(`'${updatedRoom.roomName}' updated`)
    } else {
        return res.status(400).json({ message: 'Invalid product data received' })
    }
}

// @desc Delete a room
// @route DELETE /rooms
// @access Private
const deleteRoom = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Room ID required' })
    }

    // Confirm room exists to delete 
    const room = await Room.findById(id).exec()

    if (!room) {
        return res.status(400).json({ message: 'Room not found' })
    }

    const deleted = await stripe.products.del(room.productId);

    const result = await room.deleteOne()

    const reply = `Room '${result.roomName}' with ID ${result._id} deleted`

    if (deleted) {
        return res.json(reply)
    } else {
        return res.status(400).json({ message: 'Invalid product ID received' })
    }
}

module.exports = {
    getAllRooms,
    createNewRoom,
    updateRoom,
    deleteRoom
}