const Room = require('../models/Room')

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
    const { roomName, reservationId, datesOccupied, roomPrice, roomDescription, roomImages, imageLabels } = req.body

    // Confirm data
    if (!roomName || !roomPrice || !roomDescription || !roomImages || !imageLabels) {
        return res.status(400).json({ message: 'All fields required' })
    }

    // Check for duplicate title
    const duplicate = await Room.findOne({ roomName }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate room' })
    }

    // Create objects with date and reservationId for datesOccupied array
    // const datesOccupiedArray = datesOccupied.map(date => tempObj = { date: date, reservationId: reservationId });

    const myDocument = new Room({
        roomName: roomName,
        reservationId: null,
        datesOccupied: [],
        roomPrice: roomPrice,
        roomDescription: roomDescription,
        roomImages: roomImages,
        imageLabels: imageLabels
    });

    // Create and store the new room 
    const newRoom = await Room.create(myDocument)

    if (newRoom) { // Created 
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

    // Allow renaming of the original room 
    if (duplicate && duplicate?._id.toString() !== id) {
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

    res.json(`'${updatedRoom.roomName}' updated`)
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

    const result = await room.deleteOne()

    const reply = `Room '${result.roomName}' with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllRooms,
    createNewRoom,
    updateRoom,
    deleteRoom
}