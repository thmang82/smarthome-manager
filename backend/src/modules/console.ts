import * as moment from 'moment';

var console_log_obj = console.log.bind(console);
    
export function setupConsole(){
    console.log = (...args) => {
    // perform task
    let moment_now = moment();
    args.unshift(":");
    args.unshift(moment_now.format("YYYY-MM-DD HH:mm:ss.SSS"));
    console_log_obj.apply(null,args);
    }
    var console_err_obj = console.error.bind(console);
    console.error = (...args) => {
    // perform task
    let moment_now = moment();
    args.unshift(":");
    args.unshift(moment_now.format("YYYY-MM-DD HH:mm:ss.SSS"));
    console_err_obj.apply(null,args);
    }
}