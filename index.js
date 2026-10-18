import { startServer } from './modbus/modbusSlave.js';
import { startHttpServer } from './server.js';

startServer();
startHttpServer();



