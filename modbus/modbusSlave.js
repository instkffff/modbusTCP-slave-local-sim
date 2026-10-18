import { readValue } from '../sqlite/read.js';
import { insertValue } from '../sqlite/insert.js';
import { port, System } from '../config.js';
import ModbusRTU from 'modbus-serial';

function checkParams(unitID, addr, quantity = 1) {
    const entry = System[unitID];
    if (!entry) throw new Error("Server Device Failure");
    const [tableName, maxAddr] = entry;
    if (addr < 0 || (addr + quantity) > maxAddr) throw new Error("Illegal Data Address");
    return tableName;
}

function handleRead(addr, unitID) {
    const tableName = checkParams(unitID, addr, 1);
    return readValue(tableName, addr + 1) ?? 0;
}

function handleWrite(addr, value, unitID, quantity = 1) {
    const tableName = checkParams(unitID, addr, quantity);
    const startId = addr + 1;
    if (quantity === 1) {
        insertValue(tableName, startId, value);
    } else {
        value.forEach((val, i) => insertValue(tableName, startId + i, val));
    }
}

const vector = {
    getHoldingRegister: (addr, unitID, callback) => {
        try { 
            const val = handleRead(addr, unitID);
            callback(null, val); 
        } catch (e) { 
            console.error([unitID, addr, e.message]); 
            callback(e, null); 
        }
    },
    
    setRegister: (addr, value, unitID, callback) => {
        try { 
            handleWrite(addr, value, unitID);
            console.log([unitID, addr, value]);
            callback(null, value);
        } catch (e) { 
            console.error([unitID, addr, e.message]); 
            callback(e, null);
        }
    },
    
    setMultipleRegisters: (addr, values, unitID, callback) => {
        try { 
            handleWrite(addr, values, unitID, values.length);
            console.log([unitID, addr, values]);
            callback(null, values.length);
        } catch (e) { 
            console.error([unitID, addr, e.message]); 
            callback(e, null);
        }
    }
};

function initializeDatabaseCheck() {
    for (const [unitID, [tableName]] of Object.entries(System)) {
        try { readValue(tableName, 1); console.log([unitID, 'ok']); }
        catch (e) { console.warn([unitID, e]); }
    }
}

function startServer(host = '0.0.0.0', serverPort = port) {
    initializeDatabaseCheck();
    const serverTCP = new ModbusRTU.ServerTCP(vector, { host, port: serverPort, debug: false });
    serverTCP.on('socketError', (err) => console.error([0, 0, err]));
    console.log(`Server started on port ${serverPort}`);
    return serverTCP;
}

export { startServer };