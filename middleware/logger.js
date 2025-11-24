// logger.js

// 1. Revert import to require() and use CommonJS syntax
const { format } = require('date-fns');
const { v4: uuid } = require('uuid');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises; // Use the old way to get the promises API

// 2. Remove ESM-specific path definitions (We'll use the global __dirname)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename); 

const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    try {
        // Use the global __dirname
        const logDirectory = path.join(__dirname, '..', 'logs');

        // Use the synchronous fs.existsSync (accessible via require('fs'))
        if (!fs.existsSync(logDirectory)) {
            await fsPromises.mkdir(logDirectory);
        }

        // Use fsPromises for asynchronous writing
        await fsPromises.appendFile(path.join(logDirectory, logFileName), logItem);
    } catch (err) {
        console.error(err);
    }
};

const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log');
    console.log(`${req.method} ${req.path}`);
    next();
};

// 3. Revert to module.exports
module.exports = { logEvents, logger };