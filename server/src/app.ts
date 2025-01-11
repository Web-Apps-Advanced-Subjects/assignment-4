import * as dotenv from 'dotenv';
dotenv.config();

import initApp from './server';

initApp({ startExpress: true }).catch((err) => console.log(err));
