import { readConfigFile, getPrintableConfigFile } from "./modules/config";
import { ServerBackup } from "./modules/backup";
import { MqttClass } from "./modules/mqtt";
import { setupConsole } from "./modules/console";
import { globalMachineStatus } from "./modules/machine_status";
import { sWebServer } from "./modules/webserver";

setupConsole();
console.log("\nStarting ...\n")

export const config = readConfigFile();
console.log("nStarting: Config:", getPrintableConfigFile(config));

globalMachineStatus.init(config);
sWebServer.startApi(config);

const backup   = new ServerBackup();
export const mqttInstance = new MqttClass();

mqttInstance.loadNewConfig(config);
backup.loadNewConfig(config);

console.log("Startup finished");