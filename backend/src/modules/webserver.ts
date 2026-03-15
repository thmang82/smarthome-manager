
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Router, Request, Response } from 'express';
import { ConfigFile } from 'types/config';
import * as ipcheck from 'ip-range-check';
import { sSystemControl } from './system_control';


const CONF_INTERFACE     = "0.0.0.0";
const CONF_PORT_API      = 8000;

class WebServer {
    private app_api:      express.Application | null = null;
    private access_token: string | undefined;
    private allowed_ips: string[] | undefined
    private port: number;

    public startApi = (config: ConfigFile) => {
        if (!this.app_api){
            this.access_token = config.api?.token;
            this.allowed_ips  = config.api?.allowed_ips;
            this.app_api = express();
            const conf_port = config.api?.port;
            console.log("Config port: ", conf_port)
            this.port = conf_port ? conf_port : CONF_PORT_API;

            this.app_api.use(bodyParser.json());
            this.app_api.use(bodyParser.urlencoded({ extended: false }));
            
            const api_router: Router = Router();
            api_router.post('/reboot', async (req: Request, res: Response) => {
                console.log(`API Request [ ${req.originalUrl} ]`);
                let success = sSystemControl.reboot();
                res.json({success: success});
            });

            const isApiAuthenticated = (req: Request, res: Response, next: express.NextFunction) => {
                let elems = req.get('Authorization')?.split("Bearer ");
                let ip_ok = this.allowed_ips && req.ip ? ipcheck(req.ip || "", this.allowed_ips) : false;
                let token_ok = elems && elems.length == 2 && elems[1] === this.access_token;
                let allowed = token_ok && ip_ok;
                if (allowed) {
                    next();
                } else {
                    
                    let errors: string[] = []; 
                    if (!ip_ok) errors.push("IpAddressNotAllowed");
                    if (!token_ok) errors.push("WrongAccessToken");
                    console.error(`API Request [ ${req.originalUrl} ] NotVerified! Error: ${errors.join(" ")}`);
                    res.status(500).json({ 
                        error: "Access not allowed", 
                        reason:  errors.join(" ")
                    });
                }
            }

            this.app_api.use('/api', isApiAuthenticated, api_router);
  
            this.app_api.listen(this.port, CONF_INTERFACE, () => {
                console.log("Listening at http://" + CONF_INTERFACE + ":" + this.port);
            });
        }
    }
}

export const sWebServer = new WebServer();
