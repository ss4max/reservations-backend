const Room = require('../models/Room')
const asyncHandler = require('express-async-handler')

// @desc Get all rooms 
// @route GET /rooms
// @access Private
const getAllRooms = asyncHandler(async (req, res) => {
    // Get all rooms from MongoDB
    const rooms = await Room.find().lean()

    // If no rooms 
    if (!rooms?.length) {
        return res.status(400).json({ message: 'No rooms found' })
    }

    res.json(rooms)
})

// @desc Create new room
// @route POST /rooms
// @access Private
const createNewRoom = asyncHandler(async (req, res) => {
    const { roomName, datesOccupied } = req.body

    // Confirm data
    if (!roomName) {
        return res.status(400).json({ message: 'Room name is required' })
    }

    // Check for duplicate title
    const duplicate = await Room.findOne({ roomName }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate room' })
    }

    // Create and store the new room 
    const newRoom = await Room.create({ roomName, datesOccupied })

    if (newRoom) { // Created 
        return res.status(201).json({ message: 'New room created' })
    } else {
        return res.status(400).json({ message: 'Invalid room data received' })
    }

})

// @desc Update a room
// @route PATCH /rooms
// @access Private
const updateRoom = asyncHandler(async (req, res) => {
    const { id, roomName, datesOccupied } = req.body

    // Confirm data
    if (!id || !roomName || !datesOccupied) {
        return res.status(400).json({ message: 'All fields required' })
    }

    // Confirm room exists to update
    const room = await Room.findById(id).exec()

    if (!room) {
        return res.status(400).json({ message: 'Room not found' })
    }

    // Check for duplicate title
    const duplicate = await Room.findOne({ roomName }).lean().exec()

    // Allow renaming of the original room 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate room' })
    }



    room.roomName = roomName
    room.datesOccupied = datesOccupied

    const updatedRoom = await room.save()

    res.json(`'${updatedRoom.roomName}' updated`)
})

// @desc Delete a room
// @route DELETE /rooms
// @access Private
const deleteRoom = asyncHandler(async (req, res) => {
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
})

module.exports = {
    getAllRooms,
    createNewRoom,
    updateRoom,
    deleteRoom
}