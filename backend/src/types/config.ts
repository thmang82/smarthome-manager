

export interface ConfigFile {
    api?: {
        token: string;
        allowed_ips: string[];
        port: number;
    };
    mqtt: {
        url: string,
        topic: string
    };
    reboot?: {
        enabled: boolean,
    };
    backup: {
        time: string,
        source: string,
        target: string,
        filename: string,
        delete_old_after_hours: number,
        delete_monday_after_weeks: number,
        mount?: {
            share: string, // the network share, e.g. //mynas/backup
            path: string,  // the mount point, e.g. /mnt/backup
            user: string,
            pass: string,
            uid: number
        }
    };
}