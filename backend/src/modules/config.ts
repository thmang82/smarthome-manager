
import * as fs from "fs";
import { ConfigFile } from "../types/config";

const data_path_rel        = "./config";
const data_path_static_p1  = "./";
const data_path_static_p2  = "./config"; // Prio 2
export const data_path = fs.existsSync(data_path_static_p1) ? data_path_static_p1 : (fs.existsSync(data_path_static_p2) ? data_path_static_p2 : data_path_rel);

export function readConfigFile(): ConfigFile{
    const path_rel_config_example = data_path_rel + "/config_example.json";
    const path_config             = data_path     + "/config.json";

    if (fs.existsSync(path_rel_config_example) && !fs.existsSync(path_config)){
        console.log("readConfigFile(): Create initial config.json from config_example.json, target: " + path_config)
        try {
            let ret = fs.copyFileSync(path_rel_config_example, path_config);
            console.log("readConfigFile() - copy success!");
        } catch (e){
            console.error("readConfigFile() - error: ",e);
        }
    }

    const config = JSON.parse(fs.readFileSync(path_config).toString());
    return config;
}

export function getPrintableConfigFile(config: ConfigFile): ConfigFile {
    const copy = <ConfigFile> JSON.parse(JSON.stringify(config));
    const c_mount = copy.backup.mount;
    if (c_mount) {
        const pw = c_mount.pass;
        c_mount.pass = pw.split("").map(e => "*").join();
    }
    return copy;
}