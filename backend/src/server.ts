import { readConfigFile } from "./modules/config";
import { ServerBackup } from "./modules/backup";


const config = readConfigFile();
console.log(config);
const backup = new ServerBackup();
backup.loadNewConfig(config);

console.log("Started at " + (new Date()).toUTCString() + " Local: " + (new Date()).toLocaleString());