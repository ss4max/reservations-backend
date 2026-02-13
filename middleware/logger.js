const { format } = require('date-fns');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

let uuid;

// 2. Use a dynamic import to load the 'uuid' module asynchronously
import('uuid')
    .then(module => {
        // 3. Assign the v4 function to the 'uuid' variable
        uuid = module.v4;
        console.log('UUID module loaded successfully via dynamic import.');
    })
    .catch(err => {
        // Handle any errors during module loading
        console.error('Failed to load uuid module:', err);
    });

// If the uuid module fails to load, the server will continue to start,
// but any call to logEvents will result in an error until the module is loaded.


const logEvents = async (message, logFileName) => {
    // ⚠️ IMPORTANT: Check if the module is loaded before using it!
    if (!uuid) {
        console.error('UUID function not available yet. Skipping log event.');
        return;
    }

    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`; // Uses the globally loaded 'uuid' function

    // ... rest of your file system logic ...
    try {
        const logDirectory = path.join(__dirname, '..', 'logs');

        if (!fs.existsSync(logDirectory)) {
            await fsPromises.mkdir(logDirectory);
        }

        await fsPromises.appendFile(path.join(logDirectory, logFileName), logItem);
    } catch (err) {
        console.error(err);
    }
};


const logger = (req, res, next) => {
    // This part should work as before, as logEvents is now asynchronous
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log');
    console.log(`${req.method} ${req.path}`);
    next();
};

module.exports = { logEvents, logger };