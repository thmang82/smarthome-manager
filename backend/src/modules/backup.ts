import { ConfigFile } from "../types/config";
import { scheduleJob, Job } from 'node-schedule';
import { execSync } from 'child_process';
import * as moment from 'moment';
import * as fs from "fs";

const conf_date_format = "YYYYMMDD_HHmmss";

export class ServerBackup {
    private target: string;
    private source: string;
    private filename: string;
    private delete_old_after_hours: number;
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
        this.time     = config.backup.time;

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
        if (fs.existsSync(this.target)){ // Touch the directory => wait for NAS to wake up
            setTimeout(this.doBackup, 1000);
        } else {
            setTimeout(this.doBackup, 5000);
        }
    }
    private doBackup = () => {
        if (fs.existsSync(this.target)){
            // execute the ZIP command
            console.log("Backup - execute zipping ... ");
            const date_str = moment().format(conf_date_format);
            const filename = this.filename + "_" + date_str + ".tar.gz";
            const out_file = this.target + "/" + filename;
            const cmd = `tar -zcvf ${out_file} ${this.source}`;
            const cmd_rights = `chmod 444 ${out_file}`;
            try {
                execSync(cmd);
                execSync(cmd_rights);
            } catch (e) {
                console.error("ERROR: Backup command failed with error: ", e);
            }
        } else {
            console.error("Backup - Error: Could not find path: "  + this.target);
        }
        this.cleanUpOldBackups();
    }

    private cleanUpOldBackups = () => {
        const m_now = moment();
        let files = fs.readdirSync(this.target).filter(file => fs.statSync(this.target + "/" + file).isFile());
        let backup_files = files.filter(file => file.indexOf(this.filename) >= 0);
        backup_files.forEach(file => {
            try {
                const date_str = file.replace(this.filename + "_", "").replace(".tar.gz","");
                const date = moment(date_str, conf_date_format);
                const diff = moment.duration(m_now.diff(date));
                console.log("  " + file + " => ", date.toISOString() + " => age: " + diff.asHours().toFixed(2) + "h");
                if (diff.asHours() > this.delete_old_after_hours){
                    console.log(" => Delete file " + file + " ...");
                    fs.unlinkSync(this.target + "/" + file);
                }
            } catch(e){
                console.error("Error at cleanUpOldBackups: ", e);
            }
        })
    }
}