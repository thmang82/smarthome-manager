import { spawn } from 'child_process';

export namespace SpawnAsync {

    export interface Result {
        code: number;
        errors: any[],
        std_out: string[];
        std_err: string[];
    }
    export type OutputCallback = (type: "stdout" | "stderr", line: string) => void;

    export function spawn_exec(str: string, output_cb?: OutputCallback) {
      const elem = str.split(" ");
      const cmd = elem.splice(0,1)[0];

      return new Promise<SpawnAsync.Result>((resolve, reject) => {
        const proc = spawn(cmd, elem);

        let res: SpawnAsync.Result = {
            code: 0,
            errors: [],
            std_err: [],
            std_out: []
        }

        proc.stdout.on('data', (data) => {
            let lines = data.toString().split("\n");
            lines.forEach(line => {
                res.std_err.push(line);
                if (output_cb) {
                    try {
                        output_cb("stdout", line);
                    } catch (e) {
                        console.error("ErrProcessStdErr: ", e);
                    }
                }
            })
        });
        
        proc.stderr.on('data', (data) => {
            let lines = data.toString().split("\n");
            lines.forEach(line => {
                res.std_err.push(line);
                if (output_cb) {
                    try {
                        output_cb("stderr", line);
                    } catch (e) {
                        console.error("ErrProcessStdErr: ", e);
                    }
                }
            })
        });
        proc.on('close', (code) => {
            res.code = code; // Return code
            console.log(`child process exited with code ${code}`);
            if (res.code == 0 && res.errors.length == 0) {
                resolve(res);
            } else {
                reject(res);
            }
            proc.removeAllListeners(); // cleanup
        });
        proc.on('error', (error) => {
            res.errors.push(error);
            console.log(`child process exited with code ${error}`);
          });
      })
    }
}