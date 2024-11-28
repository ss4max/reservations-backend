const mongoose = require('mongoose');

// Define the translation schema
const translationSchema = new mongoose.Schema({
    language: {
        type: String, // The language code (e.g., 'en', 'th')
        required: true, // Language is mandatory
    },
    data: {
        type: Object, // The object containing the translation data
        required: true, // Translation data is mandatory
    }
});

// Create and export the model
module.exports = mongoose.model('Translation', translationSchema);
