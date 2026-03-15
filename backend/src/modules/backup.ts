import { ConfigFile } from "../types/config";
import { scheduleJob, Job } from 'node-schedule';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import * as moment from 'moment';
import * as fs from "fs";
import { mqttInstance } from "../server";
import { SpawnAsync } from "./../utils/spawn_async";
const execAsync = promisify(exec);

const conf_date_format = "YYYYMMDD_HHmmss";

export class ServerBackup {
    private target: string;
    private mount: {
        share_path: string;
        mount_point: string;
        username:  string;
        password:  string;
        uid: string;
    } | undefined;
    private source: string;
    private filename: string;
    private delete_old_after_hours: number;
    private delete_monday_after_weeks: number;
    private time:   string;

    private _job: Job | undefined;

    constructor(){
       
    };

    public loadNewConfig(config: ConfigFile){
        let self = this;
        this.target   = config.backup.target;
        this.source   = config.backup.source;
        this.filename = config.backup.filename;
        this.delete_old_after_hours = config.backup.delete_old_after_hours;
        this.delete_monday_after_weeks = config.backup.delete_monday_after_weeks;
        this.time     = config.backup.time;

        const mount_c = config.backup.mount;
        if (mount_c){
            if (mount_c.user && mount_c.path && mount_c.share && mount_c.pass && mount_c.uid){
                this.mount = {
                    share_path: mount_c.share,
                    mount_point: mount_c.path,
                    username: mount_c.user,
                    password: mount_c.pass,
                    uid: "" + mount_c.uid,
                }
                if (this.target.indexOf(mount_c.path) < 0) {
                    console.warn(`WARN: Mount path '${mount_c.path}' is not part of target path '${this.target}'. Configured correct?`);
                }
            } else {
                console.error("config.backup.mount is incomplete! Either 'user', 'pass', 'uid' or 'path' missing");
            }
        }

        if (!this.delete_monday_after_weeks) {
            this.delete_monday_after_weeks = 5;
        }

        this.cleanUpOldBackups();

        if (this._job){
            this._job.cancel();
            this._job = undefined;
        }

        let split = this.time.split(":");
        if (split.length == 2){
            let hours   = parseInt(split[0]);
            let minutes = parseInt(split[1]);
            const shedule_str = '0 ' + minutes + " " + hours + " * * *"; 
            console.log("Backup -> Shedule at " + shedule_str);
            this._job = scheduleJob(shedule_str, self.executeBackup) // works on local time!!!
        }
    }

    private executeBackup = () => {
        console.log("executeBackup ... ");
        if (this.mount){
            const mounted = this.checkMounted();
            if (!mounted) {
                this.mountTarget();
            }
        }

        if (fs.existsSync(this.target)){ // Touch the directory => wait for NAS to wake up
            setTimeout(this.doBackup, 1000);
        } else {
            setTimeout(this.doBackup, 5000);
        }
    }
    private doBackup = async () => {
        if (fs.existsSync(this.target)){
            // execute the ZIP command
            console.log("Backup - execute zipping ... ");
            const date_str = moment().format(conf_date_format);
            const filename = this.filename + "_" + date_str + ".tar.gz";
            if (!fs.existsSync(this.target)) {
                console.error("ERROR: Could not find backup path: " + this.target);
            }
            const out_file = this.target + "/" + filename;
            const cmd = `tar --totals=USR1 -zcvf ${out_file} ${this.source}`;
            const cmd_rights = `chmod 444 ${out_file}`;

            const mqtt_topic = "backup";
            try {
                const use_exec = true;
                if (use_exec) {
                    const res_tar = await execAsync(cmd);
                    console.log("Result tar: ", res_tar);
                } else {
                    const res_tar = await SpawnAsync.spawn_exec(cmd, (type, line) => {
                        console.debug(`  tar log[${type}]:  ` + line);
                    });
                    console.log("Result tar: ", res_tar);
                }
                const res_rights = await execAsync(cmd_rights);
                console.log("Result chmod: ", res_rights);
                const stats = fs.statSync(out_file);
                const size_mb = stats.size / 1024 / 1024; // .size is #Bytes
                mqttInstance.publish(mqtt_topic, "Backup success at " + date_str + " => " + out_file + " (" + size_mb.toFixed(2) + "MB)", true);
            } catch (e) {
                console.error("ERROR: Backup command failed with error: ", e);
                // Permission denied
                mqttInstance.publish(mqtt_topic, "Backup Failed at " + date_str, true);
            }
        } else {
            console.error("Backup - Error: Could not find path: "  + this.target);
        }
        this.cleanUpOldBackups(); // will unmount it later on!
    }

