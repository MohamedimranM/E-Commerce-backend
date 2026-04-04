// Loads environment variables based on NODE_ENV
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

dotenv.config({ path: envFile });

export const {PORT, NODE_ENV, DB_HOST} = process.env

