import { exec } from "child_process";

class SystemControl {
    public reboot = (): boolean => {
        console.log("SystemService::reboot() ...");
        const cmd = "sudo reboot";
        let success = false;
        try {
            exec(cmd);
            success = true;
        } catch (e){
            console.log("SystemService::reboot() => Error: ", e);
        }
        return success;
    }
}
export const sSystemControl = new SystemControl();