    private checkMounted = (): boolean => {
        const m = this.mount;
        if (m){
            const str = execSync("sudo mount").toString();
            const mounted = str.indexOf(m.mount_point) >= 0;
            console.log(`is [ ${m.share_path} ] mounted on [ ${m.mount_point} ]: ` + mounted);
            return mounted;
        } else {
            return false;
        }
    }

    private mountTarget = (): boolean => {
        const m = this.mount;
        if (m) {
            console.log(`mountTarget [ ${m.mount_point} ] with [ ${m.share_path} ] and username [ ${m.username} ]`);
            const uid = m.uid;
            const gid = m.uid;
            const cmd = `sudo mount -t cifs -o uid=${uid},gid=${gid},username=${m.username},password=${m.password},vers=2.0,rw,_netdev ${m.share_path}  ${m.mount_point}`;
            execSync(cmd, { stdio: "inherit" });
            return this.checkMounted();
        } else {
            return false;
        }
	
    }

    private unmountTarget = (): boolean => {
        const m = this.mount;
        if (m) {
            const cmd = `sudo umount ${m.mount_point}`;
            console.log(`unmountTarget [ ${m.mount_point} ]`)
            execSync(cmd, { stdio: "inherit" });
            return !this.checkMounted();
        } else {
            return false;
        }
    }

    private cleanUpOldBackups = () => {
        const m_now = moment();
        let files: string[] | undefined;

        if (this.mount){
            const mounted = this.checkMounted();
            if (!mounted) {
                this.mountTarget();
            }
        }
        console.debug(`Clean old backups on '${this.target} ...'`);
        try {
            files = fs.readdirSync(this.target).filter(file => fs.statSync(this.target + "/" + file).isFile());
        } catch(e){
            console.error(`cleanUpOldBackups: error acessing [ ${this.target} ], e: `, e);
        }
        if (files){
            let backup_files = files.filter(file => file.indexOf(this.filename) >= 0);
            const file_infos = backup_files.map(file => {
                try {
                    const date_str = file.replace(this.filename + "_", "").replace(".tar.gz","");
                    const date = moment(date_str, conf_date_format);
                    const diff = moment.duration(m_now.diff(date));
                    let day_num_iso = date.isoWeekday();
                    console.log("  " + file + " => ", date.toISOString() + " => age: " + diff.asHours().toFixed(2) + "h");
                    return {
                        keep: false,
                        file: file,
                        age_hours: diff.asHours(),
                        day_num_iso: day_num_iso
                    }
                } catch(e){
                    console.error("Error at cleanUpOldBackups: ", e);
                    return undefined;
                }
            }).sort((a,b) => a && b && a.age_hours < b.age_hours ? 1 : -1)
            console.log("cleanUpOldBackups: file_infos:", file_infos);

            // We must keep the last backup!
            let info_last = file_infos[file_infos.length - 1];
            if (info_last) {
                info_last.keep = true;
            }
            const keep_monday_weeks = this.delete_monday_after_weeks;
            file_infos.forEach(info => {
                if (info) {
                    if (info.day_num_iso == 1 && info.age_hours < (keep_monday_weeks*7*24)) { // 1 is Monday
                        info.keep = true;
                    }
                }
            })
            // We must keep the oldest backup => every Monday in last 5 Weeks
            // Todo: 

            for (let f = 0; f < file_infos.length; f++){
                let info = file_infos[f];
                if (info && !info.keep && info.age_hours > this.delete_old_after_hours) {
                    console.log("cleanUpOldBackups => Delete file " + info.file + " ...");
                    fs.unlinkSync(this.target + "/" + info.file);
                }
            }
        }
        if (this.mount){
            this.unmountTarget();
        }
    }
}