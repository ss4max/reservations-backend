const Webhook = require('../models/Webhook')

// @desc Get all webhooks
// @route GET /webhooks
// @access Private
const getAllWebhooks = async (req, res) => {
    // Get all webhooks from MongoDB
    const webhooks = await Webhook.find().select('-password').lean()

    // If no webhooks 
    if (!webhooks?.length) {
        return res.status(400).json({ message: 'No webhooks found' })
    }

    res.json(webhooks)
}

// @desc Create new webhook
// @route POST /webhooks
// @access Private
const createNewWebhook = async (req, res) => {
    const { id, data, key } = req.body

    const webhookObject = { sourceId: data?.source?.id, data, key }

    // Create and store new webhook 
    const webhook = await Webhook.create(webhookObject)

    if (webhook) { //created 
        res.status(201).json({ message: `New webhook ${id} created` })
    } else {
        res.status(400).json({ message: 'Invalid webhook data received' })
    }
}

// @desc Update a webhook
// @route PATCH /webhooks
// @access Private
const updateWebhook = async (req, res) => {
    const { id, completed } = req.body

    // Confirm data 
    if (!id) {
        return res.status(400).json({ message: 'ID is required' })
    }

    // Does the webhook exist to update?
    const webhook = await Webhook.findById(id).exec()

    if (!webhook) {
        return res.status(400).json({ message: 'Webhook not found' })
    }

    webhook.completed = completed

    const updatedWebhook = await webhook.save()

    res.json({ message: `${updatedWebhook.id} updated` })
}

// @desc Delete a webhook
// @route DELETE /webhooks
// @access Private
const deleteWebhook = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Webhook ID Required' })
    }

    // Does the webhook exist to delete?
    const webhook = await Webhook.findById(id).exec()

    if (!webhook) {
        return res.status(400).json({ message: 'Webhook not found' })
    }

    const result = await webhook.deleteOne()

    const reply = `Webhook ${result.id} deleted`

    res.json(reply)
}

module.exports = {
    getAllWebhooks,
    createNewWebhook,
    updateWebhook,
    deleteWebhook
}