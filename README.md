# smarthome-manager
A Small Node Server for Backup / Mqtt Transformations / Reboot / ...


## Installtion instruction
- Make sure you have node.js installed!
- Copy the dist/server.js file with help of scripts/copy_to_server.sh file to the server
- Place the scripts/servermanger.service file into the /etc/systemd/system folder
 - Modify the paths in it according to your system
- Start the service:
    'sudo service servermanager start'
- Enable the service to be started at boot:
    'sudo systemctl enable servermanager'
- Check the status:
    'service servermanager status'
- View logs:
    'sudo journalctl -u servermanager.service -n 100 --no-pager'

