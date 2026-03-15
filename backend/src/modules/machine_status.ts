import { execSync } from 'child_process';
import { ConfigFile } from 'types/config';

let conf_interval_minutes = 10;

class MachineStatus {

    constructor(){
        const self = this;
    }

    public init = (config: ConfigFile) => {
        console.log("MachineStatus:init() - conf_interval_minutes: " + conf_interval_minutes);
        this.getData();
        setInterval(this.getData, conf_interval_minutes * 60*1000);
    }
    
    public getData = () => {
        let start_time_iso: string | undefined
        try {
            start_time_iso = execSync("uptime -s").toString().trim(); // e.g. 2020-10-05 22:43:54
        } catch(e){
            console.error("MachineStatus, error getting uptime: ", e);
        }
        const hostname = execSync("hostname").toString().trim(); // e.g. server

        console.log(`MachineStatus: hostname:       '${hostname}'`);
        console.log(`MachineStatus: start_time_iso: '${start_time_iso}'`);

        // "mount"

        // "df"
        this.getAvlbDiskSpace();
    }

    private getMountConfig = () => {
        
        execSync("cat /etc/fstab").toString().split("\n").forEach(line => {
            /*
                proc                    /proc           proc    defaults          0       0
                PARTUUID=6c586e13-01    /boot           vfat    defaults          0       2
                PARTUUID=6c586e13-02    /               ext4    defaults,noatime  0       1
                //tmangnas.lan/backup   /mnt/backup     cifs    uid=1000,gid=1000,username=USERNAME,password=PASSWORD,vers=2.0,rw,_netdev,x-systemd.automount 0 0
            */
            // check on "noatime" on /
            // check on "commit=1800" (commit=X_SECONDS) => only write in certain interval => reduced write load on SD-Cards => https://domoticproject.com/extending-life-raspberry-pi-sd-card/
            // check via "mount" if mounts worked + can get all parameters!
        });
    }

    private getAvlbDiskSpace = () => {
        let line_count = 0;
        try {
            execSync("df -T").toString().split("\n").forEach(line => {
                line_count++;
                /*
                Dateisystem      Typ      1K-Blöcke    Benutzt Verfügbar Verw% Eingehängt auf
                /dev/root        ext4     29612196   11365700  17007940   41% /
                /dev/mmcblk0p1   vfat       258095      54373    203722   22% /boot
                //tmangnas.lan/backup cifs     2879527424 2103934588 775592836   74% /mnt/backup
                Types: devtmpfs, tmpfs, vfat
                */
            if (line_count > 1){
                    line = line.replace(/[\t ]+/g," ").trim(); // replace all space and tabs with only one space
                    let elems = line.split(" ");
                    if (elems && elems.length == 7){
                        const path_disk  = elems[0];
                        const path_mount = elems[6];
                        const type       = elems[1];
                        const kb_total = parseInt(elems[2]);
                        const kb_used = parseInt(elems[3]);
                        const kb_avlb = parseInt(elems[4]);
                        let percent = kb_avlb / kb_total * 100;
                        if (type.indexOf("tmpfs") < 0 && type.indexOf("overlay") < 0){
                            const is_root          = path_mount == "/";
                            const is_boot          = path_mount == "/boot";
                            const is_network_mount = path_disk.startsWith("//");
                            console.log(`DiskSpace: ${type.padEnd(5," ")} | ${path_disk.padEnd(25," ")}->${path_mount.padEnd(25," ")} | ${percent.toFixed(1)}% | is_root:${is_root} is_boot:${is_boot} is_net:${is_network_mount}`);
                        }
                    }
            }
            });
        } catch (e){
            console.error("DiskSpace: ErrorFetching: ", e);
        }
    }
}

export const globalMachineStatus = new MachineStatus();