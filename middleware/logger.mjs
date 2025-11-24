import { format } from 'date-fns';
import { v4 as uuid } from 'uuid';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { promises as fsPromises, existsSync } from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export const logEvents = async (message, logFileName) => {
    const dateTime = format(new Date(), 'yyyyMMdd\tHH:mm:ss');
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

    try {
        const logDirectory = join(__dirname, '..', 'logs');

        if (!existsSync(logDirectory)) {
            await fsPromises.mkdir(logDirectory);
        }

        await fsPromises.appendFile(join(logDirectory, logFileName), logItem);
    } catch (err) {
        console.error(err);
    }
};

export const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.log');
    console.log(`${req.method} ${req.path}`);
    next();
};