import { readConfigFile } from "./modules/config";
import { ServerBackup } from "./modules/backup";
import { MqttClass } from "modules/mqtt";


const config = readConfigFile();
console.log(config);

const backup   = new ServerBackup();
export const mqttInstance = new MqttClass();

mqttInstance.loadNewConfig(config);
backup.loadNewConfig(config);

console.log("Started at " + (new Date()).toUTCString() + " Local: " + (new Date()).toLocaleString());