const Translation = require('../models/Translation'); // Import the Translation model

// @desc Get all translations
// @route GET /translations
// @access Private (use authentication middleware)
const getTranslation = async (req, res) => {
    const { language } = req.params;  // Get language from the route parameter

    try {
        // Find translations for the specified language
        const translations = await Translation.find({ language: language });

        if (translations.length === 0) {
            return res.status(404).json({ message: `No translations found for language: ${language}` });
        }

        // Send the translations as a JSON response
        res.status(200).json(translations);
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Error fetching translations', error: error.message });
    }
};


// @desc Create new translation
// @route POST /translations
// @access Private (use authentication middleware)
const createNewTranslation = async (req, res) => {
    const { language, data } = req.body; // Get the translation data from the request body

    // Check if the language already exists in the database
    try {
        const existingTranslation = await Translation.findOne({ language });
        if (existingTranslation) {
            return res.status(400).json({ message: 'Translation for this language already exists' });
        }

        // Create a new translation
        const newTranslation = new Translation({
            language,
            data,
        });

        // Save the translation to the database
        await newTranslation.save();
        res.status(201).json({ message: 'Translation created successfully', newTranslation });
    } catch (error) {
        res.status(500).json({ message: 'Error creating translation', error: error.message });
    }
};

// @desc Update a translation
// @route PATCH /translations/:language
// @access Private (use authentication middleware)
const updateTranslation = async (req, res) => {
    const { language } = req.params; // Get language from the route parameter
    const { data } = req.body; // Get the updated translation data

    try {
        // Find and update the translation for the specific language
        const updatedTranslation = await Translation.findOneAndUpdate(
            { language },
            { data }, // Update the translation data
            { new: true } // Return the updated document
        );

        if (!updatedTranslation) {
            return res.status(404).json({ message: 'Translation not found' });
        }

        res.status(200).json({ message: 'Translation updated successfully', updatedTranslation });
    } catch (error) {
        res.status(500).json({ message: 'Error updating translation', error: error.message });
    }
};

// @desc Delete a translation
// @route DELETE /translations/:language
// @access Private (use authentication middleware)
const deleteTranslation = async (req, res) => {
    const { language } = req.params; // Get the language from the route parameter

    console.log(req.params);


    try {
        const deletedTranslation = await Translation.findOneAndDelete({ language });

        if (!deletedTranslation) {
            return res.status(404).json({ message: 'Translation not found' });
        }

        res.status(200).json({ message: 'Translation deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting translation', error: error.message });
    }
};

module.exports = {
    getTranslation,
    createNewTranslation,
    updateTranslation,
    deleteTranslation,
};
