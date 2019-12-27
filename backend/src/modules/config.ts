
import * as fs from "fs";
import { ConfigFile } from "../types/config";

const data_path_rel        = "./config";
const data_path_static_p1  = "/config";
const data_path_static_p2  = "/data"; // Prio 2
export const data_path = fs.existsSync(data_path_static_p1) ? data_path_static_p1 : (fs.existsSync(data_path_static_p2) ? data_path_static_p2 : data_path_rel);

export function readConfigFile(): ConfigFile{
    const path_rel_config_example = data_path_rel + "/config_example.json";
    const path_config             = data_path     + "/config.json";

    if (fs.existsSync(path_rel_config_example) && !fs.existsSync(path_config)){
        console.log("Create initial config.jsom from config_exmaple.json, target: " + path_config)
        fs.copyFileSync(path_rel_config_example, path_config);
    }
    const config = JSON.parse(fs.readFileSync(path_config).toString());
    return config;
}